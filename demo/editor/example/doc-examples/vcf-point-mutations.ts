import type { GoslingSpec } from 'gosling.js';

export const VCF_POINT_MUTATIONS: GoslingSpec = {
    subtitle: 'Point mutations from a VCF file',
    layout: 'linear',
    arrangement: 'vertical',
    centerRadius: 0.8,
    views: [
        {
            tracks: [
                {
                    dataTransform: [{ type: 'filter', field: 'DISTPREVLOGE', oneOf: [null] }],
                    id: 'track-1',
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/SV/SNV_test_tumor_normal_with_panel.vcf.gz',
                        type: 'vcf',
                        indexUrl:
                            'https://s3.amazonaws.com/gosling-lang.org/data/SV/SNV_test_tumor_normal_with_panel.vcf.gz.tbi',
                        sampleLength: 5000
                    },
                    tooltip: [
                        { field: 'DISTPREVLOGE', type: 'nominal', format: 's1' },
                        { field: 'POS', type: 'genomic' }
                    ],
                    mark: 'point',
                    x: { field: 'POS', type: 'genomic', axis: 'top' },
                    color: {
                        field: 'SUBTYPE',
                        type: 'nominal',
                        legend: true,
                        domain: ['C>A', 'C>G', 'C>T', 'T>A', 'T>C', 'T>G']
                    },
                    y: { field: 'DISTPREVLOGE', type: 'quantitative', axis: 'top' },
                    opacity: { value: 0.9 },
                    width: 600,
                    height: 130
                }
            ]
        }
    ]
};
