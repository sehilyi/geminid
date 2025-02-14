import React, { useState, useEffect } from 'react';
import { PixiManager } from '@pixi-manager';
import {
    addDummyTrack,
    addTextTrack,
    addCircularBrush,
    addGoslingTrack,
    addAxisTrack,
    addLinearBrush,
    addBigwig,
    addHeatmap,
    addLeftAxisTrack,
    addGoslingVertical
} from './examples';
import { compile } from '../src/compiler/compile';
import { getTheme } from '../src/core/utils/theme';

import './App.css';
import { GoslingComponent } from './GoslingComponent';

function App() {
    const [fps, setFps] = useState(120);
    return (
        <>
            <h1>HiGlass/Gosling tracks with new renderer</h1>

            <div className="card">
                <GoslingComponent spec={fullMatrix} width={2000} height={1500} />
            </div>
        </>
    );
}

export default App;

const fullMatrix = {
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
                    linkingId: 'y-link',
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
                                    y: {
                                        field: 'peak',
                                        type: 'quantitative',
                                        axis: 'none'
                                    },
                                    color: { value: '#0072B2' }
                                },
                                {
                                    style: { backgroundOpacity: 0 },
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
                                        ]
                                    },
                                    dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['+'] }],
                                    mark: 'triangleRight',
                                    x: { field: 'start', type: 'genomic' },
                                    size: { value: 13 },
                                    stroke: { value: 'white' },
                                    strokeWidth: { value: 1 },
                                    row: {
                                        field: 'strand',
                                        type: 'nominal',
                                        domain: ['+', '-']
                                    },
                                    color: { value: '#CB7AA7' }
                                },
                                {
                                    style: { backgroundOpacity: 0 },
                                    title: 'HFFC6_CTCF',
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
                                        ]
                                    },
                                    dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['-'] }],
                                    mark: 'triangleLeft',
                                    x: { field: 'start', type: 'genomic' },
                                    size: { value: 13 },
                                    stroke: { value: 'white' },
                                    strokeWidth: { value: 1 },
                                    row: {
                                        field: 'strand',
                                        type: 'nominal',
                                        domain: ['+', '-']
                                    },
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
                                    y: {
                                        field: 'peak',
                                        type: 'quantitative',
                                        axis: 'none'
                                    },
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
                                    y: {
                                        field: 'peak',
                                        type: 'quantitative',
                                        axis: 'none'
                                    },
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
                                            y: {
                                                field: 'peak',
                                                type: 'quantitative',
                                                axis: 'none'
                                            },
                                            color: { value: '#0072B2' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['+'] }],
                                            mark: 'triangleRight',
                                            x: { field: 'start', type: 'genomic' },
                                            size: { value: 13 },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            row: {
                                                field: 'strand',
                                                type: 'nominal',
                                                domain: ['+', '-']
                                            },
                                            color: { value: '#CB7AA7' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
                                            title: 'HFFC6_CTCF',
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['-'] }],
                                            mark: 'triangleLeft',
                                            x: { field: 'start', type: 'genomic' },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            size: { value: 13 },
                                            row: {
                                                field: 'strand',
                                                type: 'nominal',
                                                domain: ['+', '-']
                                            },
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
                                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=hffc6-microc-hg38',
                                        type: 'matrix'
                                    },
                                    mark: 'bar',
                                    x: { field: 'xs', type: 'genomic', axis: 'none' },
                                    xe: { field: 'xe', type: 'genomic', axis: 'none' },
                                    y: { field: 'ys', type: 'genomic', axis: 'none', linkingId: 'y-link' },
                                    ye: { field: 'ye', type: 'genomic', axis: 'none' },
                                    color: {
                                        field: 'value',
                                        type: 'quantitative',
                                        range: 'warm'
                                    },
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
                                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=epilogos-hg38',
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
                                    y: {
                                        field: 'value',
                                        type: 'quantitative',
                                        axis: 'none'
                                    },
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
                                    y: {
                                        field: 'peak',
                                        type: 'quantitative',
                                        axis: 'none'
                                    },
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
                                    y: {
                                        field: 'peak',
                                        type: 'quantitative',
                                        axis: 'none'
                                    },
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
                                            y: {
                                                field: 'peak',
                                                type: 'quantitative',
                                                axis: 'none'
                                            },
                                            color: { value: '#0072B2' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['+'] }],
                                            mark: 'triangleRight',
                                            x: { field: 'start', type: 'genomic' },
                                            size: { value: 13 },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            row: {
                                                field: 'strand',
                                                type: 'nominal',
                                                domain: ['+', '-']
                                            },
                                            color: { value: '#CB7AA7' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
                                            title: 'HFFC6_CTCF',
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['-'] }],
                                            mark: 'triangleLeft',
                                            x: { field: 'start', type: 'genomic' },
                                            size: { value: 13 },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            row: {
                                                field: 'strand',
                                                type: 'nominal',
                                                domain: ['+', '-']
                                            },
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
                                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=hffc6-hic-hg38',
                                        type: 'matrix'
                                    },
                                    mark: 'bar',
                                    x: { field: 'xs', type: 'genomic', axis: 'none' },
                                    xe: { field: 'xe', type: 'genomic', axis: 'none' },
                                    y: { field: 'ys', type: 'genomic', axis: 'none', linkingId: 'y-link' },
                                    ye: { field: 'ye', type: 'genomic', axis: 'none' },
                                    color: {
                                        field: 'value',
                                        type: 'quantitative',
                                        range: 'warm'
                                    },
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
                                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=epilogos-hg38',
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
                                    y: {
                                        field: 'value',
                                        type: 'quantitative',
                                        axis: 'none'
                                    },
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
                                    width: 600,
                                    height: 40
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    style: { outlineWidth: 0, background: '#F6F6F6' }
};
const doubleMatrix = {
    arrangement: 'horizontal',
    xDomain: { chromosome: 'chr7', interval: [77700000, 81000000] },
    spacing: 1,
    linkingId: 'all',
    views: [
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
                                            y: {
                                                field: 'peak',
                                                type: 'quantitative',
                                                axis: 'none'
                                            },
                                            color: { value: '#0072B2' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['+'] }],
                                            mark: 'triangleRight',
                                            x: { field: 'start', type: 'genomic' },
                                            size: { value: 13 },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            row: {
                                                field: 'strand',
                                                type: 'nominal',
                                                domain: ['+', '-']
                                            },
                                            color: { value: '#CB7AA7' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
                                            title: 'HFFC6_CTCF',
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['-'] }],
                                            mark: 'triangleLeft',
                                            x: { field: 'start', type: 'genomic' },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            size: { value: 13 },
                                            row: {
                                                field: 'strand',
                                                type: 'nominal',
                                                domain: ['+', '-']
                                            },
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
                                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=hffc6-microc-hg38',
                                        type: 'matrix'
                                    },
                                    mark: 'bar',
                                    x: { field: 'xs', type: 'genomic', axis: 'none' },
                                    xe: { field: 'xe', type: 'genomic', axis: 'none' },
                                    y: { field: 'ys', type: 'genomic', axis: 'none', linkingId: 'y-link' },
                                    ye: { field: 'ye', type: 'genomic', axis: 'none' },
                                    color: {
                                        field: 'value',
                                        type: 'quantitative',
                                        range: 'warm'
                                    },
                                    width: 600,
                                    height: 600
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
                                            y: {
                                                field: 'peak',
                                                type: 'quantitative',
                                                axis: 'none'
                                            },
                                            color: { value: '#0072B2' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['+'] }],
                                            mark: 'triangleRight',
                                            x: { field: 'start', type: 'genomic' },
                                            size: { value: 13 },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            row: {
                                                field: 'strand',
                                                type: 'nominal',
                                                domain: ['+', '-']
                                            },
                                            color: { value: '#CB7AA7' }
                                        },
                                        {
                                            style: { backgroundOpacity: 0 },
                                            title: 'HFFC6_CTCF',
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
                                                ]
                                            },
                                            dataTransform: [{ type: 'filter', field: 'strand', oneOf: ['-'] }],
                                            mark: 'triangleLeft',
                                            x: { field: 'start', type: 'genomic' },
                                            size: { value: 13 },
                                            stroke: { value: 'white' },
                                            strokeWidth: { value: 1 },
                                            row: {
                                                field: 'strand',
                                                type: 'nominal',
                                                domain: ['+', '-']
                                            },
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
                                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=hffc6-hic-hg38',
                                        type: 'matrix'
                                    },
                                    mark: 'bar',
                                    x: { field: 'xs', type: 'genomic', axis: 'none' },
                                    xe: { field: 'xe', type: 'genomic', axis: 'none' },
                                    y: { field: 'ys', type: 'genomic', axis: 'none', linkingId: 'y-link' },
                                    ye: { field: 'ye', type: 'genomic', axis: 'none' },
                                    color: {
                                        field: 'value',
                                        type: 'quantitative',
                                        range: 'warm'
                                    },
                                    width: 600,
                                    height: 600
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    style: { outlineWidth: 0, background: '#F6F6F6' }
};

