import type { OverlaidTracks, SingleTrack, SingleView } from '@gosling.schema';
import type { GoslingSpec } from 'gosling.js';
import { CHANNEL_DEFAULTS } from '../../../src/core/channel';

type GapBarProp = {
    title: boolean;
    width: number;
    height: number;
    yAxis: boolean;
};
export const gapBar: (prop: GapBarProp) => SingleTrack = prop => {
    return {
        title: prop.title ? 'Gap' : undefined,
        data: {
            url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.gap.csv',
            type: 'csv',
            genomicFields: ['pos'],
            sampleLength: 99999
        },
        mark: 'bar',
        x: { field: 'start', type: 'genomic', axis: 'none' },
        xe: { field: 'end', type: 'genomic', axis: 'none' },
        y: { field: 'gap', type: 'quantitative', axis: prop.yAxis ? 'right' : 'none' },
        color: { value: 'gray' },
        stroke: { value: 'white' },
        strokeWidth: { value: 0 },
        width: prop.width,
        height: prop.height
    };
};

type ConservationBarProp = GapBarProp;
export const conservationBar: (prop: ConservationBarProp) => SingleTrack = prop => {
    return {
        title: prop.title ? 'Conservation' : undefined,
        data: {
            url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.conservation.csv',
            type: 'csv',
            genomicFields: ['pos'],
            sampleLength: 99999
        },
        mark: 'bar',
        x: { field: 'start', type: 'genomic', axis: 'none' },
        xe: { field: 'end', type: 'genomic', axis: 'none' },
        y: { field: 'conservation', type: 'quantitative', axis: prop.yAxis ? 'right' : 'none' },
        color: { field: 'conservation', type: 'quantitative' },
        stroke: { value: 'white' },
        strokeWidth: { value: 0 },
        width: prop.width,
        height: prop.height
    };
};

type AlignmentProp = {
    width: number;
    height: number;
    xAxis: boolean;
    rowLegend: boolean;
    colorLegend: boolean;
};
export const alignmentWithText: (prop: AlignmentProp) => OverlaidTracks = prop => {
    return {
        alignment: 'overlay',
        data: {
            url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.fasta.csv',
            type: 'csv',
            genomicFields: ['pos'],
            sampleLength: 99999
        },
        tracks: [
            {
                mark: 'rect'
            },
            {
                mark: 'text',
                x: { field: 'start', type: 'genomic' },
                xe: { field: 'end', type: 'genomic' },
                color: { value: 'black' },
                size: { value: 12 },
                visibility: [
                    {
                        measure: 'zoomLevel',
                        target: 'track',
                        threshold: 10,
                        operation: 'LT',
                        transitionPadding: 100
                    }
                ]
            }
        ],
        x: { field: 'pos', type: 'genomic', axis: prop.xAxis ? 'bottom' : 'none' },
        row: { field: 'name', type: 'nominal', legend: prop.rowLegend },
        color: {
            field: 'base',
            type: 'nominal',
            range: CHANNEL_DEFAULTS.NOMINAL_COLOR_EXTENDED.slice(0, 20),
            legend: prop.colorLegend
        },
        stroke: { value: 'white' },
        strokeWidth: { value: 0 },
        text: { field: 'base', type: 'nominal' },
        width: prop.width,
        height: prop.height
    };
};

export const alignmentWithoutText: (prop: AlignmentProp) => SingleTrack = prop => {
    return {
        data: {
            url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/alignment_viewer_p53.fasta.csv',
            type: 'csv',
            genomicFields: ['pos'],
            sampleLength: 99999
        },
        mark: 'rect',
        x: { field: 'pos', type: 'genomic', axis: prop.xAxis ? 'bottom' : 'none' },
        row: { field: 'name', type: 'nominal', legend: prop.rowLegend },
        color: {
            field: 'base',
            type: 'nominal',
            range: CHANNEL_DEFAULTS.NOMINAL_COLOR_EXTENDED.slice(0, 20),
            legend: prop.colorLegend
        },
        stroke: { value: 'white' },
        strokeWidth: { value: 0 },
        text: { field: 'base', type: 'nominal' },
        width: prop.width,
        height: prop.height
    };
};

