import type { GoslingSpec } from 'gosling.js';

export const MATRIX: GoslingSpec = {
    title: 'Basic Marks: Rect in Matrix',
    subtitle: 'Tutorial Examples',
    width: 600,
    height: 600,
    tracks: [
        {
            title: 'HFFc6_Hi-C',
            data: {
                url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=hffc6-hic-hg38',
                type: 'matrix'
            },
            mark: 'rect',
            x: {
                field: 'position1',
                type: 'genomic',
                axis: 'top'
            },
            y: {
                field: 'position2',
                type: 'genomic',
                axis: 'left'
            },
            color: {
                field: 'value',
                type: 'quantitative',
                range: 'warm'
            }
        }
    ]
};
