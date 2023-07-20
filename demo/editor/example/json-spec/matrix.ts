import type { PredefinedColors, SingleTrack } from '@gosling.schema';
import type { GoslingSpec } from 'gosling.js';
import { random } from 'lodash-es';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

const generateToyJson = (length: number, chr: string, size: number) =>
    Array.from({ length }, () => {
        return {
            c: chr,
            x: random(true) * size,
            xe: random(true) * size,
            y: random(true) * size,
            ye: random(true) * size,
            v: random(true)
        };
    });

export const EX_SPEC_MATRIX: GoslingSpec = {
    title: 'Hi-C Matrix',
    subtitle: 'Visualize Hi-C Data Using Matrix and Annotations',
    xDomain: { interval: [800000000, 1800000000] },
    views: [
        {
            alignment: 'overlay',
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.matrix,
                        type: 'matrix'
                    },
                    mark: 'bar',
                    x: { field: 'xs', type: 'genomic', axis: 'top' },
                    xe: { field: 'xe', type: 'genomic', axis: 'none' },
                    y: { field: 'ys', type: 'genomic', axis: 'left' },
                    ye: { field: 'ye', type: 'genomic' },
                    color: {
                        field: 'value',
                        type: 'quantitative',
                        range: 'grey',
                        legend: true
                    },
                    style: { background: 'lightgray' }
                },
                {
                    data: {
                        type: 'json',
                        values: [
                            { c: 'chr2', p: 100000 },
                            { c: 'chr5', p: 100000 },
                            { c: 'chr10', p: 100000 }
                        ],
                        chromosomeField: 'c',
                        genomicFields: ['p']
                    },
                    mark: 'rule',
                    x: { field: 'p', type: 'genomic', axis: 'none' },
                    strokeWidth: { value: 2 },
                    color: { value: 'red' }
                },
                {
                    data: {
                        type: 'json',
                        values: [
                            { c: 'chr2', p: 100000 },
                            { c: 'chr5', p: 100000 },
                            { c: 'chr10', p: 100000 }
                        ],
                        chromosomeField: 'c',
                        genomicFields: ['p']
                    },
                    mark: 'rule',
                    y: { field: 'p', type: 'genomic' },
                    strokeWidth: { value: 2 },
                    color: { value: 'blue' }
                },
                {
                    data: {
                        type: 'json',
                        values: [
                            { c: 'chr6', x: 0, xe: 170805979, y: 0, ye: 170805979, v: 1 },
                            { c: 'chr7', x: 0, xe: 159345973, y: 0, ye: 159345973, v: 100 },
                            { c: 'chr8', x: 0, xe: 145138636, y: 0, ye: 145138636, v: 21 }
                        ],
                        chromosomeField: 'c',
                        genomicFields: ['x', 'xe', 'y', 'ye']
                    },
                    mark: 'bar',
                    x: { field: 'x', type: 'genomic' },
                    xe: { field: 'xe', type: 'genomic' },
                    y: { field: 'y', type: 'genomic' },
                    ye: { field: 'ye', type: 'genomic' },
                    stroke: { field: 'c', type: 'nominal' },
                    strokeWidth: { value: 4 },
                    color: { field: 'v', type: 'quantitative' },
                    opacity: { value: 0.5 }
                },
                {
                    data: {
                        type: 'json',
                        values: [
                            ...generateToyJson(100, 'chr6', 170805979),
                            ...generateToyJson(100, 'chr7', 159345973),
                            ...generateToyJson(100, 'chr8', 145138636)
                        ],
                        chromosomeField: 'c',
                        genomicFields: ['x', 'xe', 'y', 'ye']
                    },
                    mark: 'point',
                    x: { field: 'x', type: 'genomic' },
                    xe: { field: 'xe', type: 'genomic' },
                    y: { field: 'y', type: 'genomic' },
                    ye: { field: 'ye', type: 'genomic' },
                    size: { field: 'v', type: 'quantitative', range: [1, 4] },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 1 },
                    color: { value: 'steelblue' },
                    opacity: { value: 0.5 }
                }
            ],
            width: 600,
            height: 600,
            style: { dashed: [6, 3] }
        }
    ]
};

const getMatrix: (
    t: string,
    c: PredefinedColors,
    e: 'full' | 'upper-right' | 'lower-left',
    w: number,
    h: number
) => SingleTrack = (t, c, e, w, h) => {
    return {
        id: t,
        data: {
            url: t,
            type: 'matrix'
        },
        mark: 'bar',
        x: { field: 'xs', type: 'genomic', axis: 'top' },
        xe: { field: 'xe', type: 'genomic', axis: 'none' },
        y: { field: 'ys', type: 'genomic', axis: 'left' },
        ye: { field: 'ye', type: 'genomic' },
        color: {
            field: 'value',
            type: 'quantitative',
            range: c,
            legend: true
        },
        style: { matrixExtent: e },
        width: w,
        height: h
    };
};

