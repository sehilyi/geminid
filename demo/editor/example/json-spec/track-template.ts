import type { GoslingSpec } from 'gosling.js';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_TEMPLATE: GoslingSpec = {
    title: 'Track Template In Gosling.js',
    subtitle: 'Gosling.js enables track templates! This allows to create complex visualization more easily.',
    spacing: 0,
    // layout: 'circular',
    layout: 'linear',
    centerRadius: 0.5,
    style: { enableSmoothPath: true },
    views: [
        {
            xDomain: { chromosome: 'chr3', interval: [52168000, 52890000] },
            tracks: [
                // {
                //     data: {
                //         url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                //         type: 'multivec',
                //         row: 'sample',
                //         column: 'position',
                //         value: 'peak',
                //         categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                //     },
                //     mark: 'point',
                //     x: { field: 'position', type: 'genomic' },
                //     y: { field: 'peak', type: 'quantitative', grid: true },
                //     size: { field: 'peak', type: 'quantitative' },
                //     color: { field: 'sample', type: 'nominal', legend: true },
                //     opacity: { value: 0.5 },
                //     width: 600,
                //     height: 330
                // },
                {
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
                        geneHeight: { value: 30 },
                        geneLabel: { field: 'name' },
                        geneLabelFontSize: { value: 30 },
                        geneLabelColor: { field: 'strand', range: ['gray'] },
                        geneLabelStroke: { value: 'white' },
                        geneLabelStrokeThickness: { value: 4 },
                        geneLabelOpacity: { value: 1 },
                        type: { field: 'type' }
                    },
                    width: 800,
                    height: 300
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr1', interval: [77925299, 77925320] },
            tracks: [
                {
                    template: 'sequence',
                    data: {
                        url: GOSLING_PUBLIC_DATA.fasta,
                        type: 'multivec',
                        row: 'base',
                        column: 'position',
                        value: 'count',
                        categories: ['A', 'T', 'G', 'C'],
                        start: 'start',
                        end: 'end'
                    },
                    encoding: {
                        barLength: { field: 'count', type: 'quantitative' },
                        baseBackground: { field: 'base', type: 'nominal' },
                        baseLabelColor: { field: 'base', type: 'nominal' },
                        position: { field: 'position', type: 'genomic' },
                        startPosition: { field: 'start', type: 'genomic' },
                        endPosition: { field: 'end', type: 'genomic' }
                    },
                    width: 800,
                    height: 100
                }
            ]
        },
        {
            xDomain: { chromosome: 'chr1' },
            tracks: [
                {
                    template: 'ideogram',
                    data: {
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                        type: 'csv',
                        chromosomeField: 'Chromosome',
                        genomicFields: ['chromStart', 'chromEnd']
                    },
                    encoding: {
                        startPosition: { field: 'chromStart' },
                        endPosition: { field: 'chromEnd' },
                        stainBackgroundColor: { field: 'Stain' },
                        stainLabelColor: { field: 'Stain' },
                        name: { field: 'Name' },
                        stainStroke: { value: 'black' }
                    },
                    width: 800,
                    height: 60
                }
            ]
        }
    ]
};
