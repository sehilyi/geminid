import type { GoslingSpec, PartialTrack, View, BigWigData, BeddbData } from '@gosling.schema';

const width = 400;

const ideogram: View = {
    layout: 'linear',
    xDomain: { chromosome: 'chr3' },
    centerRadius: 0.8,
    tracks: [
        {
            alignment: 'overlay',
            title: 'chr3',
            data: {
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/cytogenetic_band.csv',
                type: 'csv',
                chromosomeField: 'Chr.',
                genomicFields: ['ISCN_start', 'ISCN_stop', 'Basepair_start', 'Basepair_stop']
            },
            tracks: [
                {
                    mark: 'rect',
                    dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1', 'acen-2'], not: true }],
                    color: {
                        field: 'Density',
                        type: 'nominal',
                        domain: ['', '25', '50', '75', '100'],
                        range: ['white', '#D9D9D9', '#979797', '#636363', 'black']
                    },
                    size: { value: 20 }
                },
                {
                    mark: 'rect',
                    dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gvar'] }],
                    color: { value: '#A0A0F2' },
                    size: { value: 20 }
                },
                {
                    mark: 'triangleRight',
                    dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1'] }],
                    color: { value: '#B40101' },
                    size: { value: 20 }
                },
                {
                    mark: 'triangleLeft',
                    dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-2'] }],
                    color: { value: '#B40101' },
                    size: { value: 20 }
                },
                {
                    mark: 'brush',
                    x: { linkingId: 'detail' },
                    color: { value: 'red' },
                    opacity: { value: 0.3 },
                    strokeWidth: { value: 1 },
                    stroke: { value: 'red' }
                }
            ],
            x: { field: 'Basepair_start', type: 'genomic', axis: 'none' },
            xe: { field: 'Basepair_stop', type: 'genomic' },
            stroke: { value: 'black' },
            strokeWidth: { value: 1 },
            style: { outlineWidth: 0 },
            width,
            height: 25
        }
    ]
};

const getBigwigData = (name: string): BigWigData => {
    return {
        url: `https://s3.amazonaws.com/gosling-lang.org/data/${name}insertions_bin100_RIPnorm.bw`,
        type: 'bigwig',
        column: 'position',
        value: 'peak'
    };
};

const barTracks: PartialTrack[] = [
    {
        data: getBigwigData('ExcitatoryNeurons-'),
        title: 'Excitatory neurons',
        mark: 'bar',
        color: { value: '#F29B67' }
    },
    {
        data: getBigwigData('InhibitoryNeurons-'),
        title: 'Inhibitory neurons',
        mark: 'bar',
        color: { value: '#3DC491' }
    },
    {
        data: getBigwigData('DopaNeurons_Cluster10_AllFrags_projSUNI2_'),
        title: 'Dopaminergic neurons',
        mark: 'bar',
        color: { value: '#565C8B' }
    },
    {
        data: getBigwigData('Microglia-'),
        title: 'Microglia',
        mark: 'bar',
        color: { value: '#77C0FA' }
    },
    {
        data: getBigwigData('Oligodendrocytes-'),
        title: 'Oligodendrocytes',
        mark: 'bar',
        color: { value: '#9B46E5' }
    },
    {
        data: getBigwigData('Astrocytes-'),
        title: 'Astrocytes',
        mark: 'bar',
        color: { value: '#D73636' }
    },
    {
        data: getBigwigData('OPCs-'),
        title: 'OPCs',
        mark: 'bar',
        color: { value: '#E38ADC' }
    }
];

