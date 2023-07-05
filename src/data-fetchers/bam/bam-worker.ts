// Adopted from https://github.com/higlass/higlass-pileup/blob/master/src/bam-fetcher-worker.js
import { expose, Transfer } from 'threads/worker';
import { BamFile as _BamFile } from '@gmod/bam';

import type { TilesetInfo } from '@higlass/types';
import type { BamRecord } from '@gmod/bam';

import { DataSource, RemoteFile, type ExtendedChromInfo } from '../utils';
import type { ChromSizes } from '@gosling.schema';

function parseMD(mdString: string, useCounts: true): { type: string; length: number }[];
function parseMD(mdString: string, useCounts: false): { pos: number; base: string; length: 1; bamSeqShift: number }[];
function parseMD(mdString: string, useCounts: boolean) {
    let currPos = 0;
    let currNum = 0;
    let deletionEncountered = false;
    let bamSeqShift = 0;
    const substitutions = [];

    /* eslint-disable-next-line @typescript-eslint/prefer-for-of */
    for (let i = 0; i < mdString.length; i++) {
        if (mdString[i].match(/[0-9]/g)) {
            // a number, keep on going
            currNum = currNum * 10 + +mdString[i];
            deletionEncountered = false;
        } else if (mdString[i] === '^') {
            deletionEncountered = true;
        } else {
            currPos += currNum;

            if (useCounts) {
                substitutions.push({
                    length: currNum,
                    type: mdString[i]
                });
            } else if (deletionEncountered) {
                // Do nothing if there is a deletion and keep on going.
                // Note that there can be multiple deletions "^ATC"
                // Deletions are visualized using the CIGAR string
                // However, keep track of where in the bam seq we need to pull the variant.
                bamSeqShift -= 1;
            } else {
                substitutions.push({
                    pos: currPos,
                    base: mdString[i],
                    length: 1,
                    bamSeqShift
                });
            }

            currNum = 0;
            currPos += 1;
        }
    }

    return substitutions;
}

type Substitution = {
    pos: number;
    length: number;
    type: 'X' | 'I' | 'D' | 'N' | '=' | 'M' | 'S' | 'H';
    variant?: string;
};

export type Segment = {
    // if two segments have the same name but different id, they are paired reads.
    // https://github.com/GMOD/bam-js/blob/7a57d24b6aef08a1366cca86ba5092254c7a7f56/src/bamFile.ts#L386
    id: string;
    name: string;
    start: number;
    end: number;
    md: string;
    chrName: string;
    chrOffset: number;
    cigar: string;
    mapq: string;
    strand: '+' | '-';
};

/**
 * Gets an array of all substitutions in the segment
 * @param segment  Current segment
 * @param seq  Read sequence from bam file.
 */
function getSubstitutions(segment: Segment, seq: string) {
    let substitutions: Substitution[] = [];
    let softClippingAtReadStart: null | { type: string; length: number } = null;

    if (segment.cigar) {
        const cigarSubs = parseMD(segment.cigar, true);
        let currPos = 0;

        for (const sub of cigarSubs) {
            if (sub.type === 'X') {
                // sequence mismatch, no need to do anything
                substitutions.push({
                    pos: currPos,
                    length: sub.length,
                    type: 'X'
                });

                currPos += sub.length;
            } else if (sub.type === 'I') {
                substitutions.push({
                    pos: currPos,
                    length: sub.length,
                    type: 'I'
                });
            } else if (sub.type === 'D') {
                substitutions.push({
                    pos: currPos,
                    length: sub.length,
                    type: 'D'
                });
                currPos += sub.length;
            } else if (sub.type === 'N') {
                substitutions.push({
                    pos: currPos,
                    length: sub.length,
                    type: 'N'
                });
                currPos += sub.length;
            } else if (sub.type === '=' || sub.type === 'M') {
                currPos += sub.length;
            } else {
                // console.log('skipping:', sub.type);
            }
            // if (referenceConsuming.has(sub.base)) {
            //   if (queryConsuming.has(sub.base)) {
            //     substitutions.push(
            //     {
            //       pos:
            //     })
            //   }
            // }
        }

        const firstSub = cigarSubs[0];
        const lastSub = cigarSubs[cigarSubs.length - 1];

        // Soft clipping can happen at the beginning, at the end, or both
        // positions are from the beginning of the read
        if (firstSub.type === 'S') {
            softClippingAtReadStart = firstSub;
            // soft clipping at the beginning
            substitutions.push({
                pos: -firstSub.length,
                type: 'S',
                length: firstSub.length
            });
        }
        // soft clipping at the end
        if (lastSub.type === 'S') {
            substitutions.push({
                pos: segment.end - segment.start,
                length: lastSub.length,
                type: 'S'
            });
        }

        // Hard clipping can happen at the beginning, at the end or both
        // positions are from the beginning of the read
        if (firstSub.type === 'H') {
            substitutions.push({
                pos: -firstSub.length,
                type: 'H',
                length: firstSub.length
            });
        }
        if (lastSub.type === 'H') {
            substitutions.push({
                pos: segment.end - segment.start,
                length: lastSub.length,
                type: 'H'
            });
        }
    }

    if (segment.md) {
        const mdSubstitutions = parseMD(segment.md, false);
        mdSubstitutions.forEach(function (substitution: (typeof mdSubstitutions)[number] & { variant?: string }) {
            let posStart = substitution['pos'] + substitution['bamSeqShift']!;
            let posEnd = posStart + substitution['length'];
            // When there is soft clipping at the beginning,
            // we need to shift the position where we read the variant from the sequence
            // not necessary when there is hard clipping
            if (softClippingAtReadStart !== null) {
                posStart += softClippingAtReadStart.length;
                posEnd += softClippingAtReadStart.length;
            }
            substitution['variant'] = seq.substring(posStart, posEnd);
            // @ts-expect-error
            delete substitution['bamSeqShift'];
        });
        // @ts-expect-error
        substitutions = mdSubstitutions.concat(substitutions);
    }

    return substitutions;
}

