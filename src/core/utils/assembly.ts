import type { Assembly, ChromSizes, GenomicPosition } from '@gosling-lang/gosling-schema';
import {
    CHROM_SIZE_HG16,
    CHROM_SIZE_HG17,
    CHROM_SIZE_HG18,
    CHROM_SIZE_HG19,
    CHROM_SIZE_HG38,
    CHROM_SIZE_MM10,
    CHROM_SIZE_MM9
} from './chrom-size';

export interface ChromSize {
    size: { [chr: string]: number };
    interval: { [chr: string]: [number, number] };
    total: number;
    path: string;
}

/**
 * Get relative chromosome position (e.g., `100` => `{ chromosome: 'chr1', position: 100 }`)
 * @param absPos number which is the absolute chromosome position
 * @param assembly the assembly used to calculate which chromosome position
 * @param returnWithinAssembly If true, then if the absolute position is before the first chromosome, it returns the
 * first position of the first chromosome. If the absolute position is after the last chromosome, it returns the last
 * position of the last chromosome
 * @returns the genomic position of the absPos
 */
export function getRelativeGenomicPosition(
    absPos: number,
    assembly?: Assembly,
    returnWithinAssembly = false
): GenomicPosition {
    const chrSizes = Object.entries(computeChromSizes(assembly).interval);
    const minPosChr = { chromosome: 'unknown', position: Infinity } as GenomicPosition;
    const maxPosChr = { chromosome: 'unknown', position: 0 } as GenomicPosition;
    for (const chrSize of chrSizes) {
        const [chromosome, absInterval] = chrSize;
        const [start, end] = absInterval;
        // absPos was found within this chromosome
        if (start <= absPos && absPos < end) {
            return { chromosome, position: absPos - start } as GenomicPosition;
        }
        // Update the min and max chromosomes found
        if (start < minPosChr.position) {
            minPosChr.chromosome = chromosome;
            minPosChr.position = start;
        }
        if (end > maxPosChr.position) {
            maxPosChr.chromosome = chromosome;
            maxPosChr.position = end;
        }
    }
    if (returnWithinAssembly) {
        // Return either the min or max chromosome position
        if (absPos < minPosChr.position) {
            return minPosChr;
        } else {
            return maxPosChr;
        }
    } else {
        return { chromosome: 'unknown', position: absPos };
    }
}

/**
 * Generate a URL for custom chrom sizes
 * @param chromSizes A custom assembly that specifies chromosomes and their sizes
 */
function createChromSizesUrl(chromSizes: ChromSizes): string {
    const text = chromSizes.map(d => d.join('\t')).join('\n');
    const tsv = new Blob([text], { type: 'text/tsv' });
    return URL.createObjectURL(tsv);
}

/**
 * Get chromosome sizes.
 * @param assembly (default: 'hg38')
 */
export function computeChromSizes(assembly?: Assembly): ChromSize {
    if (assembly && typeof assembly === 'string' && assembly in CRHOM_SIZES) {
        return CRHOM_SIZES[assembly];
    } else if (Array.isArray(assembly) && assembly.length !== 0) {
        // custom assembly
        const size = Object.fromEntries(assembly);
        return {
            size,
            interval: getChromInterval(size),
            total: getChromTotalSize(size),
            path: createChromSizesUrl(assembly)
        };
    } else {
        // We do not have that assembly prepared, so return a default one.
        return CRHOM_SIZES.hg38;
    }
}

