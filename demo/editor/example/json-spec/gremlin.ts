import type { GoslingSpec } from 'gosling.js';

export const EX_SPEC_GREMLIN: GoslingSpec = {
    title: "Gremlin (O'Brien et al. 2010)",
    style: { linkStyle: 'elliptical' },
    views: [
        {
            linkingId: 'view1',
            xDomain: { chromosome: 'chr5', interval: [0, 80000000] },
            tracks: [
                {
                    alignment: 'overlay',
                    title: 'Chromosome 5',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                        type: 'csv',
                        chromosomeField: 'Chromosome',
                        genomicFields: ['chromStart', 'chromEnd']
                    },
                    tracks: [
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen'], not: true }],
                            color: {
                                field: 'Stain',
                                type: 'nominal',
                                domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar'],
                                range: ['#C0C0C0', '#808080', '#404040', 'black', 'black', 'black']
                            },
                            size: { value: 20 }
                        },
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen'] }],
                            size: { value: 10 },
                            color: { value: '#B74780' }
                        },
                        {
                            mark: 'text',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gpos25', 'gpos50', 'gpos100'] }],
                            text: { field: 'Name', type: 'nominal' },
                            visibility: [
                                {
                                    operation: 'less-than',
                                    measure: 'width',
                                    threshold: '|xe-x|',
                                    transitionPadding: 10,
                                    target: 'mark'
                                }
                            ],
                            size: { value: 6 },
                            style: {
                                dy: 16,
                                outline: 'white'
                            }
                        },
                        {
                            mark: 'text',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gneg', 'gpos75', 'gvar'] }],
                            text: { field: 'Name', type: 'nominal' },
                            visibility: [
                                {
                                    operation: 'less-than',
                                    measure: 'width',
                                    threshold: '|xe-x|',
                                    transitionPadding: 10,
                                    target: 'mark'
                                }
                            ],
                            size: { value: 6 },
                            style: {
                                dy: -16,
                                outline: 'white'
                            }
                        },
                        {
                            mark: 'brush',
                            x: { linkingId: 'view2' },
                            strokeWidth: { value: 0 }
                        }
                    ],
                    x: {
                        field: 'chromStart',
                        type: 'genomic'
                    },
                    xe: { field: 'chromEnd', type: 'genomic' },
                    color: { value: 'black' },
                    stroke: { value: 'white' },
                    strokeWidth: { value: 1 },
                    style: { outline: 'white' },
                    width: 800,
                    height: 60
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/vigsterkr/circos/master/data/5/segdup.txt',
                        type: 'csv',
                        headerNames: ['id', 'chr', 'p1', 'p2'],
                        chromosomePrefix: 'hs',
                        chromosomeField: 'chr',
                        genomicFields: ['p1', 'p2'],
                        separator: ' ',
                        longToWideId: 'id',
                        sampleLength: 2000
                    },
                    dataTransform: [
                        { type: 'filter', field: 'chr', oneOf: ['hs5', 'hs4', 'hs6'] },
                        { type: 'filter', field: 'chr_2', oneOf: ['hs5', 'hs4', 'hs6'] }
                    ],
                    tracks: [
                        { mark: 'rect' },
                        {
                            mark: 'brush',
                            x: { linkingId: 'view2' },
                            strokeWidth: { value: 0 }
                        }
                    ],
                    x: {
                        field: 'p1',
                        type: 'genomic'
                    },
                    xe: { field: 'p2', type: 'genomic' },
                    row: {
                        field: 'chr_2',
                        type: 'nominal',
                        domain: ['hs5', 'hs4', 'hs6']
                    },
                    color: {
                        field: 'chr_2',
                        type: 'nominal',
                        domain: ['hs5', 'hs4', 'hs6'],
                        range: ['#62AAD7', '#D1A74F', '#6CB74C']
                    },
                    stroke: {
                        field: 'chr_2',
                        type: 'nominal',
                        domain: ['hs5', 'hs4', 'hs6'],
                        range: ['#62AAD7', '#D1A74F', '#6CB74C']
                    },
                    strokeWidth: { value: 2 },
                    opacity: { value: 0.4 },
                    style: { outline: 'black', outlineWidth: 1 },
                    width: 800,
                    height: 80
                },
                {
                    alignment: 'overlay',
                    data: {
                        url: 'https://raw.githubusercontent.com/vigsterkr/circos/master/data/5/segdup.txt',
                        type: 'csv',
                        headerNames: ['id', 'chr', 'p1', 'p2'],
                        chromosomePrefix: 'hs',
                        chromosomeField: 'chr',
                        genomicFields: ['p1', 'p2'],
                        separator: ' ',
                        longToWideId: 'id',
                        sampleLength: 1000
                    },
                    dataTransform: [
                        { type: 'filter', field: 'chr', oneOf: ['hs5'] },
                        { type: 'filter', field: 'chr_2', oneOf: ['hs5'] }
                    ],
                    tracks: [
                        { mark: 'withinLink' },
                        {
                            mark: 'brush',
                            x: { linkingId: 'view2' },
                            strokeWidth: { value: 0 }
                        }
                    ],
                    x: { field: 'p1', type: 'genomic', linkingId: 'view1' },
                    xe: { field: 'p1_2', type: 'genomic' },
                    x1: { field: 'p2', type: 'genomic' },
                    x1e: { field: 'P2_2', type: 'genomic' },
                    stroke: { value: '#6CB74C' },
                    strokeWidth: { value: 1 },
                    opacity: { value: 0.4 },
                    style: { outline: 'white' },
                    width: 800,
                    height: 220
                }
            ]
        },
        {
            views: [
                {
                    tracks: [
                        {
                            title: 'Region of Interest',
                            data: {
                                url: 'https://raw.githubusercontent.com/vigsterkr/circos/master/data/5/segdup.txt',
                                type: 'csv',
                                headerNames: ['id', 'chr', 'p1', 'p2'],
                                chromosomePrefix: 'hs',
                                chromosomeField: 'chr',
                                genomicFields: ['p1', 'p2'],
                                separator: ' ',
                                longToWideId: 'id',
                                sampleLength: 1000
                            },
                            dataTransform: [
                                { type: 'filter', field: 'chr', oneOf: ['hs5', 'hs4', 'hs6'] },
                                { type: 'filter', field: 'chr_2', oneOf: ['hs5', 'hs4', 'hs6'] }
                            ],
                            mark: 'withinLink',
                            x: {
                                field: 'p1',
                                type: 'genomic',
                                linkingId: 'view2',
                                axis: 'bottom',
                                domain: { chromosome: 'chr5', interval: [68000000, 71000000] }
                            },
                            xe: { field: 'p2', type: 'genomic' },
                            row: {
                                field: 'chr_2',
                                type: 'nominal',
                                domain: ['hs5', 'hs4', 'hs6', 'empty']
                            },
                            color: { value: 'none' },
                            stroke: {
                                field: 'chr_2',
                                type: 'nominal',
                                domain: ['hs5', 'hs4', 'hs6'],
                                range: ['#62AAD7', '#D1A74F', '#6CB74C']
                            },
                            strokeWidth: { value: 2 },
                            opacity: { value: 0.4 },
                            style: {
                                outline: 'lightgray',
                                outlineWidth: 3,
                                background: '#F8F8F8'
                            },
                            width: 800,
                            height: 200
                        }
                    ]
                },
                {
                    views: [
                        {
                            tracks: [
                                {
                                    title: 'Rearrangement View',
                                    data: {
                                        url: 'https://raw.githubusercontent.com/vigsterkr/circos/master/data/5/segdup.txt',
                                        type: 'csv',
                                        headerNames: ['id', 'chr', 'p1', 'p2'],
                                        chromosomePrefix: 'hs',
                                        chromosomeField: 'chr',
                                        genomicFields: ['p1', 'p2'],
                                        separator: ' ',
                                        longToWideId: 'id',
                                        sampleLength: 1000
                                    },
                                    dataTransform: [{ type: 'filter', field: 'chr', oneOf: ['hs5'] }],
                                    mark: 'withinLink',
                                    x: {
                                        field: 'p1',
                                        type: 'genomic',
                                        axis: 'bottom',
                                        domain: {
                                            chromosome: 'chr5',
                                            interval: [69276000, 69282000]
                                        }
                                    },
                                    xe: { field: 'p2', type: 'genomic' },
                                    color: { value: 'none' },
                                    stroke: { value: '#62AAD7' },
                                    strokeWidth: { value: 6 },
                                    opacity: { value: 0.4 },
                                    style: { outline: 'lightgray', outlineWidth: 3 },
                                    width: 600,
                                    height: 200
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};
