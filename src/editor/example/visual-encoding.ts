import { GoslingSpec } from '../../core/gosling.schema';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_VISUAL_ENCODING: GoslingSpec = {
    title: 'Visual Encoding',
    subtitle: 'Gosling provides diverse visual encoding methods',
    layout: 'linear',
    arrangement: 'vertical',
    centerRadius: 0.8,
    xDomain: { chromosome: '1', interval: [1, 3000500] },
    views: [
        {
            id: 'view-1',
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                        binSize: 4
                    },
                    mark: 'rect',
                    x: {
                        field: 'start',
                        type: 'genomic',
                        axis: 'top'
                    },
                    xe: {
                        field: 'end',
                        type: 'genomic'
                    },
                    row: { field: 'sample', type: 'nominal', legend: true },
                    color: { field: 'peak', type: 'quantitative', legend: true },
                    tooltip: [
                        { field: 'start', type: 'genomic', alt: 'Start Position' },
                        { field: 'end', type: 'genomic', alt: 'End Position' },
                        { field: 'peak', type: 'quantitative', alt: 'Value', format: '.2' },
                        { field: 'sample', type: 'nominal', alt: 'Sample' }
                    ],
                    width: 600,
                    height: 130
                }
            ]
        },
        {
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    mark: 'bar',
                    x: {
                        field: 'position',
                        type: 'genomic',
                        axis: 'top'
                    },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal', legend: true },
                    tooltip: [
                        { field: 'position', type: 'genomic', alt: 'Position' },
                        { field: 'peak', type: 'quantitative', alt: 'Value', format: '.2' },
                        { field: 'sample', type: 'nominal', alt: 'Sample' }
                    ],
                    width: 600,
                    height: 130
                }
            ]
        },
        {
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    mark: 'bar',
                    x: {
                        field: 'position',
                        type: 'genomic',
                        axis: 'top'
                    },
                    y: { field: 'peak', type: 'quantitative', grid: true },
                    color: { field: 'sample', type: 'nominal', legend: true },
                    tooltip: [
                        { field: 'position', type: 'genomic', alt: 'Position' },
                        { field: 'peak', type: 'quantitative', alt: 'Value', format: '.2' },
                        { field: 'sample', type: 'nominal', alt: 'Sample' }
                    ],
                    width: 600,
                    height: 130
                }
            ]
        },
        {
            alignment: 'overlay',
            data: {
                url: GOSLING_PUBLIC_DATA.multivec,
                type: 'multivec',
                row: 'sample',
                column: 'position',
                value: 'peak',
                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
            },
            x: {
                field: 'position',
                type: 'genomic',
                axis: 'top'
            },
            y: { field: 'peak', type: 'quantitative' },
            row: { field: 'sample', type: 'nominal' },
            color: { field: 'sample', type: 'nominal', legend: true },
            tracks: [{ mark: 'line' }, { mark: 'point', size: { field: 'peak', type: 'quantitative', range: [0, 2] } }],
            tooltip: [
                { field: 'position', type: 'genomic', alt: 'Position' },
                { field: 'peak', type: 'quantitative', alt: 'Value', format: '.2' },
                { field: 'sample', type: 'nominal', alt: 'Sample' }
            ],
            width: 600,
            height: 130
        },
        {
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    mark: 'point',
                    x: {
                        field: 'position',
                        type: 'genomic',
                        axis: 'top'
                    },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    size: { field: 'peak', type: 'quantitative' },
                    color: { field: 'sample', type: 'nominal', legend: true },
                    opacity: { value: 0.5 },
                    tooltip: [
                        { field: 'position', type: 'genomic', alt: 'Position' },
                        { field: 'peak', type: 'quantitative', alt: 'Value', format: '.2' },
                        { field: 'sample', type: 'nominal', alt: 'Sample' }
                    ],
                    width: 600,
                    height: 130
                }
            ]
        },
        {
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    mark: 'point',
                    x: {
                        field: 'position',
                        type: 'genomic',
                        axis: 'top'
                    },
                    y: { field: 'peak', type: 'quantitative', grid: true },
                    size: { field: 'peak', type: 'quantitative' },
                    color: { field: 'sample', type: 'nominal', legend: true },
                    opacity: { value: 0.5 },
                    tooltip: [
                        { field: 'position', type: 'genomic', alt: 'Position' },
                        { field: 'peak', type: 'quantitative', alt: 'Value', format: '.2' },
                        { field: 'sample', type: 'nominal', alt: 'Sample' }
                    ],
                    width: 600,
                    height: 130
                }
            ]
        },
        {
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    mark: 'area',
                    x: {
                        field: 'position',
                        type: 'genomic',
                        axis: 'top'
                    },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal', legend: true },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0.5 },
                    tooltip: [
                        { field: 'position', type: 'genomic', alt: 'Position' },
                        { field: 'peak', type: 'quantitative', alt: 'Value', format: '.2' },
                        { field: 'sample', type: 'nominal', alt: 'Sample' }
                    ],
                    width: 600,
                    height: 130
                }
            ]
        },
        {
            tracks: [
                {
                    data: {
                        url:
                            'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                        type: 'csv',
                        chromosomeField: 'c2',
                        genomicFields: ['s1', 'e1', 's2', 'e2']
                    },
                    mark: 'withinLink',
                    x: {
                        field: 's1',
                        type: 'genomic',
                        domain: { chromosome: '1', interval: [103900000, 104100000] }
                    },
                    xe: {
                        field: 'e1',
                        type: 'genomic'
                    },
                    x1: {
                        field: 's2',
                        type: 'genomic',
                        domain: { chromosome: '1' }
                    },
                    x1e: {
                        field: 'e2',
                        type: 'genomic'
                    },
                    color: { field: 's1', type: 'nominal' },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 0.5 },
                    opacity: { value: 0.2 },
                    width: 600,
                    height: 130
                }
            ]
        }
    ]
};

