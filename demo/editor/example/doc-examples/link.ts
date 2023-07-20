import type { GoslingSpec } from 'gosling.js';

export const LINK: GoslingSpec = {
    title: 'Basic Marks: Link',
    subtitle: 'Tutorial Examples',
    tracks: [
        {
            layout: 'linear',
            width: 800,
            height: 180,
            data: {
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                type: 'csv',
                chromosomeField: 'c2',
                genomicFields: ['s1', 'e1', 's2', 'e2']
            },
            mark: 'withinLink', // specify the mark type
            // bind visual channels to corresponding data fields
            x: {
                field: 's1',
                type: 'genomic',
                domain: { chromosome: 'chr1' },
                axis: 'top'
            },
            xe: { field: 'e1', type: 'genomic' },
            x1: {
                field: 's2',
                type: 'genomic',
                domain: { chromosome: 'chr1' },
                axis: 'top'
            },
            x1e: { field: 'e2', type: 'genomic' },

            // specify styles of the mark
            stroke: { value: 'steelblue' }
        }
    ]
};
