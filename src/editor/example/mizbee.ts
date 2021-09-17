import { DataDeep, GoslingSpec } from '../../core/gosling.schema';

const opacity = 1;
const chrColorDomain = [
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
];
const chrColorRange = [
    'rgb(153, 102, 0)',
    'rgb(102, 102, 0)',
    'rgb(153, 153, 30)',
    'rgb(204, 0, 0)',
    'rgb(255, 0, 0)',
    'rgb(255, 0, 204)',
    'rgb(255, 204, 204)',
    'rgb(255, 153, 0)',
    'rgb(255, 204, 0)',
    'rgb(255, 255, 0)',
    'rgb(204, 255, 0)',
    'rgb(0, 255, 0)',
    'rgb(53, 128, 0)',
    'rgb(0, 0, 204)',
    'rgb(102, 153, 255)',
    'rgb(153, 204, 255)',
    'rgb(0, 255, 255)',
    'rgb(204, 255, 255)',
    'rgb(153, 0, 204)',
    'rgb(204, 51, 255)',
    'rgb(204, 153, 255)',
    'rgb(102, 102, 102)',
    'rgb(255, 102, 102)',
    'rgb(102, 102, 255)'
];

const data: DataDeep = {
    url:
        'https://s3.amazonaws.com/gosling-lang.org/data/ideogram.js/homo_sapiens-mus_musculus-synteny-v73-adjusted.tsv',
    type: 'csv',
    genomicFieldsToConvert: [
        {
            assembly: 'mm10',
            chromosomeField: 'Chromosome_spec1',
            genomicFields: ['Start_spec1', 'End_spec1']
        },
        {
            assembly: 'hg38',
            chromosomeField: 'Chromosome_spec2',
            genomicFields: ['Start_spec2', 'End_spec2']
        }
    ],
    separator: '\t'
};

