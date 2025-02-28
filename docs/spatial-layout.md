# 3D chromatin structures in Gosling

The purpose of this file is to document the changes in the specification and
gosling.js to support visualizing 3D structures of chromatin. It should be
merged in the main documentation at some point.

Minimal specification using 3D data:

```javascript
const spec = {
   views: [{
      layout: "spatial",
      tracks: [
         {
            data: {
               url: "https://...",
            },
         },
      ],
   }]
}
```

## Features

### Specifying visual channels
```javascript
{
   /* ... */
   views: [{
      layout: "spatial",
      tracks: [
         {
            data: {
               url: "https://...",
            },
            color: {
               value: "#ff00ff"
            },
            scale: {
               value: 0.01
            }
         },
      ],
   }]
}
```

### Composing multiple tracks within a spatial view

To create more complex visualizations, we can compose several tracks within a
single view. Then each track can have different visual encodings, filtering,
etc., that will be composed (overlaid) within a single view

```javascript
{
   /* ... */
   views: [{
      layout: "spatial",
      tracks: [
         { // track 1
            data: {
               url: "https://...",
            },
            color: {
               value: "#ff00ff"
            },
            scale: {
               value: 0.01
            }
         },
         { // track 2
            data: {
               url: "https://...", // TODO: could this be too much repetition (if it's the same dataset)?
            },
            color: {
               value: "#333333"
            },
            scale: {
               value: 0.001
            }
         },
      ],
   }]
}
```

### Filtering

In composing several tracks, it might be helpful to filter certain tracks,
either by genomic coordinates, or based on the data. The question is how much
power should this expression have: can be whole SQL.

```javascript
{
   /* ... */
   views: [{
      layout: "spatial",
      tracks: [
         { // track 1
            data: {
               url: "https://...",
            },
            color: {
               value: "#ff00ff"
            },
            scale: {
               value: 0.01
            }
            filter: "chr1", //~ select only part to show
            //filter: "chr1:10000-20000", //~ select only part to show
         },
         { // track 2
            data: {
               url: "https://...", // TODO: could this be too much repetition (if it's the same dataset)?
            },
            color: {
               value: "#333333"
            },
            scale: {
               value: 0.001
            }
         },
      ],
   }]
}
```

### Minimal example without any defaults

```javascript
const spec = {
   views: [{
      layout: "spatial", //~ basically, this should switch it into chromospace rendering
      tracks: [
         {
            data: {
               url: "https://.../model.arrow",
            },
            x: {
               field: "x", //~ this should look into the .arrow file
               type: ???, // will need to lift the requirement for x to only be 'genomic'
            },
            y: {
               field: "y",
               type: ???,
            },
            z: {
               field: "z",
               type: ???,
            },
            color: {
               field: "chr",
               type: ???,
            },
         },
      ],
   }]
}
```
Constant color:

```javascript
const spec = {
   views: [{
      layout: "spatial", //~ basically, this should switch it into chromospace rendering
      tracks: [
         {
            data: {
               url: "https://.../model.arrow",
            },
            x: {
               field: "x", //~ this should look into the .arrow file
               type: ???, // will need to lift the requirement for x to only be 'genomic'
            },
            y: {
               field: "y",
               type: ???,
            },
            z: {
               field: "z",
               type: ???,
            },
            color: {
               value: "red",
            },
         },
      ],
   }]
}
```

Designing with the goal of augmenting existing gosling specs

```javascript
{
  "title": "Visual Linking",
  "subtitle": "Change the position and range of brushes to update the detail view on the bottom",
  "arrangement": "vertical",
  "centerRadius": 0.4,
  "views": [
    {
      "layout": "linear",
      "xDomain": {"chromosome": "chr1", "interval": [160000000, 200000000]},
      "linkingId": "detail",
      "tracks": [
        {
          "data": {
            "url": "https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec",
            "type": "multivec",
            "row": "sample",
            "column": "position",
            "value": "peak",
            "categories": ["sample 1", "sample 2", "sample 3", "sample 4"]
          },
          "mark": "bar",
          // "spatial": {
          //   data: "https;",
          //   x: "x",
          //   y: "y",
          //   z: "z",
          // }
          "x": {"field": "position", "type": "genomic", "axis": "top"},
          "y": {"field": "peak", "type": "quantitative"},
          "row": {"field": "sample", "type": "nominal"},
          "color": {"field": "sample", "type": "nominal"},
          "width": 690,
          "height": 200
        }
      ]
    }
  ]
}
```
