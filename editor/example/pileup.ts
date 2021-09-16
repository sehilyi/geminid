import type { Domain, DomainGene, GoslingSpec, View } from '@gosling.schema';
import { EX_TRACK_SEMANTIC_ZOOM } from './semantic-zoom';

export function EX_SPEC_VIEW_PILEUP(
    id: string,
    width: number,
    height: number,
    xDomain: Exclude<Domain, string[] | number[] | DomainGene>,
    strandColor?: [number, number]
): View {
    return {
        static: false,
        layout: 'linear',
        centerRadius: 0.05,
        xDomain: xDomain,
        spacing: 0.01,
        tracks: [
            {
                id,
                title: 'Coverage',
                // prerelease: { testUsingNewRectRenderingForBAM: true },
                data: {
                    type: 'bam',
                    // url: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam'
                    url: 'https://aveit.s3.amazonaws.com/higlass/bam/example_higlass.bam',
                    indexUrl: 'https://aveit.s3.amazonaws.com/higlass/bam/example_higlass.bam.bai'
                },
                dataTransform: [{ type: 'coverage', startField: 'from', endField: 'to' }],
                mark: 'bar',
                x: { field: 'from', type: 'genomic' },
                xe: { field: 'to', type: 'genomic' },
                y: { field: 'coverage', type: 'quantitative', axis: 'right', grid: true },
                color: { value: 'lightgray' },
                stroke: { value: 'gray' },
                width,
                height: 80
            },
            {
                alignment: 'overlay',
                title: 'hg38 | Genes',
                data: {
                    url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=gene-annotation',
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
                tracks: [
                    {
                        dataTransform: [
                            { type: 'filter', field: 'type', oneOf: ['gene'] },
                            { type: 'filter', field: 'strand', oneOf: ['+'] }
                        ],
                        mark: 'triangleRight',
                        x: { field: 'end', type: 'genomic' },
                        size: { value: 15 }
                    },
                    {
                        dataTransform: [{ type: 'filter', field: 'type', oneOf: ['gene'] }],
                        mark: 'text',
                        text: { field: 'name', type: 'nominal' },
                        x: { field: 'start', type: 'genomic' },
                        xe: { field: 'end', type: 'genomic' },
                        style: { dy: -15, outline: 'black', outlineWidth: 0 }
                    },
                    {
                        dataTransform: [
                            { type: 'filter', field: 'type', oneOf: ['gene'] },
                            { type: 'filter', field: 'strand', oneOf: ['-'] }
                        ],
                        mark: 'triangleLeft',
                        x: { field: 'start', type: 'genomic' },
                        size: { value: 15 },
                        style: {
                            align: 'right',
                            outline: 'black',
                            outlineWidth: 0
                        }
                    },
                    {
                        dataTransform: [{ type: 'filter', field: 'type', oneOf: ['exon'] }],
                        mark: 'rect',
                        x: { field: 'start', type: 'genomic' },
                        size: { value: 15 },
                        xe: { field: 'end', type: 'genomic' }
                    },
                    {
                        dataTransform: [
                            { type: 'filter', field: 'type', oneOf: ['gene'] },
                            { type: 'filter', field: 'strand', oneOf: ['+'] }
                        ],
                        mark: 'rule',
                        x: { field: 'start', type: 'genomic' },
                        strokeWidth: { value: 2 },
                        xe: { field: 'end', type: 'genomic' },
                        style: {
                            linePattern: { type: 'triangleRight', size: 3.5 },
                            outline: 'black',
                            outlineWidth: 0
                        }
                    },
                    {
                        dataTransform: [
                            { type: 'filter', field: 'type', oneOf: ['gene'] },
                            { type: 'filter', field: 'strand', oneOf: ['-'] }
                        ],
                        mark: 'rule',
                        x: { field: 'start', type: 'genomic' },
                        strokeWidth: { value: 2 },
                        xe: { field: 'end', type: 'genomic' },
                        style: {
                            linePattern: { type: 'triangleLeft', size: 3.5 },
                            outline: 'black',
                            outlineWidth: 0
                        }
                    }
                ],
                row: {
                    field: 'strand',
                    type: 'nominal',
                    domain: ['+', '-']
                },
                color: {
                    field: 'strand',
                    type: 'nominal',
                    domain: ['+', '-'],
                    range: ['#97A8B2', '#D4C6BA'] //['blue', 'red']
                },
                visibility: [
                    {
                        operation: 'less-than',
                        measure: 'width',
                        threshold: '|xe-x|',
                        transitionPadding: 10,
                        target: 'mark'
                    }
                ],
                // opacity: { value: 0.4 },
                width,
                height: 100
            },
            {
                title: 'Sequence',
                ...EX_TRACK_SEMANTIC_ZOOM.sequence,
                style: { inlineLegend: true, outline: 'white' },
                width,
                height: 40
            },
            {
                alignment: 'overlay',
                title: 'Reads',
                // prerelease: { testUsingNewRectRenderingForBAM: true },
                data: {
                    type: 'bam',
                    // url: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam'
                    url: 'https://aveit.s3.amazonaws.com/higlass/bam/example_higlass.bam',
                    indexUrl: 'https://aveit.s3.amazonaws.com/higlass/bam/example_higlass.bam.bai'
                },
                mark: 'rect',
                tracks: [
                    {
                        dataTransform: [
                            {
                                type: 'displace',
                                method: 'pile',
                                boundingBox: {
                                    startField: 'from',
                                    endField: 'to',
                                    groupField: 'strand',
                                    padding: 5,
                                    isPaddingBP: true
                                },
                                newField: 'pileup-row'
                            }
                        ],
                        x: { field: 'from', type: 'genomic' },
                        xe: { field: 'to', type: 'genomic' },
                        stroke: { value: 'white' },
                        strokeWidth: { value: 0.5 }
                    },
                    {
                        dataTransform: [
                            {
                                type: 'displace',
                                method: 'pile',
                                boundingBox: {
                                    startField: 'from',
                                    endField: 'to',
                                    groupField: 'strand',
                                    padding: 5,
                                    isPaddingBP: true
                                },
                                newField: 'pileup-row'
                            },
                            {
                                type: 'subjson',
                                field: 'substitutions',
                                genomicField: 'pos',
                                baseGenomicField: 'from',
                                genomicLengthField: 'length'
                            },
                            { type: 'filter', field: 'type', oneOf: ['sub'] }
                        ],
                        x: { field: 'pos_start', type: 'genomic' },
                        xe: { field: 'pos_end', type: 'genomic' },
                        color: {
                            field: 'variant',
                            type: 'nominal',
                            domain: ['A', 'T', 'G', 'C', 'S', 'H', 'X', 'I', 'D'],
                            legend: true
                        }
                    }
                ],
                y: { field: 'pileup-row', type: 'nominal', flip: false },
                row: { field: 'strand', type: 'nominal', domain: ['+', '-'], padding: 1 },
                color: {
                    field: 'strand',
                    type: 'nominal',
                    domain: ['+', '-'],
                    range: strandColor ?? ['#97A8B2', '#D4C6BA']
                },
                style: { outlineWidth: 0.5 },
                width,
                height
            }
        ]
    };
}

export const EX_SPEC_PILEUP: GoslingSpec = {
    title: 'Pileup Track Using BAM Data',
    subtitle: '',
    ...EX_SPEC_VIEW_PILEUP('bam', 1250, 600, { chromosome: '1', interval: [136750, 139450] })
};
