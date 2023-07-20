import type { GoslingSpec } from '@gosling.schema';

export const EX_SPEC_RESPONSIVE_SEGREGATED_AREA_CHART: GoslingSpec = {
    // title: 'Responsive Visualization',
    // subtitle: 'Resize your browser to see visualization changes...',
    responsiveSize: { width: false, height: true },
    xDomain: { chromosome: 'chr12', interval: [5000000, 15000000] },
    views: [
        {
            tracks: [
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: [
                            'sample 1',
                            'sample 2',
                            'sample 3',
                            'sample -',
                            'sample -',
                            'sample 6',
                            'sample 7',
                            'sample 8',
                            'sample 9',
                            'sample 10',
                            'sample 11',
                            'sample 12',
                            'sample 13',
                            'sample 14',
                            'sample 15',
                            'sample 16'
                        ],
                        binSize: 4
                    },
                    dataTransform: [{ type: 'filter', field: 'sample', oneOf: ['sample -'], not: true }],
                    mark: 'area',
                    x: { field: 'position', type: 'genomic' },
                    color: { field: 'sample', type: 'nominal' },
                    tracks: [
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'right', domain: [0, 0.02], grid: true },
                            row: { field: 'sample', type: 'nominal', legend: true },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GT',
                                    threshold: 8 * 10
                                }
                            ]
                        },
                        {
                            mark: 'line',
                            y: { field: 'peak', type: 'quantitative', axis: 'right' },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LT',
                                    threshold: 8 * 10
                                }
                            ]
                        }
                    ],
                    width: 600,
                    height: 130
                }
            ]
        }
    ]
};

