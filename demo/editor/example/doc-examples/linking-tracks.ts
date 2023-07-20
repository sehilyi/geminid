import type { GoslingSpec } from 'gosling.js';

export const LINKING_TRACKS: GoslingSpec = {
    tracks: [
        {
            layout: 'linear',
            height: 100,
            width: 800,
            data: {
                url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                type: 'multivec',
                row: 'sample',
                column: 'position',
                value: 'peak',
                categories: ['sample 1', 'sample 3', 'sample 4']
            },
            mark: 'line',
            x: {
                field: 'position',
                type: 'genomic',
                domain: { chromosome: 'chr2' },
                axis: 'top',
                linkingId: 'link1' // assign a linking id
            },
            y: { field: 'peak', type: 'quantitative' },
            row: { field: 'sample', type: 'nominal' },
            color: { field: 'sample', type: 'nominal', legend: true },
            stroke: { value: 'white' },
            strokeWidth: { value: 0.5 }
        },
        {
            height: 100,
            width: 800,
            data: {
                url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
                type: 'multivec',
                row: 'sample',
                column: 'position',
                value: 'peak',
                categories: ['sample 1', 'sample 2']
            },
            mark: 'area',
            x: {
                field: 'position',
                type: 'genomic',
                domain: { chromosome: 'chr2' },
                axis: 'top',
                linkingId: 'link1' // assign the same linking id as the first track
            },
            y: { field: 'peak', type: 'quantitative' },
            row: { field: 'sample', type: 'nominal' },
            color: { field: 'sample', type: 'nominal', legend: true },
            stroke: { value: 'white' },
            strokeWidth: { value: 0.5 }
        }
    ]
};
