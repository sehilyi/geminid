import { dsvFormat as d3dsvFormat } from 'd3-dsv';
import { GET_CHROM_SIZES } from '../../core/utils/assembly';
import fetch from 'cross-fetch'; // TODO: Can we remove this and make the test working
import { sampleSize } from 'lodash';
import { Assembly, FilterTransform } from '../../core/gosling.schema';
import { filterData } from '../../core/utils/data-transform';

/**
 * HiGlass data fetcher specific for Gosling which ultimately will accept any types of data other than CSV files.
 */
function CSVDataFetcher(HGC: any, ...args: any): any {
    if (!new.target) {
        throw new Error('Uncaught TypeError: Class constructor cannot be invoked without "new"');
    }

    class CSVDataFetcherClass {
        // @ts-ignore
        private dataConfig: GeminiDataConfig;
        // @ts-ignore
        private tilesetInfoLoading: boolean;
        private dataPromise: Promise<any> | undefined;
        private chromSizes: any;
        private values: any;
        private assembly: Assembly;
        private filter: FilterTransform[] | undefined;

        constructor(params: any[]) {
            const [dataConfig] = params;
            this.dataConfig = dataConfig;
            this.tilesetInfoLoading = false;
            this.assembly = this.dataConfig.assembly;
            this.filter = this.dataConfig.filter;

            if (!dataConfig.url) {
                console.error('Please provide the `url` of the data');
                return;
            }

            // Prepare chromosome interval information
            const chromosomeSizes: { [k: string]: number } = GET_CHROM_SIZES(this.assembly).size;
            const chromosomeCumPositions: { id: number; chr: string; pos: number }[] = [];
            const chromosomePositions: { [k: string]: { id: number; chr: string; pos: number } } = {};
            let prevEndPosition = 0;

            Object.keys(GET_CHROM_SIZES(this.assembly).size).forEach((chrStr, i) => {
                const positionInfo = {
                    id: i,
                    chr: chrStr,
                    pos: prevEndPosition
                };

                chromosomeCumPositions.push(positionInfo);
                chromosomePositions[chrStr] = positionInfo;

                prevEndPosition += GET_CHROM_SIZES(this.assembly).size[chrStr];
            });
            this.chromSizes = {
                chrToAbs: (chrom: string, chromPos: number) => this.chromSizes.chrPositions[chrom].pos + chromPos,
                cumPositions: chromosomeCumPositions,
                chrPositions: chromosomePositions,
                totalLength: prevEndPosition,
                chromLengths: chromosomeSizes
            };

            if (dataConfig.data) {
                // we have raw data that we can use right away
                this.values = dataConfig.data;
            } else {
                this.dataPromise = this.fetchCSV();
            }
        }

        fetchCSV() {
            const {
                url,
                chromosomeField,
                genomicFields,
                quantitativeFields,
                headerNames,
                chromosomePrefix,
                longToWideId,
                genomicFieldsToConvert
            } = this.dataConfig;

            const separator = this.dataConfig.separator ?? ',';

            return fetch(url)
                .then(response => {
                    return response.ok ? response.text() : Promise.reject(response.status);
                })
                .then(text => {
                    const textWithHeader = headerNames ? `${headerNames.join(separator)}\n${text}` : text;
                    return d3dsvFormat(separator).parse(textWithHeader, (row: any) => {
                        let successfullyGotChrInfo = true;

                        // !!! Experimental
                        if (genomicFieldsToConvert) {
                            // This spec is used when multiple chromosomes are stored in a single row
                            genomicFieldsToConvert.forEach((d: any) => {
                                const cField = d.chromosomeField;
                                const assembly = d.assembly ?? this.assembly;
                                d.genomicFields.forEach((g: string) => {
                                    try {
                                        if (assembly !== 'unknown') {
                                            // This means we need to use the relative position considering the start position of individual chr.
                                            const chr = chromosomePrefix
                                                ? row[cField].replace(chromosomePrefix, 'chr')
                                                : row[cField].includes('chr')
                                                ? row[cField]
                                                : `chr${row[cField]}`;
                                            row[g] = GET_CHROM_SIZES(assembly).interval[chr][0] + +row[g];
                                        } else {
                                            // In this case, we use the genomic position as it is w/o adding the cumulative length of chr.
                                            // So, nothing to do additionally.
                                        }
                                    } catch (e) {
                                        // genomic position did not parse properly
                                        successfullyGotChrInfo = false;
                                    }
                                });
                            });
                        } else {
                            genomicFields.forEach((g: string) => {
                                if (!row[chromosomeField]) {
                                    // TODO:
                                    return;
                                }
                                try {
                                    const chr = chromosomePrefix
                                        ? row[chromosomeField].replace(chromosomePrefix, 'chr')
                                        : row[chromosomeField].includes('chr')
                                        ? row[chromosomeField]
                                        : `chr${row[chromosomeField]}`;
                                    row[g] = GET_CHROM_SIZES(this.assembly).interval[chr][0] + +row[g];
                                } catch (e) {
                                    // genomic position did not parse properly
                                    successfullyGotChrInfo = false;
                                }
                            });
                        }

                        if (!successfullyGotChrInfo) {
                            // store row only when chromosome information is correctly parsed
                            return undefined;
                        }

                        quantitativeFields?.forEach((q: string) => {
                            row[q] = +row[q];
                        });

                        return row;
                    });
                })
                .then(json => {
                    if (longToWideId && json[0]?.[longToWideId]) {
                        // rows having identical IDs are juxtaposed horizontally
                        const keys = Object.keys(json[0]);
                        const newJson: { [k: string]: { [k: string]: string | number } } = {};
                        json.forEach(d => {
                            if (!newJson[d[longToWideId]]) {
                                newJson[d[longToWideId]] = JSON.parse(JSON.stringify(d));
                            } else {
                                keys.forEach(k => {
                                    newJson[d[longToWideId]][`${k}_2`] = d[k];
                                });
                            }
                        });
                        this.values = Object.keys(newJson).map(k => newJson[k]);
                    } else {
                        this.values = json;
                    }
                })
                .catch(error => {
                    console.error('[Gosling Data Fetcher] Error fetching data', error);
                });
        }

        generateTilesetInfo(callback?: any) {
            this.tilesetInfoLoading = false;

            const TILE_SIZE = 1024;
            const totalLength = this.chromSizes.totalLength;
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

        tilesetInfo(callback?: any) {
            if (!this.dataPromise) {
                // data promise is not prepared yet
                return;
            }

            this.tilesetInfoLoading = true;

            return this.dataPromise
                .then(() => this.generateTilesetInfo(callback))
                .catch(err => {
                    this.tilesetInfoLoading = false;
                    console.error('[Gosling Data Fetcher] Error parsing data:', err);
                });
        }

        fetchTilesDebounced(receivedTiles: any, tileIds: any) {
            const tiles: { [k: string]: any } = {};

            const validTileIds: any[] = [];
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
                tilePromises.push(this.tile(z, x, y));
            }

            Promise.all(tilePromises).then(values => {
                values.forEach((value, i) => {
                    const validTileId = validTileIds[i];
                    tiles[validTileId] = value;
                    tiles[validTileId].tilePositionId = validTileId;
                });
                receivedTiles(tiles);
            });

            return tiles;
        }

        tile(z: any, x: any, y: any) {
            return this.tilesetInfo()?.then((tsInfo: any) => {
                const sizeLimit = this.dataConfig.sampleLength ?? 1000;
                const tileWidth = +tsInfo.max_width / 2 ** +z;

                // get the bounds of the tile
                const minX = tsInfo.min_pos[0] + x * tileWidth;
                const maxX = tsInfo.min_pos[0] + (x + 1) * tileWidth;

                let tabularData = this.values;

                // filter data based on the `DataTransform` spec
                this.filter?.forEach(f => {
                    tabularData = filterData(f, tabularData);
                });

                // filter the data so that only the visible data is sent to tracks
                if (tabularData.length > sizeLimit) {
                    tabularData = tabularData.filter((d: any) => {
                        if (this.dataConfig.genomicFields) {
                            return this.dataConfig.genomicFields.find((g: any) => minX < d[g] && d[g] <= maxX);
                        } else {
                            const allGenomicFields: string[] = [];
                            this.dataConfig.genomicFieldsToConvert.forEach((d: any) =>
                                allGenomicFields.push(...d.genomicFields)
                            );
                            return allGenomicFields.find((g: any) => minX < d[g] && d[g] <= maxX);
                        }
                    });
                }

                return {
                    // sample the data to make it managable for visualization components
                    tabularData: tabularData.length > sizeLimit ? sampleSize(tabularData, sizeLimit) : tabularData,
                    server: null,
                    tilePos: [x, y],
                    zoomLevel: z
                };
            });
        }
    }

    return new CSVDataFetcherClass(args);
}

CSVDataFetcher.config = {
    type: 'csv'
};

export default CSVDataFetcher;
