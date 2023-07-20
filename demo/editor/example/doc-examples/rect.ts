import type { GoslingSpec } from 'gosling.js';

export const RECT: GoslingSpec = {
    title: 'Basic Marks: Rect',
    subtitle: 'Tutorial Examples',
    tracks: [
        {
            width: 800,
            height: 40,
            data: {
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                type: 'csv',
                chromosomeField: 'Chromosome',
                genomicFields: ['chromStart', 'chromEnd']
            },
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
            },
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
