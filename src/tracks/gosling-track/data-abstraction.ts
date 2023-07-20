import type { SparseTile, TileData } from '@higlass/services';
import type { Datum, SingleTrack } from '../../core/gosling.schema';
import { IsDataDeepTileset } from '../../core/gosling.schema.guards';

export const GOSLING_DATA_ROW_UID_FIELD = 'gosling-data-row-uid';

/**
 * Convert genomic data formats to common tabular formats for given tile.
 */
export function getTabularData(
    spec: SingleTrack,
    data: TileData & {
        sparse?: Array<SparseTile>;
        shape?: [number, number];
        tileX: number;
        tileWidth: number;
        tileSize: number;
        tileY?: number; // used for matrix
        tileHeight?: number; // used for matrix
    }
) {
    const tabularData: Datum[] = [];

    if (!IsDataDeepTileset(spec.data)) {
        console.warn('No data is specified');
        return;
    }

    if (spec.data.type === 'vector' || spec.data.type === 'bigwig') {
        if (!('dense' in data)) {
            // we did not get sufficient data.
            return;
        }

        const bin = spec.data.binSize ?? 1;

        const numericValues = data.dense;
        const numOfGenomicPositions = data.tileSize;
        const tileUnitSize = data.tileWidth / data.tileSize;

        const valueName = spec.data.value ?? 'value';
        const columnName = spec.data.column ?? 'position';
        const startName = spec.data.start ?? 'start';
        const endName = spec.data.end ?? 'end';

        // additional columns with different aggregation functions
        const minValueName = `${valueName}_min`;
        const maxValueName = `${valueName}_max`;

        // user's aggregation function
        const agg = spec.data.aggregation ?? 'mean';

        // convert data to a visualization-friendly format
        let cumVal = 0;
        let minVal = Number.MAX_SAFE_INTEGER;
        let maxVal = Number.MIN_SAFE_INTEGER;
        let binStart = Number.MIN_SAFE_INTEGER;
        let binEnd = Number.MAX_SAFE_INTEGER;
        Array.from(Array(numOfGenomicPositions).keys()).forEach((g: number, j: number) => {
            // add individual rows
            if (bin === 1) {
                const value = numericValues[j] / (agg === 'mean' ? tileUnitSize : 1);
                tabularData.push({
                    [valueName]: value,
                    [columnName]: data.tileX + (j + 0.5) * tileUnitSize,
                    [startName]: data.tileX + j * tileUnitSize,
                    [endName]: data.tileX + (j + 1) * tileUnitSize,
                    [minValueName]: value,
                    [maxValueName]: value
                });
            } else {
                // bin the data considering the `binSize` option
                if (j % bin === 0) {
                    // Start storing information for this bin
                    cumVal = minVal = maxVal = numericValues[j];
                    binStart = j;
                    binEnd = j + bin;
                } else if (j % bin === bin - 1) {
                    // Add a row using the cumulative value
                    tabularData.push({
                        [valueName]: cumVal / bin / (agg === 'mean' ? tileUnitSize : 1),
                        [columnName]: data.tileX + (binStart + bin / 2.0) * tileUnitSize,
                        [startName]: data.tileX + binStart * tileUnitSize,
                        [endName]: data.tileX + binEnd * tileUnitSize,
                        [minValueName]: minVal,
                        [maxValueName]: maxVal
                    });
                } else if (j === numOfGenomicPositions - 1) {
                    // Manage the remainders. Just add them as a single row.
                    const smallBin = numOfGenomicPositions % bin;
                    const correctedBinEnd = binStart + smallBin;
                    tabularData.push({
                        [valueName]: cumVal / smallBin / (agg === 'mean' ? tileUnitSize : 1),
                        [columnName]: data.tileX + (binStart + smallBin / 2.0) * tileUnitSize,
                        [startName]: data.tileX + binStart * tileUnitSize,
                        [endName]: data.tileX + correctedBinEnd * tileUnitSize,
                        [minValueName]: minVal,
                        [maxValueName]: maxVal
                    });
                } else {
                    // Add a current value
                    cumVal += numericValues[j];
                    if (minVal > numericValues[j]) minVal = numericValues[j];
                    if (maxVal < numericValues[j]) maxVal = numericValues[j];
                }
            }
        });
    } else if (spec.data.type === 'multivec') {
        if (!('dense' in data) || data.shape === undefined) {
            // we did not get sufficient data.
            return;
        }

        const bin = spec.data.binSize ?? 1;

        const numOfTotalCategories = data.shape[0];
        const categories: any = spec.data.categories ?? [...Array(numOfTotalCategories).keys()];
        const numericValues = data.dense;
        const numOfGenomicPositions = data.shape[1];
        const tileUnitSize = data.tileWidth / data.tileSize;

        const rowName = spec.data.row ?? 'category';
        const valueName = spec.data.value ?? 'value';
        const columnName = spec.data.column ?? 'position';
        const startName = spec.data.start ?? 'start';
        const endName = spec.data.end ?? 'end';

        // additional columns with different aggregation functions
        const minValueName = `${valueName}_min`;
        const maxValueName = `${valueName}_max`;

        // user's aggregation function
        const agg = spec.data.aggregation ?? 'mean';

        // convert data to a visualization-friendly format
        categories.forEach((c: string, i: number) => {
            let cumVal = 0;
            let binStart = Number.MIN_SAFE_INTEGER;
            let binEnd = Number.MAX_SAFE_INTEGER;
            let minVal = Number.MAX_SAFE_INTEGER;
            let maxVal = Number.MIN_SAFE_INTEGER;
            Array.from(Array(numOfGenomicPositions).keys()).forEach((g: number, j: number) => {
                // add individual rows
                if (bin === 1) {
                    const value = numericValues[numOfGenomicPositions * i + j] / (agg === 'mean' ? tileUnitSize : 1);
                    tabularData.push({
                        [rowName]: c,
                        [valueName]: value,
                        [columnName]: data.tileX + (j + 0.5) * tileUnitSize,
                        [startName]: data.tileX + j * tileUnitSize,
                        [endName]: data.tileX + (j + 1) * tileUnitSize,
                        [minValueName]: value,
                        [maxValueName]: value
                    });
                } else {
                    if (j % bin === 0) {
                        // Start storing information for this bin
                        cumVal = minVal = maxVal = numericValues[numOfGenomicPositions * i + j];
                        binStart = j;
                        binEnd = j + bin;
                    } else if (j % bin === bin - 1) {
                        // Add a row using the cumulative value

                        tabularData.push({
                            [rowName]: c,
                            [valueName]: agg === 'mean' ? cumVal / bin / tileUnitSize : cumVal,
                            [columnName]: data.tileX + (binStart + bin / 2.0) * tileUnitSize,
                            [startName]: data.tileX + binStart * tileUnitSize,
                            [endName]: data.tileX + binEnd * tileUnitSize,
                            [minValueName]: minVal,
                            [maxValueName]: maxVal
                        });
                    } else if (j === numOfGenomicPositions - 1) {
                        // Manage the remainders. Just add them as a single row.
                        const smallBin = numOfGenomicPositions % bin;
                        const correctedBinEnd = binStart + smallBin;
                        tabularData.push({
                            [rowName]: c,
                            [valueName]: agg === 'mean' ? cumVal / smallBin / tileUnitSize : cumVal,
                            [columnName]: data.tileX + (binStart + smallBin / 2.0) * tileUnitSize,
                            [startName]: data.tileX + binStart * tileUnitSize,
                            [endName]: data.tileX + correctedBinEnd * tileUnitSize,
                            [minValueName]: minVal,
                            [maxValueName]: maxVal
                        });
                    } else {
                        // Add a current value
                        const value = numericValues[numOfGenomicPositions * i + j];
                        cumVal += value;
                        if (minVal > value) minVal = value;
                        if (maxVal < value) maxVal = value;
                    }
                }
            });
        });
    } else if (spec.data.type === 'matrix') {
        if (!('dense' in data) || typeof data.tileY === 'undefined' || typeof data.tileHeight === 'undefined') {
            // we do not have sufficient data.
            return;
        }

        // width and height of the tile
        const numBins = Math.sqrt(data.dense.length);

        const { tileX, tileY, tileWidth, tileHeight } = data;
        const numericValues = data.dense;

        const tileXUnitSize = tileWidth / numBins;
        const tileYUnitSize = tileHeight / numBins;
        const columnField = spec.data.column ?? 'x';
        const rowField = spec.data.row ?? 'y';

        // TODO: a way to improve rendering performance?
        // For the rendering performance, we aggregate cells so that we draw smaller number of marks.
        const aggSize = 16; // assuming that # of cells can be divided by binSize, which is mostly 256 or 1024
        for (let i = 0; i < numericValues.length / aggSize; i++) {
            const aggLen = Math.sqrt(aggSize);
            const xIndex = (i * aggLen) % numBins;
            const yIndex = Math.floor((i * aggLen) / numBins) * aggLen;

            // Being xIndex and yIndex the top-let origin, aggregate 4 x 4 cells
            let value = NaN;
            for (let c = 0; c < aggLen; c++) {
                for (let r = 0; r < aggLen; r++) {
                    const curVal = numericValues[(yIndex + r) * numBins + (xIndex + c)];
                    // If the current value is NaN, we do not need to do anything
                    if (!isNaN(+curVal)) {
                        // If the cumulative value is still NaN, which is the default value,
                        // set that to zero so that we are able to add a value
                        if (isNaN(value)) {
                            value = 0;
                        }
                        value += curVal;
                    }
                }
            }

            if (isNaN(value)) {
                // this means all values for this bin is NaN, hence a missing value
                continue;
            }

            const xs = tileX + xIndex * tileXUnitSize;
            const xe = tileX + (xIndex + aggLen) * tileXUnitSize;
            const ys = tileY + yIndex * tileYUnitSize;
            const ye = tileY + (yIndex + aggLen) * tileYUnitSize;
            const x = (xs + xe) / 2.0;
            const y = (ys + ye) / 2.0;
            tabularData.push({
                value,
                [columnField]: x,
                [`${columnField}s`]: xs,
                [`${columnField}e`]: xe,
                [rowField]: y,
                [`${rowField}s`]: ys,
                [`${rowField}e`]: ye
            });
        }
    } else if (spec.data.type === 'beddb') {
        if (!data.sparse) {
            // we did not get sufficient data.
            return;
        }

        const { genomicFields, exonIntervalFields, valueFields } = spec.data;

        data.sparse.forEach((d, i) => {
            const { chrOffset, fields } = d;

            const datum: { [k: string]: number | string } = {};

            datum[GOSLING_DATA_ROW_UID_FIELD] = `${i}`;

            genomicFields.forEach(g => {
                datum[g.name] = +fields[g.index] + chrOffset;
            });

            // values
            valueFields?.forEach(v => {
                datum[v.name] = v.type === 'quantitative' ? +fields[v.index] : fields[v.index];
            });

            tabularData.push({
                ...datum,
                type: 'gene' // this should be described in the spec
            });

            if (exonIntervalFields) {
                const [exonStartField, exonEndField] = exonIntervalFields;
                const exonStartStrs = (fields[exonStartField.index] as string).split(',');
                const exonEndStrs = (fields[exonEndField.index] as string).split(',');

                exonStartStrs.forEach((es, i) => {
                    const ee = exonEndStrs[i];

                    // exon
                    tabularData.push({
                        ...datum,
                        [exonStartField.name]: +es + chrOffset,
                        [exonEndField.name]: +ee + chrOffset,
                        type: 'exon'
                    });

                    // intron
                    if (i + 1 < exonStartStrs.length) {
                        const nextEs = exonStartStrs[i + 1];
                        tabularData.push({
                            ...datum,
                            [exonStartField.name]: +ee + chrOffset,
                            [exonEndField.name]: +nextEs + chrOffset,
                            type: 'intron'
                        });
                    }
                });
            }
        });
    }

    /// DEBUG
    // console.log(tabularData);

    return tabularData;
}