/////////////////////////////////////////////////////
/// End Chrominfo
/////////////////////////////////////////////////////

const bamRecordToJson = (bamRecord: BamRecord, chrName: string, chrOffset: number) => {
    const seq = bamRecord.get('seq');
    const segment: Segment = {
        // if two segments have the same name but different id, they are paired reads.
        // https://github.com/GMOD/bam-js/blob/7a57d24b6aef08a1366cca86ba5092254c7a7f56/src/bamFile.ts#L386
        id: bamRecord.get('id'),
        name: bamRecord.get('name'),
        start: +bamRecord.get('start') + 1 + chrOffset,
        end: +bamRecord.get('end') + 1 + chrOffset,
        md: bamRecord.get('MD'),
        chrName,
        chrOffset,
        cigar: bamRecord.get('cigar'),
        mapq: bamRecord.get('mq'),
        strand: bamRecord.get('strand') === 1 ? '+' : '-'
    };
    return Object.assign(segment, { substitutions: getSubstitutions(segment, seq) });
};

type JsonBamRecord = ReturnType<typeof bamRecordToJson>;

class BamFile extends _BamFile {
    #uid: string;
    headerPromise: ReturnType<BamFile['getHeader']>;
    constructor(opt: ConstructorParameters<typeof _BamFile>, uid: string) {
        super(...opt);
        this.headerPromise = this.getHeader();
        this.#uid = uid;
    }
    static fromUrl(url: string, indexUrl: string, uid: string) {
        return new BamFile([{
            bamFilehandle: new RemoteFile(url),
            baiFilehandle: new RemoteFile(indexUrl)
            // fetchSizeLimit: 500000000,
            // chunkSizeLimit: 100000000,
            // yieldThreadTime: 1000,
        }], uid);
    }
    getChromNames() {
        return this.indexToChr.map((v: { refName: string; length: number }) => v.refName);
    }
    
    /**
     * Retrieves data within a certain coordinate range
     * @param minX A number which is the minimum X boundary of the tile
     * @param maxX A number which is the maximum X boundary of the tile
     * @returns A promise of array of promises which resolve when the data has been successfully retrieved
     */
    async getTileData(minX: number, maxX: number, chromInfo: ExtendedChromInfo, opt: any) {
        const TILE_KEY = `${this.#uid}.${z}.${x}`;
        const { chromLengths, cumPositions } = chromInfo;
        const allTiles: Promise<JsonBamRecord[]>[] = [];
        for (const cumPos of cumPositions) {
            const chromName = cumPos.chr;
            const chromStart = cumPos.pos;
            const chromEnd = cumPos.pos + chromLengths[chromName];
            let startPos: number, endPos: number;
            
            // Early break, rather than creating an nested if
            if (chromStart > minX || minX >= chromEnd) {
                continue;
            }
            
            if (maxX > chromEnd) {
                startPos = minX - chromStart;
                endPos = chromEnd - chromStart;
            } else {
                startPos = Math.floor(minX - chromStart);
                endPos = Math.ceil(maxX - chromStart);
            }
            
            const tilesPromise = new Promise<JsonBamRecord[]>(resolve => {
                this
                    .getRecordsForRange(chromName, startPos, endPos, opt)
                    .then(records => {
                        const mappedRecords = records.map(r =>
                            bamRecordToJson(r, chromName, chromStart)
                        );
                        cachedTileValues[TILE_KEY] = [...cachedTileValues[TILE_KEY], ...mappedRecords];
                        resolve(cachedTileValues[TILE_KEY]);
                    });
                    
            });
            allTiles.push(tilesPromise);
    
            if (maxX <= chromEnd) {
                continue;
            }
            
            minX = chromEnd;
        }
        const tileArrays = await Promise.all(allTiles);
        return tileArrays.flat();
    }
}

