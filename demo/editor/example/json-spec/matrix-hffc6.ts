import type { GoslingSpec } from 'gosling.js';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_MATRIX_HFFC6: GoslingSpec = {
    title: 'Matrix Visualization',
    subtitle: 'Comparison of Micro-C and Hi-C for HFFc6 Cells',
    arrangement: 'horizontal',
    xDomain: { chromosome: 'chr7', interval: [77700000, 81000000] },
    spacing: 1,
    linkingId: '-',
    views: [
        {
            orientation: 'vertical',
            yOffset: 75,
            views: [
                {
                    tracks: [
                        {
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_H3K4me3.bigWig',
                                type: 'bigwig',
                                column: 'position',
                                value: 'peak',
                                binSize: 8
                            },
                            title: 'HFFc6_H3K4me3',
                            mark: 'bar',
                            x: { field: 'start', type: 'genomic', axis: 'top' },
                            xe: { field: 'end', type: 'genomic' },
                            y: { field: 'peak', type: 'quantitative', axis: 'none' },
                            color: { value: 'darkgreen' },
                            height: 600,
                            width: 40
                        },
                        {
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_Atacseq.mRp.clN.bigWig',
                                type: 'bigwig',
                                column: 'position',
                                value: 'peak',
                                binSize: 8
                            },
                            title: 'HFFc6_ATAC',
                            mark: 'bar',
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            y: { field: 'peak', type: 'quantitative', axis: 'none' },
                            color: { value: '#E79F00' },
                            height: 600,
                            width: 40
                        },
                        {
                            alignment: 'overlay',
                            tracks: [
                                {
                                    data: {
                                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFC6_CTCF.mRp.clN.bigWig',
                                        type: 'bigwig',
                                        column: 'position',
                                        value: 'peak',
                                        binSize: 8
                                    },
                                    mark: 'bar',
                                    x: { field: 'start', type: 'genomic' },
                                    xe: { field: 'end', type: 'genomic' },
                                    y: { field: 'peak', type: 'quantitative', axis: 'none' },
                                    color: { value: '#0072B2' }
                                },
                                {
                                    style: { backgroundOpacity: 0 },
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
                                        ]
                                    },
                                    dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['+'] }],
                                    mark: 'triangleRight',
                                    x: { field: 'start', type: 'genomic' },
                                    size: { value: 13 },
                                    stroke: { value: 'white' },
                                    strokeWidth: { value: 1 },
                                    row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                    color: { value: '#CB7AA7' }
                                },
                                {
                                    style: { backgroundOpacity: 0 },
                                    title: 'HFFC6_CTCF',
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
                                        ]
                                    },
                                    dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['-'] }],
                                    mark: 'triangleLeft',
                                    x: { field: 'start', type: 'genomic' },
                                    size: { value: 13 },
                                    stroke: { value: 'white' },
                                    strokeWidth: { value: 1 },
                                    row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                    color: { value: '#029F73' }
                                }
                            ],
                            height: 600,
                            width: 40
                        }
                    ]
                }
            ]
        },
        {
            spacing: 30,
            views: [
                {
                    spacing: 0,
                    arrangement: 'vertical',
                    views: [
                        {
                            tracks: [
                                {
                                    data: {
                                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_H3K4me3.bigWig',
                                        type: 'bigwig',
                                        column: 'position',
                                        value: 'peak',
                                        binSize: 8
                                    },
                                    title: 'HFFc6_H3K4me3',
                                    mark: 'bar',
                                    x: { field: 'start', type: 'genomic', axis: 'top' },
                                    xe: { field: 'end', type: 'genomic' },
                                    y: { field: 'peak', type: 'quantitative', axis: 'none' },
                                    color: { value: 'darkgreen' },
                                    width: 570,
                                    height: 40
                                },
                                {
                                    data: {
                                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_Atacseq.mRp.clN.bigWig',
                                        type: 'bigwig',
                                        column: 'position',
                                        value: 'peak',
                                        binSize: 8
                                    },
                                    title: 'HFFc6_ATAC',
                                    mark: 'bar',
                                    x: { field: 'start', type: 'genomic' },
                                    xe: { field: 'end', type: 'genomic' },
                                    y: { field: 'peak', type: 'quantitative', axis: 'none' },
                                    color: { value: '#E79F00' },
                                    width: 600,
                                    height: 40
                                },
                                {
                                    alignment: 'overlay',
                                    tracks: [
                                        {
                                            data: {
                                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFC6_CTCF.mRp.clN.bigWig',
                                                type: 'bigwig',
                                                column: 'position',
                                                value: 'peak',
                                                binSize: 8
                                            },
                                            mark: 'bar',
                                            x: { field: 'start', type: 'genomic' },
                                            xe: { field: 'end', type: 'genomic' },
                                            y: { field: 'peak', type: 'quantitative', axis: 'none' },
                                            color: { value: '#0072B2' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['+'] }],
                                            mark: 'triangleRight',
                                            x: { field: 'start', type: 'genomic' },
                                            size: { value: 13 },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                            color: { value: '#CB7AA7' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
                                            title: 'HFFC6_CTCF',
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['-'] }],
                                            mark: 'triangleLeft',
                                            x: { field: 'start', type: 'genomic' },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            size: { value: 13 },
                                            row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                            color: { value: '#029F73' }
                                        }
                                    ],
                                    width: 600,
                                    height: 40
                                }
                            ]
                        },
                        {
                            tracks: [
                                {
                                    title: 'HFFc6_Micro-C',
                                    data: {
                                        url: GOSLING_PUBLIC_DATA.matrixMicroC,
                                        type: 'matrix'
                                    },
                                    mark: 'bar',
                                    x: { field: 'xs', type: 'genomic', axis: 'none' },
                                    xe: { field: 'xe', type: 'genomic', axis: 'none' },
                                    y: { field: 'ys', type: 'genomic', axis: 'none' },
                                    ye: { field: 'ye', type: 'genomic', axis: 'none' },
                                    color: { field: 'value', type: 'quantitative', range: 'warm' },
                                    width: 600,
                                    height: 600
                                }
                            ]
                        },
                        {
                            tracks: [
                                {
                                    title: 'Epilogos (hg38)',
                                    data: {
                                        url: GOSLING_PUBLIC_DATA.epilogos,
                                        type: 'multivec',
                                        row: 'category',
                                        column: 'position',
                                        value: 'value',
                                        categories: [
                                            'Active TSS',
                                            'Flanking Active TSS',
                                            "Transcr at gene 5\\' and 3\\'",
                                            'Strong transcription',
                                            'Weak transcription',
                                            'Genic enhancers',
                                            'Enhancers',
                                            'ZNF genes & repeats',
                                            'Heterochromatin',
                                            'Bivalent/Poised TSS',
                                            'Flanking Bivalent TSS/Enh',
                                            'Bivalent Enhancer',
                                            'Repressed PolyComb',
                                            'Weak Repressed PolyComb',
                                            'Quiescent/Low'
                                        ],
                                        binSize: 8
                                    },
                                    dataTransform: [{ type: 'filter', field: 'value', inRange: [0, 999999] }],
                                    mark: 'bar',
                                    x: { field: 'start', type: 'genomic', axis: 'none' },
                                    xe: { field: 'end', type: 'genomic' },
                                    y: { field: 'value', type: 'quantitative', axis: 'none' },
                                    color: {
                                        field: 'category',
                                        type: 'nominal',
                                        range: [
                                            '#FF0000',
                                            '#FF4500',
                                            '#32CD32',
                                            '#008000',
                                            '#006400',
                                            '#C2E105',
                                            '#FFFF00',
                                            '#66CDAA',
                                            '#8A91D0',
                                            '#CD5C5C',
                                            '#E9967A',
                                            '#BDB76B',
                                            '#808080',
                                            '#C0C0C0',
                                            'gray'
                                        ]
                                    },
                                    // strokeWidth: {value: 0.5},
                                    width: 600,
                                    height: 40
                                }
                            ]
                        }
                    ]
                },
                {
                    arrangement: 'vertical',
                    spacing: 0,
                    views: [
                        {
                            tracks: [
                                {
                                    data: {
                                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_H3K4me3.bigWig',
                                        type: 'bigwig',
                                        column: 'position',
                                        value: 'peak',
                                        binSize: 8
                                    },
                                    title: 'HFFc6_H3K4me3',
                                    mark: 'bar',
                                    x: { field: 'start', type: 'genomic', axis: 'top' },
                                    xe: { field: 'end', type: 'genomic' },
                                    y: { field: 'peak', type: 'quantitative', axis: 'none' },
                                    color: { value: 'darkgreen' },
                                    width: 600,
                                    height: 40
                                },
                                {
                                    data: {
                                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_Atacseq.mRp.clN.bigWig',
                                        type: 'bigwig',
                                        column: 'position',
                                        value: 'peak',
                                        binSize: 8
                                    },
                                    title: 'HFFc6_ATAC',
                                    mark: 'bar',
                                    x: { field: 'start', type: 'genomic' },
                                    xe: { field: 'end', type: 'genomic' },
                                    y: { field: 'peak', type: 'quantitative', axis: 'none' },
                                    color: { value: '#E79F00' },
                                    width: 600,
                                    height: 40
                                },
                                {
                                    alignment: 'overlay',
                                    tracks: [
                                        {
                                            data: {
                                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFC6_CTCF.mRp.clN.bigWig',
                                                type: 'bigwig',
                                                column: 'position',
                                                value: 'peak',
                                                binSize: 8
                                            },
                                            mark: 'bar',
                                            x: { field: 'start', type: 'genomic' },
                                            xe: { field: 'end', type: 'genomic' },
                                            y: { field: 'peak', type: 'quantitative', axis: 'none' },
                                            color: { value: '#0072B2' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['+'] }],
                                            mark: 'triangleRight',
                                            x: { field: 'start', type: 'genomic' },
                                            size: { value: 13 },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                            color: { value: '#CB7AA7' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
                                            title: 'HFFC6_CTCF',
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['-'] }],
                                            mark: 'triangleLeft',
                                            x: { field: 'start', type: 'genomic' },
                                            size: { value: 13 },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                            color: { value: '#029F73' }
                                        }
                                    ],
                                    width: 600,
                                    height: 40
                                }
                            ]
                        },
                        {
                            tracks: [
                                {
                                    title: 'HFFc6_Hi-C',
                                    data: {
                                        url: GOSLING_PUBLIC_DATA.matrixHiC,
                                        type: 'matrix'
                                    },
                                    mark: 'bar',
                                    x: { field: 'xs', type: 'genomic', axis: 'none' },
                                    xe: { field: 'xe', type: 'genomic', axis: 'none' },
                                    y: { field: 'ys', type: 'genomic', axis: 'none' },
                                    ye: { field: 'ye', type: 'genomic', axis: 'none' },
                                    color: { field: 'value', type: 'quantitative', range: 'warm' },
                                    width: 600,
                                    height: 600
                                }
                            ]
                        },
                        {
                            tracks: [
                                {
                                    title: 'Epilogos (hg38)',
                                    data: {
                                        url: GOSLING_PUBLIC_DATA.epilogos,
                                        type: 'multivec',
                                        row: 'category',
                                        column: 'position',
                                        value: 'value',
                                        categories: [
                                            'Active TSS',
                                            'Flanking Active TSS',
                                            "Transcr at gene 5\\' and 3\\'",
                                            'Strong transcription',
                                            'Weak transcription',
                                            'Genic enhancers',
                                            'Enhancers',
                                            'ZNF genes & repeats',
                                            'Heterochromatin',
                                            'Bivalent/Poised TSS',
                                            'Flanking Bivalent TSS/Enh',
                                            'Bivalent Enhancer',
                                            'Repressed PolyComb',
                                            'Weak Repressed PolyComb',
                                            'Quiescent/Low'
                                        ],
                                        binSize: 8
                                    },
                                    dataTransform: [{ type: 'filter', field: 'value', inRange: [0, 999999] }],
                                    mark: 'bar',
                                    x: { field: 'start', type: 'genomic', axis: 'none' },
                                    xe: { field: 'end', type: 'genomic' },
                                    y: { field: 'value', type: 'quantitative', axis: 'none' },
                                    color: {
                                        field: 'category',
                                        type: 'nominal',
                                        range: [
                                            '#FF0000',
                                            '#FF4500',
                                            '#32CD32',
                                            '#008000',
                                            '#006400',
                                            '#C2E105',
                                            '#FFFF00',
                                            '#66CDAA',
                                            '#8A91D0',
                                            '#CD5C5C',
                                            '#E9967A',
                                            '#BDB76B',
                                            '#808080',
                                            '#C0C0C0',
                                            'gray'
                                        ]
                                    },
                                    // strokeWidth: {value: 0.5},
                                    width: 600,
                                    height: 40
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        // {
        //     orientation: 'vertical',
        //     yOffset: 75,
        //     views: [
        //         {
        //             tracks: [
        //                 {
        //                     data: {
        //                         url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_H3K4me3.bigWig',
        //                         type: 'bigwig',
        //                         column: 'position',
        //                         value: 'peak',
        //                         binSize: 8
        //                     },
        //                     title: 'HFFc6_H3K4me3',
        //                     mark: 'bar',
        //                     x: { field: 'start', type: 'genomic', axis: 'none' },
        //                     xe: { field: 'end', type: 'genomic' },
        //                     y: { field: 'peak', type: 'quantitative', axis: 'none' },
        //                     color: { value: 'darkgreen' },
        //                     height: 600,
        //                     width: 40
        //                 },
        //                 {
        //                     data: {
        //                         url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_Atacseq.mRp.clN.bigWig',
        //                         type: 'bigwig',
        //                         column: 'position',
        //                         value: 'peak',
        //                         binSize: 8
        //                     },
        //                     title: 'HFFc6_ATAC',
        //                     mark: 'bar',
        //                     x: { field: 'start', type: 'genomic' },
        //                     xe: { field: 'end', type: 'genomic' },
        //                     y: { field: 'peak', type: 'quantitative', axis: 'none' },
        //                     color: { value: '#E79F00' },
        //                     height: 600,
        //                     width: 40
        //                 },
        //                 {
        //                     alignment: 'overlay',
        //                     tracks: [
        //                         {
        //                             data: {
        //                                 url: 'https://s3.amazonaws.com/gosling-lang.org/data/HFFC6_CTCF.mRp.clN.bigWig',
        //                                 type: 'bigwig',
        //                                 column: 'position',
        //                                 value: 'peak',
        //                                 binSize: 8
        //                             },
        //                             mark: 'bar',
        //                             x: { field: 'start', type: 'genomic', axis: 'bottom' },
        //                             xe: { field: 'end', type: 'genomic' },
        //                             y: { field: 'peak', type: 'quantitative', axis: 'none' },
        //                             color: { value: '#0072B2' }
        //                         },
        //                         {
        //                             style: { backgroundOpacity: 0 },
        //                             data: {
        //                                 url: GOSLING_PUBLIC_DATA.geneAnnotation,
        //                                 type: 'beddb',
        //                                 genomicFields: [
        //                                     { index: 1, name: 'start' },
        //                                     { index: 2, name: 'end' }
        //                                 ],
        //                                 valueFields: [
        //                                     { index: 5, name: 'strand', type: 'nominal' },
        //                                     { index: 3, name: 'name', type: 'nominal' }
        //                                 ]
        //                             },
        //                             dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['+'] }],
        //                             mark: 'triangleRight',
        //                             x: { field: 'start', type: 'genomic' },
        //                             size: { value: 13 },
        //                             stroke: { value: 'white' },
        //                             strokeWidth: { value: 1 },
        //                             row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
        //                             color: { value: '#CB7AA7' }
        //                         },
        //                         {
        //                             style: { backgroundOpacity: 0 },
        //                             title: 'HFFC6_CTCF',
        //                             data: {
        //                                 url: GOSLING_PUBLIC_DATA.geneAnnotation,
        //                                 type: 'beddb',
        //                                 genomicFields: [
        //                                     { index: 1, name: 'start' },
        //                                     { index: 2, name: 'end' }
        //                                 ],
        //                                 valueFields: [
        //                                     { index: 5, name: 'strand', type: 'nominal' },
        //                                     { index: 3, name: 'name', type: 'nominal' }
        //                                 ]
        //                             },
        //                             dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['-'] }],
        //                             mark: 'triangleLeft',
        //                             x: { field: 'start', type: 'genomic' },
        //                             size: { value: 13 },
        //                             stroke: { value: 'white' },
        //                             strokeWidth: { value: 1 },
        //                             row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
        //                             color: { value: '#029F73' }
        //                         }
        //                     ],
        //                     height: 600,
        //                     width: 40
        //                 }
        //             ]
        //         },
        //     ]
        // },
    ],
    style: { outlineWidth: 0, background: '#F6F6F6' }
};
