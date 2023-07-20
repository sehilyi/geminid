import type { GoslingSpec } from 'gosling.js';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_BASIC_SEMANTIC_ZOOM: GoslingSpec = {
    title: 'Basic Idea of Semantic Zoom',
    subtitle:
        'Zoom in and out to see how different visual encoding (here, color) can be applied depending on the zoom level.',
    layout: 'linear',
    centerRadius: 0.5,
    alignment: 'overlay',
    data: {
        type: 'multivec',
        url: GOSLING_PUBLIC_DATA.multivec,
        value: 'y',
        row: '_',
        column: 'x',
        categories: ['_'],
        binSize: 12
    },
    mark: 'rect',
    x: { field: 'start', type: 'genomic' },
    xe: { field: 'end', type: 'genomic' },
    style: { outline: 'black', outlineWidth: 1 },
    width: 720,
    height: 130,
    tracks: [
        {
            color: { value: '#E79F00' },
            visibility: [
                {
                    operation: 'GT',
                    target: 'mark',
                    threshold: 100000000,
                    measure: 'zoomLevel'
                }
            ]
        },
        {
            color: { value: '#57B4E9' },
            visibility: [
                {
                    operation: 'GT',
                    target: 'mark',
                    threshold: 10 ** 7,
                    measure: 'zoomLevel'
                },
                {
                    operation: 'LT',
                    target: 'mark',
                    threshold: 100000000,
                    measure: 'zoomLevel'
                }
            ]
        },
        {
            color: { value: '#029F73' },
            visibility: [
                {
                    operation: 'GT',
                    target: 'mark',
                    threshold: 1000000,
                    measure: 'zoomLevel'
                },
                {
                    operation: 'LT',
                    target: 'mark',
                    threshold: 10000000,
                    measure: 'zoomLevel'
                }
            ]
        },
        {
            color: { value: '#0072B2' },
            visibility: [
                {
                    operation: 'GT',
                    target: 'mark',
                    threshold: 100000,
                    measure: 'zoomLevel'
                },
                {
                    operation: 'LT',
                    target: 'mark',
                    threshold: 1000000,
                    measure: 'zoomLevel'
                }
            ]
        },
        {
            color: { value: '#D45E00' },
            visibility: [
                {
                    operation: 'GT',
                    target: 'mark',
                    threshold: 10000,
                    measure: 'zoomLevel'
                },
                {
                    operation: 'LT',
                    target: 'mark',
                    threshold: 100000,
                    measure: 'zoomLevel'
                }
            ]
        },
        {
            color: { value: '#CB7AA7' },
            visibility: [
                {
                    operation: 'GT',
                    target: 'mark',
                    threshold: 1000,
                    measure: 'zoomLevel'
                },
                {
                    operation: 'LT',
                    target: 'mark',
                    threshold: 10000,
                    measure: 'zoomLevel'
                }
            ]
        }
    ]
};
