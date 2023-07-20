import type { GoslingSpec, MultivecData, OverlaidTracks } from '@gosling.schema';
import { EX_TRACK_SEMANTIC_ZOOM } from './semantic-zoom';

export const EX_TRACK_SARS_COV_2_GENES: OverlaidTracks = {
    alignment: 'overlay',
    title: 'NC_045512.2 Genes',
    data: {
        type: 'csv',
        url: 'https://s3.amazonaws.com/gosling-lang.org/data/COVID/NC_045512.2-Genes.csv',
        chromosomeField: 'Accession',
        genomicFields: ['Start', 'Stop']
    },
    tracks: [
        {
            mark: 'rect',
            color: { value: '#0072B2' },
            stroke: { value: 'white' },
            strokeWidth: { value: 2 }
        },
        {
            mark: 'rule',
            color: { value: 'white' },
            opacity: { value: 0.6 },
            strokeWidth: { value: 0 },
            style: { linePattern: { type: 'triangleRight', size: 10 } }
        },
        {
            mark: 'text',
            text: { field: 'Gene symbol', type: 'nominal' },
            color: { value: 'black' },
            stroke: { value: 'white' },
            strokeWidth: { value: 3 },
            visibility: [
                {
                    target: 'mark',
                    measure: 'width',
                    threshold: '|xe-x|',
                    operation: 'LTET',
                    transitionPadding: 30
                }
            ]
        }
    ],
    x: { field: 'Start', type: 'genomic' },
    xe: { field: 'Stop', type: 'genomic' },
    width: 800,
    height: 30
};

export const EX_SPEC_SARS_COV_2: GoslingSpec = {
    title: 'SARS-CoV-2',
    subtitle: 'Data Source: WashU Virus Genome Browser, NCBI, GISAID',
    assembly: [['NC_045512.2', 29903]],
    layout: 'linear',
    spacing: 50,
    views: [
        {
            ...EX_TRACK_SARS_COV_2_GENES,
            static: true,
            layout: 'linear',
            xDomain: { interval: [1, 29903] },
            tracks: [
                ...EX_TRACK_SARS_COV_2_GENES.tracks,
                {
                    mark: 'brush',
                    x: { linkingId: 'detail' }
                }
            ]
        },
        {
            centerRadius: 0,
            xDomain: { interval: [1, 29903] },
            linkingId: 'detail',
            alignment: 'stack',
            tracks: [
                // {
                //     title: 'Viral RNA Expression (nanopore)',
                //     data: {
                //         type: 'bigwig',
                //         url: 'https://wangftp.wustl.edu/~xzhuo/bat_genomes/VeroInf24h.bw',
                //         column: 'g',
                //         value: 'v'
                //     },
                //     mark: 'bar',
                //     x: { field: 'g', type: 'genomic' },
                //     y: { field: 'v', type: 'quantitative' },
                //     color: { value: 'steelblue' },
                //     stroke: { value: 'steelblue' },
                //     strokeWidth: { value: 1 },
                //     width: 800, height: 30
                // },
                // {
                //     title: 'Sequence Diversity (Shannon Entropy)',
                //     data: {
                //         type: 'csv',
                //         url: 'https://s3.amazonaws.com/gosling-lang.org/data/COVID/ncov_entropy.bedgraph.sort',
                //         separator: '\t',
                //         genomicFields: ['Start', 'Stop'],
                //         sampleLength: 500
                //     },
                //     dataTransform: { filter: [{ field: "Entropy", oneOf: [0], not: true}]},
                //     mark: 'point',
                //     x: { field: 'Start', type: 'genomic' },
                //     xe: { field: 'Stop', type: 'genomic' },
                //     y: { field: 'Entropy', type: 'quantitative' },
                //     color: { value: '#0072B2' },
                //     opacity: { value: 0.3 },
                //     width: 800, height: 30
                // },
                {
                    alignment: 'overlay',
                    title: 'S Protein Annotation',
                    data: {
                        type: 'csv',
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/COVID/sars-cov-2_Sprot_annot_sorted.bed',
                        chromosomeField: 'Accession',
                        genomicFields: ['Start', 'Stop']
                    },
                    tracks: [
                        {
                            mark: 'rect',
                            color: {
                                field: 'Protein',
                                type: 'nominal',
                                domain: [
                                    'receptor-binding domain (RBD)',
                                    'receptor-binding motif (RBM)',
                                    'S1/S2 cleavage site',
                                    'heptad repeat 1 (HR1)',
                                    'heptad repeat 2 (HR2)'
                                ]
                            },
                            xe: { field: 'Stop', type: 'genomic' }
                        },
                        {
                            mark: 'text',
                            text: { field: 'Protein', type: 'nominal' },
                            color: { value: '#333' },
                            stroke: { value: 'white' },
                            strokeWidth: { value: 3 },
                            style: { textAnchor: 'end' }
                        }
                    ],
                    x: { field: 'Start', type: 'genomic' },
                    row: {
                        field: 'Protein',
                        type: 'nominal',
                        domain: [
                            'receptor-binding domain (RBD)',
                            'receptor-binding motif (RBM)',
                            'S1/S2 cleavage site',
                            'heptad repeat 1 (HR1)',
                            'heptad repeat 2 (HR2)'
                        ]
                    },
                    width: 800,
                    height: 80
                },
                EX_TRACK_SARS_COV_2_GENES,
                {
                    title: 'NC_045512.2 Sequence',
                    ...EX_TRACK_SEMANTIC_ZOOM.sequence,
                    data: {
                        ...(EX_TRACK_SEMANTIC_ZOOM.sequence.data as MultivecData),
                        url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=NC_045512_2-multivec'
                    },
                    style: { inlineLegend: true },
                    width: 800,
                    height: 40
                },
                {
                    title: 'TRS-L-Dependent Recombination Events',
                    data: {
                        type: 'csv',
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/COVID/TRS-L-dependent_recombinationEvents_sorted.bed',
                        chromosomeField: 'Accession',
                        genomicFields: ['Start1', 'Stop1', 'Start2', 'Stop2'],
                        sampleLength: 100
                    },
                    mark: 'withinLink',
                    x: { field: 'Start1', type: 'genomic' },
                    xe: { field: 'Stop1', type: 'genomic' },
                    x1: { field: 'Start2', type: 'genomic' },
                    x1e: { field: 'Stop2', type: 'genomic' },
                    stroke: { value: '#0072B2' },
                    color: { value: '#0072B2' },
                    opacity: { value: 0.1 },
                    width: 800,
                    height: 400
                }
            ]
        }
    ]
};