const geneAnnotationTrack: View = {
    alignment: 'overlay',
    title: 'Genes',
    data: {
        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=gene-annotation',
        type: 'beddb',
        genomicFields: [
            { index: 1, name: 'start' },
            { index: 2, name: 'end' }
        ],
        valueFields: [
            { index: 5, name: 'strand', type: 'nominal' },
            { index: 3, name: 'name', type: 'nominal' }
        ],
        exonIntervalFields: [
            { index: 12, name: 'start' },
            { index: 13, name: 'end' }
        ]
    },
    style: { outline: '#20102F' },
    tracks: [
        {
            dataTransform: [
                { type: 'filter', field: 'type', oneOf: ['gene'] },
                { type: 'filter', field: 'strand', oneOf: ['+'] }
            ],
            mark: 'text',
            text: { field: 'name', type: 'nominal' },
            x: {
                field: 'start',
                type: 'genomic'
            },
            size: { value: 8 },
            xe: { field: 'end', type: 'genomic' },
            style: { textFontSize: 8, dy: -12 }
        },
        {
            dataTransform: [
                { type: 'filter', field: 'type', oneOf: ['gene'] },
                { type: 'filter', field: 'strand', oneOf: ['-'] }
            ],
            mark: 'text',
            text: { field: 'name', type: 'nominal' },
            x: { field: 'start', type: 'genomic' },
            xe: { field: 'end', type: 'genomic' },
            size: { value: 8 },
            style: { textFontSize: 8, dy: 10 }
        },
        {
            dataTransform: [
                { type: 'filter', field: 'type', oneOf: ['gene'] },
                { type: 'filter', field: 'strand', oneOf: ['+'] }
            ],
            mark: 'rect',
            x: { field: 'end', type: 'genomic' },
            size: { value: 7 }
        },
        {
            dataTransform: [
                { type: 'filter', field: 'type', oneOf: ['gene'] },
                { type: 'filter', field: 'strand', oneOf: ['-'] }
            ],
            mark: 'rect',
            x: { field: 'start', type: 'genomic' },
            size: { value: 7 }
        },
        {
            dataTransform: [{ type: 'filter', field: 'type', oneOf: ['exon'] }],
            mark: 'rect',
            x: { field: 'start', type: 'genomic' },
            xe: { field: 'end', type: 'genomic' },
            size: { value: 14 }
        },
        {
            dataTransform: [{ type: 'filter', field: 'type', oneOf: ['gene'] }],
            mark: 'rule',
            x: { field: 'start', type: 'genomic' },
            xe: { field: 'end', type: 'genomic' },
            strokeWidth: { value: 3 }
        }
    ],
    row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
    color: { field: 'strand', type: 'nominal', domain: ['+', '-'], range: ['#012DB8', '#BE1E2C'] },
    visibility: [
        {
            operation: 'less-than',
            measure: 'width',
            threshold: '|xe-x|',
            transitionPadding: 10,
            target: 'mark'
        }
    ],
    width,
    height: 80
};

const getBeddbData = (name: string): BeddbData => {
    return {
        url: `https://server.gosling-lang.org/api/v1/tileset_info/?d=${name}-plac-seq-bedpe`,
        type: 'beddb',
        genomicFields: [
            { name: 'start', index: 1 },
            { name: 'end', index: 2 }
        ]
    };
};

const withinLinkTracks = [
    { name: 'oligodendrocyte', color: '#F97E2A' },
    { name: 'microglia', color: '#50ADF9' },
    { name: 'neuron', color: '#7B0EDC' }
].map((d, i) => {
    return {
        title: i == 0 ? 'PLAC-seq (H3K4me3) Nott et al.' : '',
        data: getBeddbData(d.name),
        mark: 'withinLink',
        x: { field: 'start', type: 'genomic' },
        xe: { field: 'end', type: 'genomic' },
        y: { flip: true },
        strokeWidth: { value: 1 },
        color: { value: 'none' },
        stroke: { value: d.color },
        opacity: { value: 0.1 },
        overlayOnPreviousTrack: i != 0,
        width,
        height: 60
    };
});

const spec: GoslingSpec = {
    title: 'Single-cell Epigenomic Analysis',
    subtitle: 'Corces et al. 2020',
    layout: 'linear',
    arrangement: 'vertical',
    views: [
        ideogram,
        {
            xDomain: { chromosome: 'chr3', interval: [52168000, 52890000] },
            linkingId: 'detail',
            x: {
                field: 'position',
                type: 'genomic'
            },
            y: { field: 'peak', type: 'quantitative', axis: 'right' },
            style: { outline: '#20102F' },
            width,
            height: 40,
            tracks: [...barTracks, geneAnnotationTrack, ...withinLinkTracks]
        }
    ]
};

export { spec };
