import { dsvFormat as d3dsvFormat } from 'd3-dsv';
import { computeChromSizes } from '../../core/utils/assembly';
import { sampleSize } from 'lodash-es';
import type { Assembly, BedData, FilterTransform, Datum } from '@gosling.schema';
import type { DSVParsedArray, DSVRowString } from 'd3-dsv';
import { filterData } from '../../core/utils/data-transform';
import { type CommonDataConfig, filterUsingGenoPos } from '../utils';

export type BedDataConfig = BedData & CommonDataConfig & { filter?: FilterTransform[] };

interface ChomSizes {
    chrToAbs: (chrom: string, chromPos: number) => number;
    cumPositions: { id: number; chr: string; pos: number }[];
    chrPositions: { [k: string]: { id: number; chr: string; pos: number } };
    totalLength: number;
    chromLengths: { [k: string]: number };
}

/**
 * Used in #tile() to associate tile coordinates with data
 */
interface TileInfo {
    tabularData: Datum[];
    server: null;
    tilePos: number[];
    zoomLevel: number;
    tilePositionId?: string;
}
/**
 * This is what all the tile information eventually gets organized into.
 */
interface LoadedTiles {
    [tilePositionId: string]: TileInfo;
}

/**
 * Used in #generateTilesetInfo()
 */
export interface TilesetInfo {
    tile_size: number;
    max_zoom: number;
    max_width: number;
    min_pos: number[];
    max_pos: number[];
}

/**
 * Enum of the BED12 header
 */
enum BED12 {
    Chrom = 'chrom',
    ChromStart = 'chromStart',
    ChromEnd = 'chromEnd',
    Name = 'name',
    Score = 'score',
    Strand = 'strand',
    ThickStart = 'thickStart',
    ThickEnd = 'thickEnd',
    ItemRgb = 'itemRgb',
    BlockCount = 'blockCount',
    BlockSizes = 'blockSizes',
    MyField = 'myField'
}

export class BedDataFetcherClass {
    dataConfig: BedDataConfig;
    // @ts-ignore
    tilesetInfoLoading: boolean; // Used in TiledPixiTrack

    #dataPromise: Promise<void> | undefined;
    #chromSizes: ChomSizes;
    #parsedData!: DSVParsedArray<DSVRowString<string>>; // Either set in the constructor or in #fetchCsv()
    #assembly: Assembly;
    #filter: FilterTransform[] | undefined;

    constructor(dataConfig: BedDataConfig) {
        this.dataConfig = dataConfig;
        this.tilesetInfoLoading = false;
        this.#assembly = this.dataConfig.assembly;
        this.#filter = this.dataConfig.filter;

        if (!dataConfig.url) {
            console.error('Please provide the `url` of the data');
        }

        this.#chromSizes = this.#generateChromSizeInfo();
        this.#dataPromise = this.#fetchBed();
    }

    /**
     * Fetches BED file from url, parses it, and sets this.#parsedData
     */
    async #fetchBed(): Promise<void> {
        const url = this.dataConfig.url;
        const customFields = this.dataConfig.customFields ?? [];
        const separator = this.dataConfig.separator ?? ',';