const matrix2 = {
    xDomain: { chromosome: 'chr7', interval: [77700000, 81000000] },
    arrangement: 'serial',
    views: [
        {
            orientation: 'vertical',
            yOffset: 210,
            tracks: [
                {
                    layout: 'linear',
                    width: 180,
                    height: 600,
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1'],
                        binSize: 5
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic', axis: 'bottom', linkingId: 'test' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative', axis: 'right' },
                    size: { value: 5 }
                }
            ]
        },
        {
            tracks: [
                {
                    layout: 'linear',
                    width: 600,
                    height: 180,
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1'],
                        binSize: 5
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic', axis: 'bottom' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative', axis: 'right' },
                    size: { value: 5 }
                },
                {
                    title: 'HFFc6_Micro-C',
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=hffc6-microc-hg38',
                        type: 'matrix'
                    },
                    mark: 'bar',
                    x: { field: 'xs', type: 'genomic', axis: 'none' },
                    xe: { field: 'xe', type: 'genomic', axis: 'none' },
                    y: { field: 'ys', type: 'genomic', axis: 'none', linkingId: 'test' },
                    ye: { field: 'ye', type: 'genomic', axis: 'none' },
                    color: { field: 'value', type: 'quantitative', range: 'warm' },
                    width: 600,
                    height: 600
                }
            ]
        }
    ]
};

