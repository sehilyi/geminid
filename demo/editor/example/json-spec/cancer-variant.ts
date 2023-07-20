import type { GoslingSpec } from 'gosling.js';
import { EX_SPEC_VIEW_PILEUP } from './pileup';

export const EX_SPEC_CANCER_VARIANT_PROTOTYPE: GoslingSpec = {
    title: 'Breast Cancer Variant (Staaf et al. 2019)',
    subtitle: 'Genetic characteristics of RAD51C- and PALB2-altered TNBCs',
    layout: 'linear',
    arrangement: 'vertical',
    centerRadius: 0.5,
    assembly: 'hg19',
    spacing: 40,
    style: {
        outlineWidth: 1,
        outline: 'lightgray',
        enableSmoothPath: false
    },
    views: [
        {
            arrangement: 'vertical',
            views: [
                {
                    xOffset: 190,
                    layout: 'circular',
                    spacing: 1,
                    tracks: [
                        {
                            title: 'Patient Overview (PD35930a)',
                            alignment: 'overlay',
                            data: {
                                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                                type: 'csv',
                                chromosomeField: 'Chromosome',
                                genomicFields: ['chromStart', 'chromEnd']
                            },
                            tracks: [
                                { mark: 'rect' },
                                {
                                    mark: 'brush',
                                    x: { linkingId: 'mid-scale' },
                                    strokeWidth: { value: 1.5 },
                                    stroke: { value: '#0070DC' },
                                    color: { value: '#AFD8FF' },
                                    opacity: { value: 0.5 }
                                }
                            ],
                            color: {
                                field: 'Stain',
                                type: 'nominal',
                                domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar', 'acen'],
                                range: ['white', 'lightgray', 'gray', 'gray', 'black', '#7B9CC8', '#DC4542']
                            },
                            size: { value: 18 },
                            x: { field: 'chromStart', type: 'genomic' },
                            xe: { field: 'chromEnd', type: 'genomic' },
                            stroke: { value: 'gray' },
                            strokeWidth: { value: 0.3 },
                            width: 500,
                            height: 100
                        },
                        {
                            title: 'Putative Driver',
                            alignment: 'overlay',
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/SV/driver.df.scanb.complete.csv',
                                type: 'csv',
                                chromosomeField: 'Chr',
                                genomicFields: ['ChrStart', 'ChrEnd']
                            },
                            dataTransform: [{ type: 'filter', field: 'Sample', oneOf: ['PD35930a'] }],
                            tracks: [{ mark: 'text' }, { mark: 'triangleBottom', size: { value: 5 } }],
                            x: { field: 'ChrStart', type: 'genomic' },
                            xe: { field: 'ChrEnd', type: 'genomic' },
                            text: { field: 'Gene', type: 'nominal' },
                            color: { value: 'black' },
                            style: {
                                textFontWeight: 'normal',
                                dx: -10,
                                outlineWidth: 0
                            },
                            width: 500,
                            height: 40
                        },
                        {
                            title: 'LOH',
                            style: { background: 'lightgray', backgroundOpacity: 0.2 },
                            alignment: 'overlay',
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/cancer/cnv.PD35930a.csv',
                                headerNames: [
                                    'id',
                                    'chr',
                                    'start',
                                    'end',
                                    'total_cn_normal',
                                    'minor_cp_normal',
                                    'total_cn_tumor',
                                    'minor_cn_tumor'
                                ],
                                type: 'csv',
                                chromosomeField: 'chr',
                                genomicFields: ['start', 'end']
                            },
                            dataTransform: [{ type: 'filter', field: 'minor_cn_tumor', oneOf: ['0'] }],
                            tracks: [
                                { mark: 'rect' },
                                {
                                    mark: 'brush',
                                    x: { linkingId: 'mid-scale' },
                                    strokeWidth: { value: 1 },
                                    stroke: { value: '#94C2EF' },
                                    color: { value: '#AFD8FF' }
                                }
                            ],
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            color: { value: '#FB6A4B' },
                            width: 620,
                            height: 40
                        },
                        {
                            title: 'Gain',
                            style: { background: 'lightgray', backgroundOpacity: 0.2 },
                            alignment: 'overlay',
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/cancer/cnv.PD35930a.csv',
                                headerNames: [
                                    'id',
                                    'chr',
                                    'start',
                                    'end',
                                    'total_cn_normal',
                                    'minor_cp_normal',
                                    'total_cn_tumor',
                                    'minor_cn_tumor'
                                ],
                                type: 'csv',
                                chromosomeField: 'chr',
                                genomicFields: ['start', 'end']
                            },
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'total_cn_tumor',
                                    inRange: [4.5, 900]
                                }
                            ],
                            tracks: [
                                { mark: 'rect' },
                                {
                                    mark: 'brush',
                                    x: { linkingId: 'mid-scale' },
                                    strokeWidth: { value: 0 }
                                }
                            ],
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            color: { value: '#73C475' },
                            width: 500,
                            height: 40
                        },
                        {
                            title: 'Structural Variant',
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/cancer/rearrangement.PD35930a.csv',
                                type: 'csv',
                                genomicFieldsToConvert: [
                                    {
                                        chromosomeField: 'chr1',
                                        genomicFields: ['start1', 'end1']
                                    },
                                    {
                                        chromosomeField: 'chr2',
                                        genomicFields: ['start2', 'end2']
                                    }
                                ]
                            },
                            mark: 'withinLink',
                            x: { field: 'start1', type: 'genomic' },
                            xe: { field: 'end2', type: 'genomic' },
                            color: {
                                field: 'svclass',
                                type: 'nominal',
                                legend: true,
                                domain: ['tandem-duplication', 'translocation', 'delection', 'inversion'],
                                range: ['#569C4D', '#4C75A2', '#DA5456', '#EA8A2A']
                            },
                            stroke: {
                                field: 'svclass',
                                type: 'nominal',
                                domain: ['tandem-duplication', 'translocation', 'delection', 'inversion'],
                                range: ['#569C4D', '#4C75A2', '#DA5456', '#EA8A2A']
                            },
                            strokeWidth: { value: 1 },
                            opacity: { value: 0.6 },
                            style: { legendTitle: 'SV Class' },
                            width: 500,
                            height: 80
                        }
                    ]
                },
                {
                    linkingId: 'mid-scale',
                    xDomain: { chromosome: 'chr1' },
                    layout: 'linear',
                    tracks: [
                        {
                            style: {
                                background: '#D7EBFF',
                                outline: '#8DC1F2',
                                outlineWidth: 5
                            },
                            title: 'Ideogram',
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
                                    dataTransform: [
                                        {
                                            type: 'filter',
                                            field: 'Stain',
                                            oneOf: ['acen'],
                                            not: true
                                        }
                                    ]
                                },
                                {
                                    mark: 'triangleRight',
                                    dataTransform: [
                                        { type: 'filter', field: 'Stain', oneOf: ['acen'] },
                                        { type: 'filter', field: 'Name', include: 'q' }
                                    ]
                                },
                                {
                                    mark: 'triangleLeft',
                                    dataTransform: [
                                        { type: 'filter', field: 'Stain', oneOf: ['acen'] },
                                        { type: 'filter', field: 'Name', include: 'p' }
                                    ]
                                },
                                {
                                    mark: 'text',
                                    dataTransform: [
                                        {
                                            type: 'filter',
                                            field: 'Stain',
                                            oneOf: ['acen'],
                                            not: true
                                        }
                                    ],
                                    size: { value: 12 },
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
                                }
                            ],
                            color: {
                                field: 'Stain',
                                type: 'nominal',
                                domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar', 'acen'],
                                range: ['white', 'lightgray', 'gray', 'gray', 'black', '#7B9CC8', '#DC4542']
                            },
                            size: { value: 18 },
                            x: { field: 'chromStart', type: 'genomic' },
                            xe: { field: 'chromEnd', type: 'genomic' },
                            text: { field: 'Name', type: 'nominal' },
                            stroke: { value: 'gray' },
                            strokeWidth: { value: 0.3 },
                            width: 500,
                            height: 30
                        },
                        {
                            title: 'Putative Driver',
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/SV/driver.df.scanb.complete.csv',
                                type: 'csv',
                                chromosomeField: 'Chr',
                                genomicFields: ['ChrStart', 'ChrEnd']
                            },
                            dataTransform: [{ type: 'filter', field: 'Sample', oneOf: ['PD35930a'] }],
                            mark: 'text',
                            x: { field: 'ChrStart', type: 'genomic' },
                            xe: { field: 'ChrEnd', type: 'genomic' },
                            text: { field: 'Gene', type: 'nominal' },
                            color: { value: 'black' },
                            style: { textFontWeight: 'normal', dx: -10 },
                            width: 500,
                            height: 20
                        },
                        {
                            alignment: 'overlay',
                            title: 'hg38 | Genes',
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
                            tracks: [
                                {
                                    dataTransform: [
                                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                                        { type: 'filter', field: 'strand', oneOf: ['+'] }
                                    ],
                                    mark: 'triangleRight',
                                    x: { field: 'end', type: 'genomic' },
                                    size: { value: 15 }
                                },
                                {
                                    dataTransform: [{ type: 'filter', field: 'type', oneOf: ['gene'] }],
                                    mark: 'text',
                                    text: { field: 'name', type: 'nominal' },
                                    x: { field: 'start', type: 'genomic' },
                                    xe: { field: 'end', type: 'genomic' },
                                    style: { dy: -15, outline: 'black', outlineWidth: 0 }
                                },
                                {
                                    dataTransform: [
                                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                                        { type: 'filter', field: 'strand', oneOf: ['-'] }
                                    ],
                                    mark: 'triangleLeft',
                                    x: { field: 'start', type: 'genomic' },
                                    size: { value: 15 },
                                    style: {
                                        align: 'right',
                                        outline: 'black',
                                        outlineWidth: 0
                                    }
                                },
                                {
                                    dataTransform: [{ type: 'filter', field: 'type', oneOf: ['exon'] }],
                                    mark: 'rect',
                                    x: { field: 'start', type: 'genomic' },
                                    size: { value: 15 },
                                    xe: { field: 'end', type: 'genomic' }
                                },
                                {
                                    dataTransform: [
                                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                                        { type: 'filter', field: 'strand', oneOf: ['+'] }
                                    ],
                                    mark: 'rule',
                                    x: { field: 'start', type: 'genomic' },
                                    strokeWidth: { value: 2 },
                                    xe: { field: 'end', type: 'genomic' },
                                    style: {
                                        linePattern: { type: 'triangleRight', size: 3.5 },
                                        outline: 'black',
                                        outlineWidth: 0
                                    }
                                },
                                {
                                    dataTransform: [
                                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                                        { type: 'filter', field: 'strand', oneOf: ['-'] }
                                    ],
                                    mark: 'rule',
                                    x: { field: 'start', type: 'genomic' },
                                    strokeWidth: { value: 2 },
                                    xe: { field: 'end', type: 'genomic' },
                                    style: {
                                        linePattern: { type: 'triangleLeft', size: 3.5 },
                                        outline: 'black',
                                        outlineWidth: 0
                                    }
                                },
                                {
                                    mark: 'brush',
                                    x: { linkingId: 'detail-1' },
                                    strokeWidth: { value: 0 },
                                    color: { value: 'gray' },
                                    opacity: { value: 0.3 }
                                },
                                {
                                    mark: 'brush',
                                    x: { linkingId: 'detail-2' },
                                    strokeWidth: { value: 0 },
                                    color: { value: 'gray' },
                                    opacity: { value: 0.3 }
                                }
                            ],
                            row: {
                                field: 'strand',
                                type: 'nominal',
                                domain: ['+', '-']
                            },
                            color: {
                                field: 'strand',
                                type: 'nominal',
                                domain: ['+', '-'],
                                range: ['#97A8B2', '#D4C6BA'] //['blue', 'red']
                            },
                            visibility: [
                                {
                                    operation: 'less-than',
                                    measure: 'width',
                                    threshold: '|xe-x|',
                                    transitionPadding: 10,
                                    target: 'mark'
                                }
                            ],
                            // opacity: { value: 0.4 },
                            width: 400,
                            height: 100
                        },
                        {
                            title: 'LOH',
                            style: { background: 'lightgray', backgroundOpacity: 0.2 },
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/cancer/cnv.PD35930a.csv',
                                headerNames: [
                                    'id',
                                    'chr',
                                    'start',
                                    'end',
                                    'total_cn_normal',
                                    'minor_cp_normal',
                                    'total_cn_tumor',
                                    'minor_cn_tumor'
                                ],
                                type: 'csv',
                                chromosomeField: 'chr',
                                genomicFields: ['start', 'end']
                            },
                            dataTransform: [{ type: 'filter', field: 'minor_cn_tumor', oneOf: ['0'] }],
                            mark: 'rect',
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            color: { value: '#FB6A4B' },
                            width: 620,
                            height: 20
                        },
                        {
                            title: 'Gain',
                            style: { background: 'lightgray', backgroundOpacity: 0.2 },
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/cancer/cnv.PD35930a.csv',
                                headerNames: [
                                    'id',
                                    'chr',
                                    'start',
                                    'end',
                                    'total_cn_normal',
                                    'minor_cp_normal',
                                    'total_cn_tumor',
                                    'minor_cn_tumor'
                                ],
                                type: 'csv',
                                chromosomeField: 'chr',
                                genomicFields: ['start', 'end']
                            },
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'total_cn_tumor',
                                    inRange: [4.5, 900]
                                }
                            ],
                            mark: 'rect',
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            color: { value: '#73C475' },
                            width: 500,
                            height: 20
                        },
                        {
                            title: 'Structural Variant',
                            data: {
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/cancer/rearrangement.PD35930a.csv',
                                type: 'csv',
                                genomicFieldsToConvert: [
                                    {
                                        chromosomeField: 'chr1',
                                        genomicFields: ['start1', 'end1']
                                    },
                                    {
                                        chromosomeField: 'chr2',
                                        genomicFields: ['start2', 'end2']
                                    }
                                ]
                            },
                            alignment: 'overlay',
                            tracks: [
                                {
                                    mark: 'withinLink',
                                    x: { field: 'start1', type: 'genomic' },
                                    xe: { field: 'end2', type: 'genomic' }
                                },
                                {
                                    mark: 'point',
                                    x: { field: 'start1', type: 'genomic' },
                                    y: { value: 400 }
                                },
                                {
                                    mark: 'point',
                                    x: { field: 'end2', type: 'genomic' },
                                    y: { value: 400 }
                                }
                            ],
                            color: {
                                field: 'svclass',
                                type: 'nominal',
                                domain: ['tandem-duplication', 'translocation', 'delection', 'inversion'],
                                range: ['#569C4D', '#4C75A2', '#DA5456', '#EA8A2A'],
                                legend: true
                            },
                            stroke: {
                                field: 'svclass',
                                type: 'nominal',
                                domain: ['tandem-duplication', 'translocation', 'delection', 'inversion'],
                                range: ['#569C4D', '#4C75A2', '#DA5456', '#EA8A2A']
                            },
                            strokeWidth: { value: 1 },
                            opacity: { value: 0.6 },
                            size: { value: 4 },
                            tooltip: [
                                { field: 'start1', type: 'genomic' },
                                { field: 'end2', type: 'genomic' },
                                { field: 'svclass', type: 'nominal' }
                            ],
                            style: { legendTitle: 'SV Class', linkStyle: 'elliptical' },
                            width: 1000,
                            height: 200
                        }
                    ]
                }
            ]
        },
        {
            arrangement: 'horizontal',
            spacing: 100,
            views: [
                {
                    ...EX_SPEC_VIEW_PILEUP('bam-1', 450, 310, { chromosome: 'chr1', interval: [205000, 207000] })
                },
                {
                    ...EX_SPEC_VIEW_PILEUP('bam-2', 450, 310, { chromosome: 'chr1', interval: [490000, 496000] })
                }
            ]
        }
    ]
};

