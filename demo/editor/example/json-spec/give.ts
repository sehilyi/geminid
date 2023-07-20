import type { GoslingSpec } from 'gosling.js';

export const EX_SPEC_GIVE: GoslingSpec = {
    title: 'GIVE',
    subtitle: 'Reimplementation of GenoCAT examples',
    spacing: 60,
    arrangement: 'vertical',
    views: [
        {
            layout: 'linear',
            tracks: [
                {
                    alignment: 'overlay',
                    title: 'Genes',
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=M9A9klpwTci5Vf4bHZ864g',
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
                            mark: 'rect',
                            x: {
                                field: 'end',
                                type: 'genomic',
                                domain: { chromosome: 'chr17', interval: [200000, 800000] },
                                axis: 'top'
                            },
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
                    color: { value: '#4050B4' },
                    width: 700,
                    height: 50
                },
                {
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=Zz3CBDSqQ3ySrOSe2yj1eg',
                        type: 'vector',
                        column: 'position',
                        value: 'peak',
                        binSize: 4
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { value: '#8A96D5' },
                    stroke: { value: '#3C4DB4' },
                    strokeWidth: { value: 0.5 },
                    width: 700,
                    height: 40
                },
                {
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=dc_SOjdCRgq_8PYf6W--7w',
                        type: 'vector',
                        column: 'position',
                        value: 'peak',
                        binSize: 4
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { value: '#8A96D5' },
                    stroke: { value: '#3C4DB4' },
                    strokeWidth: { value: 0.5 },
                    width: 700,
                    height: 40
                },
                {
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=Nolbrk9kS3CE0jJL_7OW1g',
                        type: 'vector',
                        column: 'position',
                        value: 'peak',
                        binSize: 4
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { value: '#8A96D5' },
                    stroke: { value: '#3C4DB4' },
                    strokeWidth: { value: 0.5 },
                    width: 700,
                    height: 40
                },
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
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen'], not: true }]
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
                        }
                    ],
                    x: {
                        field: 'chromStart',
                        type: 'genomic',
                        domain: { chromosome: 'chr17', interval: [20000000, 50000000] }
                    },
                    xe: { field: 'chromEnd', type: 'genomic' },
                    color: { value: 'white' },
                    size: { value: 14 },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 0.5 },
                    width: 700,
                    height: 40
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
                        //sampleLength: 5000
                    },
                    dataTransform: [{ type: 'filter', field: 'chr', oneOf: ['hs17'] }],
                    mark: 'rect',
                    x: { field: 'p1', type: 'genomic' },
                    xe: { field: 'p2', type: 'genomic' },
                    color: {
                        field: 'chr_2',
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
                        ]
                    },
                    opacity: { value: 0.5 },
                    size: { value: 14 },
                    overlayOnPreviousTrack: true,
                    width: 700,
                    height: 40
                }
            ]
        },
        {
            layout: 'linear',
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
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen'], not: true }]
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
                        }
                    ],
                    x: {
                        field: 'chromStart',
                        type: 'genomic',
                        axis: 'none'
                    },
                    xe: { field: 'chromEnd', type: 'genomic' },
                    color: { value: 'white' },
                    size: { value: 14 },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 0.5 },
                    width: 700,
                    height: 40
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
                        //sampleLength: 5000
                    },
                    dataTransform: [{ type: 'filter', field: 'chr_2', oneOf: ['hs1'] }],
                    mark: 'rect',
                    x: { field: 'p1_2', type: 'genomic' },
                    xe: { field: 'p2_2', type: 'genomic' },
                    color: {
                        field: 'chr',
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
                        ]
                    },
                    opacity: { value: 0.5 },
                    size: { value: 14 },
                    overlayOnPreviousTrack: true,
                    width: 700,
                    height: 40
                },
                {
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=Zz3CBDSqQ3ySrOSe2yj1eg',
                        type: 'vector',
                        column: 'position',
                        value: 'peak',
                        binSize: 4
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { value: '#8A96D5' },
                    stroke: { value: '#3C4DB4' },
                    strokeWidth: { value: 0.5 },
                    width: 700,
                    height: 40
                },
                {
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=dc_SOjdCRgq_8PYf6W--7w',
                        type: 'vector',
                        column: 'position',
                        value: 'peak',
                        binSize: 4
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { value: '#8A96D5' },
                    stroke: { value: '#3C4DB4' },
                    strokeWidth: { value: 0.5 },
                    width: 700,
                    height: 40
                },
                {
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=Nolbrk9kS3CE0jJL_7OW1g',
                        type: 'vector',
                        column: 'position',
                        value: 'peak',
                        binSize: 4
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    color: { value: '#8A96D5' },
                    stroke: { value: '#3C4DB4' },
                    strokeWidth: { value: 0.5 },
                    width: 700,
                    height: 40
                },
                {
                    alignment: 'overlay',
                    title: 'Genes',
                    data: {
                        url: 'https://resgen.io/api/v1/tileset_info/?d=M9A9klpwTci5Vf4bHZ864g',
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
                            mark: 'rect',
                            x: {
                                field: 'end',
                                type: 'genomic',
                                domain: { chromosome: 'chr1', interval: [109000000, 112000000] },
                                axis: 'bottom'
                            },
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
                    color: { value: '#4050B4' },
                    width: 700,
                    height: 50
                }
            ]
        }
    ],
    style: { outlineWidth: 0 }
};
