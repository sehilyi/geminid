import type { PartialTrack, GoslingSpec, JsonData } from '@gosling.schema';

const barTrack: PartialTrack = {
    data: {
        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
        type: 'multivec',
        row: 'sample',
        column: 'position',
        value: 'peak',
        categories: ['sample 1'],
        binSize: 4
    },
    mark: 'bar',
    x: { field: 'start', type: 'genomic' },
    xe: { field: 'end', type: 'genomic' },
    y: { field: 'peak', type: 'quantitative', domain: [0, 0.003] },
    color: { value: 'lightgray' }
};

const referenceData: JsonData = {
    type: 'json',
    values: [
        { c: 'chr2', p: 100000, v: 0.0001 },
        { c: 'chr5', p: 100000, v: 0.0004 },
        { c: 'chr10', p: 100000, v: 0.0009 }
    ],
    chromosomeField: 'c',
    genomicFields: ['p']
};

const spec: GoslingSpec = {
    title: 'Rule Mark',
    subtitle: 'Annotate visualization with horizontal and vertical lines',
    style: { dashed: [3, 3] },
    views: [
        {
            alignment: 'overlay',
            tracks: [
                barTrack,
                {
                    data: referenceData,
                    mark: 'rule',
                    x: { field: 'p', type: 'genomic' },
                    y: { field: 'v', type: 'quantitative', domain: [0, 0.003] },
                    strokeWidth: { field: 'v', type: 'quantitative' },
                    color: { value: 'red' }
                },
                {
                    data: referenceData,
                    mark: 'rule',
                    x: { field: 'p', type: 'genomic' },
                    strokeWidth: { value: 2 },
                    color: { value: 'blue' }
                }
            ],
            width: 500,
            height: 200
        }
    ]
};

export { spec };
