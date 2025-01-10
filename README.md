# Gosling.js

[![npm version](https://img.shields.io/npm/v/gosling.js.svg)](https://www.npmjs.com/package/gosling.js) [![editor status](https://github.com/gosling-lang/gosling.js/actions/workflows/deploy-editor.yml/badge.svg)](https://github.com/gosling-lang/gosling.js/actions/workflows/deploy-editor.yml) [![build status](https://github.com/gosling-lang/gosling.js/actions/workflows/ci.yml/badge.svg)](https://github.com/gosling-lang/gosling.js/actions/workflows/ci.yml) [![codecov](https://img.shields.io/codecov/c/github/gosling-lang/gosling.js/master.svg?cacheSeconds=60)](https://codecov.io/gh/gosling-lang/gosling.js) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![online editor](https://img.shields.io/badge/demo-online_editor-E08243.svg)](https://gosling.js.org/) [![docs](https://img.shields.io/badge/docs-📖-57B4E9.svg)](http://gosling-lang.org/docs/)

**Gosling.js is a declarative grammar for interactive (epi)genomics visualization on the Web.**

<img width="1549" alt="teaser" src="https://user-images.githubusercontent.com/9922882/109852545-e05f3400-7c22-11eb-90f3-7371e4ddeb42.png">

## Why Gosling?

The Gosling's key features compared to existing visualization libraries and grammars are as follows:

-   **Encoding/Data Scalability**: Gosling scales from whole genomes to single nucleotides via semantic zooming that updates visual encodings dynamically and by using the rendering and data access capabilities of [our HiGlass genomics visualization framework](http://higlass.io/).

-   **Expressiveness**: Gosling is designed to be expressive enough to generate pretty much any visualization of genome-mapped data, which we accomplished by basing the grammar on [our taxonomy of (epi)genomics data visualizations](https://onlinelibrary.wiley.com/doi/full/10.1111/cgf.13727).

-   **Interactivity**: Gosling has intuitive and effective user interactions built in, including zooming and panning and [brushing and linking](https://infovis-wiki.net/wiki/Linking_and_Brushing). This enables flexible visualizations that cover a wide range of visual analysis scenarios, like overview + detail views with brushes or comparative views.

## Learn More About Gosling

-   [Documentation](http://gosling-lang.org/)
-   [Gosling.js Editor](https://gosling.js.org/)

## Contributing to Gosling.js

We welcome and greatly appreciate your contribution to this project! Please read [CONTRIBUTING.md](/CONTRIBUTING.md) to find guidelines.

## Contact

-   Open [Github Issues](https://github.com/gosling-lang/gosling.js/issues/) to ask questions or request features.

## Citation

[L'Yi et al., 2021. “Gosling: A Grammar-based Toolkit for Scalable and Interactive Genomics Data Visualization.”](https://osf.io/6evmb)

```bib
@article{lyi2021gosling,
  author = {L'Yi, Sehi and Wang, Qianwen and Lekschas, Fritz and Gehlenborg, Nils},
  doi = {10.1109/TVCG.2021.3114876},
  journal = {IEEE Transactions on Visualization and Computer Graphics},
  month = {1},
  number = {1},
  pages = {140--150},
  title = {{Gosling: A Grammar-based Toolkit forScalable and Interactive Genomics Data Visualization}},
  year = {2022}
}
```

## License

This project is licensed under the terms of the [MIT license](https://github.com/gosling-lang/gosling.js/blob/main/LICENSE.md).
