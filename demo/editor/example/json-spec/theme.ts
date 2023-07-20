import type { GoslingSpec } from '@gosling.schema';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_CUSTOM_THEME: GoslingSpec = {
    // theme: {
    //     base: 'light',
    //     track: {
    //         outline: 'black'
    //     },
    //     markCommon: {
    //         color: 'black'
    //     },
    //     brush: {
    //         color: 'red',
    //         opacity: 1,
    //         strokeWidth: 1,
    //         stroke: 'red'
    //     },
    //     legend: {
    //         background: '#2E4863',
    //         backgroundOpacity: 1,
    //         labelColor: 'white'
    //     }
    // },
    title: 'Custom Theme',
    subtitle: 'Customize the style of Gosling visualizations',
    layout: 'linear',
    arrangement: 'vertical',
    views: [
        {
            layout: 'linear',
            xDomain: { chromosome: 'chr3' },
            centerRadius: 0.8,
            tracks: [
                {
                    alignment: 'overlay',
                    title: 'chr3',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/cytogenetic_band.csv',
                        type: 'csv',
                        chromosomeField: 'Chr.',
                        genomicFields: ['ISCN_start', 'ISCN_stop', 'Basepair_start', 'Basepair_stop']
                    },
                    tracks: [
                        {
                            mark: 'text',
                            dataTransform: [
                                {
                                    type: 'filter',
                                    field: 'Stain',
                                    oneOf: ['acen-1', 'acen-2'],
                                    not: true
                                }
                            ],
                            text: { field: 'Band', type: 'nominal' },
                            color: { value: 'black' },
                            visibility: [
                                {
                                    operation: 'less-than',
                                    measure: 'width',
                                    threshold: '|xe-x|',
                                    transitionPadding: 10,
                                    target: 'mark'
                                }
                            ]
                        },
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1', 'acen-2'], not: true }],
                            color: {
                                field: 'Density',
                                type: 'nominal',
                                domain: ['', '25', '50', '75', '100'],
                                range: ['#E3E3E3', '#D9D9D9', '#979797', '#636363', 'black']
                            },
                            size: { value: 20 }
                        },
                        {
                            mark: 'rect',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gvar'] }],
                            color: { value: 'black' },
                            size: { value: 20 }
                        },
                        {
                            mark: 'triangleRight',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1'] }],
                            color: { value: '#963232' },
                            size: { value: 20 }
                        },
                        {
                            mark: 'triangleLeft',
                            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-2'] }],
                            color: { value: '#963232' },
                            size: { value: 20 }
                        },
                        {
                            mark: 'brush',
                            x: { linkingId: 'detail' },
                            strokeWidth: { value: 0 }
                        }
                    ],
                    x: { field: 'Basepair_start', type: 'genomic', axis: 'none' },
                    xe: { field: 'Basepair_stop', type: 'genomic' },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 1 },
                    width: 600,
                    height: 25
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr3', interval: [52168000, 52890000] },
            linkingId: 'detail',
            mark: 'bar',
            x: {
                field: 'position',
                type: 'genomic'
            },
            y: { field: 'peak', type: 'quantitative' },
            width: 400,
            height: 40,
            tracks: [
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/ExcitatoryNeurons-insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'Excitatory neurons'
                },
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/InhibitoryNeurons-insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'Inhibitory neurons'
                },
                {
                    data: {
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/DopaNeurons_Cluster10_AllFrags_projSUNI2_insertions_bin100_RIPnorm.bw',
                        type: 'bigwig',
                        column: 'position',
                        value: 'peak'
                    },
                    title: 'Dopaminergic neurons'
                },
                {
                    alignment: 'overlay',
                    title: 'Genes',
                    data: {
                        url: GOSLING_PUBLIC_DATA.geneAnnotation,
                        type: 'beddb',
                        genomicFields: [
                            { index: 1, name: 'start' },
                            { index: 2, name: 'end' }
                        ],
                        valueFields: [
                            { index: 5, name: 'strand', type: 'nominal' },
                            { index: 3, name: 'name', type: 'nominal' }
                        ],
                        exonIntervalFields: [
                            { index: 12, name: 'start' },
                            { index: 13, name: 'end' }
                        ]
                    },
                    style: { outline: '#20102F' },
                    tracks: [
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['+'] }
                            ],
                            mark: 'text',
                            text: { field: 'name', type: 'nominal' },
                            x: {
                                field: 'start',
                                type: 'genomic'
                            },
                            xe: { field: 'end', type: 'genomic' },
                            style: { textFontSize: 8, dy: -12 }
                        },
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['-'] }
                            ],
                            mark: 'text',
                            text: { field: 'name', type: 'nominal' },
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            style: { textFontSize: 8, dy: 10 }
                        },
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['+'] }
                            ],
                            mark: 'rect',
                            x: { field: 'end', type: 'genomic' },
                            size: { value: 7 }
                        },
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['-'] }
                            ],
                            mark: 'rect',
                            x: { field: 'start', type: 'genomic' },
                            size: { value: 7 }
                        },
                        {
                            dataTransform: [{ type: 'filter', field: 'type', oneOf: ['exon'] }],
                            mark: 'rect',
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            size: { value: 14 }
                        },
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['-'] }
                            ],
                            mark: 'rule',
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            strokeWidth: { value: 1 },
                            style: { linePattern: { size: 3, type: 'triangleLeft' } }
                        },
                        {
                            dataTransform: [
                                { type: 'filter', field: 'type', oneOf: ['gene'] },
                                { type: 'filter', field: 'strand', oneOf: ['+'] }
                            ],
                            mark: 'rule',
                            x: { field: 'start', type: 'genomic' },
                            xe: { field: 'end', type: 'genomic' },
                            strokeWidth: { value: 1 },
                            style: { linePattern: { size: 3, type: 'triangleRight' } }
                        }
                    ],
                    row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
                    color: { field: 'strand', type: 'nominal', domain: ['+', '-'], range: ['#006300', '#0C0C78'] },
                    visibility: [
                        {
                            operation: 'less-than',
                            measure: 'width',
                            threshold: '|xe-x|',
                            transitionPadding: 10,
                            target: 'mark'
                        }
                    ],
                    width: 600,
                    height: 80
                }
            ]
        }
    ]
};