const matrix = {
    xDomain: { chromosome: 'chr7', interval: [77700000, 81000000] },
    tracks: [
        {
            title: 'HFFc6_Micro-C',
            data: {
                url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=hffc6-microc-hg38',
                type: 'matrix'
            },
            mark: 'bar',
            x: { field: 'xs', type: 'genomic', axis: 'top' },
            xe: { field: 'xe', type: 'genomic', axis: 'none' },
            y: { field: 'ys', type: 'genomic', axis: 'right' },
            ye: { field: 'ye', type: 'genomic', axis: 'none' },
            color: { field: 'value', type: 'quantitative', range: 'warm' },
            width: 600,
            height: 600
        }
    ]
};

const simple = {
    orientation: 'vertical',
    tracks: [
        {
            layout: 'linear',
            width: 800,
            height: 180,
            data: {
                url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                type: 'multivec',
                row: 'sample',
                column: 'position',
                value: 'peak',
                categories: ['sample 1'],
                binSize: 5
            },
            mark: 'bar',
            x: { field: 'start', type: 'genomic', axis: 'bottom' },
            xe: { field: 'end', type: 'genomic' },
            y: { field: 'peak', type: 'quantitative', axis: 'right' },
            size: { value: 5 }
        }
    ]
};

const spec = {
    title: 'Basic Marks: line',
    subtitle: 'Tutorial Examples',
    layout: 'linear',
    orientation: 'vertical',
    tracks: [
        {
            layout: 'circular',
            width: 500,
            height: 180,
            data: {
                url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                type: 'multivec',
                row: 'sample',
                column: 'position',
                value: 'peak',
                categories: ['sample 1']
            },
            mark: 'line',
            x: { field: 'position', type: 'genomic', axis: 'top' },
            y: { field: 'peak', type: 'quantitative', axis: 'right' },
            size: { value: 2 }
        },
        {
            layout: 'circular',
            width: 500,
            height: 180,
            data: {
                url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                type: 'multivec',
                row: 'sample',
                column: 'position',
                value: 'peak',
                categories: ['sample 1']
            },
            mark: 'bar',
            x: { field: 'position', type: 'genomic', axis: 'top' },
            y: { field: 'peak', type: 'quantitative', axis: 'right' },
            size: { value: 2 }
        }
    ]
};

const corces = {
    title: 'Single-cell Epigenomic Analysis',
    subtitle: 'Corces et al. 2020',
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
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
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
                    width: 400,
                    height: 25
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr3', interval: [52168000, 52890000] },
            linkingId: 'detail',
            x: { field: 'position', type: 'genomic' },
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
                    mark: 'bar',
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
                    mark: 'bar',
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
                    mark: 'bar',
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
                            x: { field: 'start', type: 'genomic' },
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
                    color: {
                        field: 'strand',
                        type: 'nominal',
                        domain: ['+', '-'],
                        range: ['#012DB8', '#BE1E2C']
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
                    width: 400,
                    height: 80
                },
                {
                    title: 'PLAC-seq (H3K4me3) Nott et al.',
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
                    overlayOnPreviousTrack: false,
                    width: 400,
                    height: 60
                },
                {
                    title: '',
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
                    title: '',
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
            ]
        }
    ]
};

const linkingTest = {
    title: 'Basic Marks: line',
    subtitle: 'Tutorial Examples',
    views: [
        {
            tracks: [
                {
                    layout: 'linear',
                    width: 800,
                    height: 100,
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1']
                    },
                    mark: 'line',
                    x: { field: 'position', type: 'genomic', axis: 'bottom', linkingId: 'test' },
                    y: { field: 'peak', type: 'quantitative', axis: 'right' },
                    size: { value: 2 }
                }
            ]
        },
        {
            linkingId: 'test',
            tracks: [
                {
                    layout: 'linear',
                    width: 800,
                    height: 100,
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1']
                    },
                    mark: 'line',
                    x: { field: 'position', type: 'genomic', axis: 'bottom' },
                    y: { field: 'peak', type: 'quantitative', axis: 'right' },
                    size: { value: 2 }
                }
            ]
        },
        {
            tracks: [
                {
                    layout: 'linear',
                    width: 800,
                    height: 100,
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1']
                    },
                    mark: 'line',
                    x: { field: 'position', type: 'genomic', axis: 'bottom' },
                    y: { field: 'peak', type: 'quantitative', axis: 'right' },
                    size: { value: 2 }
                },
                {
                    layout: 'linear',
                    width: 800,
                    height: 100,
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1']
                    },
                    mark: 'line',
                    x: { field: 'position', type: 'genomic', axis: 'bottom', linkingId: 'test' },
                    y: { field: 'peak', type: 'quantitative', axis: 'right' },
                    size: { value: 2 }
                }
            ]
        }
    ]
};

