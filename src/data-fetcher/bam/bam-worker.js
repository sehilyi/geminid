// This worker is heavily based on https://github.com/higlass/higlass-pileup/blob/master/src/bam-fetcher-worker.js
import { text } from 'd3-request';
import { bisector } from 'd3-array';
import { tsvParseRows } from 'd3-dsv';
import { color } from 'd3-color';
import { expose, Transfer } from 'threads/worker';
import { BamFile } from '@gmod/bam';
import LRU from 'lru-cache';

export const cigarTypeToText = type => {
    if (type === 'D') {
        return 'Deletion';
    } else if (type === 'S') {
        return 'Soft clipping';
    } else if (type === 'H') {
        return 'Hard clipping';
    } else if (type === 'I') {
        return 'Insertion';
    } else if (type === 'N') {
        return 'Skipped region';
    }
    return type;
};

export const parseMD = (mdString, useCounts) => {
    let currPos = 0;
    let currNum = 0;
    let deletionEncountered = false;
    let bamSeqShift = 0;
    const substitutions = [];

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
};

/**
 * Gets an array of all substitutions in the segment
 * @param  {String} segment  Current segment
 * @param  {String} seq   Read sequence from bam file.
 * @return {Array}  Substitutions.
 */
export const getSubstitutions = (segment, seq) => {
    let substitutions = [];
    let softClippingAtReadStart = null;

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

        // Soft clipping can happen at the beginning, at the end or both
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
                pos: segment.to - segment.from,
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
                pos: segment.to - segment.from,
                length: lastSub.length,
                type: 'H'
            });
        }
    }

    if (segment.md) {
        const mdSubstitutions = parseMD(segment.md, false);

        mdSubstitutions.forEach(function (substitution) {
            let posStart = substitution['pos'] + substitution['bamSeqShift'];
            let posEnd = posStart + substitution['length'];
            // When there is soft clipping at the beginning,
            // we need to shift the position where we read the variant from the sequence
            // not necessary when there is hard clipping
            if (softClippingAtReadStart !== null) {
                posStart += softClippingAtReadStart.length;
                posEnd += softClippingAtReadStart.length;
            }
            substitution['variant'] = seq.substring(posStart, posEnd);
            delete substitution['bamSeqShift'];
        });

        substitutions = mdSubstitutions.concat(substitutions);
    }

    return substitutions;
};

/////////////////////////////////////////////////
/// ChromInfo
/////////////////////////////////////////////////

const chromInfoBisector = bisector(d => d.pos).left;

const groupBy = (xs, key) =>
    xs.reduce((rv, x) => {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});

const chrToAbs = (chrom, chromPos, chromInfo) => chromInfo.chrPositions[chrom].pos + chromPos;

const absToChr = (absPosition, chromInfo) => {
    if (!chromInfo || !chromInfo.cumPositions || !chromInfo.cumPositions.length) {
        return null;
    }

    let insertPoint = chromInfoBisector(chromInfo.cumPositions, absPosition);
    const lastChr = chromInfo.cumPositions[chromInfo.cumPositions.length - 1].chr;
    const lastLength = chromInfo.chromLengths[lastChr];

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

    return [chromInfo.cumPositions[insertPoint].chr, chrPosition, offset, insertPoint];
};

function natcmp(xRow, yRow) {
    const x = xRow[0];
    const y = yRow[0];

    if (x.indexOf('_') >= 0) {
        const xParts = x.split('_');
        if (y.indexOf('_') >= 0) {
            // chr_1 vs chr_2
            const yParts = y.split('_');

            return natcmp(xParts[1], yParts[1]);
        }

        // chr_1 vs chr1
        // chr1 comes first
        return 1;
    }

    if (y.indexOf('_') >= 0) {
        // chr1 vs chr_1
        // y comes second
        return -1;
    }

    const xParts = [];
    const yParts = [];

    for (const part of x.match(/(\d+|[^\d]+)/g)) {
        xParts.push(Number.isNaN(part) ? part.toLowerCase() : +part);
    }

    for (const part of y.match(/(\d+|[^\d]+)/g)) {
        xParts.push(Number.isNaN(part) ? part.toLowerCase() : +part);
    }

    // order of these parameters is purposefully reverse how they should be
    // ordered
    for (const key of ['m', 'y', 'x']) {
        if (y.toLowerCase().includes(key)) return -1;
        if (x.toLowerCase().includes(key)) return 1;
    }

    if (xParts < yParts) {
        return -1;
    } else if (yParts > xParts) {
        return 1;
    }

    return 0;
}

