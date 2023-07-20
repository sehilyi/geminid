import type { GoslingSpec } from 'gosling.js';

export const EX_SPEC_BAND: GoslingSpec = {
    layout: 'linear',
    xDomain: { chromosome: 'chr1', interval: [103900000, 104100000] },
    spacing: 0,
    tracks: [
        {
            data: {
                type: 'csv',
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                chromosomeField: 'c2',
                genomicFields: ['s1', 'e1', 's2', 'e2']
            },
            mark: 'rect',
            x: { field: 's1', type: 'genomic' },
            xe: { field: 'e1', type: 'genomic' },
            stroke: { value: '#4C6629' },
            strokeWidth: { value: 0.8 },
            tooltip: [
                { field: 's1', type: 'genomic', alt: '<b style="color:green">Start Position</b>' },
                { field: 'e1', type: 'genomic', alt: '<b style="color:green">End Position</b>' }
            ],
            opacity: { value: 0.15 },
            color: { value: '#85B348' },
            width: 500,
            height: 16
        },
        {
            data: {
                type: 'csv',
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                chromosomeField: 'c2',
                genomicFields: ['s1', 'e1', 's2', 'e2']
            },
            mark: 'betweenLink',
            x: { field: 's1', type: 'genomic' },
            xe: { field: 'e1', type: 'genomic' },
            x1: { field: 's2', type: 'genomic' },
            x1e: { field: 'e2', type: 'genomic' },
            stroke: { value: '#4C6629' },
            strokeWidth: { value: 0.8 },
            opacity: { value: 0.15 },
            color: { value: '#85B348' },
            style: { outlineWidth: 0 },
            width: 500,
            height: 100
        },
        {
            data: {
                type: 'csv',
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                chromosomeField: 'c2',
                genomicFields: ['s1', 'e1', 's2', 'e2']
            },
            mark: 'rect',
            x: { field: 's2', type: 'genomic' },
            xe: { field: 'e2', type: 'genomic' },
            stroke: { value: '#4C6629' },
            strokeWidth: { value: 0.8 },
            tooltip: [
                { field: 's2', type: 'genomic', alt: '<b style="color:green">Start Position</b>' },
                { field: 'e2', type: 'genomic', alt: '<b style="color:green">End Position</b>' }
            ],
            opacity: { value: 0.15 },
            color: { value: '#85B348' },
            width: 500,
            height: 16
        },
        {
            data: {
                type: 'csv',
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                chromosomeField: 'c2',
                genomicFields: ['s1', 'e1', 's2', 'e2']
            },
            mark: 'betweenLink',
            x1: { field: 's1', type: 'genomic' },
            x1e: { field: 'e1', type: 'genomic' },
            x: { field: 's2', type: 'genomic' },
            xe: { field: 'e2', type: 'genomic' },
            stroke: { value: '#4C6629' },
            strokeWidth: { value: 0.8 },
            opacity: { value: 0.15 },
            color: { value: '#85B348' },
            style: { outlineWidth: 0 },
            width: 500,
            height: 100
        },
        {
            data: {
                type: 'csv',
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                chromosomeField: 'c2',
                genomicFields: ['s1', 'e1', 's2', 'e2']
            },
            mark: 'rect',
            x: { field: 's1', type: 'genomic' },
            xe: { field: 'e1', type: 'genomic' },
            stroke: { value: '#4C6629' },
            strokeWidth: { value: 0.8 },
            tooltip: [
                { field: 's1', type: 'genomic', alt: '<b style="color:green">Start Position</b>' },
                { field: 'e1', type: 'genomic', alt: '<b style="color:green">End Position</b>' }
            ],
            opacity: { value: 0.15 },
            color: { value: '#85B348' },
            width: 500,
            height: 16
        },
        {
            data: {
                type: 'csv',
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                chromosomeField: 'c2',
                genomicFields: ['s1', 'e1', 's2', 'e2']
            },
            mark: 'betweenLink',
            x: { field: 's1', type: 'genomic' },
            xe: { field: 'e1', type: 'genomic' },
            x1: { field: 's2', type: 'genomic' },
            x1e: { field: 'e2', type: 'genomic' },
            stroke: { value: '#4C6629' },
            strokeWidth: { value: 0.8 },
            opacity: { value: 0.15 },
            color: { value: '#85B348' },
            style: { outlineWidth: 0 },
            width: 500,
            height: 100
        },
        {
            data: {
                type: 'csv',
                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                chromosomeField: 'c2',
                genomicFields: ['s1', 'e1', 's2', 'e2']
            },
            mark: 'rect',
            x: { field: 's2', type: 'genomic' },
            xe: { field: 'e2', type: 'genomic' },
            stroke: { value: '#4C6629' },
            strokeWidth: { value: 0.8 },
            tooltip: [
                { field: 's2', type: 'genomic', alt: '<b style="color:green">Start Position</b>' },
                { field: 'e2', type: 'genomic', alt: '<b style="color:green">End Position</b>' }
            ],
            opacity: { value: 0.15 },
            color: { value: '#85B348' },
            width: 500,
            height: 16
        }
    ]
};
