import type { DomainChrInterval, GoslingSpec, OverlaidTracks, SingleTrack, TemplateTrack } from '@gosling.schema';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

const trackColor = {
    1: '#CC7DAA',
    2: '#E6A01B'
};

const tracks: (type: 1 | 2, compact?: boolean) => SingleTrack[] = (type, compact) => [
    {
        id: `${type}-1`,
        title: `Sample 1`,
        data: {
            url: 'https://resgen.io/api/v1/tileset_info/?d=Zz3CBDSqQ3ySrOSe2yj1eg',
            type: 'vector',
            column: 'position',
            value: 'peak',
            binSize: 4
        },
        mark: 'bar',
        x: { field: 'start', type: 'genomic', axis: 'none', linkingId: `${type}` },
        xe: { field: 'end', type: 'genomic' },
        y: { field: 'peak', type: 'quantitative', axis: 'none', flip: compact && type === 2 && false },
        color: { value: trackColor[type] },
        stroke: { value: 'white' },
        strokeWidth: { value: 0.2 },
        style: { background: 'lightgray', backgroundOpacity: type === 1 || !compact ? 0 : 0.2 },
        width: 700,
        height: 100
    },
    {
        id: `${type}-2`,
        title: `Sample 2`,
        data: {
            url: 'https://resgen.io/api/v1/tileset_info/?d=dc_SOjdCRgq_8PYf6W--7w',
            type: 'vector',
            column: 'position',
            value: 'peak',
            binSize: 4
        },
        mark: 'bar',
        x: { field: 'start', type: 'genomic', axis: 'none', linkingId: `${type}` },
        xe: { field: 'end', type: 'genomic' },
        y: { field: 'peak', type: 'quantitative', axis: 'none', flip: compact && type === 2 && false },
        color: { value: trackColor[type] },
        stroke: { value: 'white' },
        strokeWidth: { value: 0.2 },
        style: { background: 'lightgray', backgroundOpacity: type === 1 || !compact ? 0 : 0.2 },
        width: 700,
        height: 100
    },
    {
        id: `${type}-3`,
        title: `Sample 3`,
        data: {
            url: 'https://resgen.io/api/v1/tileset_info/?d=Nolbrk9kS3CE0jJL_7OW1g',
            type: 'vector',
            column: 'position',
            value: 'peak',
            binSize: 4
        },
        mark: 'bar',
        x: { field: 'start', type: 'genomic', axis: 'none', linkingId: `${type}` },
        xe: { field: 'end', type: 'genomic' },
        y: { field: 'peak', type: 'quantitative', axis: 'none', flip: compact && type === 2 && false },
        color: { value: trackColor[type] },
        stroke: { value: 'white' },
        strokeWidth: { value: 0.2 },
        style: { background: 'lightgray', backgroundOpacity: type === 1 || !compact ? 0 : 0.2 },
        width: 700,
        height: 100
    }
];

// TODO: `tracks: [gene(1)]` makes error
export const gene: (type: 1 | 2, compact?: boolean) => TemplateTrack = (type, compact) => {
    return {
        template: 'gene',
        id: `${type}-gene`,
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
        encoding: {
            startPosition: { field: 'start', axis: type === 1 ? 'top' : 'bottom', linkingId: `${type}` },
            endPosition: { field: 'end' },
            strandColor: { field: 'strand', range: [trackColor[type]] },
            strandRow: { field: 'strand' },
            opacity: { value: 0.4 },
            // geneHeight: { value: 30 },
            geneLabel: { field: 'name' },
            // geneLabelFontSize: { value: 30 },
            geneLabelColor: { field: 'strand', range: [trackColor[type]] },
            geneLabelStroke: { value: 'white' },
            geneLabelStrokeThickness: { value: 4 },
            geneLabelOpacity: { value: 1 },
            type: { field: 'type' }
        },
        style: { background: 'lightgray', backgroundOpacity: type === 1 || !compact ? 0 : 0.1 },
        width: 700,
        height: 100
    };
};

const _gene: (type: 1 | 2, compact?: boolean) => OverlaidTracks = (type, compact) => {
    return {
        alignment: 'overlay',
        // title: 'Locus 1',
        id: `${type}-gene`,
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
        tracks: [
            {
                dataTransform: [
                    { type: 'filter', field: 'type', oneOf: ['gene'] },
                    { type: 'filter', field: 'strand', oneOf: ['+'] }
                ],
                mark: 'triangleRight',
                x: {
                    field: 'end',
                    type: 'genomic',
                    axis: type === 1 ? 'top' : 'bottom',
                    linkingId: `${type}`
                },
                size: { value: 15 }
            },
            {
                dataTransform: [{ type: 'filter', field: 'type', oneOf: ['gene'] }],
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
                stroke: { value: 'white' },
                strokeWidth: { value: 3 }
            },
            {
                dataTransform: [
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
                dataTransform: [{ type: 'filter', field: 'type', oneOf: ['exon'] }],
                mark: 'rect',
                x: {
                    field: 'start',
                    type: 'genomic'
                },
                xe: {
                    field: 'end',
                    type: 'genomic'
                },
                size: { value: 15 }
            },
            {
                dataTransform: [
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
                    linePattern: { type: 'triangleLeft', size: 5 }
                }
            }
        ],
        row: { field: 'strand', type: 'nominal', domain: ['+', '-'] },
        color: { value: trackColor[type] },
        visibility: [
            {
                operation: 'less-than',
                measure: 'width',
                threshold: '|xe-x|',
                transitionPadding: 10,
                target: 'mark'
            }
        ],
        style: { background: 'lightgray', backgroundOpacity: type === 1 || !compact ? 0 : 0.2 },
        opacity: { value: 0.8 },
        width: 700,
        height: 100
    };
};

const xDomain: (type: 1 | 2) => DomainChrInterval = type => {
    if (type === 1) return { chromosome: 'chr12', interval: [10140000, 10210000] };
    else return { chromosome: 'chr8', interval: [127734000, 127744000] };
};

export const EX_SPEC_RESPONSIVE_TRACK_WISE_COMPARISON: GoslingSpec = {
    spacing: 30,
    responsiveSpec: [
        {
            selectivity: [{ measure: 'height', operation: 'LT', threshold: 1000, target: 'container' }],
            spec: {
                spacing: 0,
                views: [
                    { xDomain: xDomain(1), linkingId: '1', tracks: [_gene(1, true)] },
                    { xDomain: xDomain(1), linkingId: '1', tracks: [tracks(1, true)[0]] },
                    { xDomain: xDomain(2), linkingId: '2', tracks: [tracks(2, true)[0]] },
                    { xDomain: xDomain(1), linkingId: '1', tracks: [tracks(1, true)[1]] },
                    { xDomain: xDomain(2), linkingId: '2', tracks: [tracks(2, true)[1]] },
                    { xDomain: xDomain(1), linkingId: '1', tracks: [tracks(1, true)[2]] },
                    { xDomain: xDomain(2), linkingId: '2', tracks: [tracks(2, true)[2]] },
                    { xDomain: xDomain(2), linkingId: '2', tracks: [_gene(2, true)] }
                ]
            }
        }
    ],
    views: [
        {
            spacing: 0,
            xDomain: xDomain(1),
            linkingId: '1',
            tracks: [_gene(1), ...tracks(1)]
        },
        {
            spacing: 0,
            xDomain: xDomain(2),
            linkingId: '2',
            tracks: [...tracks(2), _gene(2)]
        }
    ],
    style: { outlineWidth: 0 }
};
