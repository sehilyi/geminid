import { bisector } from 'd3-array';
import { RemoteFile as _RemoteFile } from 'generic-filehandle';

import type * as HiGlass from '@higlass/types';
import type { Assembly, ChromSizes, Datum } from '@gosling-lang/gosling-schema';

export type CommonDataConfig = {
    assembly: Assembly;
    x?: string;
    xe?: string;
    x1?: string;
    x1e?: string;
    urlFetchOptions?: RequestInit;
};

export class DataSource<File, Options> {
    chromInfo: ExtendedChromInfo;
    tilesetInfo: ReturnType<typeof tilesetInfoFromChromInfo>;

    constructor(
        public file: File,
        chromSizes: ChromSizes,
        public options: Options
    ) {
        this.chromInfo = sizesToChromInfo(chromSizes);
        this.tilesetInfo = tilesetInfoFromChromInfo(this.chromInfo);
    }
}

/**
 * Filter data before sending to a track considering the visible genomic area in the track.
 * TODO(2022-Jul-13): Consider genomic `y` channels as well.
 */
export function filterUsingGenoPos(
    data: Datum[],
    [minX, maxX]: [number, number],
    config: Omit<CommonDataConfig, 'assembly'>
) {
    const { x, xe, x1, x1e } = config;
    const definedXFields = [x, xe, x1, x1e].filter(f => f) as string[];
    return data.filter((d: Datum) => {
        if (definedXFields.length === 0) {
            // no filter applies
            return true;
        } else if (definedXFields.length === 1) {
            // filter based on one genomic position
            const value = +d[definedXFields[0]];
            return typeof value === 'number' && minX < value && value <= maxX;
        } else {
            // filter based on two genomic positions, i.e., check overlaps
            const values = definedXFields.map(f => +d[f]).filter(v => !isNaN(v));
            const minValue = Math.min(...values);
            const maxValue = Math.max(...values);
            return minX <= maxValue && minValue <= maxX;
        }
    });
}

const chromInfoBisector = bisector((d: { pos: number }) => d.pos).left;

const chrToAbs = (chrom: string, chromPos: number, chromInfo: HiGlass.ChromInfo) =>
    chromInfo.chrPositions[chrom].pos + chromPos;

const absToChr = (absPosition: number, chromInfo: HiGlass.ChromInfo) => {
    if (!chromInfo || !chromInfo.cumPositions || !chromInfo.cumPositions.length) {
        return null;
    }

    let insertPoint = chromInfoBisector(chromInfo.cumPositions, absPosition);
    const lastChr = chromInfo.cumPositions[chromInfo.cumPositions.length - 1].chr;
    const lastLength = chromInfo.chromLengths[lastChr];

    // @ts-expect-error
    insertPoint -= insertPoint > 0 && 1;

    let chrPosition = Math.floor(absPosition - chromInfo.cumPositions[insertPoint].pos);
    let offset = 0;

    if (chrPosition < 0) {
        // before the start of the genome
        offset = chrPosition - 1;
        chrPosition = 1;
    }

    if (insertPoint === chromInfo.cumPositions.length - 1 && chrPosition > lastLength) {
        // beyond the last chromosome
        offset = chrPosition - lastLength;
        chrPosition = lastLength;
    }

    return [chromInfo.cumPositions[insertPoint].chr, chrPosition, offset, insertPoint] as const;
};

/**
 * Get a chromosome name for the consistentcy, e.g., `1` --> `chr1`.
 * @param chrName A chromosome name to be sanitized
 * @param assembly A genome assembly of the data
 * @param chromosomePrefix A prefix string that can be replaced to 'chr'
 * @returns
 */
