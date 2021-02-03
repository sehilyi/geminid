<!-- <p align="center"><img src="https://raw.githubusercontent.com/wiki/gosling-lang/gosling.js/images/logo.png" width="450" /></p> -->

<div align="center">
<h1>Gosling.js</h1>

[![npm version](https://img.shields.io/npm/v/gosling.js.svg?style=flat-square)](https://www.npmjs.com/package/gosling.js)
[![Build Status](https://img.shields.io/travis/sehilyi/geminid/master.svg?style=flat-square)](https://travis-ci.com/gosling-lang/gosling.js)
[![codecov](https://img.shields.io/codecov/c/github/gosling-lang/gosling.js/master.svg?style=flat-square&?cacheSeconds=60)](https://codecov.io/gh/gosling-lang/gosling.js)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

</div>

<p align="center"><img src="https://raw.githubusercontent.com/wiki/gosling-lang/gosling.js/images/cover.png" width="700"/></p>

<br/>
<br/>

## Introduction

Gosling is a declarative visualization grammar tailored for interactive genomic visualizations. 
Using Gosling.js, users can easily create interactive and scalable genomic visualizations through writing a JSON configuration. 

<table>
<tr><td>  
<pre>
{
    // Simplest example with only data configuration
    "tracks": [{
        "data": {
            "url": "https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ",
            "type": "tileset"
        },
        "metadata": {
            "type": "higlass-multivec",
            "row": "sample",
            "column": "position",
            "value": "peak",
            "categories": ["sample 1", "sample 2", "sample 3", "sample 4"]
        }
    }]
}
</pre>

</td>
<td>
<img src="https://raw.githubusercontent.com/wiki/gosling-lang/gosling.js/images/demo.gif"  width="400"/>
<center><a href="https://gosling.js.org/">Try Online</></center>
</td>
</tr>
</table>
<!--[Try Online](<https://gosling.js.org/?full=false&spec=('trackG(0'BurlKhttps%3A%2F%2Fresgen.io%2Fapi%2Fv1%2FC_info%2F%3Fd%3DUvVPeLHuRDiYA3qwFlm7xQ8EC'0)%2C0'metaBEhiglass-multivec8row698columnKposition8valueKpeak8categorieGM1525354'%5D0)I)%5D%0A)*%20%200I*5J%20M6!%208J0*'9'sampleBdata6(0*'CtilesetEtypeKGs6%5BI%0A**J'%2CK6'M9%20%01MKJIGECB98650*_>) -->

## Learn More About Gosling
- [Gosling.js Website](https://gosling.js.org/)
- [Documentation](https://github.com/gosling-lang/gosling.js/wiki/Documentation)
- [Online Examples](https://gosling.js.org/)
- [Getting Started](https://github.com/gosling-lang/gosling.js/wiki/GettingStarted)
- [Use Gosling.js in your React app](https://github.com/gosling-lang/gosling-react)
- [Roadmap](https://github.com/gosling-lang/gosling.js/projects/1)

## Installation
```
npm install gosling.js
```

## Run Editor Locally

The following commands install and run a Gosling.js editor locally in your computer (ensure you have installed [yarn](https://yarnpkg.com/getting-started/install)):

```sh
yarn
yarn start
```
Then you can open <http://localhost:8080/> in a web browser to play with the editor.

## Contact
- Open [Github Issues](https://github.com/gosling-lang/gosling.js/issues/) to ask questions or request features.

## Team
- Sehi L'Yi (<sehi_lyi@hms.harvard.edu>)
- Qianwen Wang (<qianwen_wang@hms.harvard.edu>)
- Nils Gehlenborg (<nils@hms.harvard.edu>)

## License

This project is licensed under the terms of the [MIT license](https://github.com/gosling-lang/gosling.js/blob/master/LICENSE.md).


<!-- # Cite Gosling -->
