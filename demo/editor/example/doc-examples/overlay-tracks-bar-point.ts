import type { GoslingSpec } from 'gosling.js';

export const OVERLAY_TRACKS_BAR_POINT: GoslingSpec = {
    title: 'Example: Overlay Tracks',
    tracks: [
        {
            layout: 'linear',
            width: 800,
            height: 200,
            data: {
                url: 'https://cgap-higlass.com/api/v1/tileset_info/?d=clinvar_20200824_hg38',
                type: 'beddb',
                genomicFields: [
                    {
                        index: 1,
                        name: 'start'
                    },
                    {
                        index: 2,
                        name: 'end'
                    }
                ],
                valueFields: [
                    {
                        index: 7,
                        name: 'significance',
                        type: 'nominal'
                    }
                ]
            },
            alignment: 'overlay',
            tracks: [
                // first track: bar
                {
                    mark: 'bar',
                    stroke: {
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
                        range: ['#D45E00', '#D45E00', '#D45E00', 'black', '#029F73', '#029F73', '#029F73']
                    },
                    strokeWidth: {
                        value: 0.5
                    },
                    size: {
                        value: 1
                    }
                },
                // second track: point
                {
                    mark: 'point',
                    size: {
                        value: 5
                    },
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
                        range: ['#D45E00', '#D45E00', '#D45E00', 'black', '#029F73', '#029F73', '#029F73'],
                        legend: true
                    }
                }
            ],

            // visual encoding is shared by the two tracks
            x: {
                field: 'start',
                type: 'genomic',
                domain: {
                    chromosome: 'chr3'
                },
                axis: 'top'
            },
            xe: {
                field: 'end',
                type: 'genomic'
            },
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
                range: [150, 20],
                grid: true
            },
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
                range: ['#D45E00', '#D45E00', '#D45E00', 'black', '#029F73', '#029F73', '#029F73']
            },
            opacity: {
                value: 0.6
            }
        }
    ]
};
