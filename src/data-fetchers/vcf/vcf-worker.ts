/*
 * This document is heavily based on the following repo by @alexander-veit:
 * https://github.com/dbmi-bgm/higlass-sv/blob/main/src/sv-fetcher-worker.js
 */
import { TabixIndexedFile } from '@gmod/tabix';
import VCF from '@gmod/vcf';
import { expose, Transfer } from 'threads/worker';
import { sampleSize } from 'lodash-es';

import { DataSource, RemoteFile } from '../utils';

import type { TilesetInfo } from '@higlass/types';
import type { ChromSizes } from '@gosling-lang/gosling-schema';
import type { VcfTile } from './vcf-data-fetcher';
import { recordToTile } from './utils';

// promises indexed by urls
const vcfFiles: Map<string, VcfFile> = new Map();

type VcfFileOptions = {
    sampleLength: number;
    urlFetchOptions?: RequestInit;
    indexUrlFetchOptions?: RequestInit;
};

/**
 * This is a class to represent a VCF file.
 */
class VcfFile {
    #parser?: VCF;
    #uid: string;
    constructor(
        public tbi: TabixIndexedFile,
        uid: string
    ) {
        this.#uid = uid;
    }
    /**
     * Function to create an instance of VcfFile from URLs
     * @param url A string which is the URL of the bed file
     * @param indexUrl A string which is the URL of the bed index file
     * @param uid A unique identifier for the worker
     * @param urlFetchOptions
     * @param indexUrlFetchOptions
     * @returns an instance of VcfFile
     */
    static fromUrl(
        url: string,
        indexUrl: string,
        uid: string,
        urlFetchOptions?: RequestInit,
        indexUrlFetchOptions?: RequestInit
    ) {
        const tbi = new TabixIndexedFile({
            filehandle: new RemoteFile(url, { overrides: urlFetchOptions }),
            tbiFilehandle: new RemoteFile(indexUrl, { overrides: indexUrlFetchOptions })
        });
        return new VcfFile(tbi, uid);
    }
    /**
     * Creates the parser used for the VCF file.
     */
    async getParser() {
        if (!this.#parser) {
            const header = await this.tbi.getHeader();
            this.#parser = new VCF({ header });
        }
        return this.#parser;
    }
    /**
     * Retrieves data within a certain coordinate range
     * @param minX A number which is the minimum X boundary of the tile
     * @param maxX A number which is the maximum X boundary of the tile
     * @param callback A callback function which receives the VCF tile
     * @returns A promise of array of promises which resolve when the data has been successfully retrieved
     */
    async getTileData(minX: number, maxX: number): Promise<VcfTile[]> {
        const source = dataSources.get(this.#uid)!;
        const parser = await this.getParser();

        let curMinX = minX;
        const { chromLengths, cumPositions } = source.chromInfo;
        const recordPromises: Promise<VcfTile[]>[] = [];

        for (const cumPos of cumPositions) {
            const chromName = cumPos.chr;
            const chromStart = cumPos.pos;
            const chromEnd = cumPos.pos + chromLengths[chromName];
            let startPos, endPos;

            // Early break, rather than creating an nested if
            if (chromStart > curMinX || curMinX >= chromEnd) {
                continue;
            }

            // start of the visible region is within this chromosome
            let prevPOS: number | undefined;
            const tilesPromise = new Promise<VcfTile[]>(resolve => {
                const tiles: VcfTile[] = [];
                const lineCallback = (line: string) => {
                    const vcfRecord = parser.parseLine(line);
                    const vcfTile = recordToTile(vcfRecord, chromStart, prevPOS);
                    prevPOS = vcfTile.POS;
                    tiles.push(vcfTile);
                };

                if (maxX > chromEnd) {
                    startPos = curMinX - chromStart;
                    endPos = chromEnd - chromStart;
                } else {
                    startPos = Math.floor(curMinX - chromStart);
                    endPos = Math.ceil(maxX - chromStart);
                }

                source.file.tbi.getLines(chromName, startPos, endPos, lineCallback).then(() => {
                    resolve(tiles);
                });
            });

            recordPromises.push(tilesPromise);

            if (maxX <= chromEnd) {
                continue;
            }

            curMinX = chromEnd;
        }

        const tileArrays = await Promise.all(recordPromises);
        return tileArrays.flat();
    }
}

// promises indexed by url
const tileValues: Record<string, VcfTile[]> = {}; // new LRU({ max: MAX_TILES });

// const vcfData = [];
const dataSources: Map<string, DataSource<VcfFile, VcfFileOptions>> = new Map();

function init(
    uid: string,
    vcf: { url: string; indexUrl: string },
    chromSizes: ChromSizes,
    options: Partial<VcfFileOptions> = {}
) {
    let vcfFile = vcfFiles.get(vcf.url);
    if (!vcfFile) {
        vcfFile = VcfFile.fromUrl(vcf.url, vcf.indexUrl, uid, options.urlFetchOptions, options.indexUrlFetchOptions);
    }
    const dataSource = new DataSource(vcfFile, chromSizes, {
        sampleLength: 1000,
        ...options
    });
    dataSources.set(uid, dataSource);
}

const tilesetInfo = (uid: string) => {
    return dataSources.get(uid)!.tilesetInfo;
};

/**
 * Updates `tileValues` with the data for a specific tile.
 * @param uid A string which is the unique identifier of the worker
 * @param z A number which is the z coordinate of the tile
 * @param x A number which is the x coordinate of the tile
 */
const tile = async (uid: string, z: number, x: number): Promise<VcfTile[]> => {
    const source = dataSources.get(uid)!;
    const CACHE_KEY = `${uid}.${z}.${x}`;

    // TODO: Caching is needed
    // if (!tileValues[CACHE_KEY]) {
    tileValues[CACHE_KEY] = [];
    // }
    const tileWidth = +source.tilesetInfo.max_width / 2 ** +z;

    // get bounds of this tile
    const minX = source.tilesetInfo.min_pos[0] + x * tileWidth;
    const maxX = source.tilesetInfo.min_pos[0] + (x + 1) * tileWidth;

    tileValues[CACHE_KEY] = await source.file.getTileData(minX, maxX);

    return tileValues[CACHE_KEY];
};

const fetchTilesDebounced = async (uid: string, tileIds: string[]) => {
    const tiles: Record<string, VcfTile> = {};
    const validTileIds: string[] = [];
    const tilePromises: Promise<VcfTile[]>[] = [];

    for (const tileId of tileIds) {
        const parts = tileId.split('.');
        const z = parseInt(parts[0], 10);
        const x = parseInt(parts[1], 10);

        if (Number.isNaN(x) || Number.isNaN(z)) {
            console.warn('Invalid tile zoom or position:', z, x);
            continue;
        }
        validTileIds.push(tileId);
        tilePromises.push(tile(uid, z, x));
    }
    return Promise.all(tilePromises).then(values => {
        for (let i = 0; i < values.length; i++) {
            const validTileId = validTileIds[i];
            // @ts-expect-error values is void, this should never happen.
            tiles[validTileId] = values[i];
            tiles[validTileId].tilePositionId = validTileId;
        }
        return tiles;
    });
};

const getTabularData = (uid: string, tileIds: string[]) => {
    const data: VcfTile[][] = [];

    tileIds.forEach(tileId => {
        const parts = tileId.split('.');
        const z = parseInt(parts[0], 10);
        const x = parseInt(parts[1], 10);

        const tileValue = tileValues[`${uid}.${z}.${x}`];

        if (!tileValue) {
            console.warn(`No tile data constructed (${tileId})`);
        }

        data.push(tileValue);
    });

    let output = Object.values(data).flat();

    const sampleLength = dataSources.get(uid)!.options.sampleLength;
    if (output.length >= sampleLength) {
        // TODO: we can make this more generic
        // priotize that mutations with closer each other are selected when sampling.
        const highPriority = output.sort((a, b) => -(a.DISTPREV ?? 0) + (b.DISTPREV ?? 0)).slice(0, sampleLength / 2.0);
        output = sampleSize(output, sampleLength / 2.0).concat(highPriority);
    }

    const buffer = new TextEncoder().encode(JSON.stringify(output)).buffer;
    return Transfer(buffer, [buffer]);
};

const tileFunctions = {
    init,
    tilesetInfo,
    fetchTilesDebounced,
    tile,
    getTabularData
};

export type WorkerApi = typeof tileFunctions;
export type { TilesetInfo };

expose(tileFunctions);