const basePath = (assembly: string) => `https://s3.amazonaws.com/gosling-lang.org/data/${assembly}.chrom.sizes`;
const CRHOM_SIZES: { [assembly: string]: ChromSize } = Object.freeze({
    hg38: {
        size: CHROM_SIZE_HG38,
        interval: getChromInterval(CHROM_SIZE_HG38),
        total: getChromTotalSize(CHROM_SIZE_HG38),
        path: basePath('hg38')
    },
    hg19: {
        size: CHROM_SIZE_HG19,
        interval: getChromInterval(CHROM_SIZE_HG19),
        total: getChromTotalSize(CHROM_SIZE_HG19),
        path: basePath('hg19')
    },
    hg18: {
        size: CHROM_SIZE_HG18,
        interval: getChromInterval(CHROM_SIZE_HG18),
        total: getChromTotalSize(CHROM_SIZE_HG18),
        path: basePath('hg18')
    },
    hg17: {
        size: CHROM_SIZE_HG17,
        interval: getChromInterval(CHROM_SIZE_HG17),
        total: getChromTotalSize(CHROM_SIZE_HG17),
        path: basePath('hg17')
    },
    hg16: {
        size: CHROM_SIZE_HG16,
        interval: getChromInterval(CHROM_SIZE_HG16),
        total: getChromTotalSize(CHROM_SIZE_HG16),
        path: basePath('hg16')
    },
    mm10: {
        size: CHROM_SIZE_MM10,
        interval: getChromInterval(CHROM_SIZE_MM10),
        total: getChromTotalSize(CHROM_SIZE_MM10),
        path: basePath('mm10')
    },
    mm9: {
        size: CHROM_SIZE_MM9,
        interval: getChromInterval(CHROM_SIZE_MM9),
        total: getChromTotalSize(CHROM_SIZE_MM9),
        path: basePath('mm9')
    },
    // `unknown` assembly contains only one chromosome with max length
    unknown: {
        size: { chr: Number.MAX_VALUE },
        interval: { chr: [0, Number.MAX_VALUE] },
        total: Number.MAX_VALUE,
        path: basePath('hg38') // just to ensure this does not make crash
    }
});

/**
 * Some presets of auto-complete IDs (`autocompleteId`) to search for genes using the HiGlass server.
 */
export function getAutoCompleteObject(assembly: Assembly = 'hg38') {
    const base = {
        autocompleteServer: 'https://server.gosling-lang.org/api/v1',
        chromInfoServer: 'https://server.gosling-lang.org/api/v1',
        chromInfoId: assembly
    };
    switch (assembly) {
        case 'hg19':
            return { ...base, autocompleteId: 'gene-annotation-hg19' };
        case 'mm10':
            return { ...base, autocompleteId: 'gene-annotation-mm10' };
        case 'mm9':
            // mm9 is not supported by the Gosling server, so we use HiGlass server.
            // To support, we need to add mm9 gene annotation to the Gosling server.
            return {
                ...base,
                autocompleteServer: 'https://higlass.io/api/v1',
                chromInfoServer: 'https://higlass.io/api/v1',
                autocompleteId: 'GUm5aBiLRCyz2PsBea7Yzg'
            };
        case 'hg38':
        default:
            return { ...base, autocompleteId: 'gene-annotation' };
    }
}

/**
 * Calculate cumulative interval of each chromosome.
 */
export function getChromInterval(chromSize: { [k: string]: number }) {
    const interval: { [k: string]: [number, number] } = {};

    Object.keys(chromSize).reduce((sum, k) => {
        interval[k] = [sum, sum + chromSize[k]];
        return sum + chromSize[k];
    }, 0);

    return interval;
}

/**
 * Calculate total size of entire chromosomes.
 */
export function getChromTotalSize(chromSize: { [k: string]: number }) {
    return Object.values(chromSize).reduce((sum, current) => sum + current, 0);
}

export function parseGenomicPosition(position: string): { chromosome: string; start?: number; end?: number } {
    const [chromosome, intervalString] = position.split(':');
    if (intervalString) {
        const [start, end] = intervalString.split('-').map(s => +s.replace(/,/g, ''));
        // only return if both are valid
        if (!Number.isNaN(start) && !Number.isNaN(end)) {
            return { chromosome, start, end };
        }
    }
    return { chromosome };
}

/**
 * A class that consistently manage and convert genomics positions.
 */
export class GenomicPositionHelper {
    constructor(
        public chromosome: string,
        public start?: number,
        public end?: number
    ) {}
    static fromString(str: string) {
        const result = parseGenomicPosition(str);
        return new GenomicPositionHelper(result.chromosome, result.start, result.end);
    }
    toAbsoluteCoordinates(assembly?: Assembly, padding = 0): [number, number] {
        const info = computeChromSizes(assembly);
        const size = info.size[this.chromosome];
        const interval = info.interval[this.chromosome];
        if (size === undefined || interval === undefined) {
            throw new Error(`Chromosome name ${this.chromosome} is not valid`);
        }
        let { start, end } = this;
        if (start === undefined || end === undefined) {
            // if only a chromosome name is specified, set to the extent of the chromosome
            [start, end] = [1, size];
        }
        const offset = interval[0];
        return [start + offset - padding, end + offset + padding];
    }
}
