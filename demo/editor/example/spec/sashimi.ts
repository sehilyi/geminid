import type { BamData, GoslingSpec } from '@gosling.schema';

const bamData: BamData = {
    type: 'bam',
    url: 'https://s3.amazonaws.com/gosling-lang.org/data/sashimi/ENCFF088HTJ.chr10_27035000_27050000.bam',
    indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/sashimi/ENCFF088HTJ.chr10_27035000_27050000.bam.bai'
};

const spec: GoslingSpec = {
    title: 'Sashimi Plot',
    subtitle: 'Junction extraction from a BAM file',
    description: 'https://github.com/guigolab/ggsashimi/blob/master/examples/sashimi.pdf',
    style: { outlineWidth: 0 },
    spacing: 0,
    static: true,
    views: [
        {
            // TODO: assembly not properly chosen
            xDomain: { interval: [1707408143 + (27040527 - 27035000), 1707408143 + (27040527 - 27035000) + 7549] },
            tracks: [
                {
                    data: {
                        ...bamData,
                        extractJunction: true,
                        junctionMinCoverage: 100
                    },
                    alignment: 'overlay',
                    tracks: [
                        { mark: 'withinLink' },
                        {
                            mark: 'text',
                            text: { field: 'score', type: 'nominal' },
                            color: { value: 'black' },
                            stroke: { value: 'white' },
                            strokeWidth: { value: 3 },
                            visibility: [
                                {
                                    target: 'mark',
                                    measure: 'width',
                                    threshold: '|xe-x|',
                                    transitionPadding: 10,
                                    operation: 'LT'
                                }
                            ]
                        }
                    ],
                    x: { field: 'start', type: 'genomic', axis: 'none' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'score', type: 'quantitative' },
                    stroke: { value: '#FFC153' },
                    strokeWidth: { field: 'score', type: 'quantitative', range: [1, 4] },
                    opacity: { value: 0.8 },
                    style: { linkStyle: 'elliptical' },
                    width: 800,
                    height: 80
                },
                {
                    data: bamData,
                    dataTransform: [
                        {
                            type: 'coverage',
                            startField: 'start',
                            endField: 'end'
                        }
                    ],
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'coverage', type: 'quantitative' },
                    color: { value: '#FFC153' },
                    width: 800,
                    height: 80
                }
            ]
        },
        {
            // xDomain: { chromosome: 'chr10', interval: [27035000, 27150000] },
            xDomain: { chromosome: 'chr10', interval: [27040527, 27048076] },
            tracks: [
                {
                    data: {
                        type: 'csv',
                        url: 'https://s3.amazonaws.com/gosling-lang.org/data/sashimi/ggsashimi-annotation.gtf',
                        headerNames: ['chrom', 'name', 'type', 'start', 'end'],
                        separator: '\t',
                        chromosomeField: 'chrom',
                        genomicFields: ['start', 'end']
                    },
                    alignment: 'overlay',
                    mark: 'rect',
                    tracks: [
                        {
                            dataTransform: [{ type: 'filter', field: 'type', oneOf: ['exon'] }]
                        },
                        {
                            dataTransform: [{ type: 'filter', field: 'type', oneOf: ['gene'] }],
                            size: { value: 6 }
                        }
                    ],
                    x: { field: 'start', type: 'genomic', axis: 'bottom' },
                    xe: { field: 'end', type: 'genomic' },
                    color: { value: 'gray' },
                    // color: { field: 'type', type: 'nominal', legend: true },
                    width: 800,
                    height: 30
                }
            ]
        },
        {
            // xDomain: { interval: [1707408143, 1707408143 + 15000] },
            xDomain: { interval: [1707408143 + (27040527 - 27035000), 1707408143 + (27040527 - 27035000) + 7549] },
            tracks: [
                {
                    data: bamData,
                    dataTransform: [
                        {
                            type: 'displace',
                            method: 'pile',
                            boundingBox: { startField: 'start', endField: 'end', padding: 4, isPaddingBP: true },
                            newField: 'pileup-row'
                        }
                    ],
                    mark: 'bar',
                    x: { field: 'start', type: 'genomic', axis: 'none' },
                    xe: { field: 'end', type: 'genomic' },
                    row: { field: 'pileup-row', type: 'nominal', padding: 0.05 },
                    color: { value: 'grey' },
                    width: 800,
                    height: 400
                }
            ]
        }
    ]
};

export { spec };
