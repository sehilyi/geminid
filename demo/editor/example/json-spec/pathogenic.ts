import type { GoslingSpec } from 'gosling.js';
import { EX_TRACK_GENE_ANNOTATION } from './gene-annotation';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const allDomains = [
    'Pathogenic',
    'Pathogenic/Likely_pathogenic',
    'Likely_pathogenic',
    'Uncertain_significance',
    'Likely_benign',
    'Benign/Likely_benign',
    'Benign'
];

export const EX_SPEC_PATHOGENIC: GoslingSpec = {
    xDomain: { chromosome: 'chr3', interval: [10140000, 10160000] },
    centerRadius: 0.1,
    layout: 'linear',
    spacing: 0,
    alignment: 'stack',
    tracks: [
        EX_TRACK_GENE_ANNOTATION.higlass,
        {
            alignment: 'overlay',
            data: {
                url: GOSLING_PUBLIC_DATA.clinvar,
                type: 'beddb',
                genomicFields: [
                    { index: 1, name: 'start' },
                    { index: 2, name: 'end' }
                ],
                valueFields: [{ index: 7, name: 'significance', type: 'nominal' }]
            },
            tracks: [
                {
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    y: {
                        field: 'significance',
                        type: 'nominal',
                        domain: [
                            'Pathogenic',
                            'Pathogenic/Likely_pathogenic',
                            'Likely_pathogenic',
                            'Uncertain_significance',
                            'Likely_benign',
                            'Benign/Likely_benign',
                            'Benign'
                        ],
                        baseline: 'Uncertain_significance',
                        range: [150, 20]
                    },
                    size: { value: 1 },
                    color: { value: 'lightgray' },
                    stroke: { value: 'lightgray' },
                    strokeWidth: { value: 1 },
                    opacity: { value: 0.3 },
                    visibility: [
                        {
                            measure: 'zoomLevel',
                            target: 'mark',
                            threshold: 100000,
                            operation: 'LT',
                            transitionPadding: 100000
                        }
                    ]
                },
                {
                    mark: 'point',
                    x: { field: 'start', type: 'genomic' },
                    row: {
                        field: 'significance',
                        type: 'nominal',
                        domain: [
                            'Pathogenic',
                            'Pathogenic/Likely_pathogenic',
                            'Likely_pathogenic',
                            'Uncertain_significance',
                            'Likely_benign',
                            'Benign/Likely_benign',
                            'Benign'
                        ]
                    },
                    size: { value: 7 },
                    opacity: { value: 0.8 },
                    visibility: [
                        {
                            measure: 'zoomLevel',
                            target: 'mark',
                            threshold: 1000000,
                            operation: 'LT',
                            transitionPadding: 1000000
                        }
                    ]
                },
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.clinvardensity,
                        type: 'multivec',
                        row: 'significance',
                        column: 'position',
                        value: 'count',
                        categories: [
                            'Benign',
                            'Benign/Likely_benign',
                            'Likely_benign',
                            'Uncertain_significance',
                            'Likely_pathogenic',
                            'Pathogenic/Likely_pathogenic',
                            'Pathogenic'
                        ],
                        binSize: 4
                    },
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'count', type: 'quantitative', axis: 'none' },
                    color: {
                        field: 'significance',
                        type: 'nominal',
                        domain: [
                            'Pathogenic',
                            'Pathogenic/Likely_pathogenic',
                            'Likely_pathogenic',
                            'Uncertain_significance',
                            'Likely_benign',
                            'Benign/Likely_benign',
                            'Benign'
                        ],
                        range: ['#CB3B8C', '#CB71A3', '#CB96B3', 'gray', '#029F73', '#5A9F8C', '#5A9F8C'],
                        legend: true
                    },
                    visibility: [
                        {
                            measure: 'zoomLevel',
                            target: 'mark',
                            threshold: 500000,
                            operation: 'GT',
                            transitionPadding: 500000
                        }
                    ]
                }
            ],
            color: {
                field: 'significance',
                type: 'nominal',
                domain: [
                    'Pathogenic',
                    'Pathogenic/Likely_pathogenic',
                    'Likely_pathogenic',
                    'Uncertain_significance',
                    'Likely_benign',
                    'Benign/Likely_benign',
                    'Benign'
                ],
                range: ['#CB3B8C', '#CB71A3', '#CB96B3', 'gray', '#029F73', '#5A9F8C', '#5A9F8C']
            },
            width: 800,
            height: 150
        }
    ]
};