        try {
            const response = await fetch(url);
            const text = await (response.ok ? response.text() : Promise.reject(response.status));
            this.#parsedData = this.#parseBed(text, separator, customFields);
        } catch (error) {
            console.error('[Gosling Data Fetcher] Error fetching data', error);
        }
    }

    /**
     * BED file parser
     * @param rawText A string, the raw text of the BED file
     * @param separator A string, the separator used in the BED file. For example, '\t'
     * @param customFields An array of strings, where each string is the name of a custom field in the BED file
     */
    #parseBed(rawText: string, separator: string, customFields: string[]): DSVParsedArray<DSVRowString<string>> {
        const [colNames, chromPositionCols] = this.#processColNames(rawText, separator, customFields);

        // console.warn(colNames);
        // console.warn('position headers', chromPositionCols);

        const textWithHeader = `${colNames.join(separator)}\n${rawText}`;
        const parsedBed = d3dsvFormat(separator).parse(textWithHeader, row => {
            return this.#processBedRow(row, chromPositionCols);
        });
        // console.warn(parsedBed);
        return parsedBed;
    }

    /**
     * Determines the correct column names and chromosome position columns of the BED file
     * @param rawText A string, the raw text of the BED file
     * @param separator A string, the separator used to delimit the BED file
     * @param customFields An array of strings, the custom fields of the BED file
     * @returns An array of the column names and column names of the chrom position columns
     */
    #processColNames(rawText: string, separator: string, customFields: string[]): [string[], BED12[]] {
        /** Helper function to calculate the number of columns */
        function calcNCols(tabularString: string, separator: string): number {
            const newLinePos = tabularString.indexOf('\n');
            const firstRow = tabularString.slice(0, newLinePos);
            return firstRow.split(separator).length;
        }

        const n_cols = calcNCols(rawText, separator);
        console.warn('n_cols', n_cols);
        const standardColumns = [
            BED12.Chrom,
            BED12.ChromStart,
            BED12.ChromEnd,
            BED12.Name,
            BED12.Score,
            BED12.Strand,
            BED12.ThickStart,
            BED12.ThickEnd,
            BED12.ItemRgb,
            BED12.BlockCount,
            BED12.BlockSizes,
            BED12.MyField
        ];
        const REQUIRED_COLS = 3; // The first three columns are required

        let columns: string[];
        if (customFields.length === 0) {
            if (n_cols > standardColumns.length) {
                throw new Error('BED file error: more columns found than expected');
            }
            columns = standardColumns.slice(0, n_cols);
        }
        if (n_cols > standardColumns.length) {
            if (n_cols !== standardColumns.length + customFields.length) {
                throw new Error(`BED file error: unexpected number of custom fields. Found ${n_cols} columns 
                        which is different from the expected ${standardColumns.length + customFields.length}`);
            }
            columns = (standardColumns as string[]).concat(customFields);
        } else {
            if (n_cols - customFields.length >= REQUIRED_COLS) {
                columns = (standardColumns as string[]).slice(0, n_cols - customFields.length).concat(customFields);
            } else {
                throw new Error(
                    `Expected ${REQUIRED_COLS + customFields.length} columns (${REQUIRED_COLS} required columns and ${
                        customFields.length
                    } custom columns) but found ${n_cols} columns`
                );
            }
        }
        // Collect the column names which contain chromosome coordinates
        const chromPosColumns = [BED12.ChromStart, BED12.ChromEnd];
        if (columns[6] === BED12.ThickStart) chromPosColumns.push(BED12.ThickStart);
        if (columns[7] === BED12.ThickEnd) chromPosColumns.push(BED12.ThickEnd);

        return [columns, chromPosColumns];
    }

    /**
     * Processes each row of the BED file. Used in parseBED()
     * @param row An object where the keys are the column name, and values are the value of that column in the row.
     * @param chromPosColumns An array of column names whose columns contain chromosome positions.
     * @returns An object of the row with cleaned/processed values
     */
    #processBedRow(row: DSVRowString<string>, chromPosColumns: string[]) {
        /**
         * Helper function to calculate the cumulative chromosome position, if needed
         */
        function calcCumulativePos(chromName: string, chromPosition: string, assembly: Assembly) {
            if (assembly !== 'unknown') {
                return (computeChromSizes(assembly).interval[chromName][0] + +chromPosition).toString();
            } else {
                return chromPosition;
            }
        }

        try {
            chromPosColumns.forEach(chromPosCol => {
                const chromPosition = row[chromPosCol] as string;
                const chromName = row[BED12.Chrom] as string;
                row[chromPosCol] = calcCumulativePos(chromName, chromPosition, this.#assembly);
            });
            return row;
        } catch {
            return undefined;
        }
    }

    /**
     * Called in TiledPixiTrack
     */
    tilesetInfo(callback?: (tilesetInto: TilesetInfo) => void): Promise<TilesetInfo | void> | undefined {
        if (!this.#dataPromise) {
            // data promise is not prepared yet
            return;
        }

        this.tilesetInfoLoading = true;

        return this.#dataPromise
            .then(() => this.#generateTilesetInfo(callback))
            .catch(err => {
                this.tilesetInfoLoading = false;
                console.error('[Gosling Data Fetcher] Error parsing data:', err);
            });
    }
    /**
     * Called by this.tilesetInfo() to call a callback function with tileset info.
     */
    #generateTilesetInfo(callback?: (tilesetInto: TilesetInfo) => void): TilesetInfo {
        this.tilesetInfoLoading = false;

        const TILE_SIZE = 1024;
        const totalLength = this.#chromSizes.totalLength;
        const retVal = {
            tile_size: TILE_SIZE,
            max_zoom: Math.ceil(Math.log(totalLength / TILE_SIZE) / Math.log(2)),
            max_width: totalLength,
            min_pos: [0, 0],
            max_pos: [totalLength, totalLength]
        };

        if (callback) {
            callback(retVal);
        }

        return retVal;
    }
    /**
     * Called in TiledPixiTrack.
     * @param receivedTiles A function from TiledPixiTrack which takes in all the loaded tiles
     * @param tileIds An array of tile IDs. Ex. ['1.0', '1.1']
     */
    fetchTilesDebounced(receivedTiles: (loadedTiles: LoadedTiles) => void, tileIds: string[]): void {
        if (!this.#parsedData) {
            throw new Error('File was not able to be parsed correctly; no data to associate with tiles');
        }
        const tiles: LoadedTiles = {};

        const validTileIds: string[] = [];
        const tilePromises = [];

        for (const tileId of tileIds) {
            const parts = tileId.split('.');
            const z = parseInt(parts[0], 10);
            const x = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);

            if (Number.isNaN(x) || Number.isNaN(z)) {
                console.warn('[Gosling Data Fetcher] Invalid tile zoom or position:', z, x, y);
                continue;
            }

            validTileIds.push(tileId);
            tilePromises.push(this.#tile(z, x, y));
        }

        Promise.all(tilePromises).then(tileInfo => {
            tileInfo.forEach((tileInfo, i) => {
                if (tileInfo) {
                    const validTileId = validTileIds[i];
                    tiles[validTileId] = tileInfo;
                    tiles[validTileId].tilePositionId = validTileId;
                }
            });
            receivedTiles(tiles);
        });
    }
    /**
     * Creates an object to associate a tile position with the corresponding data
     * @param z An integer, the z coordinate of the tile
     * @param x An integer, the x coordinate of the tile
     * @param y An integer, the y coordinate of the tile
     * @returns A promise of an object with tile coordinates and data
     */
    async #tile(z: number, x: number, y: number): Promise<TileInfo | undefined> {
        const tilesetInfo = await this.tilesetInfo();
        if (!tilesetInfo) return;

        const tileWidth = +tilesetInfo.max_width / 2 ** +z;

        // get the bounds of the tile
        const minX = tilesetInfo.min_pos[0] + x * tileWidth;
        const maxX = tilesetInfo.min_pos[0] + (x + 1) * tileWidth;

        // filter the data so that only the visible data is sent to tracks
        let tabularData = filterUsingGenoPos(this.#parsedData as Datum[], [minX, maxX], this.dataConfig);

        // filter data based on the `DataTransform` spec
        this.#filter?.forEach(f => {
            tabularData = filterData(f, tabularData);
        });

        const sizeLimit = this.dataConfig.sampleLength ?? 1000;
        return {
            // sample the data to make it managable for visualization components
            tabularData: tabularData.length > sizeLimit ? sampleSize(tabularData, sizeLimit) : tabularData,
            server: null,
            tilePos: [x, y],
            zoomLevel: z
        };
    }

    /**
     * This function calculates chromosome position and size based on the assembly (this.#assembly)
     * @returns An object containing chromosome information and a way to calculate absolute position
     */
    #generateChromSizeInfo(): ChomSizes {
        // Prepare chromosome interval information
        const chromosomeSizes: { [k: string]: number } = computeChromSizes(this.#assembly).size;
        const chromosomeCumPositions: { id: number; chr: string; pos: number }[] = [];
        const chromosomePositions: { [k: string]: { id: number; chr: string; pos: number } } = {};
        let prevEndPosition = 0;

        Object.keys(chromosomeSizes).forEach((chrStr, i) => {
            const positionInfo = {
                id: i,
                chr: chrStr,
                pos: prevEndPosition
            };

            chromosomeCumPositions.push(positionInfo);
            chromosomePositions[chrStr] = positionInfo;

            prevEndPosition += chromosomeSizes[chrStr];
        });

        return {
            chrToAbs: (chrom: string, chromPos: number) => this.#chromSizes.chrPositions[chrom].pos + chromPos,
            cumPositions: chromosomeCumPositions,
            chrPositions: chromosomePositions,
            totalLength: prevEndPosition,
            chromLengths: chromosomeSizes
        };
    }
}

function BedDataFetcher(
    _HGC: import('@higlass/types').HGC,
    dataConfig: BedDataConfig,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _pubsub: Record<string, any>
): BedDataFetcherClass {
    if (!new.target) {
        throw new Error('Uncaught TypeError: Class constructor cannot be invoked without "new"');
    }
    return new BedDataFetcherClass(dataConfig);
}

BedDataFetcher.config = {
    type: 'bed'
};

export default BedDataFetcher;
