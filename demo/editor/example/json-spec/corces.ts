import type { GoslingSpec } from 'gosling.js';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_CORCES_ET_AL: GoslingSpec = {
    title: 'Single-cell Epigenomic Analysis',
    subtitle: 'Corces et al. 2020',
    static: true,
    // subtitle: 'Single-cell epigenomic analyses implicate candidate causal ...',
    // description:
    //     'Corces et al. 2020. Single-cell epigenomic analyses implicate candidate causal variants at inherited risk loci for Alzheimer’s and Parkinson’s diseases. Nature Genetics, pp.1-11.',
    layout: 'linear',
    arrangement: 'vertical',
    views: [
        {
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
                            opacity: { value: 1 },
                            strokeWidth: { value: 1 },
                            stroke: { value: 'red' }
                        }
                    ],
                    x: { field: 'Basepair_start', type: 'genomic', axis: 'none' },
                    xe: { field: 'Basepair_stop', type: 'genomic' },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 1 },
                    style: { outlineWidth: 0 },
                    width: 400,
                    height: 25
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr3', interval: [52168000, 52890000] },
            linkingId: 'detail',
            mark: 'bar',
            x: {
                field: 'position',
                type: 'genomic'
            },
            y: { field: 'peak', type: 'quantitative', axis: 'right' },
            style: { outline: '#20102F' },
            width: 400,
            height: 40,
            tracks: [
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/ExcitatoryNeurons-insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'Excitatory neurons',
                    color: { value: '#F29B67' }
                },
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/InhibitoryNeurons-insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'Inhibitory neurons',
                    color: { value: '#3DC491' }
                },
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/DopaNeurons_Cluster10_AllFrags_projSUNI2_insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'Dopaminergic neurons',
                    mark: 'bar',
                    color: { value: '#565C8B' }
                },
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/Microglia-insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'Microglia',
                    color: { value: '#77C0FA' }
                },
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/Oligodendrocytes-insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'Oligodendrocytes',
                    mark: 'bar',
                    color: { value: '#9B46E5' }
                },
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/Astrocytes-insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'Astrocytes',
                    mark: 'bar',
                    color: { value: '#D73636' }
                },
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/OPCs-insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'OPCs',
                    mark: 'bar',
                    color: { value: '#E38ADC' }
                },
                {
                    alignment: 'overlay',
                    title: 'Genes',
                    data: {
                        url: GOSLING_PUBLIC_DATA.geneAnnotation,
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
                    width: 400,
                    height: 80
                },
                // {
                //     title: 'HiChIP (H3K27ac)',
                //     data: {
                //         url: 'https://resgen.io/api/v1/tileset_info/?d=fyY8k9PlS-mGLnBob05_Ow',
                //         type: 'beddb',
                //         genomicFields: [
                //             { name: 'start', index: 1 },
                //             { name: 'end', index: 2 }
                //         ]
                //     },
                //     overlay: [
                //         {},
                //         {
                //             mark: 'brush',
                //             x: { linkingId: 'l-h' },
                //             color: { value: 'blue' },
                //             opacity: { value: 0.2 },
                //             strokeWidth: { value: 0 }
                //         }
                //     ],
                //     mark: 'withinLink',
                //     x: { field: 'start', type: 'genomic',  },
                //     xe: { field: 'end', type: 'genomic' },
                //     y: { flip: true },
                //     strokeWidth: { value: 1 },
                //     color: { value: 'none' },
                //     stroke: { value: 'gray' },
                //     opacity: { value: 0.1 },
                //     style: { outline: '#20102F', circularLink: false },
                //     width: 400,
                //     height: 40
                // },
                // {
                //     data: {
                //         url: 'https://resgen.io/api/v1/tileset_info/?d=fyY8k9PlS-mGLnBob05_Ow',
                //         type: 'beddb',
                //         genomicFields: [
                //             { name: 'start', index: 1 },
                //             { name: 'end', index: 2 }
                //         ]
                //     },
                //     dataTransform: {
                //         filter: [{ field: 'start', inRange: [492449994 + 52450000, 492449994 + 52460000] }]
                //     },
                //     mark: 'withinLink',
                //     x: { field: 'start', type: 'genomic',  },
                //     xe: { field: 'end', type: 'genomic' },
                //     y: { flip: true },
                //     strokeWidth: { value: 1 },
                //     color: { value: 'none' },
                //     stroke: { value: 'red' },
                //     opacity: { value: 1 },
                //     style: { outline: '#20102F', circularLink: false },
                //     overlayOnPreviousTrack: true,
                //     width: 400,
                //     height: 40
                // },
                // {
                //     data: {
                //         url: 'https://resgen.io/api/v1/tileset_info/?d=fyY8k9PlS-mGLnBob05_Ow',
                //         type: 'beddb',
                //         genomicFields: [
                //             { name: 'start', index: 1 },
                //             { name: 'end', index: 2 }
                //         ]
                //     },
                //     dataTransform: {
                //         filter: [{ field: 'end', inRange: [492449994 + 52450000, 492449994 + 52460000] }]
                //     },
                //     mark: 'withinLink',
                //     x: { field: 'start', type: 'genomic',  },
                //     xe: { field: 'end', type: 'genomic' },
                //     y: { flip: true },
                //     strokeWidth: { value: 1 },
                //     color: { value: 'none' },
                //     stroke: { value: 'red' },
                //     opacity: { value: 1 },
                //     style: { outline: '#20102F', circularLink: false },
                //     overlayOnPreviousTrack: true,
                //     width: 400,
                //     height: 40
                // },
                {
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=oligodendrocyte-plac-seq-bedpe',
                        type: 'beddb',
                        genomicFields: [
                            { name: 'start', index: 1 },
                            { name: 'end', index: 2 }
                        ]
                    },
                    mark: 'withinLink',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { flip: true },
                    strokeWidth: { value: 1 },
                    color: { value: 'none' },
                    stroke: { value: '#F97E2A' },
                    opacity: { value: 0.1 },
                    width: 400,
                    height: 60
                },
                {
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=microglia-plac-seq-bedpe',
                        type: 'beddb',
                        genomicFields: [
                            { name: 'start', index: 1 },
                            { name: 'end', index: 2 }
                        ]
                    },
                    mark: 'withinLink',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { flip: true },
                    strokeWidth: { value: 1 },
                    color: { value: 'none' },
                    stroke: { value: '#50ADF9' },
                    opacity: { value: 0.1 },
                    overlayOnPreviousTrack: true,
                    width: 400,
                    height: 60
                },
                {
                    title: 'PLAC-seq (H3K4me3) Nott et al.',
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=neuron-plac-seq-bedpe',
                        type: 'beddb',
                        genomicFields: [
                            { name: 'start', index: 1 },
                            { name: 'end', index: 2 }
                        ]
                    },
                    mark: 'withinLink',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { flip: true },
                    strokeWidth: { value: 1 },
                    color: { value: 'none' },
                    stroke: { value: '#7B0EDC' },
                    opacity: { value: 0.1 },
                    overlayOnPreviousTrack: true,
                    width: 400,
                    height: 60
                }
                // {
                //     title: '(Artificial data)',
                //     data: {
                //         url: EXAMPLE_DATASETS.multivec,
                //         type: 'multivec',
                //         row: 'base',
                //         column: 'position',
                //         value: 'count',
                //         categories: ['A', 'T', 'G', 'C'],
                //         start: 'start',
                //         end: 'end',
                //         bin: 1
                //     },
                //     mark: 'text',
                //     y: { field: 'count', type: 'quantitative' },
                //     x: {
                //         field: 'start',
                //         type: 'genomic',
                //         linkingId: 'l-h',
                //         domain: { chromosome: 'chr3', interval: [52450000, 52465000] }
                //     },
                //     xe: { field: 'end', type: 'genomic' },
                //     color: {
                //         field: 'base',
                //         type: 'nominal',
                //         domain: ['A', 'T', 'G', 'C'],
                //         range: ['#008001', '#FE0300', '#FFA500', '#1300FF']
                //     },
                //     text: { field: 'base', type: 'nominal' },
                //     stretch: true,
                //     style: { outline: '#20102F' }
                // }
            ]
        }
    ]
};
