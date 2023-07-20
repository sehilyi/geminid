import type { GoslingSpec, VisibilityCondition, MultivecData } from '@gosling.schema';

const data: MultivecData = {
    type: 'multivec',
    url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
    value: 'y',
    row: '_',
    column: 'x',
    categories: ['_'],
    binSize: 12
};

const getVisibilityCondition = (thresholds: [number | undefined, number | undefined]) => {
    const conditions: VisibilityCondition[] = [];
    thresholds.map((threshold, i) => {
        if (threshold) {
            conditions.push({
                operation: i == 0 ? 'GT' : 'LT',
                target: 'mark',
                threshold,
                measure: 'zoomLevel'
            });
        }
    });

    return conditions;
};

const spec: GoslingSpec = {
    title: 'Basic Idea of Semantic Zoom',
    subtitle:
        'Zoom in and out to see how different visual encoding (here, color) can be applied depending on the zoom level.',
    layout: 'linear',
    centerRadius: 0.5,
    alignment: 'overlay',
    data,
    mark: 'rect',
    x: { field: 'start', type: 'genomic' },
    xe: { field: 'end', type: 'genomic' },
    style: { outline: 'black', outlineWidth: 1 },
    width: 720,
    height: 130,
    tracks: [
        {
            color: { value: '#E79F00' },
            visibility: getVisibilityCondition([10 ** 8, undefined])
        },
        {
            color: { value: '#57B4E9' },
            visibility: getVisibilityCondition([10 ** 7, 10 ** 8])
        },
        {
            color: { value: '#029F73' },
            visibility: getVisibilityCondition([10 ** 6, 10 ** 7])
        },
        {
            color: { value: '#0072B2' },
            visibility: getVisibilityCondition([10 ** 5, 10 ** 6])
        },
        {
            color: { value: '#D45E00' },
            visibility: getVisibilityCondition([10 ** 4, 10 ** 5])
        },
        {
            color: { value: '#CB7AA7' },
            visibility: getVisibilityCondition([undefined, 10 ** 4])
        }
    ]
};

export { spec };
