import type { GoslingSpec } from 'gosling.js';

export const VCF_INDELS: GoslingSpec = {
    subtitle: 'Insertions and deletions from a VCF file',
    id: '7a921087-8e62-4a93-a757-fd8cdbe1eb8f-mid-indel',
    style: { background: '#F6F6F6' },
    data: {
        url: 'https://somatic-browser-test.s3.amazonaws.com/browserExamples/7a921087-8e62-4a93-a757-fd8cdbe1eb8f.consensus.20161006.somatic.indel.sorted.vcf.gz',
        indexUrl:
            'https://somatic-browser-test.s3.amazonaws.com/browserExamples/7a921087-8e62-4a93-a757-fd8cdbe1eb8f.consensus.20161006.somatic.indel.sorted.vcf.gz.tbi',
        type: 'vcf',
        sampleLength: 5000
    },
    dataTransform: [
        {
            type: 'concat',
            fields: ['REF', 'ALT'],
            separator: ' → ',
            newField: 'LAB'
        },
        {
            type: 'replace',
            field: 'MUTTYPE',
            replace: [
                { from: 'insertion', to: 'Insertion' },
                { from: 'deletion', to: 'Deletion' }
            ],
            newField: 'MUTTYPE'
        }
    ],
    alignment: 'overlay',
    tracks: [
        {
            size: { value: 19 },
            visibility: [
                {
                    target: 'track',
                    operation: 'GT',
                    measure: 'zoomLevel',
                    threshold: 1000
                }
            ]
        },
        {
            xe: { field: 'POSEND', type: 'genomic', axis: 'top' },
            visibility: [
                {
                    target: 'track',
                    operation: 'LTET',
                    measure: 'zoomLevel',
                    threshold: 1000
                }
            ]
        },
        {
            mark: 'text',
            text: { field: 'LAB', type: 'nominal' },
            xe: { field: 'POSEND', type: 'genomic', axis: 'top' },
            color: { value: 'white' },
            strokeWidth: { value: 0 },
            opacity: { value: 1 },
            visibility: [
                {
                    target: 'mark',
                    operation: 'LT',
                    measure: 'width',
                    transitionPadding: 30,
                    threshold: '|xe-x|'
                }
            ]
        }
    ],
    mark: 'rect',
    x: { field: 'POS', type: 'genomic' },
    stroke: {
        field: 'MUTTYPE',
        type: 'nominal',
        domain: ['Insertion', 'Deletion']
    },
    strokeWidth: { value: 1 },
    color: {
        field: 'MUTTYPE',
        type: 'nominal',
        domain: ['Insertion', 'Deletion']
    },
    row: {
        field: 'MUTTYPE',
        type: 'nominal',
        legend: true,
        domain: ['Insertion', 'Deletion']
    },
    tooltip: [
        { field: 'POS', type: 'genomic' },
        { field: 'POSEND', type: 'genomic' },
        { field: 'MUTTYPE', type: 'nominal' },
        { field: 'ALT', type: 'nominal' },
        { field: 'REF', type: 'nominal' },
        { field: 'QUAL', type: 'quantitative' }
    ],
    opacity: { value: 0.9 },
    width: 440,
    height: 40
};
