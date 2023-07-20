import type { GoslingSpec, MultivecData, View, Tooltip } from '@gosling.schema';

const size = { width: 600, height: 130 };

const data: MultivecData = {
    url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
    type: 'multivec',
    row: 'sample',
    column: 'position',
    value: 'peak',
    categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
};

const tooltip: Tooltip[] = [
    { field: 'start', type: 'genomic', alt: 'Start Position' },
    { field: 'end', type: 'genomic', alt: 'End Position' },
    {
        field: 'peak',
        type: 'quantitative',
        alt: 'Value',
        format: '.2'
    },
    { field: 'sample', type: 'nominal', alt: 'Sample' }
];

/******* start define invidual visualizations *******/
const heatmapView: View = {
    tracks: [
        {
            id: 'track-1',
            data: {
                ...data,
                binSize: 4
            },
            mark: 'rect',
            x: { field: 'start', type: 'genomic', axis: 'top' },
            xe: { field: 'end', type: 'genomic' },
            row: { field: 'sample', type: 'nominal', legend: true },
            color: { field: 'peak', type: 'quantitative', legend: true },
            tooltip,
            ...size
        }
    ]
};
const barView: View = {
    tracks: [
        {
            id: 'track-2',
            data,
            mark: 'bar',
            x: { field: 'position', type: 'genomic', axis: 'top' },
            y: { field: 'peak', type: 'quantitative' },
            row: { field: 'sample', type: 'nominal' },
            color: { field: 'sample', type: 'nominal', legend: true },
            tooltip,
            ...size
        }
    ]
};

const stackView: View = {
    tracks: [
        {
            id: 'track-3',
            data,
            mark: 'bar',
            x: { field: 'position', type: 'genomic', axis: 'top' },
            y: { field: 'peak', type: 'quantitative', grid: true },
            color: { field: 'sample', type: 'nominal', legend: true },
            tooltip,
            ...size
        }
    ]
};

const lineView: View = {
    id: 'track-4',
    alignment: 'overlay',
    data,
    x: { field: 'position', type: 'genomic', axis: 'top' },
    y: { field: 'peak', type: 'quantitative' },
    row: { field: 'sample', type: 'nominal' },
    color: { field: 'sample', type: 'nominal', legend: true },
    tracks: [
        { mark: 'line' },
        {
            mark: 'point',
            size: { field: 'peak', type: 'quantitative', range: [0, 2] }
        }
    ],
    tooltip: [
        { field: 'position', type: 'genomic', alt: 'Position' },
        {
            field: 'peak',
            type: 'quantitative',
            alt: 'Value',
            format: '.2'
        },
        { field: 'sample', type: 'nominal', alt: 'Sample' }
    ],
    ...size
};

const pointView: View = {
    tracks: [
        {
            id: 'track-5',
            data,
            mark: 'point',
            x: { field: 'position', type: 'genomic', axis: 'top' },
            y: { field: 'peak', type: 'quantitative' },
            row: { field: 'sample', type: 'nominal' },
            size: { field: 'peak', type: 'quantitative' },
            color: { field: 'sample', type: 'nominal', legend: true },
            opacity: { value: 0.5 },
            tooltip,
            ...size
        }
    ]
};

const pointView2: View = {
    tracks: [
        {
            id: 'track-6',
            data,
            mark: 'point',
            x: { field: 'position', type: 'genomic', axis: 'top' },
            y: { field: 'peak', type: 'quantitative', grid: true },
            size: { field: 'peak', type: 'quantitative' },
            color: { field: 'sample', type: 'nominal', legend: true },
            opacity: { value: 0.5 },
            tooltip,
            ...size
        }
    ]
};

const areaView2: View = {
    tracks: [
        {
            id: 'track-7',
            data,
            mark: 'area',
            x: { field: 'position', type: 'genomic', axis: 'top' },
            y: { field: 'peak', type: 'quantitative' },
            row: { field: 'sample', type: 'nominal' },
            color: { field: 'sample', type: 'nominal', legend: true },
            stroke: { value: 'white' },
            strokeWidth: { value: 0.5 },
            tooltip,
            ...size
        }
    ]
};

const barView2: View = {
    tracks: [
        {
            id: 'track-8',
            data: {
                ...data,
                binSize: 4
            },
            mark: 'bar',
            x: { field: 'start', type: 'genomic', axis: 'top' },
            xe: { field: 'end', type: 'genomic', axis: 'top' },
            y: { field: 'peak_min', type: 'quantitative' },
            ye: { field: 'peak_max', type: 'quantitative' },
            row: { field: 'sample', type: 'nominal' },
            color: { field: 'sample', type: 'nominal', legend: true },
            stroke: { value: 'black' },
            strokeWidth: { value: 0.2 },
            tooltip: [
                { field: 'position', type: 'genomic', alt: 'Position' },
                {
                    field: 'peak_min',
                    type: 'quantitative',
                    alt: 'min(Value)',
                    format: '.2'
                },
                {
                    field: 'peak_max',
                    type: 'quantitative',
                    alt: 'max(Value)',
                    format: '.2'
                },
                { field: 'sample', type: 'nominal', alt: 'Sample' }
            ],
            ...size
        }
    ]
};

const bandView: View = {
    tracks: [
        {
            id: 'track-9',
            data: {
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                type: 'csv',
                chromosomeField: 'c2',
                genomicFields: ['s1', 'e1', 's2', 'e2']
            },
            mark: 'withinLink',
            x: {
                field: 's1',
                type: 'genomic',
                domain: { chromosome: 'chr1', interval: [103900000, 104100000] }
            },
            xe: { field: 'e1', type: 'genomic' },
            x1: {
                field: 's2',
                type: 'genomic',
                domain: { chromosome: 'chr1' }
            },
            x1e: { field: 'e2', type: 'genomic' },
            color: { field: 's1', type: 'nominal' },
            stroke: { value: 'black' },
            strokeWidth: { value: 0.5 },
            opacity: { value: 0.2 },
            ...size
        }
    ]
};
/******* end define individual visualizations *******/

const spec: GoslingSpec = {
    title: 'Visual Encoding',
    subtitle: 'Gosling provides diverse visual encoding methods',
    layout: 'linear',
    arrangement: 'vertical',
    centerRadius: 0.8,
    xDomain: { chromosome: 'chr1', interval: [1, 3000500] },
    views: [heatmapView, barView, stackView, lineView, pointView, pointView2, areaView2, barView2, bandView]
};

export { spec };
