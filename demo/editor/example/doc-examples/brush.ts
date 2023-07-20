import type { GoslingSpec } from 'gosling.js';
import { data } from './single-mark';

export const BRUSH: GoslingSpec = {
    title: 'Example: Brushing and Linking',
    layout: 'linear',
    tracks: [
        {
            width: 800,
            height: 200,
            data,
            mark: 'line',
            x: {
                field: 'position',
                type: 'genomic',
                domain: {
                    chromosome: 'chr1'
                },
                axis: 'top'
            },
            y: {
                field: 'peak',
                type: 'quantitative'
            },
            // create a rectangle brush
            alignment: 'overlay',
            tracks: [
                {}, // this dummy object cannot be removed
                {
                    mark: 'brush',
                    x: {
                        linkingId: 'linking-with-brush'
                    },
                    color: {
                        value: 'steelBlue'
                    }
                }
            ]
        },
        {
            width: 800,
            height: 200,
            data,
            mark: 'line',
            x: {
                field: 'position',
                type: 'genomic',
                domain: {
                    chromosome: 'chr1',
                    interval: [200000000, 220000000]
                },
                axis: 'top',
                linkingId: 'linking-with-brush'
            },
            y: {
                field: 'peak',
                type: 'quantitative'
            },
            opacity: {
                value: 1
            },
            style: {
                background: 'steelBlue',
                backgroundOpacity: 0.1
            }
        }
    ]
};