const TotalChartSizes = [400, 200]; // [192, 96, 48]; // from the paper below
export const EX_SPEC_RESPONSIVE_MULTIVEC: GoslingSpec = {
    description: 'Reference: Javed et al. Graphical perception of Multiple Time Series. TVCG 2010.',
    responsiveSize: { width: false, height: true },
    xDomain: { chromosome: 'chr12', interval: [5000000, 15000000] },
    views: [
        {
            // layout: 'circular', // 'linear',
            spacing: 1,
            tracks: [
                {
                    id: 'responsive-multivec',
                    alignment: 'overlay',
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: [
                            'sample 1',
                            'sample 2',
                            'sample 3',
                            'sample -',
                            'sample -',
                            'sample 6',
                            'sample 7',
                            'sample 8',
                            'sample 9',
                            'sample 10',
                            'sample 11',
                            'sample 12',
                            'sample 13',
                            'sample 14',
                            'sample 15',
                            'sample 16'
                        ],
                        binSize: 4
                    },
                    dataTransform: [{ type: 'filter', field: 'sample', oneOf: ['sample -'], not: true }],
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    color: { field: 'sample', type: 'nominal', legend: false },
                    tracks: [
                        {
                            // Sufficient Height
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0, 0.01], grid: true },
                            row: { field: 'sample', type: 'nominal', legend: false },
                            opacity: { value: 1 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GTET',
                                    threshold: TotalChartSizes[0]
                                }
                            ]
                        },
                        // {
                        //     // Sufficient Height
                        //     mark: 'bar',
                        //     y: { field: 'peak', type: 'quantitative', axis: 'right', domain: [0, 0.01], grid: true },
                        //     row: { field: 'sample', type: 'nominal', legend: true },
                        //     opacity: { value: 1 },
                        //     size: { value: 0.5 },
                        //     visibility: [
                        //         {
                        //             target: 'track',
                        //             measure: 'height',
                        //             operation: 'GTET',
                        //             threshold: TotalChartSizes[0] + 200
                        //         }
                        //     ]
                        // },
                        // {
                        //     // Max Annotation
                        //     dataTransform: [
                        //         { type: 'filter', field: 'sample', oneOf: ['sample -'], not: true }
                        //     ],
                        //     y: { field: 'peak', type: 'quantitative', axis: 'right', aggregate: 'max' },
                        //     row: { field: 'sample', type: 'nominal', legend: true },
                        //     opacity: { value: 0.6 },
                        //     visibility: [
                        //         {
                        //             target: 'track',
                        //             measure: 'height',
                        //             operation: 'GTET',
                        //             threshold: TotalChartSizes[0]
                        //         }
                        //     ]
                        // },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0, 0.0025] },
                            row: { field: 'sample', type: 'nominal', legend: true },
                            opacity: { value: 0.33 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LT',
                                    threshold: TotalChartSizes[0]
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GT',
                                    threshold: TotalChartSizes[1]
                                }
                            ]
                        },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0.0025, 0.005] },
                            row: { field: 'sample', type: 'nominal', legend: true },
                            opacity: { value: 0.33 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LT',
                                    threshold: TotalChartSizes[0]
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GT',
                                    threshold: TotalChartSizes[1]
                                }
                            ]
                        },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0.005, 0.0075] },
                            row: { field: 'sample', type: 'nominal', legend: true },
                            opacity: { value: 0.33 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LT',
                                    threshold: TotalChartSizes[0]
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GT',
                                    threshold: TotalChartSizes[1]
                                }
                            ]
                        },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0.0075, 0.01] },
                            row: { field: 'sample', type: 'nominal', legend: true },
                            opacity: { value: 0.33 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LT',
                                    threshold: TotalChartSizes[0]
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GT',
                                    threshold: TotalChartSizes[1]
                                }
                            ]
                        },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'none' },
                            // color: { field: 'sample', type: 'nominal', range: ['#2270B5'] },
                            opacity: { value: 1 },
                            // stroke: { value: 'white' },
                            // strokeWidth: { value: 1 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LTET',
                                    threshold: TotalChartSizes[1]
                                }
                            ]
                        }
                    ],
                    width: 600,
                    height: 130
                }
            ]
        }
    ]
};
export const EX_SPEC_RESPONSIVE_MULTIVEC_CIRCULAR: GoslingSpec = {
    description: 'Reference: Javed et al. Graphical perception of Multiple Time Series. TVCG 2010.',
    responsiveSize: { width: false, height: true },
    xDomain: { chromosome: 'chr12', interval: [5000000, 15000000] },
    views: [
        {
            layout: 'circular',
            responsiveSpec: [
                {
                    spec: { layout: 'linear' },
                    selectivity: [{ measure: 'aspectRatio', operation: 'GT', threshold: 1.5 }]
                }
            ],
            spacing: 1,
            tracks: [
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: [
                            'sample 1',
                            'sample 2',
                            'sample 3',
                            'sample -',
                            'sample -',
                            'sample 6',
                            'sample 7',
                            'sample 8',
                            'sample 9',
                            'sample 10',
                            'sample 11',
                            'sample 12',
                            'sample 13',
                            'sample 14',
                            'sample 15',
                            'sample 16'
                        ],
                        binSize: 4
                    },
                    dataTransform: [{ type: 'filter', field: 'sample', oneOf: ['sample -'], not: true }],
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    color: { field: 'sample', type: 'nominal', legend: false },
                    tracks: [
                        {
                            // Sufficient Height
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0, 0.01], grid: true },
                            row: { field: 'sample', type: 'nominal', legend: false },
                            opacity: { value: 1 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GTET',
                                    threshold: TotalChartSizes[0] + 100
                                }
                            ]
                        },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0, 0.0025] },
                            row: { field: 'sample', type: 'nominal', legend: false },
                            opacity: { value: 0.33 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LT',
                                    threshold: TotalChartSizes[0] + 100
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GT',
                                    threshold: TotalChartSizes[1] + 100
                                }
                            ]
                        },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0.0025, 0.005] },
                            row: { field: 'sample', type: 'nominal', legend: true },
                            opacity: { value: 0.33 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LT',
                                    threshold: TotalChartSizes[0] + 100
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GT',
                                    threshold: TotalChartSizes[1] + 100
                                }
                            ]
                        },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0.005, 0.0075] },
                            row: { field: 'sample', type: 'nominal', legend: true },
                            opacity: { value: 0.33 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LT',
                                    threshold: TotalChartSizes[0] + 100
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GT',
                                    threshold: TotalChartSizes[1] + 100
                                }
                            ]
                        },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'none', domain: [0.0075, 0.01] },
                            row: { field: 'sample', type: 'nominal', legend: true },
                            opacity: { value: 0.33 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LT',
                                    threshold: TotalChartSizes[0] + 100
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'GT',
                                    threshold: TotalChartSizes[1] + 100
                                }
                            ]
                        },
                        {
                            y: { field: 'peak', type: 'quantitative', axis: 'right' },
                            // color: { field: 'sample', type: 'nominal', range: ['#2270B5'] },
                            opacity: { value: 1 },
                            // stroke: { value: 'white' },
                            // strokeWidth: { value: 0.5 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    operation: 'LTET',
                                    threshold: TotalChartSizes[1] + 100
                                }
                            ]
                        }
                    ],
                    width: 600,
                    height: 130
                }
            ]
        }
    ]
};

