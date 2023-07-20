import type { GoslingSpec, Mark, DataDeep } from '@gosling.schema';

export const data: DataDeep = {
    url: 'https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ',
    type: 'multivec',
    row: 'sample',
    column: 'position',
    value: 'peak',
    categories: ['sample 1']
};

const getSingleTrackExample = (mark: Mark, data: DataDeep, constSize = 0, xPoint = true): GoslingSpec => {
    const x = xPoint
        ? {
              x: {
                  field: 'position',
                  type: 'genomic',
                  axis: 'bottom'
              }
          }
        : {
              x: { field: 'start', type: 'genomic', axis: 'bottom' },
              xe: { field: 'end', type: 'genomic' }
          };

    return {
        title: `Basic Marks: ${mark}`,
        subtitle: 'Tutorial Examples',
        tracks: [
            {
                layout: 'linear',
                width: 800,
                height: 180,
                // data
                data,
                // specify mark type
                mark, // specify mark type
                // encode visual channels
                ...x,
                y: {
                    field: 'peak',
                    type: 'quantitative',
                    axis: 'right'
                },
                size: constSize > 0 ? { value: constSize } : { field: 'peak', type: 'quantitative' }
            }
        ]
    };
};

export const AREA = getSingleTrackExample('area', data, 2);

export const LINE = getSingleTrackExample('line', data, 2);

export const POINT = getSingleTrackExample('point', data, 0);

const binData = { ...data, binSize: 5 };
export const BAR = getSingleTrackExample('bar', binData, 5, false);