interface BamFileOptions {
    loadMates: boolean;
    maxInsertSize: number;
    extractJunction: boolean;
    junctionMinCoverage: number;
}

// indexed by dataset uuid
const dataSources: Map<string, DataSource<BamFile, BamFileOptions>> = new Map();
// indexed by bam url
const bamFileCache: Map<string, BamFile> = new Map();
const MAX_TILES = 20;
const cachedTileValues: Record<string, JsonBamRecord[]> = {};

const init = async (
    uid: string,
    bam: { url: string; indexUrl: string },
    chromSizes: ChromSizes,
    options: Partial<BamFileOptions> = {}
) => {
    if (!bamFileCache.has(bam.url)) {
        const bamFile = BamFile.fromUrl(bam.url, bam.indexUrl, uid);
        await bamFile.getHeader(); // reads bam/bai headers

        // Infer the correct chromosome names between 'chr1' and '1'
        const firstChromNameInHeader = bamFile.getChromNames()[0];
        if (firstChromNameInHeader) {
            const headerHasPrefix = firstChromNameInHeader.includes('chr');
            const specHasPrefix = chromSizes[0]?.[0].includes('chr');
            if (headerHasPrefix && !specHasPrefix) {
                chromSizes = chromSizes.map(([s, n]) => [`chr${s}`, n]);
            } else if (!headerHasPrefix && specHasPrefix) {
                chromSizes = chromSizes.map(([s, n]) => [s.replace('chr', ''), n]);
            }
        }
        bamFileCache.set(bam.url, bamFile);
    }
    const bamFile = bamFileCache.get(bam.url)!;
    const dataSource = new DataSource(bamFile, chromSizes, {
        loadMates: false,
        maxInsertSize: 5000,
        extractJunction: false,
        junctionMinCoverage: 1,
        ...options
    });
    dataSources.set(uid, dataSource);
};

const tilesetInfo = (uid: string) => {
    return dataSources.get(uid)!.tilesetInfo;
};

/**
 * Updates `tileValues` with the data for a specific tile.
 * @param uid A string which is the unique identifier of the worker
 * @param z A number which is the z coordinate of the tile
 * @param x A number which is the x coordinate of the tile
 */
const tile = async (uid: string, z: number, x: number): Promise<JsonBamRecord[]> => {
    const TILE_KEY = `${uid}.${z}.${x}`;
    const MAX_TILE_WIDTH = 200000;
    const source = dataSources.get(uid)!;

    const info = tilesetInfo(uid);

    if (!('max_width' in info)) {
        throw new Error('tilesetInfo does not include `max_width`, which is required for the Gosling BamDataFetcher.');
    }

    const tileWidth = +info.max_width / 2 ** +z;

    const allTiles: Promise<JsonBamRecord[]>[] = [];

    if (tileWidth > MAX_TILE_WIDTH) {
        // this.errorTextText('Zoomed out too far for this track. Zoomin further to see reads');
        return [];
    }

    // get the bounds of the tile
    let minX = info.min_pos[0] + x * tileWidth;
    const maxX = info.min_pos[0] + (x + 1) * tileWidth;
    
    if(cachedTileValues[TILE_KEY]) {
        // We found a cached tile.
        return cachedTileValues[TILE_KEY];
    }

    const opt = {
        viewAsPairs: source.options.loadMates
        // TODO: Turning this on results in "too many requests error"
        // https://github.com/gosling-lang/gosling.js/pull/556
        // pairAcrossChr: typeof loadMates === 'undefined' ? false : loadMates,
    };
    cachedTileValues[TILE_KEY] = await source.file.getTileData(minX, maxX, source.chromInfo, opt);

    
};

const fetchTilesDebounced = async (uid: string, tileIds: string[]) => {
    const tiles: Record<string, JsonBamRecord[] & { tilePositionId: string }> = {};
    const validTileIds: string[] = [];
    const tilePromises: Promise<JsonBamRecord[]>[] = [];

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
        values.forEach((d, i) => {
            const validTileId = validTileIds[i];
            tiles[validTileId] = Object.assign(d, { tilePositionId: validTileId });
        });
        return tiles;
    });
};

