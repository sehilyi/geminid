import type { GoslingSpec, CsvData, Track } from '@gosling.schema';
const data: CsvData = {
    type: 'csv',
    url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
    chromosomeField: 'c2',
    genomicFields: ['s1', 'e1', 's2', 'e2']
};

const width = 500,
    bandHeight = 16,
    linkHeight = 100;

const getRectTrack = (x: string, xe: string): Track => {
    return {
        data,
        mark: 'rect',
        x: { field: x, type: 'genomic' },
        xe: { field: xe, type: 'genomic' },
        stroke: { value: '#4C6629' },
        strokeWidth: { value: 0.8 },
        tooltip: [
            { field: x, type: 'genomic', alt: '<b style="color:green">Start Position</b>' },
            { field: xe, type: 'genomic', alt: '<b style="color:green">End Position</b>' }
        ],
        opacity: { value: 0.15 },
        color: { value: '#85B348' },
        width,
        height: bandHeight
    };
};

const getBetweenLinkTrack = (x: string, xe: string, x1: string, x1e: string): Track => {
    return {
        data,
        mark: 'betweenLink',
        x: { field: x, type: 'genomic' },
        xe: { field: xe, type: 'genomic' },
        x1: { field: x1, type: 'genomic' },
        x1e: { field: x1e, type: 'genomic' },
        stroke: { value: '#4C6629' },
        strokeWidth: { value: 0.8 },
        opacity: { value: 0.15 },
        color: { value: '#85B348' },
        style: { outlineWidth: 0 },
        width,
        height: linkHeight
    };
};

const spec: GoslingSpec = {
    layout: 'linear',
    xDomain: { chromosome: 'chr1', interval: [103900000, 104100000] },
    spacing: 0,
    tracks: [
        getRectTrack('s1', 'e1'),
        getBetweenLinkTrack('s1', 'e1', 's2', 'e2'),
        getRectTrack('s2', 'e2'),
        getBetweenLinkTrack('s2', 'e2', 's1', 'e1'),
        getRectTrack('s1', 'e1'),
        getBetweenLinkTrack('s1', 'e1', 's2', 'e2'),
        getRectTrack('s2', 'e2')
    ]
};

export { spec };
