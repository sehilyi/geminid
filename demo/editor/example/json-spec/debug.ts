import type { GoslingSpec } from 'gosling.js';

export const EX_SPEC_DEBUG: GoslingSpec =
    // {
    //     title: 'Between-Connectivity In 2D Tracks',
    //     subtitle: 'Between-link examples with three types, i.e., straight, corner, and curve',
    //     // "xDomain": {"interval": [0, 1000000000]},
    //     style: { outlineWidth: 0.5 },
    //     spacing: 10,
    //     linkingId: '-',
    //     arrangement: 'horizontal',
    //     views: [
    //         {
    //             orientation: 'vertical',
    //             tracks: [
    //                 {
    //                     data: {
    //                         url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
    //                         type: 'multivec',
    //                         row: 'sample',
    //                         column: 'position',
    //                         value: 'peak',
    //                         categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
    //                         binSize: 4
    //                     },
    //                     mark: 'rect',
    //                     x: { field: 'start', type: 'genomic', axis: 'left' },
    //                     xe: { field: 'end', type: 'genomic' },
    //                     row: { field: 'sample', type: 'nominal', legend: false },
    //                     color: {
    //                         field: 'peak',
    //                         type: 'quantitative',
    //                         legend: false,
    //                         range: 'grey'
    //                     },
    //                     width: 300,
    //                     height: 300
    //                 }
    //             ]
    //         },
    //         {
    //             xOffset: 30,
    //             tracks: [
    //                 {
    //                     data: {
    //                         url:
    //                             'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
    //                         type: 'csv',
    //                         chromosomeField: 'c2',
    //                         genomicFields: ['s1', 'e1', 's2', 'e2']
    //                     },
    //                     style: { linkConnectionType: 'corner' },
    //                     mark: 'withinLink',
    //                     x: { field: 's1', type: 'genomic', axis: 'bottom' },
    //                     xe: { field: 's2', type: 'genomic' },
    //                     flipY: false,
    //                     color: { value: '#3275B4' },
    //                     size: { value: 2 },
    //                     stroke: { value: '#3275B4' },
    //                     opacity: { value: 0.2 },
    //                     width: 300,
    //                     height: 300
    //                 }
    //             ]
    //         }
    //     ]
    // };

    {
        title: 'Between-Connectivity In 2D Tracks',
        subtitle: 'Between-link examples with three types, i.e., straight, corner, and curve',
        xDomain: { interval: [0, 1000000000] },
        style: { outlineWidth: 0.5 },
        spacing: 10,
        // linkingId: '-',
        views: [
            {
                arrangement: 'horizontal',
                views: [
                    {
                        yOffset: 250,
                        spacing: 10,
                        orientation: 'vertical',
                        tracks: [
                            {
                                data: {
                                    url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                                    type: 'multivec',
                                    row: 'sample',
                                    column: 'position',
                                    value: 'peak',
                                    categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                                    binSize: 4
                                },
                                mark: 'rect',
                                x: { field: 'start', type: 'genomic', axis: 'left' },
                                xe: { field: 'end', type: 'genomic' },
                                row: { field: 'sample', type: 'nominal', legend: false },
                                color: { field: 'peak', type: 'quantitative', legend: false, range: 'grey' },
                                width: 100,
                                height: 500
                            },
                            {
                                data: {
                                    url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                                    type: 'csv',
                                    chromosomeField: 'c2',
                                    genomicFields: ['s1', 'e1', 's2', 'e2']
                                },
                                style: { linkConnectionType: 'corner' },
                                mark: 'withinLink',
                                x: { field: 's1', type: 'genomic', axis: 'none' },
                                xe: { field: 's2', type: 'genomic' },
                                flipY: false,
                                color: { value: '#3275B4' },
                                size: { value: 2 },
                                stroke: { value: '#3275B4' },
                                opacity: { value: 0.2 },
                                width: 100,
                                height: 500
                            }
                        ]
                    },
                    {
                        arrangement: 'vertical',
                        views: [
                            {
                                spacing: 10,
                                tracks: [
                                    {
                                        data: {
                                            url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                                            type: 'csv',
                                            chromosomeField: 'c2',
                                            genomicFields: ['s1', 'e1', 's2', 'e2']
                                        },
                                        style: { linkConnectionType: 'corner' },
                                        mark: 'withinLink',
                                        x: { field: 's1', type: 'genomic' },
                                        xe: { field: 's2', type: 'genomic' },
                                        flipY: false,
                                        color: { value: '#3275B4' },
                                        size: { value: 2 },
                                        stroke: { value: '#3275B4' },
                                        opacity: { value: 0.2 },
                                        width: 500,
                                        height: 100
                                    },
                                    {
                                        data: {
                                            url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                                            type: 'csv',
                                            chromosomeField: 'c2',
                                            genomicFields: ['s1', 'e1', 's2', 'e2']
                                        },
                                        style: { linkConnectionType: 'corner' },
                                        mark: 'withinLink',
                                        x: { field: 's1', type: 'genomic' },
                                        xe: { field: 's2', type: 'genomic' },
                                        flipY: false,
                                        color: { value: '#3275B4' },
                                        size: { value: 2 },
                                        stroke: { value: '#3275B4' },
                                        opacity: { value: 0.2 },
                                        width: 500,
                                        height: 100
                                    }
                                ]
                            },
                            {
                                tracks: [
                                    {
                                        title: 'Curved Connection',
                                        alignment: 'overlay',
                                        data: {
                                            url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                                            type: 'csv',
                                            chromosomeField: 'c2',
                                            genomicFields: ['s1', 'e1', 's2', 'e2']
                                        },
                                        style: { linkConnectionType: 'corner' },
                                        tracks: [
                                            {
                                                mark: 'betweenLink',
                                                x: { field: 's1', type: 'genomic', axis: 'none' },
                                                y: { field: 's2', type: 'genomic', axis: 'none' }
                                            },
                                            {
                                                mark: 'betweenLink',
                                                y: { field: 's1', type: 'genomic', axis: 'none' },
                                                x: { field: 's2', type: 'genomic', axis: 'none' }
                                            },
                                            {
                                                mark: 'point',
                                                x: { field: 's1', type: 'genomic', axis: 'none' },
                                                y: { field: 's2', type: 'genomic', axis: 'none' },
                                                opacity: { value: 1 }
                                            },
                                            {
                                                mark: 'point',
                                                y: { field: 's1', type: 'genomic', axis: 'none' },
                                                x: { field: 's2', type: 'genomic', axis: 'none' },
                                                opacity: { value: 1 }
                                            }
                                        ],
                                        color: { value: '#3275B4' },
                                        size: { value: 1 },
                                        stroke: { value: '#3275B4' },
                                        opacity: { value: 0.2 },
                                        width: 500,
                                        height: 500
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        xDomain: { interval: [0, 1000000000] },
                        yOffset: 250,
                        spacing: 10,
                        orientation: 'vertical',
                        tracks: [
                            {
                                data: {
                                    url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                                    type: 'csv',
                                    chromosomeField: 'c2',
                                    genomicFields: ['s1', 'e1', 's2', 'e2']
                                },
                                style: { linkConnectionType: 'corner' },
                                mark: 'withinLink',
                                x: { field: 's1', type: 'genomic', axis: 'none' },
                                xe: { field: 's2', type: 'genomic' },
                                flipY: true,
                                color: { value: '#3275B4' },
                                size: { value: 2 },
                                stroke: { value: '#3275B4' },
                                opacity: { value: 0.2 },
                                width: 100,
                                height: 500
                            },
                            {
                                data: {
                                    url: 'https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec',
                                    type: 'multivec',
                                    row: 'sample',
                                    column: 'position',
                                    value: 'peak',
                                    categories: ['sample 1', 'sample 2', 'sample 3', 'sample 4'],
                                    binSize: 4
                                },
                                mark: 'rect',
                                x: { field: 'start', type: 'genomic', axis: 'right' },
                                xe: { field: 'end', type: 'genomic' },
                                row: { field: 'sample', type: 'nominal', legend: false },
                                color: { field: 'peak', type: 'quantitative', legend: false, range: 'rdbu' },
                                width: 100,
                                height: 500
                            }
                        ]
                    }
                ]
            },
            {
                views: [
                    {
                        xOffset: 250,
                        spacing: 10,
                        tracks: [
                            {
                                data: {
                                    url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                                    type: 'csv',
                                    chromosomeField: 'c2',
                                    genomicFields: ['s1', 'e1', 's2', 'e2']
                                },
                                style: { linkConnectionType: 'corner' },
                                mark: 'withinLink',
                                x: { field: 's1', type: 'genomic', axis: 'none' },
                                xe: { field: 's2', type: 'genomic' },
                                flipY: true,
                                color: { value: '#3275B4' },
                                size: { value: 2 },
                                stroke: { value: '#3275B4' },
                                opacity: { value: 0.2 },
                                width: 500,
                                height: 100
                            },
                            {
                                data: {
                                    url: 'https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt',
                                    type: 'csv',
                                    chromosomeField: 'c2',
                                    genomicFields: ['s1', 'e1', 's2', 'e2']
                                },
                                style: { linkConnectionType: 'corner' },
                                mark: 'withinLink',
                                x: { field: 's1', type: 'genomic', axis: 'bottom' },
                                xe: { field: 's2', type: 'genomic' },
                                flipY: true,
                                color: { value: '#3275B4' },
                                size: { value: 2 },
                                stroke: { value: '#3275B4' },
                                opacity: { value: 0.2 },
                                width: 500,
                                height: 100
                            }
                        ]
                    }
                ]
            }
        ]
    };

// {
//   "arrangement": "horizontal",
//   "views": [
//     {
//       "tracks": [
//         {
//           "title": "Straight Connection",
//           "alignment": "overlay",
//           "data": {
//             "url": "https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt",
//             "type": "csv",
//             "chromosomeField": "c2",
//             "genomicFields": ["s1", "e1", "s2", "e2"]
//           },
//           "style": {"linkConnectionType": "straight"},
//           "tracks": [
//             {
//               "mark": "betweenLink",
//               "x": {"field": "s1", "type": "genomic", "axis": "top"},
//               "y": {"field": "s2", "type": "genomic", "axis": "left"}
//             },
//             {
//               "mark": "betweenLink",
//               "y": {"field": "s1", "type": "genomic", "axis": "top"},
//               "x": {"field": "s2", "type": "genomic", "axis": "left"}
//             }
//           ],
//           "color": {"value": "#3275B4"},
//           "size": {"value": 2},
//           "stroke": {"value": "#3275B4"},
//           "opacity": {"value": 0.2},
//           "width": 500,
//           "height": 500
//         }
//       ]
//     },
//     {
//       "tracks": [
//         {
//           "title": "Cornered Connection",
//           "alignment": "overlay",
//           "data": {
//             "url": "https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt",
//             "type": "csv",
//             "chromosomeField": "c2",
//             "genomicFields": ["s1", "e1", "s2", "e2"]
//           },
//           "style": {"linkConnectionType": "corner"},
//           "tracks": [
//             {
//               "mark": "betweenLink",
//               "x": {"field": "s1", "type": "genomic", "axis": "top"},
//               "y": {"field": "s2", "type": "genomic", "axis": "left"}
//             },
//             {
//               "mark": "betweenLink",
//               "y": {"field": "s1", "type": "genomic", "axis": "top"},
//               "x": {"field": "s2", "type": "genomic", "axis": "left"}
//             },
//             {
//               "mark": "point",
//               "x": {"field": "s1", "type": "genomic", "axis": "top"},
//               "y": {"field": "s2", "type": "genomic", "axis": "left"},
//               "opacity": {"value": 1}
//             },
//             {
//               "mark": "point",
//               "y": {"field": "s1", "type": "genomic", "axis": "top"},
//               "x": {"field": "s2", "type": "genomic", "axis": "left"},
//               "opacity": {"value": 1}
//             }
//           ],
//           "color": {"value": "black"},
//           "size": {"value": 1},
//           "stroke": {"value": "#3275B4"},
//           "opacity": {"value": 0.2},
//           "width": 500,
//           "height": 500
//         }
//       ]
//     }
//   ]
// },
// {
//   "tracks": [
//     {
//       "title": "Curved Connection",
//       "alignment": "overlay",
//       "data": {
//         "url": "https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/circos-segdup-edited.txt",
//         "type": "csv",
//         "chromosomeField": "c2",
//         "genomicFields": ["s1", "e1", "s2", "e2"]
//       },
//       "style": {"linkConnectionType": "curve"},
//       "tracks": [
//         {
//           "mark": "betweenLink",
//           "x": {"field": "s1", "type": "genomic", "axis": "top"},
//           "y": {"field": "s2", "type": "genomic", "axis": "left"}
//         },
//         {
//           "mark": "betweenLink",
//           "y": {"field": "s1", "type": "genomic", "axis": "top"},
//           "x": {"field": "s2", "type": "genomic", "axis": "left"}
//         }
//       ],
//       "color": {"value": "black"},
//       "size": {"value": 1},
//       "stroke": {"value": "#3275B4"},
//       "opacity": {"value": 0.2},
//       "width": 500,
//       "height": 500
//     }
//   ]
// }
// ]
// };