const doubleBrush = {
    arrangement: 'vertical',
    views: [
        {
            static: true,
            layout: 'circular',
            alignment: 'stack',
            tracks: [
                {
                    id: 'overview track',
                    alignment: 'overlay',
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                        binSize: 4
                    },
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal' },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 0.3 },
                    tracks: [
                        { mark: 'bar' },
                        {
                            mark: 'brush',
                            x: { linkingId: 'detail-1' },
                            color: { value: 'blue' }
                        },
                        {
                            mark: 'brush',
                            x: { linkingId: 'detail-2' },
                            color: { value: 'red' }
                        }
                    ],
                    style: { outlineWidth: 0 },
                    width: 500,
                    height: 100
                },
                {
                    data: {
                        type: 'csv',
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/rearrangements.bulk.1639.simple.filtered.pub',
                        headerNames: [
                            'chr1',
                            'p1s',
                            'p1e',
                            'chr2',
                            'p2s',
                            'p2e',
                            'type',
                            'id',
                            'f1',
                            'f2',
                            'f3',
                            'f4',
                            'f5',
                            'f6'
                        ],
                        separator: '\t',
                        genomicFieldsToConvert: [
                            { chromosomeField: 'chr1', genomicFields: ['p1s', 'p1e'] },
                            { chromosomeField: 'chr2', genomicFields: ['p2s', 'p2e'] }
                        ]
                    },
                    dataTransform: [
                        {
                            type: 'filter',
                            field: 'chr1',
                            oneOf: ['1', '16', '14', '9', '6', '5', '3']
                        },
                        {
                            type: 'filter',
                            field: 'chr2',
                            oneOf: ['1', '16', '14', '9', '6', '5', '3']
                        }
                    ],
                    mark: 'withinLink',
                    x: { field: 'p1s', type: 'genomic' },
                    xe: { field: 'p1e', type: 'genomic' },
                    x1: { field: 'p2s', type: 'genomic' },
                    x1e: { field: 'p2e', type: 'genomic' },
                    stroke: {
                        field: 'type',
                        type: 'nominal',
                        domain: ['deletion', 'inversion', 'translocation', 'tandem-duplication']
                    },
                    strokeWidth: { value: 0.8 },
                    opacity: { value: 0.15 },
                    width: 500,
                    height: 100
                }
            ]
        },
        {
            spacing: 10,
            arrangement: 'horizontal',
            views: [
                {
                    tracks: [
                        {
                            id: 'detail-1',
                            data: {
                                url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                                binSize: 4
                            },
                            mark: 'bar',
                            x: {
                                field: 'start',
                                type: 'genomic',
                                linkingId: 'detail-1',
                                domain: { chromosome: 'chr5' }
                            },
                            xe: { field: 'end', type: 'genomic' },
                            y: { field: 'peak', type: 'quantitative' },
                            row: { field: 'sample', type: 'nominal' },
                            color: { field: 'sample', type: 'nominal' },
                            stroke: { value: 'black' },
                            strokeWidth: { value: 0.3 },
                            style: { background: 'blue' },
                            width: 245,
                            height: 150
                        }
                    ]
                },
                {
                    tracks: [
                        {
                            id: 'detail-2',
                            data: {
                                url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                                binSize: 4
                            },
                            mark: 'bar',
                            x: {
                                field: 'start',
                                type: 'genomic',
                                domain: { chromosome: 'chr16' },
                                linkingId: 'detail-2'
                            },
                            xe: { field: 'end', type: 'genomic' },
                            y: { field: 'peak', type: 'quantitative' },
                            row: { field: 'sample', type: 'nominal' },
                            color: { field: 'sample', type: 'nominal', legend: true },
                            stroke: { value: 'black' },
                            strokeWidth: { value: 0.3 },
                            style: { background: 'red' },
                            width: 245,
                            height: 150
                        }
                    ]
                }
            ],
            style: { backgroundOpacity: 0.1 }
        }
    ]
};

const visualLinking = {
    title: 'Visual Linking',
    subtitle: 'Change the position and range of brushes to update the detail view on the bottom',
    arrangement: 'vertical',
    centerRadius: 0.4,
    views: [
        {
            spacing: 40,
            arrangement: 'horizontal',
            views: [
                {
                    spacing: 5,
                    static: true,
                    layout: 'circular',
                    xDomain: { chromosome: 'chr1' },
                    alignment: 'overlay',
                    tracks: [{ mark: 'bar' }, { mark: 'brush', x: { linkingId: 'detail' } }],
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 250,
                    height: 130
                },
                {
                    layout: 'linear',
                    xDomain: { chromosome: 'chr1' },
                    alignment: 'overlay',
                    tracks: [{ mark: 'bar' }, { mark: 'brush', x: { linkingId: 'detail' } }],
                    data: {
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 400,
                    height: 200
                }
            ]
        },
        {
            layout: 'linear',
            xDomain: { chromosome: 'chr1', interval: [160000000, 200000000] },
            linkingId: 'detail',
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
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 690,
                    height: 200
                }
            ]
        }
    ]
};

