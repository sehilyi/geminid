import type { GoslingSpec } from 'gosling.js';

export const OVERLAY_TRACKS_RECT_TEXT: GoslingSpec = {
    title: 'Example: Overlay Tracks',
    views: [
        {
            width: 800,
            height: 80,
            layout: 'linear',
            data: {
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                type: 'csv',
                chromosomeField: 'Chromosome',
                genomicFields: ['chromStart', 'chromEnd']
            },
            alignment: 'overlay',
            tracks: [
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
                    text: {
                        field: 'Name',
                        type: 'nominal'
                    },
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
                    ],
                    style: {
                        textStrokeWidth: 0
                    }
                },
                {
                    mark: 'rect',
                    dataTransform: [
                        {
                            type: 'filter',
                            field: 'Stain',
                            oneOf: ['acen'],
                            not: true
                        }
                    ],
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
                        {
                            type: 'filter',
                            field: 'Stain',
                            oneOf: ['acen'],
                            not: false
                        },
                        {
                            type: 'filter',
                            field: 'Name',
                            include: 'q',
                            not: false
                        }
                    ],
                    color: {
                        value: '#B40101'
                    }
                },
                {
                    mark: 'triangleLeft',
                    dataTransform: [
                        {
                            type: 'filter',
                            field: 'Stain',
                            oneOf: ['acen'],
                            not: false
                        },
                        {
                            type: 'filter',
                            field: 'Name',
                            include: 'p',
                            not: false
                        }
                    ],
                    color: {
                        value: '#B40101'
                    }
                }
            ],
            x: {
                field: 'chromStart',
                type: 'genomic',
                domain: {
                    chromosome: 'chr1'
                },
                axis: 'top'
            },
            xe: {
                field: 'chromEnd',
                type: 'genomic'
            },
            size: {
                value: 20
            },
            stroke: {
                value: 'gray'
            },
            strokeWidth: {
                value: 0.5
            },
            style: {
                outline: 'white'
            }
        }
    ]
};