function parseChromsizesRows(data) {
    const cumValues = [];
    const chromLengths = {};
    const chrPositions = {};

    let totalLength = 0;

    for (let i = 0; i < data.length; i++) {
        const length = Number(data[i][1]);
        totalLength += length;

        const newValue = {
            id: i,
            chr: data[i][0],
            pos: totalLength - length
        };

        cumValues.push(newValue);
        chrPositions[newValue.chr] = newValue;
        chromLengths[data[i][0]] = length;
    }

    return {
        cumPositions: cumValues,
        chrPositions,
        totalLength,
        chromLengths
    };
}

function ChromosomeInfo(filepath, success) {
    const ret = {};

    ret.absToChr = absPos => (ret.chrPositions ? absToChr(absPos, ret) : null);

    ret.chrToAbs = ([chrName, chrPos] = []) => (ret.chrPositions ? chrToAbs(chrName, chrPos, ret) : null);

    return text(filepath, (error, chrInfoText) => {
        if (error) {
            // console.warn('Chromosome info not found at:', filepath);
            if (success) success(null);
        } else {
            const data = tsvParseRows(chrInfoText);
            const chromInfo = parseChromsizesRows(data);

            Object.keys(chromInfo).forEach(key => {
                ret[key] = chromInfo[key];
            });
            if (success) success(ret);
        }
    });
}

/////////////////////////////////////////////////////
/// End Chrominfo
/////////////////////////////////////////////////////

const bamRecordToJson = (bamRecord, chrName, chrOffset) => {
    const seq = bamRecord.get('seq');

    const segment = {
        id: bamRecord._id,
        from: +bamRecord.data.start + 1 + chrOffset,
        to: +bamRecord.data.end + 1 + chrOffset,
        md: bamRecord.get('MD'),
        chrName,
        chrOffset,
        cigar: bamRecord.get('cigar'),
        mapq: bamRecord.get('mq'),
        strand: bamRecord.get('strand') === 1 ? '+' : '-',
        row: null,
        substitutions: []
    };

    segment.substitutions = getSubstitutions(segment, seq);

    return segment;
};

// promises indexed by urls
const bamFiles = {};
const bamHeaders = {};

const MAX_TILES = 20;

// promises indexed by url
const chromSizes = {};
const chromInfos = {};
const tileValues = new LRU({ max: MAX_TILES });
const tilesetInfos = {};

// indexed by uuid
const dataConfs = {};

const init = (uid, bamUrl, baiUrl, chromSizesUrl) => {
    // TODO: Support different URLs
    chromSizesUrl = chromSizesUrl || `https://s3.amazonaws.com/gosling-lang.org/data/hg19.chrom.sizes`;

    if (!bamFiles[bamUrl]) {
        // We do not yet have this file cached.
        bamFiles[bamUrl] = new BamFile({ bamUrl, baiUrl });

        // We have to fetch the header before we can fetch data
        bamHeaders[bamUrl] = bamFiles[bamUrl].getHeader();
    }

    // if no chromsizes are passed in, we'll retrieve them from the BAM file
    chromSizes[chromSizesUrl] = chromSizes[chromSizesUrl] || new Promise(resolve => { ChromosomeInfo(chromSizesUrl, resolve) });

    dataConfs[uid] = { bamUrl, chromSizesUrl };
};

const tilesetInfo = uid => {
    const { chromSizesUrl, bamUrl } = dataConfs[uid];
    const promises = chromSizesUrl ? [bamHeaders[bamUrl], chromSizes[chromSizesUrl]] : [bamHeaders[bamUrl]];

    return Promise.all(promises).then(values => {
        const TILE_SIZE = 1024;
        let chromInfo = null;

        if (values.length > 1) {
            // This means we received a chromInfo file
            chromInfo = values[1];
        } else {
            // No chromInfo provided so we have to take it from the bam file index
            const chroms = [];
            for (const { refName, length } of bamFiles[bamUrl].indexToChr) {
                chroms.push([refName, length]); // refName is the chromosome name
            }
            chroms.sort(natcmp);
            chromInfo = parseChromsizesRows(chroms);
        }
        chromInfos[chromSizesUrl] = chromInfo;

        tilesetInfos[uid] = {
            tile_size: TILE_SIZE,
            bins_per_dimension: TILE_SIZE,
            max_zoom: Math.ceil(Math.log(chromInfo.totalLength / TILE_SIZE) / Math.log(2)),
            max_width: chromInfo.totalLength,
            min_pos: [0],
            max_pos: [chromInfo.totalLength]
        };

        return tilesetInfos[uid];
    });
};