export const EX_SPEC_RESPONSIVE_COMPARATIVE_MATRICES: GoslingSpec = {
    responsiveSize: { width: true },
    responsiveSpec: [
        {
            selectivity: [
                {
                    measure: 'width',
                    operation: 'GT',
                    threshold: 1000
                }
            ],
            spec: {
                views: [
                    {
                        tracks: [
                            getMatrix(
                                'https://higlass.io/api/v1/tileset_info/?d=CQMd6V_cRw6iCI_-Unl3PQ',
                                'grey',
                                'full',
                                400,
                                400
                            )
                        ]
                    },
                    {
                        tracks: [
                            getMatrix(
                                'https://higlass.io/api/v1/tileset_info/?d=ZCvntCKST0KUvQPGcCbJGA',
                                'pink',
                                'full',
                                400,
                                400
                            )
                        ]
                    }
                    // {
                    //     tracks: [
                    //         getMatrix(
                    //             'https://higlass.io/api/v1/tileset_info/?d=TdQ_Qc-dQemfpqO_rjHsQQ',
                    //             'grey',
                    //             'full',
                    //             400,
                    //             400
                    //         )
                    //     ]
                    // },
                    // {
                    //     tracks: [
                    //         getMatrix(
                    //             'https://higlass.io/api/v1/tileset_info/?d=QvdMEvccQuOxKTEjrVL3wA',
                    //             'pink',
                    //             'full',
                    //             400,
                    //             400
                    //         )
                    //     ]
                    // },
                    // {
                    //     tracks: [
                    //         getMatrix(
                    //             'https://higlass.io/api/v1/tileset_info/?d=EV1TR63uTHySVLH27sT_VQ',
                    //             'grey',
                    //             'full',
                    //             400,
                    //             400
                    //         )
                    //     ]
                    // },
                    // {
                    //     tracks: [
                    //         getMatrix(
                    //             'https://higlass.io/api/v1/tileset_info/?d=JO9CouMTS_WKLnlYBRcw8A',
                    //             'pink',
                    //             'full',
                    //             400,
                    //             400
                    //         )
                    //     ]
                    // }
                ]
            }
        }
        // {
        //     selectivity: [
        //         {
        //             measure: 'width',
        //             operation: 'LT',
        //             threshold: 601
        //         }
        //     ],
        //     spec: {
        //         arrangement: 'vertical'
        //     }
        // }
    ],
    linkingId: 'commonId',
    xDomain: { chromosome: 'chr10' },
    arrangement: 'horizontal',
    views: [
        {
            alignment: 'overlay',
            tracks: [
                getMatrix(
                    'https://higlass.io/api/v1/tileset_info/?d=CQMd6V_cRw6iCI_-Unl3PQ',
                    'grey',
                    'lower-left',
                    100,
                    100
                ),
                getMatrix(
                    'https://higlass.io/api/v1/tileset_info/?d=ZCvntCKST0KUvQPGcCbJGA',
                    'pink',
                    'upper-right',
                    100,
                    100
                )
            ],
            width: 400,
            height: 400
        }
        // {
        //     alignment: 'overlay',
        //     tracks: [
        //         getMatrix(
        //             'https://higlass.io/api/v1/tileset_info/?d=TdQ_Qc-dQemfpqO_rjHsQQ',
        //             'grey',
        //             'lower-left',
        //             100,
        //             100
        //         ),
        //         getMatrix(
        //             'https://higlass.io/api/v1/tileset_info/?d=QvdMEvccQuOxKTEjrVL3wA',
        //             'pink',
        //             'upper-right',
        //             100,
        //             100
        //         )
        //     ],
        //     width: 400,
        //     height: 400
        // },
        // {
        //     alignment: 'overlay',
        //     tracks: [
        //         getMatrix(
        //             'https://higlass.io/api/v1/tileset_info/?d=EV1TR63uTHySVLH27sT_VQ',
        //             'grey',
        //             'lower-left',
        //             100,
        //             100
        //         ),
        //         getMatrix(
        //             'https://higlass.io/api/v1/tileset_info/?d=JO9CouMTS_WKLnlYBRcw8A',
        //             'pink',
        //             'upper-right',
        //             100,
        //             100
        //         )
        //     ],
        //     width: 400,
        //     height: 400
        // }
    ]
};
