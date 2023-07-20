import type { GoslingSpec } from 'gosling.js';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_GENE_TRANSCRIPT: GoslingSpec = {
    alignment: 'overlay',
    xDomain: { chromosome: 'chr3', interval: [142500000, 143000000] },
    data: {
        url: GOSLING_PUBLIC_DATA.transcript,
        type: 'beddb',
        genomicFields: [
            { index: 1, name: 'start' },
            { index: 2, name: 'end' }
        ],
        valueFields: [
            { index: 0, name: 'chr', type: 'nominal' },
            { index: 5, name: 'strand', type: 'nominal' },
            { index: 3, name: 'name', type: 'nominal' },
            { index: 9, name: 'exon_start', type: 'nominal' },
            { index: 10, name: 'exon_end', type: 'nominal' }
        ]
    },
    dataTransform: [
        { type: 'filter', field: 'type', oneOf: ['gene'] },
        {
            type: 'displace',
            method: 'pile',
            boundingBox: { startField: 'start', endField: 'end' },
            newField: 'row',
            maxRows: 15
        }
    ],
    title: 'hg38 | Transcript (Max. 15 Rows)',
    tracks: [
        {
            dataTransform: [
                {
                    type: 'displace',
                    method: 'pile',
                    boundingBox: { startField: 'start', endField: 'end' },
                    newField: 'row',
                    maxRows: 15
                },
                { type: 'filter', field: 'type', oneOf: ['gene'] },
                { type: 'filter', field: 'strand', oneOf: ['+'] }
            ],
            mark: 'triangleRight',
            x: {
                field: 'end',
                type: 'genomic',
                axis: 'top'
            },
            xe: undefined,
            size: { value: 15 }
        },
        {
            dataTransform: [
                {
                    type: 'displace',
                    method: 'pile',
                    boundingBox: { startField: 'start', endField: 'end' },
                    newField: 'row',
                    maxRows: 15
                },
                { type: 'filter', field: 'type', oneOf: ['gene'] }
            ],
            mark: 'text',
            text: { field: 'name', type: 'nominal' },
            x: {
                field: 'start',
                type: 'genomic'
            },
            xe: {
                field: 'end',
                type: 'genomic'
            },
            style: {
                dy: -10
            }
        },
        {
            dataTransform: [
                {
                    type: 'displace',
                    method: 'pile',
                    boundingBox: { startField: 'start', endField: 'end' },
                    newField: 'row',
                    maxRows: 15
                },
                { type: 'filter', field: 'type', oneOf: ['gene'] },
                { type: 'filter', field: 'strand', oneOf: ['-'] }
            ],
            mark: 'triangleLeft',
            x: {
                field: 'start',
                type: 'genomic'
            },
            size: { value: 15 },
            style: { align: 'right' }
        },
        {
            dataTransform: [
                {
                    type: 'displace',
                    method: 'pile',
                    boundingBox: { startField: 'start', endField: 'end' },
                    newField: 'row',
                    maxRows: 15
                },
                {
                    type: 'exonSplit',
                    separator: ',',
                    flag: { field: 'type', value: 'exon' },
                    fields: [
                        { field: 'exon_start', type: 'genomic', newField: 'start', chrField: 'chr' },
                        { field: 'exon_end', type: 'genomic', newField: 'end', chrField: 'chr' }
                    ]
                },
                { type: 'filter', field: 'type', oneOf: ['exon'] }
            ],
            mark: 'rect',
            size: { value: 10 },
            x: {
                field: 'start',
                type: 'genomic'
            },
            xe: {
                field: 'end',
                type: 'genomic'
            }
        },
        {
            dataTransform: [
                {
                    type: 'displace',
                    method: 'pile',
                    boundingBox: { startField: 'start', endField: 'end' },
                    newField: 'row',
                    maxRows: 15
                },
                { type: 'filter', field: 'type', oneOf: ['gene'] },
                { type: 'filter', field: 'strand', oneOf: ['+'] }
            ],
            mark: 'rule',
            x: {
                field: 'start',
                type: 'genomic'
            },
            strokeWidth: { value: 3 },
            xe: {
                field: 'end',
                type: 'genomic'
            },
            style: {
                linePattern: { type: 'triangleRight', size: 5 }
            }
        },
        {
            dataTransform: [
                {
                    type: 'displace',
                    method: 'pile',
                    boundingBox: { startField: 'start', endField: 'end' },
                    newField: 'row',
                    maxRows: 15
                },
                { type: 'filter', field: 'type', oneOf: ['gene'] },
                { type: 'filter', field: 'strand', oneOf: ['-'] }
            ],
            mark: 'rule',
            x: {
                field: 'start',
                type: 'genomic'
            },
            strokeWidth: { value: 3 },
            xe: {
                field: 'end',
                type: 'genomic'
            },
            style: {
                linePattern: { type: 'triangleRight', size: 5 }
            }
        }
    ],
    row: { field: 'row', type: 'nominal' },
    color: { field: 'strand', type: 'nominal', domain: ['+', '-'], range: ['#0072B2', '#D45E00'] },
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
    style: { outline: 'black' },
    width: 700,
    height: 500
};