export const EX_SPEC_VISUAL_ENCODING_CIRCULAR: GoslingSpec = {
    title: 'Visual Encoding in Circular Layouts',
    subtitle: 'Gosling provides diverse visual encoding methods in circular layouts',
    layout: 'circular',
    arrangement: 'vertical',
    centerRadius: 0.5,
    static: true,
    xDomain: { chromosome: '1', interval: [1, 3000500] },
    views: [
        {
            arrangement: 'horizontal',
            views: [
                {
                    spacing: 2,
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.multivec,
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                                binSize: 4
                            },
                            mark: 'rect',
                            x: {
                                field: 'start',
                                type: 'genomic',
                                axis: 'top'
                            },
                            xe: {
                                field: 'end',
                                type: 'genomic'
                            },
                            row: { field: 'sample', type: 'nominal', legend: true },
                            color: { field: 'peak', type: 'quantitative', legend: true },
                            tooltip: [
                                { field: 'start', type: 'genomic', alt: 'Start Position' },
                                { field: 'end', type: 'genomic', alt: 'End Position' },
                                { field: 'peak', type: 'quantitative', alt: 'Value', format: '.2' },
                                { field: 'sample', type: 'nominal', alt: 'Sample' }
                            ],
                            width: 350,
                            height: 130
                        }
                    ]
                },
                {
                    spacing: 2,
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.multivec,
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                            },
                            mark: 'bar',
                            x: {
                                field: 'position',
                                type: 'genomic',
                                axis: 'top'
                            },
                            y: { field: 'peak', type: 'quantitative' },
                            row: { field: 'sample', type: 'nominal' },
                            color: { field: 'sample', type: 'nominal', legend: true },
                            width: 350,
                            height: 130
                        }
                    ]
                }
            ]
        },
        {
            arrangement: 'horizontal',
            views: [
                {
                    spacing: 2,
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.multivec,
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                            },
                            mark: 'bar',
                            x: {
                                field: 'position',
                                type: 'genomic',
                                axis: 'top'
                            },
                            y: { field: 'peak', type: 'quantitative', grid: true },
                            color: { field: 'sample', type: 'nominal', legend: true },
                            width: 350,
                            height: 130
                        }
                    ]
                },
                {
                    spacing: 2,
                    alignment: 'overlay',
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    x: {
                        field: 'position',
                        type: 'genomic',
                        axis: 'top'
                    },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal', legend: true },
                    tracks: [
                        { mark: 'line' },
                        { mark: 'point', size: { field: 'peak', type: 'quantitative', range: [0, 2] } }
                    ],
                    width: 350,
                    height: 130
                }
            ]
        },
        {
            arrangement: 'horizontal',
            views: [
                {
                    spacing: 2,
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.multivec,
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                            },
                            mark: 'point',
                            x: {
                                field: 'position',
                                type: 'genomic',
                                axis: 'top'
                            },
                            y: { field: 'peak', type: 'quantitative' },
                            row: { field: 'sample', type: 'nominal' },
                            size: { field: 'peak', type: 'quantitative' },
                            color: { field: 'sample', type: 'nominal', legend: true },
                            opacity: { value: 0.5 },
                            width: 350,
                            height: 130
                        }
                    ]
                },
                {
                    spacing: 2,
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.multivec,
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                            },
                            mark: 'point',
                            x: {
                                field: 'position',
                                type: 'genomic',
                                axis: 'top'
                            },
                            y: { field: 'peak', type: 'quantitative', grid: true },
                            size: { field: 'peak', type: 'quantitative' },
                            color: { field: 'sample', type: 'nominal', legend: true },
                            opacity: { value: 0.5 },
                            width: 350,
                            height: 130
                        }
                    ]
                }
            ]
        },
        {
            arrangement: 'horizontal',
            views: [
                {
                    spacing: 2,
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.multivec,
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                            },
                            mark: 'area',
                            x: {
                                field: 'position',
                                type: 'genomic',
                                axis: 'top'
                            },
                            y: { field: 'peak', type: 'quantitative' },
                            row: { field: 'sample', type: 'nominal' },
                            color: { field: 'sample', type: 'nominal', legend: true },
                            stroke: { value: 'white' },
                            strokeWidth: { value: 0.5 },
                            width: 350,
                            height: 130
                        }
                    ]
                },
                {
                    spacing: 2,
                    tracks: [
                        {
                            data: {
                                url:
                                    'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                                type: 'csv',
                                chromosomeField: 'c2',
                                genomicFields: ['s1', 'e1', 's2', 'e2']
                            },
                            mark: 'withinLink',
                            x: {
                                field: 's1',
                                type: 'genomic',
                                domain: { chromosome: '1', interval: [103900000, 104100000] }
                            },
                            xe: {
                                field: 'e1',
                                type: 'genomic'
                            },
                            x1: {
                                field: 's2',
                                type: 'genomic',
                                domain: { chromosome: '1' }
                            },
                            x1e: {
                                field: 'e2',
                                type: 'genomic'
                            },
                            color: { field: 's1', type: 'nominal' },
                            stroke: { value: 'black' },
                            strokeWidth: { value: 0.5 },
                            opacity: { value: 0.4 },
                            width: 350,
                            height: 130
                        }
                    ]
                }
            ]
        }
    ]
};

