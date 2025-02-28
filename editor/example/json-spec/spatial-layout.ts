import type { GoslingSpec } from '@gosling-lang/gosling-schema';
import { GOSLING_PUBLIC_DATA } from './gosling-data';

export const EX_SPEC_SPATIAL: GoslingSpec = {
    title: 'Spatial Layout',
    subtitle: 'Example of spatial chromatin data integration',
    arrangement: 'vertical',
    centerRadius: 0.4,
    views: [
        {
            spacing: 40,
            arrangement: 'horizontal',
            views: [
                {
                    layout: 'spatial',
                    tracks: [
                        {
                            data: {
                                type: 'csv',
                                url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/cytogenetic_band.csv', //~ just some existing data, to get rid of errors
                            },
                            x: {
                                field: "x",
                            },
                            test: "bla bla",
                            data3D: "https://pub-5c3f8ce35c924114a178c6e929fc3ac7.r2.dev/Tan-2018_GSM3271353_gm12878_07.arrow",
                            //type: "3D",
                            width: 250,
                            height: 250
                        }
                    ]
                },
                {
                    layout: 'linear',
                    xDomain: { chromosome: 'chr1' },
                    alignment: 'overlay',
                    tracks: [
                        { mark: 'bar' },
                        {
                            mark: 'brush',
                            x: { linkingId: 'detail' }
                        }
                    ],
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    x: { field: 'start', type: 'genomic' },
                    xe: { field: 'end', type: 'genomic' },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 400,
                    height: 200
                }
            ]
        },
        {
            layout: 'linear',
            xDomain: { chromosome: 'chr1', interval: [160000000, 200000000] },
            linkingId: 'detail',
            tracks: [
                {
                    data: {
                        url: GOSLING_PUBLIC_DATA.multivec,
                        type: 'multivec',
                        row: 'sample',
                        column: 'position',
                        value: 'peak',
                        categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4']
                    },
                    mark: 'bar',
                    x: {
                        field: 'position',
                        type: 'genomic',
                        axis: 'top'
                    },
                    y: { field: 'peak', type: 'quantitative' },
                    row: { field: 'sample', type: 'nominal' },
                    color: { field: 'sample', type: 'nominal' },
                    width: 690,
                    height: 200
                }
            ]
        }
    ]
};

export const EX_SPEC_SPATIAL_MINIMAL: GoslingSpec = {
    title: 'Spatial Layout (Minimal, CSV)',
    subtitle: 'Super basic example of spatial layout',
    views: [
        {
            layout: 'spatial',
            tracks: [
                {
                    data: {
                        type: 'csv',
                        //url: 'https://raw.githubusercontent.com/dvdkouril/chromospace-sample-data/refs/heads/main/gosling-3d/Stevens-2017_GSM2219497_Cell_1_model_1_chr_f.csv',
                        url: 'https://raw.githubusercontent.com/dvdkouril/chromospace-sample-data/main/gosling-3d/yeast_model.csv',
                    },
                    spatial: {
                        x: "x",
                        y: "y",
                        z: "z",
                        chr: "chr",
                        coord: "coord",
                    },
                    width: 500,
                    height: 500
                }
            ]
        }
    ]
};

export const EX_SPEC_SPATIAL_MULTIPLE_TRACKS: GoslingSpec = {
    title: 'Spatial Layout: multiple tracks in one view',
    views: [
        {
            layout: 'spatial',
            tracks: [
                {
                    data: {
                        type: 'csv',
                        url: 'https://raw.githubusercontent.com/dvdkouril/chromospace-sample-data/main/gosling-3d/yeast_model.csv',
                    },
                    spatial: {
                        x: "x",
                        y: "y",
                        z: "z",
                        chr: "chr",
                        coord: "coord",
                    },
                    color: {
                        value: "#ffffff",
                    },
                    width: 500,
                    height: 500
                },
                {
                    data: {
                        type: 'csv',
                        url: 'https://raw.githubusercontent.com/dvdkouril/chromospace-sample-data/main/gosling-3d/yeast_model_only_one_chromosome.csv',
                    },
                    spatial: {
                        x: "x",
                        y: "y",
                        z: "z",
                        chr: "chr",
                        coord: "coord",
                    },
                    color: {
                        value: "#ffffff",
                    },
                    mark: "box",
                    width: 500,
                    height: 500
                }
            ]
        }
    ],
};