export const EX_SPEC_MIZBEE: GoslingSpec = {
    title: 'MizBee',
    subtitle: 'Reimplementation of MizBee, A Multiscale Synteny Browser',
    // static: true,
    arrangement: 'horizontal',
    centerRadius: 0.2,
    spacing: 40,
    style: { outlineWidth: 2, outline: '#B4B4B4', enableSmoothPath: true },
    // xDomain: { interval: [0, 500000000] },
    views: [
        {
            spacing: 0,
            layout: 'circular',
            arrangement: 'parallel',
            views: [
                {
                    assembly: 'mm10',
                    alignment: 'overlay',
                    tracks: [
                        {
                            title: 'mm10',
                            assembly: 'mm10',
                            data,
                            mark: 'rect',
                            x: {
                                field: 'Start_spec1',
                                type: 'genomic'
                            },
                            xe: { field: 'End_spec1', type: 'genomic' },
                            strokeWidth: { value: 0 },
                            color: {
                                field: 'Chromosome_spec2',
                                type: 'nominal',
                                domain: chrColorDomain,
                                range: chrColorRange
                            },
                            opacity: { value: opacity }
                        }
                        // {
                        //     assembly: 'mm10',
                        //     data: {
                        //         url:
                        //             'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                        //         type: 'csv',
                        //         chromosomeField: 'Chromosome',
                        //         genomicFields: ['chromStart', 'chromEnd']
                        //     },
                        //     mark: 'rect',
                        //     color: {
                        //         field: 'Chromosome',
                        //         type: 'nominal',
                        //         domain: [
                        //             'chr1',
                        //             'chr2',
                        //             'chr3',
                        //             'chr4',
                        //             'chr5',
                        //             'chr6',
                        //             'chr7',
                        //             'chr8',
                        //             'chr9',
                        //             'chr10',
                        //             'chr11',
                        //             'chr12',
                        //             'chr13',
                        //             'chr14',
                        //             'chr15',
                        //             'chr16',
                        //             'chr17',
                        //             'chr18',
                        //             'chr19',
                        //             'chr20',
                        //             'chr21',
                        //             'chr22',
                        //             'chrX',
                        //             'chrY',
                        //             'chrM',
                        //         ],
                        //         range: ['none']
                        //     },
                        //     x: {
                        //         field: 'chromStart',
                        //         type: 'genomic',
                        //         aggregate: 'min',
                        //         axis: 'top',
                        //         linkingId: 'bottom'
                        //     },
                        //     xe: {
                        //         field: 'chromEnd',
                        //         aggregate: 'max',
                        //         type: 'genomic'
                        //     },
                        //     strokeWidth: { value: 1 },
                        //     stroke: { value: '#B4B4B4' },
                        // }
                    ],
                    width: 810,
                    height: 20
                },
                {
                    spacing: 10,
                    arrangement: 'serial',
                    views: [
                        {
                            assembly: 'mm10',
                            // xDomain: { chromosome: '1' },
                            tracks: [
                                {
                                    title: 'mm10',
                                    data,
                                    dataTransform: [{ type: 'filter', field: 'Chromosome_spec1', oneOf: ['chr1'] }],
                                    mark: 'rect',
                                    x: {
                                        field: 'Start_spec1',
                                        type: 'genomic',
                                        linkingId: 'top'
                                    },
                                    xe: { field: 'End_spec1', type: 'genomic' },
                                    strokeWidth: { value: 0 },
                                    color: {
                                        field: 'Chromosome_spec2',
                                        type: 'nominal',
                                        domain: chrColorDomain,
                                        range: chrColorRange
                                    },
                                    opacity: { value: opacity },
                                    width: 100,
                                    height: 20
                                }
                            ]
                        },
                        {
                            assembly: 'hg38',
                            alignment: 'overlay',
                            tracks: [
                                {
                                    title: 'hg38',
                                    data: {
                                        url:
                                            'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                                        type: 'csv',
                                        chromosomeField: 'Chromosome',
                                        genomicFields: ['chromStart', 'chromEnd']
                                    },
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
                                        range: ['#B4B4B4']
                                    },
                                    x: {
                                        field: 'chromStart',
                                        type: 'genomic',
                                        aggregate: 'min',
                                        axis: 'top',
                                        linkingId: 'bottom'
                                    },
                                    xe: {
                                        field: 'chromEnd',
                                        aggregate: 'max',
                                        type: 'genomic'
                                    },
                                    strokeWidth: { value: 1 },
                                    stroke: { value: '#E5E5E5' }
                                },
                                {
                                    data,
                                    dataTransform: [{ type: 'filter', field: 'Chromosome_spec1', oneOf: ['chr1'] }],
                                    mark: 'rect',
                                    x: {
                                        field: 'Start_spec2',
                                        type: 'genomic',
                                        linkingId: 'bottom'
                                    },
                                    xe: { field: 'End_spec2', type: 'genomic' },
                                    strokeWidth: { value: 0 },
                                    color: {
                                        field: 'Chromosome_spec2',
                                        type: 'nominal',
                                        domain: chrColorDomain,
                                        range: chrColorRange
                                    },
                                    opacity: { value: opacity }
                                }
                            ],
                            width: 700,
                            height: 20
                        }
                    ]
                },
                {
                    tracks: [
                        {
                            data,
                            dataTransform: [{ type: 'filter', field: 'Chromosome_spec1', oneOf: ['chr1'] }],
                            mark: 'betweenLink',
                            x: {
                                field: 'Start_spec1',
                                type: 'genomic',
                                axis: 'none',
                                linkingId: 'top',
                                // domain: { chromosome: '1' },
                                range: [0, 100]
                            },
                            xe: { field: 'End_spec1', type: 'genomic', range: [0, 100] },
                            x1: {
                                field: 'Start_spec2',
                                type: 'genomic',
                                linkingId: 'bottom',
                                range: [110, 810]
                            },
                            x1e: { field: 'End_spec2', type: 'genomic', range: [110, 810] },
                            strokeWidth: { value: 0 },
                            color: {
                                field: 'Chromosome_spec2',
                                type: 'nominal',
                                domain: chrColorDomain,
                                range: chrColorRange
                            },
                            flipY: true,
                            opacity: { value: opacity },
                            style: { outlineWidth: 0 },
                            width: 810,
                            height: 100
                        }
                    ]
                }
            ]
        }
        // {
        //     assembly: 'mm10',
        //     layout: 'linear',
        //     arrangement: 'vertical',
        //     spacing: 20,
        //     views: [
        //         {
        //             xDomain: { chromosome: '1' },
        //             tracks: [
        //                 {
        //                     data,
        //                     mark: 'rect',
        //                     x: {
        //                         field: 'Start_spec1',
        //                         type: 'genomic'
        //                     },
        //                     xe: { field: 'End_spec1', type: 'genomic' },
        //                     strokeWidth: { value: 0 },
        //                     color: { value: 'black' },
        //                     opacity: { value: opacity },
        //                     style: { background: 'white' },
        //                     width: 800,
        //                     height: 20
        //                 },
        //                 {
        //                     data,
        //                     mark: 'rect',
        //                     x: {
        //                         field: 'Start_spec1',
        //                         type: 'genomic'
        //                     },
        //                     xe: { field: 'End_spec1', type: 'genomic' },
        //                     strokeWidth: { value: 0 },
        //                     color: {
        //                         field: 'Chromosome_spec2',
        //                         type: 'nominal',
        //                         domain: chrColorDomain,
        //                         range: chrColorRange
        //                     },
        //                     opacity: { value: opacity },
        //                     style: { background: 'white' },
        //                     width: 800,
        //                     height: 100
        //                 }
        //             ]
        //         },
        //         {
        //             spacing: 0,
        //             views: [
        //                 {
        //                     assembly: 'mm10',
        //                     xLinkingId: 'top',
        //                     tracks: [
        //                         {
        //                             data,
        //                             mark: 'rect',
        //                             x: {
        //                                 field: 'Start_spec1',
        //                                 type: 'genomic',
        //                                 axis: 'top'
        //                             },
        //                             xe: { field: 'End_spec1', type: 'genomic' },
        //                             strokeWidth: { value: 0 },
        //                             color: { value: 'blue' },
        //                             opacity: { value: 0.3 },
        //                             width: 800,
        //                             height: 20
        //                         }
        //                     ]
        //                 },
        //                 {
        //                     tracks: [
        //                         {
        //                             data,
        //                             mark: 'betweenLink',
        //                             x: {
        //                                 field: 'Start_spec1',
        //                                 type: 'genomic',
        //                                 axis: 'none',
        //                                 linkingId: 'top',
        //                                 domain: { chromosome: '1' }
        //                             },
        //                             xe: { field: 'End_spec1', type: 'genomic' },
        //                             x1: {
        //                                 field: 'Start_spec2',
        //                                 type: 'genomic',
        //                                 linkingId: 'bottom'
        //                             },
        //                             x1e: { field: 'End_spec2', type: 'genomic' },
        //                             strokeWidth: { value: 0 },
        //                             color: { value: 'blue' },
        //                             opacity: { value: 0.3 },
        //                             width: 800,
        //                             height: 200
        //                         }
        //                     ]
        //                 },
        //                 {
        //                     xDomain: { chromosome: '10' },
        //                     xLinkingId: 'bottom',
        //                     assembly: 'hg38',
        //                     tracks: [
        //                         {
        //                             data,
        //                             mark: 'rect',
        //                             x: {
        //                                 field: 'Start_spec2',
        //                                 type: 'genomic',
        //                                 axis: 'bottom'
        //                             },
        //                             xe: { field: 'End_spec2', type: 'genomic' },
        //                             strokeWidth: { value: 0 },
        //                             color: { value: 'blue' },
        //                             opacity: { value: 0.3 },
        //                             width: 800,
        //                             height: 20
        //                         }
        //                     ]
        //                 },
        //             ]
        //         }
        //     ]
        // }
    ]
};