const test = {
    static: true,
    layout: 'linear',
    centerRadius: 0.2,
    arrangement: 'parallel',
    views: [
        {
            xDomain: { chromosome: 'chr1' },
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
                    mark: 'area',
                    x: { field: 'position', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 1000,
                    height: 30
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/cytogenetic_band.csv',
                        type: 'csv',
                        chromosomeField: 'Chr.',
                        genomicFields: ['ISCN_start', 'ISCN_stop', 'Basepair_start', 'Basepair_stop']
                    },
                    tracks: [
                        {
                            mark: 'text',
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            text: { field: 'Band', type: 'nominal' },
                            color: { value: 'black' },
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
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            color: {
                                field: 'Density',
                                type: 'nominal',
                                domain: ['', '25', '50', '75', '100'],
                                range: ['white', '#D9D9D9', '#979797', '#636363', 'black']
                            }
                        },
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gvar'] }],
                            color: { value: '#A0A0F2' }
                        },
                        {
                            mark: 'triangleRight',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1'] }],
                            color: { value: '#B40101' }
                        },
                        {
                            mark: 'triangleLeft',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-2'] }],
                            color: { value: '#B40101' }
                        }
                    ],
                    x: { field: 'Basepair_start', type: 'genomic' },
                    xe: { field: 'Basepair_stop', type: 'genomic' },
                    stroke: { value: 'gray' },
                    strokeWidth: { value: 0.5 },
                    width: 1000,
                    height: 20
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr2' },
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
                    mark: 'area',
                    x: { field: 'position', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 970,
                    height: 30
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/cytogenetic_band.csv',
                        type: 'csv',
                        chromosomeField: 'Chr.',
                        genomicFields: ['ISCN_start', 'ISCN_stop', 'Basepair_start', 'Basepair_stop']
                    },
                    tracks: [
                        {
                            mark: 'text',
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            text: { field: 'Band', type: 'nominal' },
                            color: { value: 'black' },
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
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            color: {
                                field: 'Density',
                                type: 'nominal',
                                domain: ['', '25', '50', '75', '100'],
                                range: ['white', '#D9D9D9', '#979797', '#636363', 'black']
                            }
                        },
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gvar'] }],
                            color: { value: '#A0A0F2' }
                        },
                        {
                            mark: 'triangleRight',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1'] }],
                            color: { value: '#B40101' }
                        },
                        {
                            mark: 'triangleLeft',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-2'] }],
                            color: { value: '#B40101' }
                        }
                    ],
                    x: { field: 'Basepair_start', type: 'genomic' },
                    xe: { field: 'Basepair_stop', type: 'genomic' },
                    stroke: { value: 'gray' },
                    strokeWidth: { value: 0.5 },
                    width: 970,
                    height: 20
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr3' },
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
                    mark: 'area',
                    x: { field: 'position', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 800,
                    height: 30
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/cytogenetic_band.csv',
                        type: 'csv',
                        chromosomeField: 'Chr.',
                        genomicFields: ['ISCN_start', 'ISCN_stop', 'Basepair_start', 'Basepair_stop']
                    },
                    tracks: [
                        {
                            mark: 'text',
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            text: { field: 'Band', type: 'nominal' },
                            color: { value: 'black' },
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
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            color: {
                                field: 'Density',
                                type: 'nominal',
                                domain: ['', '25', '50', '75', '100'],
                                range: ['white', '#D9D9D9', '#979797', '#636363', 'black']
                            }
                        },
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gvar'] }],
                            color: { value: '#A0A0F2' }
                        },
                        {
                            mark: 'triangleRight',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1'] }],
                            color: { value: '#B40101' }
                        },
                        {
                            mark: 'triangleLeft',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-2'] }],
                            color: { value: '#B40101' }
                        }
                    ],
                    x: { field: 'Basepair_start', type: 'genomic' },
                    xe: { field: 'Basepair_stop', type: 'genomic' },
                    stroke: { value: 'gray' },
                    strokeWidth: { value: 0.5 },
                    width: 800,
                    height: 20
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr4' },
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
                    mark: 'area',
                    x: { field: 'position', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 770,
                    height: 30
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/cytogenetic_band.csv',
                        type: 'csv',
                        chromosomeField: 'Chr.',
                        genomicFields: ['ISCN_start', 'ISCN_stop', 'Basepair_start', 'Basepair_stop']
                    },
                    tracks: [
                        {
                            mark: 'text',
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            text: { field: 'Band', type: 'nominal' },
                            color: { value: 'black' },
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
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            color: {
                                field: 'Density',
                                type: 'nominal',
                                domain: ['', '25', '50', '75', '100'],
                                range: ['white', '#D9D9D9', '#979797', '#636363', 'black']
                            }
                        },
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gvar'] }],
                            color: { value: '#A0A0F2' }
                        },
                        {
                            mark: 'triangleRight',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1'] }],
                            color: { value: '#B40101' }
                        },
                        {
                            mark: 'triangleLeft',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-2'] }],
                            color: { value: '#B40101' }
                        }
                    ],
                    x: { field: 'Basepair_start', type: 'genomic' },
                    xe: { field: 'Basepair_stop', type: 'genomic' },
                    stroke: { value: 'gray' },
                    strokeWidth: { value: 0.5 },
                    width: 770,
                    height: 20
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr5' },
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
                    mark: 'area',
                    x: { field: 'position', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 740,
                    height: 30
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/cytogenetic_band.csv',
                        type: 'csv',
                        chromosomeField: 'Chr.',
                        genomicFields: ['ISCN_start', 'ISCN_stop', 'Basepair_start', 'Basepair_stop']
                    },
                    tracks: [
                        {
                            mark: 'text',
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            text: { field: 'Band', type: 'nominal' },
                            color: { value: 'black' },
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
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            color: {
                                field: 'Density',
                                type: 'nominal',
                                domain: ['', '25', '50', '75', '100'],
                                range: ['white', '#D9D9D9', '#979797', '#636363', 'black']
                            }
                        },
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gvar'] }],
                            color: { value: '#A0A0F2' }
                        },
                        {
                            mark: 'triangleRight',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1'] }],
                            color: { value: '#B40101' }
                        },
                        {
                            mark: 'triangleLeft',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-2'] }],
                            color: { value: '#B40101' }
                        }
                    ],
                    x: { field: 'Basepair_start', type: 'genomic' },
                    xe: { field: 'Basepair_stop', type: 'genomic' },
                    stroke: { value: 'gray' },
                    strokeWidth: { value: 0.5 },
                    width: 740,
                    height: 20
                }
            ]
        }
    ]
};

