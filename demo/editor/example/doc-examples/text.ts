import type { GoslingSpec } from 'gosling.js';

export const TEXT: GoslingSpec = {
    title: 'Basic Marks: Text',
    subtitle: 'Tutorial Examples',
    tracks: [
        {
            width: 800,
            height: 180,
            data: {
                url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                type: 'multivec',
                row: 'base',
                column: 'position',
                value: 'count',
                categories: ['A', 'T', 'G', 'C'],
                start: 'start',
                end: 'end',
                binSize: 16
            },

            mark: 'text',
            y: { field: 'count', type: 'quantitative' },
            style: { textStrokeWidth: 0 },
            stretch: true,
            x: { field: 'start', type: 'genomic', axis: 'top' },
            xe: { field: 'end', type: 'genomic' },
            color: {
                field: 'base',
                type: 'nominal',
                domain: ['A', 'T', 'G', 'C']
            },
            text: { field: 'base', type: 'nominal' }
        }
    ]
};