export const EX_SPEC_DARK_THEME: GoslingSpec = {
    // theme: {
    //     base: 'dark',
    //     axis: { gridColor: '#333', baselineColor: 'transparent', tickColor: 'transparent' },
    //     markCommon: {
    //         color: 'gray',
    //         nominalColorRange: ['white', 'gray'],
    //         stroke: 'black'
    //     }
    // },
    title: 'Dark Theme (Beta)',
    subtitle: 'Gosling allows to easily change the color theme using a `theme` property',
    layout: 'circular',
    arrangement: 'vertical',
    centerRadius: 0,
    static: true,
    xDomain: { chromosome: '1', interval: [1, 3000500] },
    views: [
        {
            arrangement: 'horizontal',
            views: [
                {
                    spacing: 0.01,
                    tracks: [
                        {
                            data: {
                                url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                            },
                            mark: 'bar',
                            x: { field: 'position', type: 'genomic', axis: 'top' },
                            y: { field: 'peak', type: 'quantitative', axis: 'left', grid: true },
                            color: { field: 'sample', type: 'nominal', legend: true },
                            width: 550,
                            height: 230
                        },
                        // {
                        //     data: {
                        //         url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        //         type: 'multivec',
                        //         row: 'sample',
                        //         column: 'position',
                        //         value: 'peak',
                        //         categories: [
                        //             'sample 1',
                        //             'sample 2',
                        //             'sample 3',
                        //             'sample 4',
                        //             'sample 5',
                        //             'sample 6',
                        //             'sample 7',
                        //             'sample 8'
                        //         ],
                        //         binSize: 4
                        //     },
                        //     dataTransform: [{ type: 'filter', field: 'peak', inRange: [0, 0.001] }],
                        //     mark: 'rect',
                        //     x: { field: 'start', type: 'genomic' },
                        //     xe: { field: 'end', type: 'genomic' },
                        //     displacement: { type: 'pile' },
                        //     color: { value: 'gray' },
                        //     stroke: { value: 'black' },
                        //     opacity: { value: 0.8 },
                        //     strokeWidth: { value: 1 },
                        //     width: 550,
                        //     height: 80
                        // },
                        {
                            alignment: 'overlay',
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
                                    style: { dy: -15 }
                                },
                                {
                                    dataTransform: [
                                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                                        { type: 'filter', field: 'strand', oneOf: ['-'] }
                                    ],
                                    mark: 'triangleLeft',
                                    x: { field: 'start', type: 'genomic' },
                                    size: { value: 15 },
                                    style: { align: 'right' }
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
                                    strokeWidth: { value: 3 },
                                    xe: { field: 'end', type: 'genomic' },
                                    style: { linePattern: { type: 'triangleRight', size: 5 } }
                                },
                                {
                                    dataTransform: [
                                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                                        { type: 'filter', field: 'strand', oneOf: ['-'] }
                                    ],
                                    mark: 'rule',
                                    x: { field: 'start', type: 'genomic' },
                                    strokeWidth: { value: 3 },
                                    xe: { field: 'end', type: 'genomic' },
                                    style: { linePattern: { type: 'triangleLeft', size: 5 } }
                                }
                            ],
                            row: { field: 'strand', type: 'nominal', domain: ['+', '-'], grid: true },
                            color: {
                                field: 'strand',
                                type: 'nominal',
                                domain: ['+', '-'],
                                range: ['#7585FF', '#FF8A85']
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
                            opacity: { value: 0.8 },
                            width: 350,
                            height: 100
                        },
                        {
                            data: {
                                url: 'https://raw.githubusercontent.com/vigsterkr/circos/master/data/5/segdup.txt',
                                type: 'csv',
                                headerNames: ['id', 'chr', 'p1', 'p2'],
                                chromosomePrefix: 'hs',
                                chromosomeField: 'chr',
                                genomicFields: ['p1', 'p2'],
                                separator: ' ',
                                longToWideId: 'id'
                            },
                            opacity: { value: 0.4 },
                            mark: 'withinLink',
                            x: { field: 'p1', type: 'genomic' },
                            xe: { field: 'p1_2', type: 'genomic' },
                            x1: { field: 'p2', type: 'genomic' },
                            x1e: { field: 'P2_2', type: 'genomic' },
                            stroke: { value: 'gray' },
                            strokeWidth: { value: 2 },
                            width: 550,
                            height: 100
                        }
                    ]
                }
            ]
        }
    ],
    style: { outlineWidth: 0 }
};