const MSA = {
    description: 'reference: https://dash.plotly.com/dash-bio/alignmentchart',
    zoomLimits: [1, 396],
    xDomain: { interval: [350, 396] },
    assembly: 'unknown',
    style: { outline: 'lightgray' },
    views: [
        {
            linkingId: '-',
            spacing: 30,
            tracks: [
                {
                    title: 'Gap',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.gap.csv',
                        type: 'csv',
                        genomicFields: ['pos'],
                        sampleLength: 99999
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic', axis: 'none' },
                    xe: { field: 'end', type: 'genomic', axis: 'none' },
                    y: { field: 'gap', type: 'quantitative', axis: 'right' },
                    color: { value: 'gray' },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0 },
                    width: 800,
                    height: 100
                },
                {
                    title: 'Conservation',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.conservation.csv',
                        type: 'csv',
                        genomicFields: ['pos'],
                        sampleLength: 99999
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic', axis: 'none' },
                    xe: { field: 'end', type: 'genomic', axis: 'none' },
                    y: {
                        field: 'conservation',
                        type: 'quantitative',
                        axis: 'right'
                    },
                    color: { field: 'conservation', type: 'quantitative' },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0 },
                    width: 800,
                    height: 150
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.fasta.csv',
                        type: 'csv',
                        genomicFields: ['pos'],
                        sampleLength: 99999
                    },
                    tracks: [
                        { mark: 'rect' },
                        {
                            mark: 'text',
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            color: { value: 'black' },
                            size: { value: 12 },
                            visibility: [
                                {
                                    measure: 'zoomLevel',
                                    target: 'track',
                                    threshold: 10,
                                    operation: 'LT',
                                    transitionPadding: 100
                                }
                            ]
                        }
                    ],
                    x: { field: 'pos', type: 'genomic', axis: 'bottom' },
                    row: { field: 'name', type: 'nominal', legend: true },
                    color: {
                        field: 'base',
                        type: 'nominal',
                        range: [
                            '#d60000',
                            '#018700',
                            '#b500ff',
                            '#05acc6',
                            '#97ff00',
                            '#ffa52f',
                            '#ff8ec8',
                            '#79525e',
                            '#00fdcf',
                            '#afa5ff',
                            '#93ac83',
                            '#9a6900',
                            '#366962',
                            '#d3008c',
                            '#fdf490',
                            '#c86e66',
                            '#9ee2ff',
                            '#00c846',
                            '#a877ac',
                            '#b8ba01'
                        ],
                        legend: true
                    },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0 },
                    text: { field: 'base', type: 'nominal' },
                    width: 800,
                    height: 500
                }
            ]
        },
        {
            static: true,
            xDomain: { interval: [0, 396] },
            alignment: 'overlay',
            tracks: [
                {
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.fasta.csv',
                        type: 'csv',
                        genomicFields: ['pos'],
                        sampleLength: 99999
                    },
                    mark: 'rect',
                    x: { field: 'pos', type: 'genomic', axis: 'none' },
                    row: { field: 'name', type: 'nominal', legend: false },
                    color: {
                        field: 'base',
                        type: 'nominal',
                        range: [
                            '#d60000',
                            '#018700',
                            '#b500ff',
                            '#05acc6',
                            '#97ff00',
                            '#ffa52f',
                            '#ff8ec8',
                            '#79525e',
                            '#00fdcf',
                            '#afa5ff',
                            '#93ac83',
                            '#9a6900',
                            '#366962',
                            '#d3008c',
                            '#fdf490',
                            '#c86e66',
                            '#9ee2ff',
                            '#00c846',
                            '#a877ac',
                            '#b8ba01'
                        ],
                        legend: false
                    },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0 },
                    text: { field: 'base', type: 'nominal' },
                    width: 800,
                    height: 150
                },
                {
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.conservation.csv',
                        type: 'csv',
                        genomicFields: ['pos'],
                        sampleLength: 99999
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic', axis: 'none' },
                    xe: { field: 'end', type: 'genomic', axis: 'none' },
                    y: {
                        field: 'conservation',
                        type: 'quantitative',
                        axis: 'none'
                    },
                    color: { field: 'conservation', type: 'quantitative' },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0 },
                    width: 800,
                    height: 150
                },
                {
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.gap.csv',
                        type: 'csv',
                        genomicFields: ['pos'],
                        sampleLength: 99999
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic', axis: 'none' },
                    xe: { field: 'end', type: 'genomic', axis: 'none' },
                    y: { field: 'gap', type: 'quantitative', axis: 'none' },
                    color: { value: 'gray' },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 0 },
                    width: 800,
                    height: 150
                },
                {
                    mark: 'brush',
                    x: { linkingId: '-' },
                    color: { value: 'black' },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 1 },
                    opacity: { value: 0.3 }
                }
            ],
            width: 800,
            height: 150
        }
    ]
};

