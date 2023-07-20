import type { GoslingSpec, SingleTrack } from '@gosling.schema';
import { GOSLING_PUBLIC_DATA } from './gosling-data';
import { CytoBands } from './ideograms';

export const BAR: SingleTrack = {
    data: {
        url: GOSLING_PUBLIC_DATA.multivec,
        type: 'multivec',
        row: 'sample',
        column: 'position',
        value: 'peak',
        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
        binSize: 16
    },
    mark: 'bar',
    x: {
        field: 'start',
        type: 'genomic'
    },
    xe: {
        field: 'end',
        type: 'genomic'
    },
    color: { field: 'sample', type: 'nominal' },
    y: { field: 'peak', type: 'quantitative', axis: 'none' },
    tooltip: [
        { field: 'start', type: 'genomic', alt: 'Start Position' },
        { field: 'end', type: 'genomic', alt: 'End Position' },
        { field: 'peak', type: 'quantitative', alt: 'Value', format: '.2' },
        { field: 'sample', type: 'nominal', alt: 'Sample' }
    ],
    width: 600,
    height: 60
};

export const EX_SPEC_MOUSE_EVENT: GoslingSpec = {
    title: 'Custom Mouse Events',
    subtitle: 'Customize mouse hovering and range selection events',
    xDomain: { chromosome: 'chr1' },
    views: [
        {
            tracks: [
                {
                    title: 'Individual Marks',
                    ...BAR,
                    experimental: {
                        mouseEvents: {
                            mouseOver: true,
                            rangeSelect: true
                        }
                    },
                    style: {
                        mouseOver: {
                            color: 'blue',
                            opacity: 0.5,
                            strokeWidth: 0
                        },
                        select: {
                            color: 'red',
                            opacity: 0.5
                        },
                        brush: {
                            color: 'purple',
                            stroke: 'purple'
                        }
                    }
                }
            ]
        },
        {
            tracks: [
                {
                    title: 'Group Marks By Sample',
                    ...BAR,
                    experimental: {
                        mouseEvents: {
                            mouseOver: true,
                            rangeSelect: true,
                            groupMarksByField: 'sample'
                        }
                    },
                    style: {
                        mouseOver: {
                            color: 'blue',
                            opacity: 0.5,
                            strokeWidth: 0
                        },
                        select: {
                            color: 'red',
                            opacity: 0.5
                        },
                        brush: {
                            color: 'green',
                            stroke: 'green'
                        }
                    }
                }
            ]
        },
        {
            tracks: [
                {
                    title: 'Group Marks By Genomic Position',
                    ...BAR,
                    experimental: {
                        mouseEvents: {
                            mouseOver: true,
                            rangeSelect: true,
                            groupMarksByField: 'position'
                        }
                    },
                    style: {
                        mouseOver: {
                            color: 'blue',
                            opacity: 0.5,
                            strokeWidth: 0
                        },
                        select: {
                            color: 'red',
                            opacity: 0.5
                        },
                        brush: {
                            color: 'yellow',
                            stroke: 'yellow'
                        }
                    }
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr3', interval: [52168000, 52890000] },
            tracks: [
                {
                    title: 'Group Marks By Gene',
                    template: 'gene',
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
                        startPosition: { field: 'start' },
                        endPosition: { field: 'end' },
                        strandColor: { field: 'strand', range: ['gray'] },
                        strandRow: { field: 'strand' },
                        opacity: { value: 0.4 },
                        geneHeight: { value: 20 },
                        geneLabel: { field: 'name' },
                        geneLabelFontSize: { value: 20 },
                        geneLabelColor: { field: 'strand', range: ['gray'] },
                        geneLabelStroke: { value: 'white' },
                        geneLabelStrokeThickness: { value: 4 },
                        geneLabelOpacity: { value: 1 },
                        type: { field: 'type' }
                    },
                    tooltip: [{ field: 'name', type: 'nominal' }],
                    width: BAR.width,
                    height: BAR.height,
                    experimental: {
                        mouseEvents: {
                            mouseOver: true,
                            rangeSelect: true,
                            groupMarksByField: 'name'
                        }
                    },
                    style: {
                        mouseOver: {
                            arrange: 'behind',
                            color: '#E0E0E0',
                            stroke: '#E0E0E0',
                            strokeWidth: 4
                        },
                        select: {
                            arrange: 'behind',
                            color: '#B9D4FA',
                            stroke: '#B9D4FA',
                            strokeWidth: 4
                        }
                    }
                }
            ]
        },
        {
            xDomain: { interval: [1, 1000000000] },
            tracks: [
                {
                    title: 'Group Marks By Chromosome',
                    ...CytoBands,
                    size: { value: 20 },
                    height: 60,
                    tooltip: [{ field: 'Chr.', type: 'nominal' }],
                    experimental: {
                        mouseEvents: {
                            click: true,
                            mouseOver: true,
                            rangeSelect: true,
                            groupMarksByField: 'Chr.'
                        }
                    },
                    style: {
                        mouseOver: {
                            color: 'blue',
                            opacity: 0.5,
                            strokeWidth: 0
                        },
                        select: {
                            color: 'red',
                            opacity: 0.5,
                            strokeWidth: 0
                        }
                    }
                }
            ]
        }
    ]
};