export const EX_SPEC_ALIGNMENT_CHART: GoslingSpec = {
    // responsiveSize: true,
    description: 'reference: https://dash.plotly.com/dash-bio/alignmentchart',
    zoomLimits: [1, 396],
    xDomain: { interval: [350, 396] },
    assembly: 'unknown',
    style: { outline: 'lightgray' },
    views: [
        {
            linkingId: '-',
            spacing: 30,
            tracks: [
                gapBar({ title: true, width: 800, height: 100, yAxis: true }),
                conservationBar({ title: true, width: 800, height: 150, yAxis: true }),
                alignmentWithText({ width: 800, height: 500, xAxis: true, rowLegend: true, colorLegend: true })
            ]
        },
        {
            static: true,
            xDomain: { interval: [0, 396] },
            alignment: 'overlay',
            tracks: [
                alignmentWithoutText({ width: 800, height: 150, xAxis: false, rowLegend: false, colorLegend: false }),
                conservationBar({ title: false, width: 800, height: 150, yAxis: false }),
                gapBar({ title: false, width: 800, height: 150, yAxis: false }),
                {
                    mark: 'brush',
                    x: { linkingId: '-' },
                    color: { value: 'black' },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 1 },
                    opacity: { value: 0.3 }
                }
            ],
            width: 800,
            height: 150
        }
    ]
};

const mainView: SingleView = {
    linkingId: '-',
    spacing: 30,
    tracks: [
        gapBar({ title: true, width: 800, height: 100, yAxis: true }),
        conservationBar({ title: true, width: 800, height: 150, yAxis: true }),
        alignmentWithText({ width: 800, height: 500, xAxis: true, rowLegend: true, colorLegend: true })
    ]
};
const compactMainView: SingleView = {
    linkingId: '-',
    spacing: 30,
    tracks: [alignmentWithText({ width: 800, height: 500, xAxis: false, rowLegend: false, colorLegend: false })]
};
const overview: SingleView = {
    static: true,
    xDomain: { interval: [0, 396] },
    alignment: 'overlay',
    tracks: [
        alignmentWithoutText({ width: 800, height: 150, xAxis: false, rowLegend: false, colorLegend: false }),
        conservationBar({ title: false, width: 800, height: 150, yAxis: false }),
        gapBar({ title: false, width: 800, height: 150, yAxis: false }),
        {
            mark: 'brush',
            x: { linkingId: '-' },
            color: { value: 'black' },
            stroke: { value: 'black' },
            strokeWidth: { value: 1 },
            opacity: { value: 0.3 }
        }
    ],
    width: 800,
    height: 150
};
export const EX_SPEC_RESPONSIVE_ALIGNMENT_CHART: GoslingSpec = {
    responsiveSize: true,
    description: 'reference: https://dash.plotly.com/dash-bio/alignmentchart',
    zoomLimits: [1, 396],
    xDomain: { interval: [350, 396] },
    assembly: 'unknown',
    style: { outline: 'lightgray' },
    views: [mainView, overview],
    responsiveSpec: [
        {
            selectivity: [
                { measure: 'width', operation: 'LT', threshold: 600 },
                { measure: 'height', operation: 'LT', threshold: 600 }
            ],
            spec: { xDomain: { interval: [0, 396] }, views: [{ ...compactMainView, layout: 'circular' }] }
        },
        {
            selectivity: [{ measure: 'height', operation: 'LT', threshold: 800 }],
            spec: { xDomain: { interval: [0, 396] }, views: [mainView] }
        },
        {
            selectivity: [{ measure: 'height', operation: 'LT', threshold: 600 }],
            spec: { xDomain: { interval: [0, 396] }, views: [compactMainView] }
        }
    ]
};
