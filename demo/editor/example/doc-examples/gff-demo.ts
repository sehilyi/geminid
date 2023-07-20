import type { GoslingSpec } from 'gosling.js';

export const GFF_DEMO: GoslingSpec = {
    title: 'GFF3 file',
    subtitle: 'E. coli genome, colored by gene type.',
    spacing: 0,
    layout: 'linear',
    assembly: [['U00096.3', 4641652]],
    style: { enableSmoothPath: true },
    views: [
        {
            xDomain: { chromosome: 'U00096.3', interval: [222000, 240000] },
            alignment: 'overlay',
            data: {
                url: 'https://s3.amazonaws.com/gosling-lang.org/data/gff/E_coli_MG1655.gff3.gz',
                indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/gff/E_coli_MG1655.gff3.gz.tbi',
                type: 'gff',
                attributesToFields: [
                    { attribute: 'gene_biotype', defaultValue: 'unknown' },
                    { attribute: 'Name', defaultValue: 'unknown' }
                ]
            },
            color: {
                type: 'nominal',
                field: 'gene_biotype',
                domain: ['protein_coding', 'tRNA', 'rRNA', 'ncRNA', 'pseudogene', 'unknown'],
                range: ['orange', 'blue', 'green', 'red', 'purple', 'black']
            },
            tracks: [
                {
                    dataTransform: [
                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                        { type: 'filter', field: 'strand', oneOf: ['+'] }
                    ],
                    mark: 'triangleRight',
                    x: { field: 'end', type: 'genomic', axis: 'top' },
                    size: { value: 10 }
                },
                {
                    dataTransform: [{ type: 'filter', field: 'type', oneOf: ['gene'] }],
                    mark: 'text',
                    text: { field: 'Name', type: 'nominal' },
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    style: { dy: -10 }
                },
                {
                    dataTransform: [
                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                        { type: 'filter', field: 'strand', oneOf: ['-'] }
                    ],
                    mark: 'triangleLeft',
                    x: { field: 'start', type: 'genomic' },
                    size: { value: 10 },
                    style: { align: 'right' }
                },
                {
                    dataTransform: [
                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                        { type: 'filter', field: 'strand', oneOf: ['+'] }
                    ],
                    mark: 'rule',
                    x: { field: 'start', type: 'genomic' },
                    strokeWidth: { value: 3 },
                    xe: { field: 'end', type: 'genomic' },
                    style: { linePattern: { type: 'triangleRight', size: 5 } }
                },
                {
                    dataTransform: [
                        { type: 'filter', field: 'type', oneOf: ['gene'] },
                        { type: 'filter', field: 'strand', oneOf: ['-'] }
                    ],
                    mark: 'rule',
                    x: { field: 'start', type: 'genomic' },
                    strokeWidth: { value: 3 },
                    xe: { field: 'end', type: 'genomic' },
                    style: { linePattern: { type: 'triangleLeft', size: 5 } }
                }
            ],
            row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },

            visibility: [
                {
                    operation: 'less-than',
                    measure: 'width',
                    threshold: '|xe-x|',
                    transitionPadding: 10,
                    target: 'mark'
                }
            ],
            opacity: { value: 0.8 },
            width: 800,
            height: 80
        }
    ]
};
