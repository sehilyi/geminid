import type { GoslingSpec, OverlaidTracks, Track } from '@gosling.schema';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const CytoBands: OverlaidTracks = {
    alignment: 'overlay',
    data: {
        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/cytogenetic_band.csv',
        type: 'csv',
        chromosomeField: 'Chr.',
        genomicFields: ['ISCN_start', 'ISCN_stop', 'Basepair_start', 'Basepair_stop']
    },
    tracks: [
        {
            mark: 'text',
            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1', 'acen-2'], not: true }],
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
                range: ['white', '#D9D9D9', '#979797', '#636363', 'black']
            }
        },
        {
            mark: 'rect',
            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['gvar'] }],
            color: { value: '#A0A0F2' }
        },
        {
            mark: 'triangleRight',
            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-1'] }],
            color: { value: '#B40101' }
        },
        {
            mark: 'triangleLeft',
            dataTransform: [{ type: 'filter', field: 'Stain', oneOf: ['acen-2'] }],
            color: { value: '#B40101' }
        }
    ],
    x: { field: 'Basepair_start', type: 'genomic' },
    xe: { field: 'Basepair_stop', type: 'genomic' },
    stroke: { value: 'gray' },
    strokeWidth: { value: 0.5 },
    width: 600,
    height: 20
};

const StackedPeaks: Track = {
    data: {
        url: GOSLING_PUBLIC_DATA.multivec,
        type: 'multivec',
        row: 'sample',
        column: 'position',
        value: 'peak',
        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
    },
    mark: 'area',
    x: {
        field: 'position',
        type: 'genomic'
    },
    y: { field: 'peak', type: 'quantitative' },
    color: { field: 'sample', type: 'nominal' },
    width: 600,
    height: 30
};

export const EX_SPEC_CYTOBANDS: GoslingSpec = {
    static: true,
    layout: 'linear',
    centerRadius: 0.2,
    arrangement: 'parallel',
    views: [
        {
            xDomain: { chromosome: 'chr1' },
            tracks: [
                { ...StackedPeaks, width: 1000 },
                { ...CytoBands, width: 1000 }
            ]
        },
        {
            xDomain: { chromosome: 'chr2' },
            tracks: [
                { ...StackedPeaks, width: 970 },
                { ...CytoBands, width: 970 }
            ]
        },
        {
            xDomain: { chromosome: 'chr3' },
            tracks: [
                { ...StackedPeaks, width: 800 },
                { ...CytoBands, width: 800 }
            ]
        },
        {
            xDomain: { chromosome: 'chr4' },
            tracks: [
                { ...StackedPeaks, width: 770 },
                { ...CytoBands, width: 770 }
            ]
        },
        {
            xDomain: { chromosome: 'chr5' },
            tracks: [
                { ...StackedPeaks, width: 740 },
                { ...CytoBands, width: 740 }
            ]
        }
    ]
};
