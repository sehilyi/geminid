import type { GoslingSpec } from 'gosling.js';
import type { SingleView } from '@gosling.schema';
import { DEFAULT_VIEW_SPACING } from '../../../src/core/defaults';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

const COLORS = ['#D45E00', '#029F73', '#0072B2', '#CB7AA7', '#E79F00'];

const spacing = DEFAULT_VIEW_SPACING;
// const width = 150;
// const height = 30;

export const getSingleView: (
    color: string,
    width: number,
    height: number,
    numHSpacing: number,
    numVSpacing: number
) => SingleView = (color, width, height, numHSpacing, numVSpacing) => {
    return {
        tracks: Array(1).fill({
            data: {
                type: 'multivec',
                url: GOSLING_PUBLIC_DATA.multivec,
                value: 'y',
                row: '_',
                column: 'x',
                categories: ['_'],
                binSize: 32
            },
            mark: 'rect',
            x: { field: 'start', type: 'genomic', axis: 'none' },
            xe: { field: 'end', type: 'genomic' },
            row: { field: '_', type: 'nominal' },
            color: { value: 'lightgray' },
            style: { outline: color, outlineWidth: 7 },
            width: width + numHSpacing * spacing,
            height: height + numVSpacing * spacing
        })
    };
};

export const EX_SPEC_LAYOUT_AND_ARRANGEMENT_1: GoslingSpec = {
    title: 'Layout and Arrangement',
    subtitle: 'Try yourself with different arrangements and layouts',
    static: true,
    layout: 'linear',
    arrangement: 'parallel',
    centerRadius: 0.5,
    views: [
        {
            ...getSingleView(COLORS[0], 400, 30, 1, 0)
        },
        {
            arrangement: 'serial',
            views: [
                {
                    ...getSingleView(COLORS[1], 200, 30, 0, 0)
                },
                {
                    ...getSingleView(COLORS[2], 200, 30, 0, 0)
                }
            ]
        }
    ]
};

export const EX_SPEC_LAYOUT_AND_ARRANGEMENT_2: GoslingSpec = {
    static: true,
    layout: 'linear',
    arrangement: 'serial',
    centerRadius: 0.5,
    views: [
        {
            arrangement: 'serial',
            views: [
                {
                    arrangement: 'parallel',
                    views: [
                        {
                            ...getSingleView(COLORS[0], 300, 60, 1, 0)
                        },
                        {
                            ...getSingleView(COLORS[1], 300, 30, 1, 0)
                        }
                    ]
                },
                {
                    arrangement: 'parallel',
                    views: [
                        {
                            ...getSingleView(COLORS[2], 50, 60, 1, 0)
                        },
                        {
                            ...getSingleView(COLORS[3], 50, 30, 1, 0)
                        }
                    ]
                }
            ]
        },
        {
            ...getSingleView(COLORS[4], 50, 90, 0, 1)
        }
    ]
};
