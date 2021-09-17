import { GoslingSpec } from '../../core/gosling.schema';

export const EX_SPEC_ALIGNMENT: GoslingSpec = {
    title: 'Genome Alignment',
    subtitle: 'Reimplementation of Genome Alignment Example in Ideogram.js',
    arrangement: 'parallel',
    // layout: 'circular',
    spacing: 0,
    style: { outlineWidth: 0 },
    // xDomain: { interval: [0, 500000000] },
    views: [
        {
            xLinkingId: 'top',
            assembly: 'mm10',
            tracks: [
                {
                    id: 'view-1',
                    template: 'ideogram',
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/ideograms/ucsc_mm10_cytoBand.csv',
                        type: 'csv',
                        chromosomeField: 'chr',
                        genomicFields: ['start', 'end']
                    },
                    encoding: {
                        startPosition: { field: 'start' },
                        endPosition: { field: 'end' },
                        stainBackgroundColor: {
                            field: 'stain',
                            domain: ['gneg', 'gpos33', 'gpos66', 'gpos75', 'gpos100'],
                            range: ['white', 'lightgray', 'gray', 'gray', 'black', 'black']
                        },
                        stainLabelColor: {
                            field: 'stain',
                            domain: ['gneg', 'gpos33', 'gpos66', 'gpos75', 'gpos100'],
                            range: ['black', 'black', 'black', 'black', 'white', 'white']
                        },
                        name: { field: 'name' },
                        stainStroke: { value: 'black' }
                    },
                    width: 1000,
                    height: 20
                }
            ]
        },
        {
            tracks: [
                {
                    id: 'view-2',
                    data: {
                        url:
                            'https://s3.amazonaws.com/gosling-lang.org/data/ideogram.js/homo_sapiens-mus_musculus-synteny-v73-adjusted.tsv',
                        type: 'csv',
                        genomicFieldsToConvert: [
                            {
                                assembly: 'mm10',
                                chromosomeField: 'Chromosome_spec1',
                                genomicFields: ['Start_spec1', 'End_spec1']
                            },
                            {
                                assembly: 'hg38',
                                chromosomeField: 'Chromosome_spec2',
                                genomicFields: ['Start_spec2', 'End_spec2']
                            }
                        ],
                        separator: '\t'
                    },
                    mark: 'betweenLink',
                    x: {
                        field: 'Start_spec1',
                        type: 'genomic',
                        axis: 'none',
                        linkingId: 'top'
                    },
                    xe: { field: 'End_spec1', type: 'genomic' },
                    x1: {
                        field: 'Start_spec2',
                        type: 'genomic',
                        linkingId: 'bottom'
                    },
                    x1e: { field: 'End_spec2', type: 'genomic' },
                    // "stroke": { "value": "light"},
                    strokeWidth: { value: 0 },
                    color: {
                        field: 'Chromosome_spec1',
                        type: 'nominal',
                        domain: [
                            'chr1',
                            'chr2',
                            'chr3',
                            'chr4',
                            'chr5',
                            'chr6',
                            'chr7',
                            'chr8',
                            'chr9',
                            'chr10',
                            'chr11',
                            'chr12',
                            'chr13',
                            'chr14',
                            'chr15',
                            'chr16',
                            'chr17',
                            'chr18',
                            'chr19',
                            'chr20',
                            'chr21',
                            'chr22',
                            'chrX',
                            'chrY'
                        ],
                        range: [
                            'rgb(153, 102, 0)',
                            'rgb(102, 102, 0)',
                            'rgb(153, 153, 30)',
                            'rgb(204, 0, 0)',
                            'rgb(255, 0, 0)',
                            'rgb(255, 0, 204)',
                            'rgb(255, 204, 204)',
                            'rgb(255, 153, 0)',
                            'rgb(255, 204, 0)',
                            'rgb(255, 255, 0)',
                            'rgb(204, 255, 0)',
                            'rgb(0, 255, 0)',
                            'rgb(53, 128, 0)',
                            'rgb(0, 0, 204)',
                            'rgb(102, 153, 255)',
                            'rgb(153, 204, 255)',
                            'rgb(0, 255, 255)',
                            'rgb(204, 255, 255)',
                            'rgb(153, 0, 204)',
                            'rgb(204, 51, 255)',
                            'rgb(204, 153, 255)',
                            'rgb(102, 102, 102)',
                            'rgb(255, 102, 102)',
                            'rgb(102, 102, 255)'
                        ]
                    },
                    opacity: { value: 0.5 },
                    width: 1000,
                    height: 630
                }
            ]
        },
        {
            xLinkingId: 'bottom',
            tracks: [
                {
                    id: 'view-3',
                    template: 'ideogram',
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/ideograms/ucsc_hg38_cytoBand.csv',
                        type: 'csv',
                        chromosomeField: 'chr',
                        genomicFields: ['start', 'end']
                    },
                    encoding: {
                        startPosition: { field: 'start', axis: 'bottom' },
                        endPosition: { field: 'end' },
                        stainBackgroundColor: {
                            field: 'stain',
                            range: ['white', 'lightgray', 'gray', 'gray', 'black', '#7B9CC8', '#DC4542']
                        },
                        stainLabelColor: { field: 'stain' },
                        name: { field: 'name' },
                        stainStroke: { value: 'black' }
                    },
                    width: 1000,
                    height: 20
                }
            ]
        }
    ]
};