const getTabularData = (uid: string, tileIds: string[]) => {
    const { options } = dataSources.get(uid)!;
    const allSegments: Record<string, Segment & { substitutions: string }> = {};

    for (const tileId of tileIds) {
        const tileValue = cachedTileValues[`${uid}.${tileId}`];

        if (!tileValue) {
            continue;
        }

        for (const segment of tileValue) {
            allSegments[segment.id] = {
                ...segment,
                substitutions: JSON.stringify(segment.substitutions)
            };
        }
    }

    let segments = Object.values(allSegments);

    // remvoe duplicates
    const uniqueNames = Array.from(new Set(segments.map(d => d.name)));
    segments = uniqueNames.map(name => segments.find(d => d.name === name)!);

    // find and set mate info when the `data.loadMates` flag is on.
    if (options.loadMates) {
        // TODO: avoid mutation?
        findMates(segments, options.maxInsertSize);
    }

    let output: Junction[] | SegmentWithMate[] | Segment[];
    if (options.extractJunction) {
        // Reference(ggsashimi): https://github.com/guigolab/ggsashimi/blob/d686d59b4e342b8f9dcd484f0af4831cc092e5de/ggsashimi.py#L136
        output = findJunctions(segments, options.junctionMinCoverage);
    } else {
        output = segments;
    }

    const buffer = new TextEncoder().encode(JSON.stringify(output)).buffer;
    return Transfer(buffer, [buffer]);
};

const groupBy = <T, K extends keyof T>(xs: readonly T[], key: K): Record<string, T[]> =>
    xs.reduce((rv, x) => {
        // @ts-expect-error
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});

export type SegmentWithMate = Segment & {
    mateIds: string[];
    foundMate: boolean;
    insertSize: number;
    largeInsertSize: boolean;
    svType: string;
    numMates: number;
};

const findMates = (segments: Segment[], maxInsertSize = 0) => {
    // @ts-expect-error This methods mutates this above aob
    const segmentsByReadName: Record<string, SegmentWithMate[]> = groupBy(segments, 'name');

    // Iterate entries and set information about mates
    Object.values(segmentsByReadName).forEach(segmentGroup => {
        if (segmentGroup.length === 2) {
            const read = segmentGroup[0];
            const mate = segmentGroup[1];
            read.mateIds = [mate.id];
            mate.mateIds = [read.id];
            // Additional info we want
            const [l, r] = [read, mate].sort((a, b) => +a.start - +b.start);
            const insertSize = Math.max(0, +r.start - +l.end);
            const largeInsertSize = insertSize >= maxInsertSize;

            let svType: string;
            if (!largeInsertSize) {
                svType = 'normal read';
            } else if (l.strand === '+' && r.strand === '-') {
                svType = 'deletion (+-)';
            } else if (l.strand === '+' && r.strand === '+') {
                svType = 'inversion (++)';
            } else if (l.strand === '-' && r.strand === '-') {
                svType = 'inversion (--)';
            } else if (l.strand === '-' && r.strand === '+') {
                svType = 'duplication (-+)';
            } else {
                svType = `(${l.strand}${r.strand})`;
            }

            // if(largeInsertSize) console.log(svType);
            [read, mate].forEach(d => {
                d.foundMate = true;
                d.insertSize = insertSize;
                d.largeInsertSize = largeInsertSize;
                d.svType = svType;
                d.numMates = 2;
            });
        } else {
            // We do not handle such cases for now
            segmentGroup.forEach(d => {
                d.mateIds = segmentGroup.filter(mate => mate.id !== d.id).map(mate => mate.id);
                d.foundMate = false;
                d.insertSize = -1;
                d.largeInsertSize = false;
                d.svType = segmentGroup.length === 1 ? 'mates not found within chromosome' : 'more than two mates';
                d.numMates = segmentGroup.length;
            });
        }
    });
    return segmentsByReadName;
};

export type Junction = { start: number; end: number; score: number };

const findJunctions = (segments: { start: number; end: number; substitutions: string }[], minCoverage = 0) => {
    const junctions: Junction[] = [];
    segments.forEach(segment => {
        const substitutions: { pos: number; length: number }[] = JSON.parse(segment.substitutions);
        substitutions.forEach(sub => {
            const don = segment.start + sub.pos;
            const acc = segment.start + sub.pos + sub.length;
            if (segment.start < don && acc < segment.end) {
                const j = junctions.find(d => d.start === don && d.end === acc);
                if (j) {
                    j.score += 1;
                } else {
                    junctions.push({ start: don, end: acc, score: 1 });
                }
            }
        });
    });
    return junctions.filter(d => d.score >= minCoverage);
};

const tileFunctions = {
    init,
    tilesetInfo,
    fetchTilesDebounced,
    tile,
    getTabularData
};

expose(tileFunctions);

export type WorkerApi = typeof tileFunctions;
export type { TilesetInfo };
export type Tiles = Awaited<ReturnType<typeof fetchTilesDebounced>>;