// TODO: Add genes and allow rotation
export const EX_SPEC_RESPONSIVE_IDEOGRAM: GoslingSpec = {
    responsiveSize: { width: true, height: true },
    xDomain: { chromosome: 'chr7' },
    views: [
        {
            tracks: [
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                        type: 'csv',
                        chromosomeField: 'Chromosome',
                        genomicFields: ['chromStart', 'chromEnd']
                    },
                    tracks: [
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
                            size: { value: 12 },
                            visibility: [
                                {
                                    target: 'mark',
                                    measure: 'width',
                                    threshold: '|xe-x|',
                                    operation: 'LT'
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    threshold: 60,
                                    operation: 'LT'
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    threshold: 10,
                                    operation: 'GTET'
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
                                range: ['black', 'black', 'black', 'black', 'black', 'black']
                            },
                            size: { value: 12 },
                            style: { dy: -20 },
                            visibility: [
                                {
                                    target: 'mark',
                                    measure: 'width',
                                    threshold: '|xe-x|',
                                    operation: 'LT'
                                },
                                {
                                    target: 'track',
                                    measure: 'height',
                                    threshold: 60,
                                    operation: 'GTET'
                                }
                            ]
                        },
                        {
                            mark: 'text',
                            data: {
                                type: 'json',
                                values: [
                                    {
                                        c: '1',
                                        chromStart: 1654193086,
                                        chromEnd: 1654206403,
                                        strand: '+',
                                        name: 'TLR4'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1707783946,
                                        chromEnd: 1707841994,
                                        strand: '-',
                                        name: 'ITGB1'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1319508165,
                                        chromEnd: 1319717626,
                                        strand: '-',
                                        name: 'ABCB1'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1349484265,
                                        chromEnd: 1349672967,
                                        strand: '+',
                                        name: 'CFTR'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1360245580,
                                        chromEnd: 1360261932,
                                        strand: '+',
                                        name: 'LEP'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1372738315,
                                        chromEnd: 1372929067,
                                        strand: '-',
                                        name: 'BRAF'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1382995358,
                                        chromEnd: 1383018902,
                                        strand: '+',
                                        name: 'NOS3'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1333131391,
                                        chromEnd: 1333143569,
                                        strand: '+',
                                        name: 'SERPINE1'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1876264645,
                                        chromEnd: 1876267704,
                                        strand: '+',
                                        name: 'GSTP1'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1878322155,
                                        chromEnd: 1878335525,
                                        strand: '+',
                                        name: 'CCND1'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1916903882,
                                        chromEnd: 1917050150,
                                        strand: '+',
                                        name: 'ATM'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1950557144,
                                        chromEnd: 1950588483,
                                        strand: '+',
                                        name: 'CD4'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1968972461,
                                        chromEnd: 1969018604,
                                        strand: '-',
                                        name: 'KRAS'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1874334646,
                                        chromEnd: 1874344023,
                                        strand: '-',
                                        name: 'RELA'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 2109358461,
                                        chromEnd: 2109442654,
                                        strand: '+',
                                        name: 'BRCA2'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1212888819,
                                        chromEnd: 1213327927,
                                        strand: '+',
                                        name: 'ESR1'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1254731444,
                                        chromEnd: 1254736305,
                                        strand: '+',
                                        name: 'IL6'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1287023323,
                                        chromEnd: 1287212383,
                                        strand: '+',
                                        name: 'EGFR'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1519086344,
                                        chromEnd: 1519091710,
                                        strand: '+',
                                        name: 'MYC'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1541473997,
                                        chromEnd: 1541617095,
                                        strand: '+',
                                        name: 'JAK2'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1558456663,
                                        chromEnd: 1558483403,
                                        strand: '-',
                                        name: 'CDKN2A'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1719253781,
                                        chromEnd: 1719268726,
                                        strand: '-',
                                        name: 'CXCL12'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1762747066,
                                        chromEnd: 1762855559,
                                        strand: '+',
                                        name: 'PTEN'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1836335945,
                                        chromEnd: 1836403109,
                                        strand: '-',
                                        name: 'BDNF'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1855400216,
                                        chromEnd: 1855420559,
                                        strand: '+',
                                        name: 'F2'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1763874187,
                                        chromEnd: 1763900690,
                                        strand: '+',
                                        name: 'FAS'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1991609209,
                                        chromEnd: 1991672704,
                                        strand: '-',
                                        name: 'VDR'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 2011922442,
                                        chromEnd: 2011927414,
                                        strand: '-',
                                        name: 'IFNG'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 2012575844,
                                        chromEnd: 2012613217,
                                        strand: '+',
                                        name: 'MDM2'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 2046163539,
                                        chromEnd: 2046248318,
                                        strand: '-',
                                        name: 'IGF1'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1091140793,
                                        chromEnd: 1091144208,
                                        strand: '+',
                                        name: 'HLA-A'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1092552189,
                                        chromEnd: 1092555569,
                                        strand: '-',
                                        name: 'HLA-B'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1092773890,
                                        chromEnd: 1092776659,
                                        strand: '+',
                                        name: 'TNF'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1093777093,
                                        chromEnd: 1093788160,
                                        strand: '-',
                                        name: 'HLA-DRB1'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1093857787,
                                        chromEnd: 1093865013,
                                        strand: '-',
                                        name: 'HLA-DQB1'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1097226000,
                                        chromEnd: 1097309560,
                                        strand: '+',
                                        name: 'MAPK14'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1097874783,
                                        chromEnd: 1097885663,
                                        strand: '+',
                                        name: 'CDKN1A'
                                    },
                                    {
                                        c: '1',
                                        chromStart: 1104968532,
                                        chromEnd: 1104984810,
                                        strand: '+',
                                        name: 'VEGFA'
                                    }
                                ],
                                // chromosomeField: 'c',
                                genomicFields: ['chromStart', 'chromEnd']
                            },
                            text: { field: 'name', type: 'nominal' },
                            color: { value: 'grey' },
                            size: { value: 12 },
                            style: { dy: 20 },
                            visibility: [
                                {
                                    target: 'track',
                                    measure: 'height',
                                    threshold: 60,
                                    operation: 'GTET'
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
                    width: 400,
                    height: 25
                }
            ]
        }
    ]
};

export const EX_SPEC_RESPONSIVE_COMPARATIVE_VIEWS: GoslingSpec = {
    responsiveSize: { width: true, height: false },
    arrangement: 'horizontal',
    linkingId: '1',
    responsiveSpec: [
        {
            spec: { arrangement: 'vertical' },
            selectivity: [
                {
                    measure: 'width',
                    threshold: 1200,
                    operation: 'LT'
                }
            ]
        }
    ],
    views: [
        {
            xDomain: { chromosome: 'chr12', interval: [5000000, 15000000] },
            tracks: [
                {
                    id: 'left',
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1'],
                        binSize: 8
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { value: '#2270B5' },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0.5 },
                    width: 600,
                    height: 130
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr9', interval: [5000000, 15000000] },
            tracks: [
                {
                    id: 'middle',
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1'],
                        binSize: 8
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { value: '#FC8D3D' },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0.5 },
                    width: 600,
                    height: 130
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr12', interval: [5000000, 15000000] },
            tracks: [
                {
                    id: 'right',
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1'],
                        binSize: 8
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { value: 'darkyellow' },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0.5 },
                    width: 600,
                    height: 130
                }
            ]
        }
    ]
};
