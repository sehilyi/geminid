const example = {
    compactLayout: false,
    trackSourceServers: [],
    views: [
        {
            genomePositionSearchBoxVisible: false,
            genomePositionSearchBox: {
                autocompleteServer: 'https://higlass.io/api/v1',
                autocompleteId: 'P0PLbQMwTYGy-5uPIQid7A',
                chromInfoServer: 'https://higlass.io/api/v1',
                chromInfoId: 'hg38'
            },
            layout: { x: 0, y: 50, w: 12, h: 44 },
            tracks: {
                top: [
                    {
                        uid: 'dbed29d0-fc48-11eb-b136-51c77f658267',
                        type: 'axis-track',
                        chromInfoPath: 'https://s3.amazonaws.com/gosling-lang.org/data/hg38.chrom.sizes',
                        options: {
                            layout: 'linear',
                            innerRadius: null,
                            width: 1000,
                            height: 44,
                            theme: {
                                base: 'light',
                                root: {
                                    background: 'white',
                                    titleColor: 'black',
                                    titleBackgroundColor: 'transparent',
                                    titleFontSize: 18,
                                    titleFontFamily: 'Arial',
                                    titleAlign: 'left',
                                    titleFontWeight: 'bold',
                                    subtitleColor: 'gray',
                                    subtitleBackgroundColor: 'transparent',
                                    subtitleFontSize: 16,
                                    subtitleFontFamily: 'Arial',
                                    subtitleFontWeight: 'normal',
                                    subtitleAlign: 'left',
                                    mousePositionColor: '#000000'
                                },
                                track: {
                                    background: 'transparent',
                                    alternatingBackground: 'transparent',
                                    titleColor: 'black',
                                    titleBackground: 'white',
                                    titleFontSize: 24,
                                    titleAlign: 'left',
                                    outline: 'black',
                                    outlineWidth: 1
                                },
                                legend: {
                                    position: 'top',
                                    background: 'white',
                                    backgroundOpacity: 0.7,
                                    labelColor: 'black',
                                    labelFontSize: 12,
                                    labelFontWeight: 'normal',
                                    labelFontFamily: 'Arial',
                                    backgroundStroke: '#DBDBDB',
                                    tickColor: 'black'
                                },
                                axis: {
                                    tickColor: 'black',
                                    labelColor: 'black',
                                    labelFontSize: 12,
                                    labelFontWeight: 'normal',
                                    labelFontFamily: 'Arial',
                                    baselineColor: 'black',
                                    gridColor: '#E3E3E3',
                                    gridStrokeWidth: 1,
                                    gridStrokeType: 'solid',
                                    gridStrokeDash: [4, 4]
                                },
                                markCommon: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                point: {
                                    color: '#E79F00',
                                    size: 3,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                rect: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                triangle: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                area: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                line: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                bar: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                rule: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 1,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                link: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 1,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                text: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6],
                                    textAnchor: 'middle',
                                    textFontWeight: 'normal'
                                },
                                brush: {
                                    color: 'gray',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 1,
                                    opacity: 0.3,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                }
                            },
                            assembly: 'hg38',
                            stroke: 'transparent',
                            color: 'black',
                            fontSize: 12,
                            fontFamily: 'Arial',
                            fontWeight: 'normal',
                            tickColor: 'black',
                            tickFormat: 'plain',
                            tickPositions: 'even',
                            reverseOrientation: false
                        },
                        height: 30
                    }
                ],
                left: [],
                center: [
                    {
                        type: 'combined',
                        width: 399,
                        height: 14,
                        contents: [
                            {
                                type: 'gosling-track',
                                width: 1000,
                                height: 14,
                                options: {
                                    showMousePosition: true,
                                    mousePositionColor: '#000000',
                                    fontSize: 24,
                                    labelPosition: 'none',
                                    labelShowResolution: false,
                                    labelColor: 'black',
                                    labelBackgroundColor: 'white',
                                    labelTextOpacity: 1,
                                    labelLeftMargin: 1,
                                    labelTopMargin: 1,
                                    labelRightMargin: 0,
                                    labelBottomMargin: 0,
                                    backgroundColor: 'transparent',
                                    spec: {
                                        data: {
                                            url:
                                                'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                                            type: 'csv',
                                            chromosomeField: 'Chromosome',
                                            genomicFields: ['chromStart', 'chromEnd']
                                        },
                                        x: {
                                            field: 'chromStart',
                                            type: 'genomic',
                                            // domain: {
                                            //     chromosome: '17',
                                            //     interval: [20000000, 50000000]
                                            // },
                                            linkingId: 'top',
                                            axis: 'top'
                                        },
                                        xe: { field: 'chromEnd', type: 'genomic' },
                                        color: { value: 'white' },
                                        size: { value: 14 },
                                        stroke: { value: 'black' },
                                        strokeWidth: { value: 0.5 },
                                        width: 1000,
                                        height: 44,
                                        overlay: [
                                            {
                                                mark: 'rect',
                                                dataTransform: [
                                                    {
                                                        type: 'filter',
                                                        field: 'Stain',
                                                        oneOf: ['acen'],
                                                        not: true
                                                    }
                                                ],
                                                style: { outlineWidth: 0 }
                                            },
                                            {
                                                mark: 'triangleRight',
                                                dataTransform: [
                                                    {
                                                        type: 'filter',
                                                        field: 'Stain',
                                                        oneOf: ['acen']
                                                    },
                                                    { type: 'filter', field: 'Name', include: 'q' }
                                                ],
                                                style: { outlineWidth: 0 }
                                            },
                                            {
                                                mark: 'triangleLeft',
                                                dataTransform: [
                                                    {
                                                        type: 'filter',
                                                        field: 'Stain',
                                                        oneOf: ['acen']
                                                    },
                                                    { type: 'filter', field: 'Name', include: 'p' }
                                                ],
                                                style: { outlineWidth: 0 }
                                            }
                                        ],
                                        assembly: 'hg38',
                                        layout: 'linear',
                                        orientation: 'horizontal',
                                        static: false,
                                        style: { outlineWidth: 0 },
                                        overlayOnPreviousTrack: false
                                    },
                                    theme: {
                                        base: 'light',
                                        root: {
                                            background: 'white',
                                            titleColor: 'black',
                                            titleBackgroundColor: 'transparent',
                                            titleFontSize: 18,
                                            titleFontFamily: 'Arial',
                                            titleAlign: 'left',
                                            titleFontWeight: 'bold',
                                            subtitleColor: 'gray',
                                            subtitleBackgroundColor: 'transparent',
                                            subtitleFontSize: 16,
                                            subtitleFontFamily: 'Arial',
                                            subtitleFontWeight: 'normal',
                                            subtitleAlign: 'left',
                                            mousePositionColor: '#000000'
                                        },
                                        track: {
                                            background: 'transparent',
                                            alternatingBackground: 'transparent',
                                            titleColor: 'black',
                                            titleBackground: 'white',
                                            titleFontSize: 24,
                                            titleAlign: 'left',
                                            outline: 'black',
                                            outlineWidth: 1
                                        },
                                        legend: {
                                            position: 'top',
                                            background: 'white',
                                            backgroundOpacity: 0.7,
                                            labelColor: 'black',
                                            labelFontSize: 12,
                                            labelFontWeight: 'normal',
                                            labelFontFamily: 'Arial',
                                            backgroundStroke: '#DBDBDB',
                                            tickColor: 'black'
                                        },
                                        axis: {
                                            tickColor: 'black',
                                            labelColor: 'black',
                                            labelFontSize: 12,
                                            labelFontWeight: 'normal',
                                            labelFontFamily: 'Arial',
                                            baselineColor: 'black',
                                            gridColor: '#E3E3E3',
                                            gridStrokeWidth: 1,
                                            gridStrokeType: 'solid',
                                            gridStrokeDash: [4, 4]
                                        },
                                        markCommon: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        point: {
                                            color: '#E79F00',
                                            size: 3,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        rect: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        triangle: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        area: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        line: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        bar: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        rule: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 1,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        link: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 1,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        text: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6],
                                            textAnchor: 'middle',
                                            textFontWeight: 'normal'
                                        },
                                        brush: {
                                            color: 'gray',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 1,
                                            opacity: 0.3,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        }
                                    }
                                },
                                data: {
                                    url:
                                        'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                                    type: 'csv',
                                    chromosomeField: 'Chromosome',
                                    genomicFields: ['chromStart', 'chromEnd'],
                                    assembly: 'hg38'
                                }
                            }
                        ]
                    }
                ],
                right: [],
                bottom: [],
                gallery: [],
                whole: []
            },
            initialXDomain: [0, 3088269832],
            initialYDomain: [0, 3088269832],
            zoomFixed: false,
            zoomLimits: [1, null],
            uid: 'view-1',
            chromInfoPath: 'https://s3.amazonaws.com/gosling-lang.org/data/hg38.chrom.sizes'
        },
        {
            genomePositionSearchBoxVisible: false,
            genomePositionSearchBox: {
                autocompleteServer: 'https://higlass.io/api/v1',
                autocompleteId: 'P0PLbQMwTYGy-5uPIQid7A',
                chromInfoServer: 'https://higlass.io/api/v1',
                chromInfoId: 'hg38'
            },
            layout: { x: 0, y: 104, w: 12, h: 400 },
            tracks: {
                top: [],
                left: [],
                center: [
                    {
                        type: 'combined',
                        width: 999,
                        height: 430,
                        contents: [
                            {
                                type: 'gosling-2d-track',
                                width: 1000,
                                height: 430,
                                data: {
                                    url:
                                        'https://s3.amazonaws.com/gosling-lang.org/data/ideogram.js/homo_sapiens-mus_musculus-synteny-v73-adjusted.tsv',
                                    type: 'csv',
                                    genomicFieldsToConvert: [
                                        {
                                            chromosomeField: 'Chromosome_spec1',
                                            genomicFields: ['Start_spec1', 'End_spec1']
                                        },
                                        {
                                            chromosomeField: 'Chromosome_spec2',
                                            genomicFields: ['Start_spec2', 'End_spec2']
                                        }
                                    ],
                                    separator: '\t',
                                    assembly: 'hg38'
                                },
                                options: {
                                    showMousePosition: true,
                                    mousePositionColor: '#000000',
                                    fontSize: 24,
                                    labelPosition: 'none',
                                    labelShowResolution: false,
                                    labelColor: 'black',
                                    labelBackgroundColor: 'white',
                                    labelTextOpacity: 1,
                                    labelLeftMargin: 1,
                                    labelTopMargin: 1,
                                    labelRightMargin: 0,
                                    labelBottomMargin: 0,
                                    backgroundColor: 'transparent',
                                    spec: {
                                        layout: 'linear',
                                        // xDomain: { chromosome: '1' },
                                        assembly: 'hg38',
                                        orientation: 'horizontal',
                                        static: false,
                                        centerRadius: 0.3,
                                        xOffset: 0,
                                        yOffset: 0,
                                        style: { outlineWidth: 0 },
                                        data: {
                                            url:
                                                'https://s3.amazonaws.com/gosling-lang.org/data/ideogram.js/homo_sapiens-mus_musculus-synteny-v73-adjusted.tsv',
                                            type: 'csv',
                                            genomicFieldsToConvert: [
                                                {
                                                    chromosomeField: 'Chromosome_spec1',
                                                    genomicFields: ['Start_spec1', 'End_spec1']
                                                },
                                                {
                                                    chromosomeField: 'Chromosome_spec2',
                                                    genomicFields: ['Start_spec2', 'End_spec2']
                                                }
                                            ],
                                            separator: '\t',
                                            assembly: 'hg38'
                                        },
                                        mark: 'betweenLink',
                                        x: {
                                            field: 'Start_spec1',
                                            type: 'genomic',
                                            axis: 'none',
                                            linkingId: 'top'
                                            // domain: { chromosome: '1' }
                                        },
                                        xe: { field: 'End_spec1', type: 'genomic' },
                                        x1: {
                                            field: 'Start_spec2',
                                            type: 'genomic',
                                            linkingId: 'bottom'
                                        },
                                        x1e: { field: 'End_spec2', type: 'genomic' },
                                        strokeWidth: { value: 0 },
                                        color: {
                                            field: 'Chromosome_spec1',
                                            type: 'nominal',
                                            domain: [
                                                'chr1',
                                                'chr2',
                                                'chr3',
                                                'chr4',
                                                'chr5',
                                                'chr6',
                                                'chr7',
                                                'chr8',
                                                'chr9',
                                                'chr10',
                                                'chr11',
                                                'chr12',
                                                'chr13',
                                                'chr14',
                                                'chr15',
                                                'chr16',
                                                'chr17',
                                                'chr18',
                                                'chr19',
                                                'chr20',
                                                'chr21',
                                                'chr22',
                                                'chrX',
                                                'chrY'
                                            ]
                                        },
                                        opacity: { value: 0.5 },
                                        width: 1000,
                                        height: 430,
                                        overlayOnPreviousTrack: false
                                    },
                                    theme: {
                                        base: 'light',
                                        root: {
                                            background: 'white',
                                            titleColor: 'black',
                                            titleBackgroundColor: 'transparent',
                                            titleFontSize: 18,
                                            titleFontFamily: 'Arial',
                                            titleAlign: 'left',
                                            titleFontWeight: 'bold',
                                            subtitleColor: 'gray',
                                            subtitleBackgroundColor: 'transparent',
                                            subtitleFontSize: 16,
                                            subtitleFontFamily: 'Arial',
                                            subtitleFontWeight: 'normal',
                                            subtitleAlign: 'left',
                                            mousePositionColor: '#000000'
                                        },
                                        track: {
                                            background: 'transparent',
                                            alternatingBackground: 'transparent',
                                            titleColor: 'black',
                                            titleBackground: 'white',
                                            titleFontSize: 24,
                                            titleAlign: 'left',
                                            outline: 'black',
                                            outlineWidth: 1
                                        },
                                        legend: {
                                            position: 'top',
                                            background: 'white',
                                            backgroundOpacity: 0.7,
                                            labelColor: 'black',
                                            labelFontSize: 12,
                                            labelFontWeight: 'normal',
                                            labelFontFamily: 'Arial',
                                            backgroundStroke: '#DBDBDB',
                                            tickColor: 'black'
                                        },
                                        axis: {
                                            tickColor: 'black',
                                            labelColor: 'black',
                                            labelFontSize: 12,
                                            labelFontWeight: 'normal',
                                            labelFontFamily: 'Arial',
                                            baselineColor: 'black',
                                            gridColor: '#E3E3E3',
                                            gridStrokeWidth: 1,
                                            gridStrokeType: 'solid',
                                            gridStrokeDash: [4, 4]
                                        },
                                        markCommon: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        point: {
                                            color: '#E79F00',
                                            size: 3,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        rect: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        triangle: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        area: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        line: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        bar: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        rule: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 1,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        link: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 1,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        text: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6],
                                            textAnchor: 'middle',
                                            textFontWeight: 'normal'
                                        },
                                        brush: {
                                            color: 'gray',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 1,
                                            opacity: 0.3,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ],
                right: [],
                bottom: [],
                gallery: [],
                whole: []
            },
            initialXDomain: [1, 3088269832],
            initialYDomain: [0, 3088269832],
            zoomFixed: false,
            zoomLimits: [1, null],
            uid: 'view-2',
            chromInfoPath: 'https://s3.amazonaws.com/gosling-lang.org/data/hg38.chrom.sizes'
        },
        {
            genomePositionSearchBoxVisible: false,
            genomePositionSearchBox: {
                autocompleteServer: 'https://higlass.io/api/v1',
                autocompleteId: 'P0PLbQMwTYGy-5uPIQid7A',
                chromInfoServer: 'https://higlass.io/api/v1',
                chromInfoId: 'hg38'
            },
            layout: { x: 0, y: 514, w: 12, h: 44 },
            tracks: {
                top: [],
                left: [],
                center: [
                    {
                        type: 'combined',
                        width: 999,
                        height: 14,
                        contents: [
                            {
                                type: 'gosling-track',
                                width: 1000,
                                height: 14,
                                options: {
                                    showMousePosition: true,
                                    mousePositionColor: '#000000',
                                    fontSize: 24,
                                    labelPosition: 'none',
                                    labelShowResolution: false,
                                    labelColor: 'black',
                                    labelBackgroundColor: 'white',
                                    labelTextOpacity: 1,
                                    labelLeftMargin: 1,
                                    labelTopMargin: 1,
                                    labelRightMargin: 0,
                                    labelBottomMargin: 0,
                                    backgroundColor: 'transparent',
                                    spec: {
                                        data: {
                                            url:
                                                'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                                            type: 'csv',
                                            chromosomeField: 'Chromosome',
                                            genomicFields: ['chromStart', 'chromEnd']
                                        },
                                        x: {
                                            field: 'chromStart',
                                            type: 'genomic',
                                            axis: 'bottom',
                                            // domain: { chromosome: '3' },
                                            linkingId: 'bottom'
                                        },
                                        xe: { field: 'chromEnd', type: 'genomic' },
                                        color: { value: 'white' },
                                        size: { value: 14 },
                                        stroke: { value: 'black' },
                                        strokeWidth: { value: 0.5 },
                                        width: 1000,
                                        height: 44,
                                        overlay: [
                                            {
                                                mark: 'rect',
                                                dataTransform: [
                                                    {
                                                        type: 'filter',
                                                        field: 'Stain',
                                                        oneOf: ['acen'],
                                                        not: true
                                                    }
                                                ],
                                                style: { outlineWidth: 0 }
                                            },
                                            {
                                                mark: 'triangleRight',
                                                dataTransform: [
                                                    {
                                                        type: 'filter',
                                                        field: 'Stain',
                                                        oneOf: ['acen']
                                                    },
                                                    { type: 'filter', field: 'Name', include: 'q' }
                                                ],
                                                style: { outlineWidth: 0 }
                                            },
                                            {
                                                mark: 'triangleLeft',
                                                dataTransform: [
                                                    {
                                                        type: 'filter',
                                                        field: 'Stain',
                                                        oneOf: ['acen']
                                                    },
                                                    { type: 'filter', field: 'Name', include: 'p' }
                                                ],
                                                style: { outlineWidth: 0 }
                                            }
                                        ],
                                        assembly: 'hg38',
                                        layout: 'linear',
                                        orientation: 'horizontal',
                                        static: false,
                                        style: { outlineWidth: 0 },
                                        overlayOnPreviousTrack: false
                                    },
                                    theme: {
                                        base: 'light',
                                        root: {
                                            background: 'white',
                                            titleColor: 'black',
                                            titleBackgroundColor: 'transparent',
                                            titleFontSize: 18,
                                            titleFontFamily: 'Arial',
                                            titleAlign: 'left',
                                            titleFontWeight: 'bold',
                                            subtitleColor: 'gray',
                                            subtitleBackgroundColor: 'transparent',
                                            subtitleFontSize: 16,
                                            subtitleFontFamily: 'Arial',
                                            subtitleFontWeight: 'normal',
                                            subtitleAlign: 'left',
                                            mousePositionColor: '#000000'
                                        },
                                        track: {
                                            background: 'transparent',
                                            alternatingBackground: 'transparent',
                                            titleColor: 'black',
                                            titleBackground: 'white',
                                            titleFontSize: 24,
                                            titleAlign: 'left',
                                            outline: 'black',
                                            outlineWidth: 1
                                        },
                                        legend: {
                                            position: 'top',
                                            background: 'white',
                                            backgroundOpacity: 0.7,
                                            labelColor: 'black',
                                            labelFontSize: 12,
                                            labelFontWeight: 'normal',
                                            labelFontFamily: 'Arial',
                                            backgroundStroke: '#DBDBDB',
                                            tickColor: 'black'
                                        },
                                        axis: {
                                            tickColor: 'black',
                                            labelColor: 'black',
                                            labelFontSize: 12,
                                            labelFontWeight: 'normal',
                                            labelFontFamily: 'Arial',
                                            baselineColor: 'black',
                                            gridColor: '#E3E3E3',
                                            gridStrokeWidth: 1,
                                            gridStrokeType: 'solid',
                                            gridStrokeDash: [4, 4]
                                        },
                                        markCommon: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        point: {
                                            color: '#E79F00',
                                            size: 3,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        rect: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        triangle: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        area: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        line: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        bar: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        rule: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 1,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        link: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 1,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        },
                                        text: {
                                            color: '#E79F00',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 0,
                                            opacity: 1,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6],
                                            textAnchor: 'middle',
                                            textFontWeight: 'normal'
                                        },
                                        brush: {
                                            color: 'gray',
                                            size: 1,
                                            stroke: 'black',
                                            strokeWidth: 1,
                                            opacity: 0.3,
                                            nominalColorRange: [
                                                '#E79F00',
                                                '#029F73',
                                                '#0072B2',
                                                '#CB7AA7',
                                                '#D45E00',
                                                '#57B4E9',
                                                '#EFE441'
                                            ],
                                            quantitativeSizeRange: [2, 6]
                                        }
                                    }
                                },
                                data: {
                                    url:
                                        'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv',
                                    type: 'csv',
                                    chromosomeField: 'Chromosome',
                                    genomicFields: ['chromStart', 'chromEnd'],
                                    assembly: 'hg38'
                                }
                            }
                        ]
                    }
                ],
                right: [],
                bottom: [
                    {
                        uid: 'dbf196a0-fc48-11eb-b136-51c77f658267',
                        type: 'axis-track',
                        chromInfoPath: 'https://s3.amazonaws.com/gosling-lang.org/data/hg38.chrom.sizes',
                        options: {
                            layout: 'linear',
                            outerRadius: null,
                            width: 400,
                            height: 44,
                            theme: {
                                base: 'light',
                                root: {
                                    background: 'white',
                                    titleColor: 'black',
                                    titleBackgroundColor: 'transparent',
                                    titleFontSize: 18,
                                    titleFontFamily: 'Arial',
                                    titleAlign: 'left',
                                    titleFontWeight: 'bold',
                                    subtitleColor: 'gray',
                                    subtitleBackgroundColor: 'transparent',
                                    subtitleFontSize: 16,
                                    subtitleFontFamily: 'Arial',
                                    subtitleFontWeight: 'normal',
                                    subtitleAlign: 'left',
                                    mousePositionColor: '#000000'
                                },
                                track: {
                                    background: 'transparent',
                                    alternatingBackground: 'transparent',
                                    titleColor: 'black',
                                    titleBackground: 'white',
                                    titleFontSize: 24,
                                    titleAlign: 'left',
                                    outline: 'black',
                                    outlineWidth: 1
                                },
                                legend: {
                                    position: 'top',
                                    background: 'white',
                                    backgroundOpacity: 0.7,
                                    labelColor: 'black',
                                    labelFontSize: 12,
                                    labelFontWeight: 'normal',
                                    labelFontFamily: 'Arial',
                                    backgroundStroke: '#DBDBDB',
                                    tickColor: 'black'
                                },
                                axis: {
                                    tickColor: 'black',
                                    labelColor: 'black',
                                    labelFontSize: 12,
                                    labelFontWeight: 'normal',
                                    labelFontFamily: 'Arial',
                                    baselineColor: 'black',
                                    gridColor: '#E3E3E3',
                                    gridStrokeWidth: 1,
                                    gridStrokeType: 'solid',
                                    gridStrokeDash: [4, 4]
                                },
                                markCommon: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                point: {
                                    color: '#E79F00',
                                    size: 3,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                rect: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                triangle: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                area: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                line: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                bar: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                rule: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 1,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                link: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 1,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                },
                                text: {
                                    color: '#E79F00',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 0,
                                    opacity: 1,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6],
                                    textAnchor: 'middle',
                                    textFontWeight: 'normal'
                                },
                                brush: {
                                    color: 'gray',
                                    size: 1,
                                    stroke: 'black',
                                    strokeWidth: 1,
                                    opacity: 0.3,
                                    nominalColorRange: [
                                        '#E79F00',
                                        '#029F73',
                                        '#0072B2',
                                        '#CB7AA7',
                                        '#D45E00',
                                        '#57B4E9',
                                        '#EFE441'
                                    ],
                                    quantitativeSizeRange: [2, 6]
                                }
                            },
                            assembly: 'hg38',
                            stroke: 'transparent',
                            color: 'black',
                            fontSize: 12,
                            fontFamily: 'Arial',
                            fontWeight: 'normal',
                            tickColor: 'black',
                            tickFormat: 'plain',
                            tickPositions: 'even',
                            reverseOrientation: true
                        },
                        height: 30
                    }
                ],
                gallery: [],
                whole: []
            },
            initialXDomain: [0, 3088269832],
            initialYDomain: [0, 3088269832],
            zoomFixed: false,
            zoomLimits: [1, null],
            uid: 'view-3'
        }
    ],
    zoomLocks: {
        locksByViewUid: {
            'view-1': 'all',
            'view-2': 'all',
            'view-3': 'all'
        },
        locksDict: {
            all: {
                uid: 'all',
                'view-1': [124625310.5, 124625310.5, 249250.621],
                'view-2': [124625310.5, 124625310.5, 249250.621],
                'view-3': [124625310.5, 124625310.5, 249250.621]
            }
        }
    },
    locationLocks: {
        locksByViewUid: {
            'view-1': { x: { lock: 'top', axis: 'x' } },
            'view-2': { x: { lock: 'top', axis: 'x' }, y: { lock: 'bottom', axis: 'x' } },
            'view-3': { x: { lock: 'bottom', axis: 'y' } }
        },
        locksDict: {
            top: {
                uid: 'top',
                'view-1': [124625310.5, 124625310.5, 249250.621],
                'view-2': [124625310.5, 124625310.5, 249250.621]
            },
            bottom: {
                uid: 'bottom',
                'view-2': [124625310.5, 124625310.5, 249250.621],
                'view-3': [124625310.5, 124625310.5, 249250.621]
            }
        }
    },
    editable: false,
    chromInfoPath: 'https://s3.amazonaws.com/gosling-lang.org/data/hg38.chrom.sizes'
};

export default example;
