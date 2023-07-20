import type { Domain, GoslingSpec, View } from '@gosling.schema';

export function EX_SPEC_VIEW_PILEUP(
    id: string,
    width: number,
    height: number,
    xDomain: Exclude<Domain, string[] | number[]>
): View {
    const maxInsertSize = 300;
    return {
        static: false,
        layout: 'linear',
        centerRadius: 0.05,
        xDomain: xDomain,
        spacing: 0.01,
        tracks: [
            {
                alignment: 'overlay',
                title: 'example_higlass.bam',
                data: {
                    type: 'bam',
                    url: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam',
                    indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam.bai',
                    loadMates: true
                },
                mark: 'bar',
                tracks: [
                    {
                        dataTransform: [
                            {
                                type: 'coverage',
                                startField: 'start',
                                endField: 'end'
                            }
                        ],
                        x: { field: 'start', type: 'genomic' },
                        xe: { field: 'end', type: 'genomic' },
                        y: { field: 'coverage', type: 'quantitative', axis: 'right' },
                        color: { value: '#C6C6C6' }
                    }
                ],
                style: { outlineWidth: 0.5 },
                width,
                height: 80
            },
            {
                alignment: 'overlay',
                title: 'example_higlass.bam',
                data: {
                    type: 'bam',
                    url: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam',
                    indexUrl: 'https://s3.amazonaws.com/gosling-lang.org/data/example_higlass.bam.bai',
                    loadMates: true,
                    maxInsertSize
                },
                mark: 'rect',
                tracks: [
                    {
                        dataTransform: [
                            {
                                type: 'displace',
                                method: 'pile',
                                boundingBox: {
                                    startField: 'start',
                                    endField: 'end',
                                    padding: 5,
                                    isPaddingBP: true
                                },
                                newField: 'pileup-row'
                            }
                        ],
                        x: { field: 'start', type: 'genomic' },
                        xe: { field: 'end', type: 'genomic' },
                        color: [
                            {
                                field: 'svType',
                                type: 'nominal',
                                legend: true,
                                domain: [
                                    'normal read',
                                    'deletion (+-)',
                                    'inversion (++)',
                                    'inversion (--)',
                                    'duplication (-+)',
                                    'more than two mates',
                                    'mates not found within chromosome',
                                    'clipping'
                                ],
                                range: [
                                    '#C8C8C8',
                                    '#E79F00',
                                    '#029F73',
                                    '#0072B2',
                                    '#CB7AA7',
                                    '#57B4E9',
                                    '#D61E2E',
                                    '#414141'
                                ]
                            },
                            {
                                field: 'insertSize',
                                type: 'quantitative',
                                legend: true
                            }
                        ][0] as any
                    },
                    {
                        dataTransform: [
                            {
                                type: 'displace',
                                method: 'pile',
                                boundingBox: {
                                    startField: 'start',
                                    endField: 'end',
                                    padding: 5,
                                    isPaddingBP: true
                                },
                                newField: 'pileup-row'
                            },
                            {
                                type: 'subjson',
                                field: 'substitutions',
                                genomicField: 'pos',
                                baseGenomicField: 'start',
                                genomicLengthField: 'length'
                            },
                            { type: 'filter', field: 'type', oneOf: ['S', 'H'] }
                        ],
                        x: { field: 'pos_start', type: 'genomic' },
                        xe: { field: 'pos_end', type: 'genomic' },
                        color: { value: '#414141' }
                    }
                ],
                tooltip: [
                    { field: 'start', type: 'genomic' },
                    { field: 'end', type: 'genomic' },
                    { field: 'insertSize', type: 'quantitative' },
                    { field: 'svType', type: 'nominal' },
                    { field: 'strand', type: 'nominal' },
                    { field: 'numMates', type: 'quantitative' },
                    { field: 'mateIds', type: 'nominal' }
                ],
                row: { field: 'pileup-row', type: 'nominal', padding: 0.2 },
                style: { outlineWidth: 0.5, legendTitle: `Insert Size = ${maxInsertSize}bp` },
                width,
                height
            }
        ]
    };
}

export const EX_SPEC_PILEUP: GoslingSpec = {
    title: 'Pileup Track Using BAM Data',
    subtitle: '',
    ...EX_SPEC_VIEW_PILEUP('bam', 1250, 600, { chromosome: 'chr1', interval: [136750, 139450] })
};