export function sanitizeChrName(chrName: string, assembly: Assembly, chromosomePrefix?: string) {
    if (Array.isArray(assembly)) {
        // this is a custom assembly, so use this as is
        return chrName;
    }

    // For assemblies in Gosling, we use the `chr` prefix consistently
    if (chromosomePrefix) {
        // `hs1` --> `chr1`
        chrName = chrName.replace(chromosomePrefix, 'chr');
    } else if (!chrName.includes('chr')) {
        // `1` --> `chr1`
        chrName = `chr${chrName}`;
    }
    return chrName;
}

export type ExtendedChromInfo = HiGlass.ChromInfo & {
    absToChr(absPos: number): ReturnType<typeof absToChr> | null;
    chrToAbs(chr: [name: string, pos: number]): number | null;
};

export function tilesetInfoFromChromInfo(chromInfo: ExtendedChromInfo, tileSize = 1024) {
    return {
        tile_size: tileSize,
        bins_per_dimension: tileSize,
        max_zoom: Math.ceil(Math.log(chromInfo.totalLength / tileSize) / Math.log(2)),
        max_width: chromInfo.totalLength,
        min_pos: [0],
        max_pos: [chromInfo.totalLength]
    };
}

export function sizesToChromInfo(sizes: [string, number][]): ExtendedChromInfo {
    const info: HiGlass.ChromInfo = {
        cumPositions: [],
        chromLengths: {},
        chrPositions: {},
        totalLength: 0
    };

    sizes.forEach(([chr, length], i) => {
        const chrPosition = { id: i, chr, pos: info.totalLength };
        info.chrPositions[chr] = chrPosition;
        info.chromLengths[chr] = length;
        info.cumPositions.push(chrPosition);
        info.totalLength += length;
    });

    return {
        ...info,
        absToChr: absPos => (info.chrPositions ? absToChr(absPos, info) : null),
        chrToAbs: ([chrName, chrPos]) => (info.chrPositions ? chrToAbs(chrName, chrPos, info) : null)
    };
}

export class RemoteFile extends _RemoteFile {
    // Overrides `read` to eagerly read 200 or 206 response
    // from https://github.com/GMOD/generic-filehandle/blob/0e8209be25e3097307bd15e964edd8c017e808d7/src/remoteFile.ts#L100-L162
    public read: _RemoteFile['read'] = async (
        buffer,
        offset = 0,
        length,
        position = 0,
        opts = {}
    ): Promise<{ bytesRead: number; buffer: Buffer }> => {
        const { headers = {}, signal, overrides = {} } = opts;

        if (length < Infinity) {
            headers.range = `bytes=${position}-${position + length}`;
        } else if (length === Infinity && position !== 0) {
            headers.range = `bytes=${position}-`;
        }
        const args = {
            // @ts-expect-error private property
            ...this.baseOverrides,
            ...overrides,
            headers: {
                ...headers,
                ...overrides.headers,
                // @ts-expect-error private property
                ...this.baseOverrides.headers
            },
            method: 'GET',
            redirect: 'follow',
            mode: 'cors',
            signal
        };
        const response = await this.fetch(this.url, args);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText} ${this.url}`);
        }

        // Just read the response if it was successful.
        if (response.status === 200 || response.status === 206) {
            // @ts-expect-error private method
            const responseData = await this.getBufferFromResponse(response);
            const bytesCopied = responseData.copy(buffer, offset, 0, Math.min(length, responseData.length));

            // try to parse out the size of the remote file
            const res = response.headers.get('content-range');
            const sizeMatch = /\/(\d+)$/.exec(res || '');
            if (sizeMatch && sizeMatch[1]) {
                // @ts-expect-error private property
                this._stat = { size: parseInt(sizeMatch[1], 10) };
            }

            return { bytesRead: bytesCopied, buffer };
        }

        // TODO: try harder here to gather more information about what the problem is
        throw new Error(`HTTP ${response.status} fetching ${this.url}`);
    };
}

export interface TabularDataFetcher<Tile> {
    getTabularData(tileIds: string[]): Promise<Tile[]>;
    MAX_TILE_WIDTH?: number;
}
