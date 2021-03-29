import { GoslingSpec } from '../../core/gosling.schema';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_MATRIX_HFFC6: GoslingSpec = {
    title: 'Matrix Visualization',
    subtitle: 'Comparison of Micro-C and Hi-C for HFFc6 Cells',
    arrangement: 'horizontal',
    xDomain: { chromosome: '7', interval: [77700000, 81000000] },
    views: [
        {
            spacing: 0,
            xLinkingId: 'all',
            arrangement: 'vertical',
            views: [
                {
                    tracks: [
                        {
                            data: {
                                url: 'https://resgen.io/api/v1/tileset_info/?d=WM8eKgR3RPG0jRdDTMWAHg',
                                type: 'vector',
                                column: 'position',
                                value: 'peak'
                            },
                            title: 'HFFc6_H3K4me3',
                            mark: 'bar',
                            x: { field: 'position', type: 'genomic', axis: 'none' },
                            y: { field: 'peak', type: 'quantitative' },
                            color: { value: 'darkgreen' },
                            style: { outline: 'gray' },
                            width: 570,
                            height: 40
                        },
                        {
                            data: {
                                url: 'https://resgen.io/api/v1/tileset_info/?d=YFasREHBTl-50_Cb3X_Wgw',
                                type: 'vector',
                                column: 'position',
                                value: 'peak'
                            },
                            title: 'HFFc6_ATAC',
                            mark: 'bar',
                            x: { field: 'position', type: 'genomic' },
                            y: { field: 'peak', type: 'quantitative' },
                            color: { value: 'purple' },
                            style: { outline: 'gray' },
                            width: 570,
                            height: 40
                        },
                        {
                            alignment: 'overlay',
                            tracks: [
                                {
                                    data: {
                                        url: 'https://resgen.io/api/v1/tileset_info/?d=LT6rIjDoQk-i3wSZWYgESQ',
                                        type: 'vector',
                                        column: 'position',
                                        value: 'peak'
                                    },
                                    mark: 'bar',
                                    x: { field: 'position', type: 'genomic' },
                                    y: { field: 'peak', type: 'quantitative' },
                                    color: { value: 'blue' }
                                },
                                {
                                    data: {
                                        url: 'https://higlass.io/api/v1/tileset_info/?d=EkPGY0iFQx6Nq6vdF8CpWA',
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
                                    dataTransform: { filter: [{ field: 'strand', oneOf: ['+'] }] },
                                    mark: 'triangleRight',
                                    x: { field: 'start', type: 'genomic' },
                                    size: { value: 10 },
                                    stroke: { value: 'white' },
                                    strokeWidth: { value: 1 },
                                    row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                    color: { value: 'red' }
                                },
                                {
                                    title: 'HFFC6_CTCF',
                                    data: {
                                        url: 'https://higlass.io/api/v1/tileset_info/?d=EkPGY0iFQx6Nq6vdF8CpWA',
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
                                    dataTransform: { filter: [{ field: 'strand', oneOf: ['-'] }] },
                                    mark: 'triangleLeft',
                                    x: { field: 'start', type: 'genomic' },
                                    stroke: { value: 'white' },
                                    strokeWidth: { value: 1 },
                                    size: { value: 10 },
                                    row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                    color: { value: 'green' }
                                }
                            ],
                            style: { outline: 'gray' },
                            width: 570,
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
                            mark: 'rect',
                            x: { field: 'position1', type: 'genomic', axis: 'top' },
                            y: { field: 'position2', type: 'genomic', axis: 'right' },
                            color: { field: 'value', type: 'quantitative', range: 'warm' },
                            width: 600,
                            height: 570
                        }
                    ]
                },
                {
                    tracks: [
                        {
                            title: 'Epilogos (hg38)',
                            data: {
                                url: 'https://higlass.io/api/v1/tileset_info/?d=WtBJUYawQzS9M2WVIIHnlA',
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
                            dataTransform: { filter: [{ field: 'value', inRange: [0, 999999] }] },
                            mark: 'bar',
                            x: { field: 'start', type: 'genomic', axis: 'none' },
                            xe: { field: 'end', type: 'genomic' },
                            y: { field: 'value', type: 'quantitative' },
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
                                    '#FFFFFF'
                                ]
                            },
                            strokeWidth: { value: 0.5 },
                            style: { outline: 'gray' },
                            width: 570,
                            height: 40
                        }
                    ]
                }
            ]
        },
        {
            arrangement: 'vertical',
            spacing: 0,
            xLinkingId: 'all',
            views: [
                {
                    tracks: [
                        {
                            data: {
                                url: 'https://resgen.io/api/v1/tileset_info/?d=WM8eKgR3RPG0jRdDTMWAHg',
                                type: 'vector',
                                column: 'position',
                                value: 'peak'
                            },
                            title: 'HFFc6_H3K4me3',
                            mark: 'bar',
                            x: { field: 'position', type: 'genomic', axis: 'none' },
                            y: { field: 'peak', type: 'quantitative' },
                            color: { value: 'darkgreen' },
                            style: { outline: 'gray' },
                            width: 570,
                            height: 40
                        },
                        {
                            data: {
                                url: 'https://resgen.io/api/v1/tileset_info/?d=YFasREHBTl-50_Cb3X_Wgw',
                                type: 'vector',
                                column: 'position',
                                value: 'peak'
                            },
                            title: 'HFFc6_ATAC',
                            mark: 'bar',
                            x: { field: 'position', type: 'genomic' },
                            y: { field: 'peak', type: 'quantitative' },
                            color: { value: 'purple' },
                            style: { outline: 'gray' },
                            width: 570,
                            height: 40
                        },
                        {
                            alignment: 'overlay',
                            tracks: [
                                {
                                    data: {
                                        url: 'https://resgen.io/api/v1/tileset_info/?d=LT6rIjDoQk-i3wSZWYgESQ',
                                        type: 'vector',
                                        column: 'position',
                                        value: 'peak'
                                    },
                                    mark: 'bar',
                                    x: { field: 'position', type: 'genomic' },
                                    y: { field: 'peak', type: 'quantitative' },
                                    color: { value: 'blue' }
                                },
                                {
                                    data: {
                                        url: 'https://higlass.io/api/v1/tileset_info/?d=EkPGY0iFQx6Nq6vdF8CpWA',
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
                                    dataTransform: { filter: [{ field: 'strand', oneOf: ['+'] }] },
                                    mark: 'triangleRight',
                                    x: { field: 'start', type: 'genomic' },
                                    size: { value: 10 },
                                    stroke: { value: 'white' },
                                    strokeWidth: { value: 1 },
                                    row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                    color: { value: 'red' }
                                },
                                {
                                    title: 'HFFC6_CTCF',
                                    data: {
                                        url: 'https://higlass.io/api/v1/tileset_info/?d=EkPGY0iFQx6Nq6vdF8CpWA',
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
                                    dataTransform: { filter: [{ field: 'strand', oneOf: ['-'] }] },
                                    mark: 'triangleLeft',
                                    x: { field: 'start', type: 'genomic' },
                                    stroke: { value: 'white' },
                                    strokeWidth: { value: 1 },
                                    size: { value: 10 },
                                    row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                                    color: { value: 'green' }
                                }
                            ],
                            style: { outline: 'gray' },
                            width: 570,
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
                            mark: 'rect',
                            x: { field: 'position1', type: 'genomic', axis: 'top' },
                            y: { field: 'position2', type: 'genomic', axis: 'right' },
                            color: { field: 'value', type: 'quantitative', range: 'warm' },
                            width: 600,
                            height: 570
                        }
                    ]
                },
                {
                    tracks: [
                        {
                            title: 'Epilogos (hg38)',
                            data: {
                                url: 'https://higlass.io/api/v1/tileset_info/?d=WtBJUYawQzS9M2WVIIHnlA',
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
                            dataTransform: { filter: [{ field: 'value', inRange: [0, 999999] }] },
                            mark: 'bar',
                            x: { field: 'start', type: 'genomic', axis: 'none' },
                            xe: { field: 'end', type: 'genomic' },
                            y: { field: 'value', type: 'quantitative' },
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
                                    '#FFFFFF'
                                ]
                            },
                            strokeWidth: { value: 0.5 },
                            style: { outline: 'gray' },
                            width: 570,
                            height: 40
                        }
                    ]
                }
            ]
        }
    ]
};