const cancer_simplify = {
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
                            tracks: [{ mark: 'rect' }],
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
                }
            ]
        }
    ]
};

const cancer = {
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
                                range: ['#97A8B2', '#D4C6BA']
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
                    static: false,
                    layout: 'linear',
                    centerRadius: 0.05,
                    xDomain: { chromosome: 'chr1', interval: [205000, 207000] },
                    spacing: 0.01,
                    tracks: [
                        {
                            alignment: 'overlay',
                            title: 'example_higlass.bam',
                            data: {
                                type: 'bam',
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam',
                                indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam.bai',
                                loadMates: true
                            },
                            mark: 'bar',
                            tracks: [
                                {
                                    dataTransform: [
                                        {
                                            type: 'coverage',
                                            startField: 'start',
                                            endField: 'end'
                                        }
                                    ],
                                    x: { field: 'start', type: 'genomic' },
                                    xe: { field: 'end', type: 'genomic' },
                                    y: {
                                        field: 'coverage',
                                        type: 'quantitative',
                                        axis: 'right'
                                    },
                                    color: { value: '#C6C6C6' }
                                }
                            ],
                            style: { outlineWidth: 0.5 },
                            width: 450,
                            height: 80
                        },
                        {
                            alignment: 'overlay',
                            title: 'example_higlass.bam',
                            data: {
                                type: 'bam',
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam',
                                indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam.bai',
                                loadMates: true,
                                maxInsertSize: 300
                            },
                            mark: 'rect',
                            tracks: [
                                {
                                    dataTransform: [
                                        {
                                            type: 'displace',
                                            method: 'pile',
                                            boundingBox: {
                                                startField: 'start',
                                                endField: 'end',
                                                padding: 5,
                                                isPaddingBP: true
                                            },
                                            newField: 'pileup-row'
                                        }
                                    ],
                                    x: { field: 'start', type: 'genomic' },
                                    xe: { field: 'end', type: 'genomic' },
                                    color: {
                                        field: 'svType',
                                        type: 'nominal',
                                        legend: true,
                                        domain: [
                                            'normal read',
                                            'deletion (+-)',
                                            'inversion (++)',
                                            'inversion (--)',
                                            'duplication (-+)',
                                            'more than two mates',
                                            'mates not found within chromosome',
                                            'clipping'
                                        ],
                                        range: [
                                            '#C8C8C8',
                                            '#E79F00',
                                            '#029F73',
                                            '#0072B2',
                                            '#CB7AA7',
                                            '#57B4E9',
                                            '#D61E2E',
                                            '#414141'
                                        ]
                                    }
                                },
                                {
                                    dataTransform: [
                                        {
                                            type: 'displace',
                                            method: 'pile',
                                            boundingBox: {
                                                startField: 'start',
                                                endField: 'end',
                                                padding: 5,
                                                isPaddingBP: true
                                            },
                                            newField: 'pileup-row'
                                        },
                                        {
                                            type: 'subjson',
                                            field: 'substitutions',
                                            genomicField: 'pos',
                                            baseGenomicField: 'start',
                                            genomicLengthField: 'length'
                                        },
                                        { type: 'filter', field: 'type', oneOf: ['S', 'H'] }
                                    ],
                                    x: { field: 'pos_start', type: 'genomic' },
                                    xe: { field: 'pos_end', type: 'genomic' },
                                    color: { value: '#414141' }
                                }
                            ],
                            tooltip: [
                                { field: 'start', type: 'genomic' },
                                { field: 'end', type: 'genomic' },
                                { field: 'insertSize', type: 'quantitative' },
                                { field: 'svType', type: 'nominal' },
                                { field: 'strand', type: 'nominal' },
                                { field: 'numMates', type: 'quantitative' },
                                { field: 'mateIds', type: 'nominal' }
                            ],
                            row: { field: 'pileup-row', type: 'nominal', padding: 0.2 },
                            style: {
                                outlineWidth: 0.5,
                                legendTitle: 'Insert Size = 300bp'
                            },
                            width: 450,
                            height: 310
                        }
                    ]
                },
                {
                    static: false,
                    layout: 'linear',
                    centerRadius: 0.05,
                    xDomain: { chromosome: 'chr1', interval: [490000, 496000] },
                    spacing: 0.01,
                    tracks: [
                        {
                            alignment: 'overlay',
                            title: 'example_higlass.bam',
                            data: {
                                type: 'bam',
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam',
                                indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam.bai',
                                loadMates: true
                            },
                            mark: 'bar',
                            tracks: [
                                {
                                    dataTransform: [
                                        {
                                            type: 'coverage',
                                            startField: 'start',
                                            endField: 'end'
                                        }
                                    ],
                                    x: { field: 'start', type: 'genomic' },
                                    xe: { field: 'end', type: 'genomic' },
                                    y: {
                                        field: 'coverage',
                                        type: 'quantitative',
                                        axis: 'right'
                                    },
                                    color: { value: '#C6C6C6' }
                                }
                            ],
                            style: { outlineWidth: 0.5 },
                            width: 450,
                            height: 80
                        },
                        {
                            alignment: 'overlay',
                            title: 'example_higlass.bam',
                            data: {
                                type: 'bam',
                                url: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam',
                                indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam.bai',
                                loadMates: true,
                                maxInsertSize: 300
                            },
                            mark: 'rect',
                            tracks: [
                                {
                                    dataTransform: [
                                        {
                                            type: 'displace',
                                            method: 'pile',
                                            boundingBox: {
                                                startField: 'start',
                                                endField: 'end',
                                                padding: 5,
                                                isPaddingBP: true
                                            },
                                            newField: 'pileup-row'
                                        }
                                    ],
                                    x: { field: 'start', type: 'genomic' },
                                    xe: { field: 'end', type: 'genomic' },
                                    color: {
                                        field: 'svType',
                                        type: 'nominal',
                                        legend: true,
                                        domain: [
                                            'normal read',
                                            'deletion (+-)',
                                            'inversion (++)',
                                            'inversion (--)',
                                            'duplication (-+)',
                                            'more than two mates',
                                            'mates not found within chromosome',
                                            'clipping'
                                        ],
                                        range: [
                                            '#C8C8C8',
                                            '#E79F00',
                                            '#029F73',
                                            '#0072B2',
                                            '#CB7AA7',
                                            '#57B4E9',
                                            '#D61E2E',
                                            '#414141'
                                        ]
                                    }
                                },
                                {
                                    dataTransform: [
                                        {
                                            type: 'displace',
                                            method: 'pile',
                                            boundingBox: {
                                                startField: 'start',
                                                endField: 'end',
                                                padding: 5,
                                                isPaddingBP: true
                                            },
                                            newField: 'pileup-row'
                                        },
                                        {
                                            type: 'subjson',
                                            field: 'substitutions',
                                            genomicField: 'pos',
                                            baseGenomicField: 'start',
                                            genomicLengthField: 'length'
                                        },
                                        { type: 'filter', field: 'type', oneOf: ['S', 'H'] }
                                    ],
                                    x: { field: 'pos_start', type: 'genomic' },
                                    xe: { field: 'pos_end', type: 'genomic' },
                                    color: { value: '#414141' }
                                }
                            ],
                            tooltip: [
                                { field: 'start', type: 'genomic' },
                                { field: 'end', type: 'genomic' },
                                { field: 'insertSize', type: 'quantitative' },
                                { field: 'svType', type: 'nominal' },
                                { field: 'strand', type: 'nominal' },
                                { field: 'numMates', type: 'quantitative' },
                                { field: 'mateIds', type: 'nominal' }
                            ],
                            row: { field: 'pileup-row', type: 'nominal', padding: 0.2 },
                            style: {
                                outlineWidth: 0.5,
                                legendTitle: 'Insert Size = 300bp'
                            },
                            width: 450,
                            height: 310
                        }
                    ]
                }
            ]
        }
    ]
};