export function view(sample: string): GoslingSpec {
    return {
        layout: 'circular',
        spacing: 1,
        tracks: [
            {
                title: 'Overview',
                alignment: 'overlay',
                data: {
                    url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                    type: 'csv',
                    chromosomeField: 'Chromosome',
                    genomicFields: ['chromStart', 'chromEnd']
                },
                tracks: [{ mark: 'rect' }, { mark: 'brush', x: { linkingId: 'mid-scale' } }],
                color: {
                    field: 'Stain',
                    type: 'nominal',
                    domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar', 'acen'],
                    range: ['#C0C0C0', '#808080', '#404040', 'black', 'black', 'black', '#B74780']
                },
                size: { value: 18 },
                x: { field: 'chromStart', type: 'genomic' },
                xe: { field: 'chromEnd', type: 'genomic' },
                opacity: { value: 0.3 },
                width: 500,
                height: 40
            },
            // {
            //     title: sample,
            //     data: {
            //         url: `https://s3.amazonaws.com/gosling-lang.org/data/cancer/substitution.${sample}.csv`,
            //         type: 'csv',
            //         chromosomeField: 'Chrom',
            //         genomicFields: ['Pos']
            //     },
            //     dataTransform: [
            //         { type: 'concat', fields: ['Ref', 'Alt'], separator: ' > ', newField: 'sub' },
            //         {
            //             type: 'replace',
            //             field: 'sub',
            //             newField: 'sub',
            //             replace: [
            //                 { from: 'G > A', to: 'C > T' },
            //                 { from: 'G > T', to: 'C > A' },
            //                 { from: 'G > C', to: 'C > G' },
            //                 { from: 'A > G', to: 'T > C' },
            //                 { from: 'A > T', to: 'T > A' },
            //                 { from: 'A > C', to: 'T > G' }
            //             ]
            //         }
            //     ],
            //     mark: 'point',
            //     x: { field: 'Pos', type: 'genomic' },
            //     y: { field: 'PosDiff', type: 'quantitative', flip: true },
            //     size: { field: 'PosDiff', type: 'quantitative' },
            //     color: {
            //         field: 'sub',
            //         type: 'nominal',
            //         legend: true,
            //         domain: ['C > A', 'C > G', 'C > T', 'T > A', 'T > C', 'T > G'],
            //         range: ['#0072B2', 'black', '#D45E00', 'gray', '#029F73', '#CB7AA7']
            //     },
            //     opacity: { value: 0.3 },
            //     style: { outlineWidth: 1, outline: 'lightgray' },
            //     // "stroke": {"field": "svclass", "type": "nominal"},
            //     width: 500,
            //     height: 80
            // },
            // {
            //     data: {
            //         url: `https://s3.amazonaws.com/gosling-lang.org/data/cancer/indel.${sample}.csv`,
            //         type: 'csv',
            //         chromosomeField: 'Chrom',
            //         genomicFields: ['Pos']
            //     },
            //     mark: 'rect',
            //     x: { field: 'Pos', type: 'genomic' },
            //     color: { field: 'Type', type: 'nominal', domain: ['Ins', 'Del'], range: ['green', 'red'] },
            //     row: { field: 'Type', type: 'nominal', domain: ['Ins', 'Del'] },
            //     width: 500,
            //     height: 40
            // },
            {
                data: {
                    url: `https://s3.amazonaws.com/gosling-lang.org/data/cancer/rearrangement.${sample}.csv`,
                    type: 'csv',
                    genomicFieldsToConvert: [
                        { chromosomeField: 'chr1', genomicFields: ['start1', 'end1'] },
                        { chromosomeField: 'chr2', genomicFields: ['start2', 'end2'] }
                    ]
                },
                mark: 'withinLink',
                x: { field: 'start1', type: 'genomic' },
                xe: { field: 'end2', type: 'genomic' },
                color: {
                    field: 'svclass',
                    type: 'nominal',
                    legend: true,
                    domain: ['translocation', 'delection', 'tandem-duplication', 'inversion']
                },
                stroke: {
                    field: 'svclass',
                    type: 'nominal',
                    domain: ['translocation', 'delection', 'tandem-duplication', 'inversion']
                },
                width: 500,
                height: 80
            }
        ]
    };
}

export const EX_SPEC_CANCER_VARIANT: GoslingSpec = {
    title: 'Breast Cancer Variant (Staaf et al. 2019)',
    subtitle: 'Genetic characteristics of RAD51C- and PALB2-altered TNBCs',
    layout: 'linear',
    arrangement: 'vertical',
    centerRadius: 0.6,
    assembly: 'hg19',
    views: [
        {
            arrangement: 'horizontal',
            views: [{ ...view('PD35930a') } as any, { ...view('PD36000a') } as any]
        },
        {
            arrangement: 'horizontal',
            views: [{ ...view('PD31042a') } as any, { ...view('PD35930a') } as any]
        }
    ]
};
