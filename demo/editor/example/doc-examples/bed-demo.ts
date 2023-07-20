import type { GoslingSpec } from 'gosling.js';

export const BED_DEMO: GoslingSpec = {
    title: 'BED files',
    subtitle: 'Demonstration of using BED files of different specifications',
    layout: 'linear',
    arrangement: 'vertical',
    xDomain: { chromosome: 'chr1', interval: [1, 2000000] },
    views: [
        {
            tracks: [
                {
                    title: 'BED12: All 12 standard fields',
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/bed/chr1_CDS_BED12.bed.gz',
                        indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/bed/chr1_CDS_BED12.bed.gz.tbi',
                        type: 'bed'
                    },
                    mark: 'rect',
                    x: { field: 'chromStart', type: 'genomic' },
                    xe: { field: 'chromEnd', type: 'genomic' },
                    size: { value: 10 },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 1 }
                },
                {
                    title: 'BED6: A file with the first 6 BED fields',
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/bed/chr1_CDS_BED6.bed.gz',
                        indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/bed/chr1_CDS_BED6.bed.gz.tbi',
                        type: 'bed'
                    },
                    mark: 'rect',
                    x: { field: 'chromStart', type: 'genomic' },
                    xe: { field: 'chromEnd', type: 'genomic' },
                    size: { value: 10 },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 1 }
                },
                {
                    title: 'BED6+6: A file with the first 6 BED fields, and 6 custom fields',
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/bed/chr1_CDS_BED12.bed.gz',
                        indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/bed/chr1_CDS_BED12.bed.gz.tbi',
                        type: 'bed',
                        customFields: ['col7', 'col8', 'col9', 'col10', 'col11', 'col12']
                    },
                    mark: 'rect',
                    x: { field: 'col7', type: 'genomic' },
                    xe: { field: 'col8', type: 'genomic' },
                    size: { value: 10 },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 1 }
                },
                {
                    title: 'BED12+1: A file with all 12 standard fields, and a single extra custom field',
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/bed/chr1_CDS_BED12%2B1.bed.gz',
                        indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/bed/chr1_CDS_BED12%2B1.bed.gz.tbi',
                        type: 'bed',
                        customFields: ['col13']
                    },
                    mark: 'rect',
                    x: { field: 'chromStart', type: 'genomic' },
                    xe: { field: 'chromEnd', type: 'genomic' },
                    size: { value: 10 },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 1 }
                }
            ]
        }
    ]
};