const tile = async (uid, z, x) => {
    const MAX_TILE_WIDTH = 200000;
    const { bamUrl, chromSizesUrl } = dataConfs[uid];
    const bamFile = bamFiles[bamUrl];

    return tilesetInfo(uid).then(tilesetInfo => {
        const tileWidth = +tilesetInfo.max_width / 2 ** +z;
        const recordPromises = [];

        if (tileWidth > MAX_TILE_WIDTH) {
            // this.errorTextText('Zoomed out too far for this track. Zoomin further to see reads');
            return new Promise(resolve => resolve([]));
        }

        // get the bounds of the tile
        let minX = tilesetInfo.min_pos[0] + x * tileWidth;
        const maxX = tilesetInfo.min_pos[0] + (x + 1) * tileWidth;

        const chromInfo = chromInfos[chromSizesUrl];

        const { chromLengths, cumPositions } = chromInfo;

        for (let i = 0; i < cumPositions.length; i++) {
            const chromName = cumPositions[i].chr;
            const chromStart = cumPositions[i].pos;

            const chromEnd = cumPositions[i].pos + chromLengths[chromName];
            tileValues.set(`${uid}.${z}.${x}`, []);

            if (chromStart <= minX && minX < chromEnd) {
                // start of the visible region is within this chromosome

                if (maxX > chromEnd) {
                    // the visible region extends beyond the end of this chromosome
                    // fetch from the start until the end of the chromosome
                    recordPromises.push(
                        bamFile
                            .getRecordsForRange(chromName, minX - chromStart, chromEnd - chromStart)
                            .then(records => {
                                const mappedRecords = records.map(rec =>
                                    bamRecordToJson(rec, chromName, cumPositions[i].pos)
                                );
                                tileValues.set(
                                    `${uid}.${z}.${x}`,
                                    tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords)
                                );
                            })
                    );

                    // continue onto the next chromosome
                    minX = chromEnd;
                } else {
                    const endPos = Math.ceil(maxX - chromStart);
                    const startPos = Math.floor(minX - chromStart);
                    // the end of the region is within this chromosome
                    recordPromises.push(
                        bamFile
                            .getRecordsForRange(chromName, startPos, endPos, {
                                // viewAsPairs: true,
                                // maxInsertSize: 2000,
                            })
                            .then(records => {
                                const mappedRecords = records.map(rec =>
                                    bamRecordToJson(rec, chromName, cumPositions[i].pos)
                                );

                                tileValues.set(
                                    `${uid}.${z}.${x}`,
                                    tileValues.get(`${uid}.${z}.${x}`).concat(mappedRecords)
                                );
                                return [];
                            })
                    );

                    // end the loop because we've retrieved the last chromosome
                    break;
                }
            }
        }

        // flatten the array of promises so that it looks like we're getting one long list of value
        return Promise.all(recordPromises).then(values => {
            return values.flat();
        });
    });
};

const fetchTilesDebounced = async (uid, tileIds) => {
    const tiles = {};

    const validTileIds = [];
    const tilePromises = [];

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
            tiles[validTileId] = d;
            tiles[validTileId].tilePositionId = validTileId;
        });
        return tiles;
    });
};

const getTabularData = (uid, tileIds) => {
    const allSegments = {};
    for (const tileId of tileIds) {
        const tileValue = tileValues.get(`${uid}.${tileId}`);

        if (tileValue.error) {
            throw new Error(tileValue.error);
        }

        for (const segment of tileValue) {
            allSegments[segment.id] = {
                ...segment,
                substitutions: JSON.stringify(segment.substitutions)
            };
        }
    }

    const segmentList = Object.values(allSegments);
    const buffer = Buffer.from(JSON.stringify(segmentList)).buffer;
    return Transfer(buffer, [buffer]);
};

const tileFunctions = {
    init,
    tilesetInfo,
    fetchTilesDebounced,
    tile,
    getTabularData
};

expose(tileFunctions);
