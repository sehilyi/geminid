import type { GoslingSpec, OverlaidTracks } from '@gosling.schema';
import { GOSLING_PUBLIC_DATA } from './gosling-data';
import { EX_SPEC_PATHOGENIC } from './pathogenic';

const ScalableSequenceTrack: OverlaidTracks = {
    alignment: 'overlay',
    data: {
        url: GOSLING_PUBLIC_DATA.fasta,
        type: 'multivec',
        row: 'base',
        column: 'position',
        value: 'count',
        categories: ['A', 'T', 'G', 'C'],
        start: 'start',
        end: 'end'
    },
    tracks: [
        {
            mark: 'bar',
            y: { field: 'count', type: 'quantitative', axis: 'none' }
        },
        {
            dataTransform: [{ type: 'filter', field: 'count', oneOf: [0], not: true }],
            mark: 'text',
            x: {
                field: 'start',
                type: 'genomic'
            },
            xe: {
                field: 'end',
                type: 'genomic'
            },
            size: { value: 24 },
            color: { value: 'white' },
            visibility: [
                {
                    operation: 'less-than',
                    measure: 'width',
                    threshold: '|xe-x|',
                    transitionPadding: 30,
                    target: 'mark'
                },
                {
                    operation: 'LT',
                    measure: 'zoomLevel',
                    threshold: 40,
                    target: 'track'
                }
            ]
        }
    ],
    x: {
        field: 'position',
        type: 'genomic'
    },
    color: {
        field: 'base',
        type: 'nominal',
        domain: ['A', 'T', 'G', 'C'],
        legend: true
    },
    text: {
        field: 'base',
        type: 'nominal'
    },
    style: {
        textFontWeight: 'bold'
    },
    width: 400,
    height: 80
};

const ScalableCytoBand: OverlaidTracks = {
    alignment: 'overlay',
    data: {
        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
        type: 'csv',
        chromosomeField: 'Chromosome',
        genomicFields: ['chromStart', 'chromEnd']
    },
    tracks: [
        {
            mark: 'rect',
            color: {
                field: 'Chromosome',
                type: 'nominal',
                domain: [
                    'chr1',
                    'chr2',
                    'chr3',
                    'chr4',
                    'chr5',
                    'chr6',
                    'chr7',
                    'chr8',
                    'chr9',
                    'chr10',
                    'chr11',
                    'chr12',
                    'chr13',
                    'chr14',
                    'chr15',
                    'chr16',
                    'chr17',
                    'chr18',
                    'chr19',
                    'chr20',
                    'chr21',
                    'chr22',
                    'chrX',
                    'chrY'
                ],
                range: ['#F6F6F6', 'gray']
            },
            x: {
                field: 'chromStart',
                type: 'genomic',
                aggregate: 'min'
            },
            xe: {
                field: 'chromEnd',
                aggregate: 'max',
                type: 'genomic'
            },
            strokeWidth: { value: 2 },
            stroke: { value: 'gray' },
            visibility: [
                {
                    operation: 'greater-than',
                    measure: 'zoomLevel',
                    threshold: 100000000,
                    target: 'mark',
                    transitionPadding: 100000000
                }
            ]
        },
        {
            mark: 'text',
            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen'], not: true }],
            text: { field: 'Name', type: 'nominal' },
            color: {
                field: 'Stain',
                type: 'nominal',
                domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar'],
                range: ['black', 'black', 'black', 'black', 'white', 'black']
            },
            visibility: [
                {
                    operation: 'less-than',
                    measure: 'width',
                    threshold: '|xe-x|',
                    transitionPadding: 10,
                    target: 'mark'
                }
            ]
        },
        {
            mark: 'rect',
            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen'], not: true }],
            color: {
                field: 'Stain',
                type: 'nominal',
                domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar'],
                range: ['white', '#D9D9D9', '#979797', '#636363', 'black', '#A0A0F2']
            }
        },
        {
            mark: 'triangleRight',
            dataTransform: [
                { type: 'filter', field: 'Stain', oneOf: ['acen'] },
                { type: 'filter', field: 'Name', include: 'q' }
            ],
            color: { value: '#B40101' }
        },
        {
            mark: 'triangleLeft',
            dataTransform: [
                { type: 'filter', field: 'Stain', oneOf: ['acen'] },
                { type: 'filter', field: 'Name', include: 'p' }
            ],
            color: { value: '#B40101' }
        }
    ],
    x: { field: 'chromStart', type: 'genomic' },
    xe: { field: 'chromEnd', type: 'genomic' },
    size: { value: 20 },
    stroke: { value: 'gray' },
    strokeWidth: { value: 0.5 },
    visibility: [
        {
            operation: 'greater-than',
            measure: 'width',
            threshold: 3,
            transitionPadding: 5,
            target: 'mark'
        }
    ],
    style: {
        outline: 'white'
    },
    width: 400,
    height: 25
};

export const EX_TRACK_SEMANTIC_ZOOM = {
    sequence: ScalableSequenceTrack,
    cytoband: ScalableCytoBand
};

export const EX_SPEC_SEMANTIC_ZOOM: GoslingSpec = {
    arrangement: 'vertical',
    views: [
        {
            layout: 'linear',
            xDomain: { chromosome: 'chr1', interval: [3000000, 3000010] },
            ...EX_TRACK_SEMANTIC_ZOOM.sequence,
            width: 800,
            height: 100
        },
        {
            layout: 'linear',
            ...EX_TRACK_SEMANTIC_ZOOM.cytoband,
            width: 800,
            size: undefined
        },
        {
            ...EX_SPEC_PATHOGENIC,
            xDomain: { chromosome: 'chr13', interval: [31500000, 33150000] }
        },
        {
            ...EX_SPEC_PATHOGENIC,
            xDomain: { chromosome: 'chr13', interval: [32000000, 32700000] }
        },
        {
            ...EX_SPEC_PATHOGENIC,
            xDomain: { chromosome: 'chr13', interval: [32314000, 32402500] }
        }
    ]
};

export const EX_SPEC_SEQUENCE_TRACK: GoslingSpec = {
    arrangement: 'vertical',
    views: [
        {
            layout: 'linear',
            xDomain: { chromosome: 'chr1', interval: [3000000, 3000010] },
            ...EX_TRACK_SEMANTIC_ZOOM.sequence,
            width: 800,
            height: 100
        }
    ]
};

export const EX_SPEC_CLINVAR_LOLLIPOP: GoslingSpec = {
    arrangement: 'vertical',
    views: [
        {
            ...EX_SPEC_PATHOGENIC,
            xDomain: { chromosome: 'chr13', interval: [31500000, 33150000] }
        },
        {
            ...EX_SPEC_PATHOGENIC,
            xDomain: { chromosome: 'chr13', interval: [32000000, 32700000] }
        },
        {
            ...EX_SPEC_PATHOGENIC,
            xDomain: { chromosome: 'chr13', interval: [32314000, 32402500] }
        }
    ]
};
