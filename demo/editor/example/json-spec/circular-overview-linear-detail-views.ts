import type { GoslingSpec } from 'gosling.js';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_CIRCULAR_OVERVIEW_LINEAR_DETAIL: GoslingSpec = {
    arrangement: 'vertical',
    views: [
        {
            static: true,
            layout: 'circular',
            alignment: 'stack',
            tracks: [
                {
                    alignment: 'overlay',
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                        binSize: 4
                    },
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal' },
                    stroke: { value: 'black' },
                    strokeWidth: { value: 0.3 },
                    tracks: [
                        {
                            mark: 'bar'
                        },
                        {
                            mark: 'brush',
                            x: { linkingId: 'detail-1' },
                            color: { value: 'blue' }
                        },
                        {
                            mark: 'brush',
                            x: { linkingId: 'detail-2' },
                            color: { value: 'red' }
                        }
                    ],
                    style: { outlineWidth: 0 },
                    width: 500,
                    height: 100
                },
                {
                    data: {
                        type: 'csv',
                        url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/rearrangements.bulk.1639.simple.filtered.pub',
                        headerNames: [
                            'chr1',
                            'p1s',
                            'p1e',
                            'chr2',
                            'p2s',
                            'p2e',
                            'type',
                            'id',
                            'f1',
                            'f2',
                            'f3',
                            'f4',
                            'f5',
                            'f6'
                        ],
                        separator: '\t',
                        genomicFieldsToConvert: [
                            { chromosomeField: 'chr1', genomicFields: ['p1s', 'p1e'] },
                            { chromosomeField: 'chr2', genomicFields: ['p2s', 'p2e'] }
                        ]
                    },
                    dataTransform: [
                        { type: 'filter', field: 'chr1', oneOf: ['1', '16', '14', '9', '6', '5', '3'] },
                        { type: 'filter', field: 'chr2', oneOf: ['1', '16', '14', '9', '6', '5', '3'] }
                    ],
                    mark: 'withinLink',
                    x: { field: 'p1s', type: 'genomic' },
                    xe: { field: 'p1e', type: 'genomic' },
                    x1: { field: 'p2s', type: 'genomic' },
                    x1e: { field: 'p2e', type: 'genomic' },
                    // color: {
                    //     field: 'type',
                    //     type: 'nominal',
                    //     legend: true,
                    //     domain: ['deletion', 'inversion', 'translocation', 'tandem-duplication']
                    // },
                    stroke: {
                        field: 'type',
                        type: 'nominal',
                        domain: ['deletion', 'inversion', 'translocation', 'tandem-duplication']
                    },
                    strokeWidth: { value: 0.8 },
                    opacity: { value: 0.15 },
                    width: 500,
                    height: 100
                }
            ]
        },
        {
            spacing: 10,
            arrangement: 'horizontal',
            views: [
                {
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.multivec,
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                                binSize: 4
                            },
                            mark: 'bar',
                            x: {
                                field: 'start',
                                type: 'genomic',
                                linkingId: 'detail-1',
                                domain: { chromosome: 'chr5' }
                            },
                            xe: { field: 'end', type: 'genomic' },
                            y: { field: 'peak', type: 'quantitative' },
                            row: { field: 'sample', type: 'nominal' },
                            color: { field: 'sample', type: 'nominal' },
                            stroke: { value: 'black' },
                            strokeWidth: { value: 0.3 },
                            style: {
                                background: 'blue'
                            },
                            width: 245,
                            height: 150
                        }
                    ]
                },
                {
                    tracks: [
                        {
                            data: {
                                url: GOSLING_PUBLIC_DATA.multivec,
                                type: 'multivec',
                                row: 'sample',
                                column: 'position',
                                value: 'peak',
                                categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                                binSize: 4
                            },
                            mark: 'bar',
                            x: {
                                field: 'start',
                                type: 'genomic',
                                domain: { chromosome: 'chr16' },
                                linkingId: 'detail-2'
                            },
                            xe: { field: 'end', type: 'genomic' },
                            y: { field: 'peak', type: 'quantitative' },
                            row: { field: 'sample', type: 'nominal' },
                            color: { field: 'sample', type: 'nominal', legend: true },
                            stroke: { value: 'black' },
                            strokeWidth: { value: 0.3 },
                            style: {
                                background: 'red'
                            },
                            width: 245,
                            height: 150
                        }
                    ]
                }
            ],
            style: { backgroundOpacity: 0.1 }
        }
    ]
};
