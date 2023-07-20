import type { GoslingSpec } from 'gosling.js';
import { THUMBNAILS } from './thumbnails';
import { EX_SPEC_LAYOUT_AND_ARRANGEMENT_1, EX_SPEC_LAYOUT_AND_ARRANGEMENT_2 } from './json-spec/layout-and-arrangement';
import { EX_SPEC_MATRIX, EX_SPEC_RESPONSIVE_COMPARATIVE_MATRICES } from './json-spec/matrix';
import { EX_SPEC_CANCER_VARIANT_PROTOTYPE } from './json-spec/cancer-variant';
import { EX_SPEC_MATRIX_HFFC6 } from './json-spec/matrix-hffc6';
import { EX_SPEC_LINKING } from './json-spec/visual-linking';
// import { EX_SPEC_BASIC_SEMANTIC_ZOOM } from './json-spec/basic-semantic-zoom';
import {
    EX_SPEC_RESPONSIVE_COMPARATIVE_VIEWS,
    EX_SPEC_RESPONSIVE_IDEOGRAM,
    EX_SPEC_RESPONSIVE_MULTIVEC,
    EX_SPEC_RESPONSIVE_MULTIVEC_CIRCULAR
} from './json-spec/responsive';
import { EX_SPEC_RESPONSIVE_TRACK_WISE_COMPARISON } from './json-spec/responsive-track-wise-comparison';
import { EX_SPEC_ALIGNMENT_CHART, EX_SPEC_RESPONSIVE_ALIGNMENT_CHART } from './json-spec/responsive-alignment';
import { EX_SPEC_MARK_DISPLACEMENT } from './json-spec/mark-displacement';
import { EX_SPEC_CIRCULAR_OVERVIEW_LINEAR_DETAIL } from './json-spec/circular-overview-linear-detail-views';
import { EX_SPEC_SARS_COV_2 } from './json-spec/sars-cov-2';
import { EX_SPEC_CIRCOS, EX_SPEC_CIRCOS_BETWEEN_LINK, EX_SPEC_CIRCULR_RANGE } from './json-spec/circos';
import { EX_SPEC_GREMLIN } from './json-spec/gremlin';
import { EX_SPEC_GENE_ANNOTATION } from './json-spec/gene-annotation';
import { EX_SPEC_CLINVAR_LOLLIPOP, EX_SPEC_SEQUENCE_TRACK } from './json-spec/semantic-zoom';
import { EX_SPEC_GIVE } from './json-spec/give';
import { EX_SPEC_CYTOBANDS } from './json-spec/ideograms';
import { EX_SPEC_PILEUP } from './json-spec/pileup';
import { EX_SPEC_TEMPLATE } from './json-spec/track-template';
import { EX_SPEC_MOUSE_EVENT } from './json-spec/mouse-event';
import { EX_SPEC_DEBUG } from './json-spec/debug';
import * as docExamples from './doc-examples';

// js and json importing from the same file
import JS_SPEC_VISUAL_ENCODING from './spec/visual-encoding.ts?raw';
import { spec as JSON_SPEC_VISUAL_ENCODING } from './spec/visual-encoding';

import JS_SPEC_VISUAL_ENCODING_CIRCULAR from './spec/visual-encoding-circular.ts?raw';
import { spec as JSON_SPEC_VISUAL_ENCODING_CIRCULAR } from './spec/visual-encoding-circular';

import JS_SPEC_RULE from './spec/rule.ts?raw';
import { spec as JSON_SPEC_RULE } from './spec/rule';

import JS_SPEC_SASHIMI from './spec/sashimi?raw';
import { spec as JSON_SPEC_SASHIMI } from './spec/sashimi';

import JS_SPEC_BAND from './spec/vertical-band?raw';
import { spec as JSON_SPEC_BAND } from './spec/vertical-band';

import JS_SPEC_CORCES_ET_AL from './spec/corces?raw';
import { spec as JSON_SPEC_CORCES_ET_AL } from './spec/corces';

import JS_SPEC_BASIC_SEMANTIC_ZOOM from './spec/basic-semantic-zoom?raw';
import { spec as JSON_SPEC_BASIC_SEMANTIC_ZOOM } from './spec/basic-semantic-zoom';

import JS_SPEC_ISLANDVIEWER from './spec/islandviewer?raw';
import { spec as JSON_SPEC_ISLANDVIEWER } from './spec/islandviewer';

export type ExampleGroup =
    | 'Visual Encoding'
    | 'Mouse Events'
    | 'Semantic Zooming'
    | 'Responsive Visualization'
    | 'Coordinated Multiple Views'
    | 'Applications'
    | 'Track Templates'
    | 'Doc'
    | 'Unassigned';

export const ExampleGroups: {
    name: ExampleGroup;
    description: string;
}[] = [
    {
        name: 'Visual Encoding',
        description:
            'Common visualizations, such as bar charts, heatmaps, and line charts, and glyph-based visualizations, such as gene annotations and ideograms.'
    },
    {
        name: 'Mouse Events',
        description: 'Flexible use of interactions using mouse events, such as mouse hover, range select, and tooltips.'
    },
    {
        name: 'Semantic Zooming',
        description:
            'Dynamic visualizations that change visual representations based on the predefined scales, i.e., zoom levels.'
    },
    {
        name: 'Responsive Visualization',
        description:
            'Dynamic visualizations that change visual representations and the structure of multiple views based on the screen resolutions.'
    },
    {
        name: 'Coordinated Multiple Views',
        description:
            'Coordinated interactions between multiple visualizations, such as zooming, panning, brushing, and linking.'
    },
    {
        name: 'Applications',
        description: 'Analytics visualizations (re)implemented using Gosling.'
    },
    {
        name: 'Track Templates',
        description: 'Built-in track templates that allow creating common tracks, like ideograms and gene annotations.'
    },
    {
        name: 'Doc',
        description: 'Examples used in the official documentation.'
    },
    {
        name: 'Unassigned',
        description: 'Examples that are not assigned to a group.'
    }
];

export interface Example {
    group: ExampleGroup;
    name: string;
    spec: GoslingSpec | string;
    id?: string;
    description?: string;
    underDevelopment?: boolean;
    specJs?: string;
    hidden?: boolean;
    forceShow?: boolean;
    image?: string;
}

// Followings are doc examples that are only accessible via URLs using the key, such as
// https://gosling.js.org/?example=doc_area
const docExampleObj: {
    readonly [id: string]: Example;
} = {
    doc_area: {
        group: 'Doc',
        name: 'Area Mark',
        spec: docExamples.AREA,
        hidden: true
    },
    doc_bar: {
        group: 'Doc',
        name: 'Bar Mark',
        spec: docExamples.BAR,
        hidden: true
    },
    doc_brush: {
        group: 'Doc',
        name: 'Brush Mark',
        spec: docExamples.BRUSH,
        hidden: true
    },
    doc_line: {
        group: 'Doc',
        name: 'Line Mark',
        spec: docExamples.LINE,
        hidden: true
    },
    doc_link: {
        group: 'Doc',
        name: 'Link Mark',
        spec: docExamples.LINK,
        hidden: true
    },
    doc_linking_tracks: {
        group: 'Doc',
        name: 'Linking Tracks',
        spec: docExamples.LINKING_TRACKS,
        hidden: true
    },
    doc_point: {
        group: 'Doc',
        name: 'Point Mark',
        spec: docExamples.POINT,
        hidden: true
    },
    doc_rect: {
        group: 'Doc',
        name: 'React Mark',
        spec: docExamples.RECT,
        hidden: true
    },
    doc_text: {
        group: 'Doc',
        name: 'Text Mark',
        spec: docExamples.TEXT,
        hidden: true
    },
    doc_triangle: {
        group: 'Doc',
        name: 'Triangle Mark',
        spec: docExamples.TRIANGLE,
        hidden: true
    },
    doc_overlay_bar_point: {
        group: 'Doc',
        name: 'Overlay Tracks: Bar + Point',
        spec: docExamples.OVERLAY_TRACKS_BAR_POINT,
        hidden: true
    },
    doc_overlay_rect_text: {
        group: 'Doc',
        name: 'Overlay Tracks: Rect + Text',
        spec: docExamples.OVERLAY_TRACKS_RECT_TEXT,
        hidden: true
    },
    doc_overlay_line_point: {
        group: 'Doc',
        name: 'Overlay Tracks: Line + Point',
        spec: docExamples.OVERLAY_TRACKS_LINE_POINT,
        hidden: true
    },
    doc_semantic_zoom_sequence: {
        group: 'Doc',
        name: 'A Sequence Example',
        spec: docExamples.SEMANTIC_ZOOM_SEQUENCE,
        hidden: true
    },
    doc_semantic_zoom_cyto: {
        group: 'Doc',
        name: 'Cyto',
        spec: docExamples.SEMANTIC_ZOOM_CYTO,
        hidden: true
    },
    doc_vcf_indels: {
        group: 'Doc',
        name: 'VCF insertions and deletions',
        spec: docExamples.VCF_INDELS,
        hidden: true
    },
    doc_vcf_point_mutations: {
        group: 'Doc',
        name: 'VCF insertions and deletions',
        spec: docExamples.VCF_POINT_MUTATIONS,
        hidden: true
    },
    doc_bed: {
        group: 'Doc',
        name: 'BED file',
        spec: docExamples.BED_DEMO,
        hidden: true
    },
    doc_gff: {
        group: 'Doc',
        name: 'GFF file',
        spec: docExamples.GFF_DEMO,
        hidden: true
    }
};

// Examples that show up in the Editor
const editorExampleObj: {
    readonly [id: string]: Example;
} = {
    DEBUG: {
        group: 'Unassigned',
        name: 'DEBUG',
        spec: EX_SPEC_DEBUG,
        hidden: true
    },
    VISUAL_ENCODING: {
        group: 'Visual Encoding',
        name: 'Visual Encoding',
        spec: JSON_SPEC_VISUAL_ENCODING,
        specJs: JS_SPEC_VISUAL_ENCODING,
        image: THUMBNAILS.VISUAL_ENCODING
    },
    VISUAL_ENCODING_CIRCULAR: {
        group: 'Visual Encoding',
        name: 'Circular Visual Encoding',
        spec: JSON_SPEC_VISUAL_ENCODING_CIRCULAR,
        specJs: JS_SPEC_VISUAL_ENCODING_CIRCULAR,
        image: THUMBNAILS.VISUAL_ENCODING_CIRCULAR
    },
    BAND: {
        group: 'Visual Encoding',
        name: 'Band Connection',
        spec: JSON_SPEC_BAND,
        specJs: JS_SPEC_BAND,
        image: THUMBNAILS.BAND
    },
    RULE: {
        group: 'Visual Encoding',
        name: 'Rule Mark',
        spec: JSON_SPEC_RULE,
        specJs: JS_SPEC_RULE,
        image: THUMBNAILS.RULE
    },
    MATRIX: {
        group: 'Visual Encoding',
        name: 'Hi-C Matrix with Annotations',
        spec: EX_SPEC_MATRIX,
        image: THUMBNAILS.MATRIX
    },
    LINKING: {
        group: 'Coordinated Multiple Views',
        name: 'Visual Linking',
        spec: EX_SPEC_LINKING,
        image: THUMBNAILS.LINKING
    },
    MOUSE_EVENT: {
        group: 'Mouse Events',
        name: 'Custom Mouse Events',
        spec: EX_SPEC_MOUSE_EVENT,
        underDevelopment: true,
        image: THUMBNAILS.MOUSE_EVENT
    },
    LAYOUT_AND_ARRANGEMENT_1: {
        group: 'Unassigned',
        name: 'Layouts and Arrangements',
        spec: EX_SPEC_LAYOUT_AND_ARRANGEMENT_1,
        hidden: true
    },
    LAYOUT_AND_ARRANGEMENT_2: {
        group: 'Unassigned',
        name: 'Layouts and Arrangements 2',
        spec: EX_SPEC_LAYOUT_AND_ARRANGEMENT_2,
        hidden: true
    },
    BASIC_SEMANTIC_ZOOM: {
        group: 'Semantic Zooming',
        name: 'Basic Idea of Semantic Zoom',
        spec: JSON_SPEC_BASIC_SEMANTIC_ZOOM,
        specJs: JS_SPEC_BASIC_SEMANTIC_ZOOM,
        hidden: true
    },
    MARK_DISPLACEMENT: {
        group: 'Visual Encoding',
        name: 'Mark Displacement',
        spec: EX_SPEC_MARK_DISPLACEMENT,
        image: THUMBNAILS.MARK_DISPLACEMENT
    },
    CIRCULAR_OVERVIEW_LINEAR_DETAIL: {
        group: 'Coordinated Multiple Views',
        name: 'Circular Overview + Linear Detail Views',
        spec: EX_SPEC_CIRCULAR_OVERVIEW_LINEAR_DETAIL,
        image: THUMBNAILS.CIRCULAR_OVERVIEW_LINEAR_DETAIL
    },
    SEQUENCE: {
        group: 'Semantic Zooming',
        name: 'Multi-Scale Sequence Track',
        spec: EX_SPEC_SEQUENCE_TRACK,
        image: THUMBNAILS.SEQUENCE
    },
    SEMANTIC_ZOOM: {
        group: 'Semantic Zooming',
        name: 'Multi-Scale Clinvar Lollipop Plot',
        spec: EX_SPEC_CLINVAR_LOLLIPOP,
        image: THUMBNAILS.SEMANTIC_ZOOM
    },
    RESPONSIVE_MULTIVEC: {
        group: 'Responsive Visualization',
        name: 'Multiple Vectors',
        spec: EX_SPEC_RESPONSIVE_MULTIVEC,
        image: THUMBNAILS.RESPONSIVE_MULTIVEC
    },
    RESPONSIVE_MULTIVEC_CIRCULAR: {
        group: 'Responsive Visualization',
        name: 'Circular Multiple Vectors',
        spec: EX_SPEC_RESPONSIVE_MULTIVEC_CIRCULAR,
        image: THUMBNAILS.RESPONSIVE_MULTIVEC_CIRCULAR
    },
    RESPONSIVE_IDEOGRAM: {
        group: 'Responsive Visualization',
        name: 'Ideogram',
        spec: EX_SPEC_RESPONSIVE_IDEOGRAM,
        underDevelopment: true,
        image: THUMBNAILS.RESPONSIVE_IDEOGRAM
    },
    RESPONSIVE_COMPARATIVE_VIEWS: {
        group: 'Responsive Visualization',
        name: 'Comparative Views',
        spec: EX_SPEC_RESPONSIVE_COMPARATIVE_VIEWS,
        underDevelopment: true,
        hidden: true
    },
    RESPONSIVE_COMPARATIVE_MATRICES: {
        group: 'Responsive Visualization',
        name: 'Comparative Matrices',
        spec: EX_SPEC_RESPONSIVE_COMPARATIVE_MATRICES,
        image: THUMBNAILS.RESPONSIVE_COMPARATIVE_MATRICES
    },
    RESPONSIVE_TRACK_WISE_COMPARISON: {
        group: 'Responsive Visualization',
        name: 'Track-wise Comparison',
        spec: EX_SPEC_RESPONSIVE_TRACK_WISE_COMPARISON,
        image: THUMBNAILS.RESPONSIVE_TRACK_WISE_COMPARISON
    },
    RESPONSIVE_ALIGNMENT: {
        group: 'Responsive Visualization',
        name: 'Alignment Views',
        spec: EX_SPEC_RESPONSIVE_ALIGNMENT_CHART,
        underDevelopment: true,
        hidden: true
    },
    CYTOBANDS: {
        group: 'Visual Encoding',
        name: 'Ideograms',
        spec: EX_SPEC_CYTOBANDS,
        image: THUMBNAILS.CYTOBANDS
    },
    GENE_ANNOTATION: {
        group: 'Visual Encoding',
        name: 'Custom Gene Annotation',
        spec: EX_SPEC_GENE_ANNOTATION,
        image: THUMBNAILS.GENE_ANNOTATION
    },
    MATRIX_HFFC6: {
        group: 'Coordinated Multiple Views',
        name: 'Comparative Matrices (Micro-C vs. Hi-C)',
        spec: EX_SPEC_MATRIX_HFFC6,
        image: THUMBNAILS.MATRIX_HFFC6
    },
    CIRCOS: {
        group: 'Visual Encoding',
        name: 'Circos',
        spec: EX_SPEC_CIRCOS,
        image: THUMBNAILS.CIRCOS
    },
    'Circular Range': {
        group: 'Visual Encoding',
        name: 'Circular Range (Inspired By Weather Radials)',
        spec: EX_SPEC_CIRCULR_RANGE,
        hidden: true
    },
    SARS_COV_2: {
        group: 'Applications',
        name: 'SARS-CoV-2',
        spec: EX_SPEC_SARS_COV_2,
        image: THUMBNAILS.SARS_COV_2
    },
    ALIGNMENT: {
        group: 'Applications',
        name: 'Alignment Chart',
        spec: EX_SPEC_ALIGNMENT_CHART,
        image: THUMBNAILS.ALIGNMENT
    },
    CORCES_ET_AL: {
        group: 'Coordinated Multiple Views',
        name: 'Corces et al. 2020',
        spec: JSON_SPEC_CORCES_ET_AL,
        specJs: JS_SPEC_CORCES_ET_AL,
        image: THUMBNAILS.CORCES_ET_AL
    },
    GREMLIN: {
        group: 'Applications',
        name: "Gremlin (O'Brien et al. 2010)",
        spec: EX_SPEC_GREMLIN,
        image: THUMBNAILS.GREMLIN
    },
    SASHIMI_PLOT: {
        group: 'Visual Encoding',
        name: 'Sashimi Plot',
        spec: JSON_SPEC_SASHIMI,
        specJs: JS_SPEC_SASHIMI,
        underDevelopment: true,
        image: THUMBNAILS.SASHIMI_PLOT
    },
    CIRCULAR_BETWEEN_BANDS: {
        group: 'Visual Encoding',
        name: 'Circular Between Bands',
        spec: EX_SPEC_CIRCOS_BETWEEN_LINK,
        underDevelopment: true,
        image: THUMBNAILS.CIRCULAR_BETWEEN_BANDS
    },
    GIVE: {
        group: 'Applications',
        name: 'GIVE (Cao et al. 2018)',
        spec: EX_SPEC_GIVE,
        underDevelopment: true,
        image: THUMBNAILS.GIVE
    },
    CANCER_VARIANT: {
        group: 'Applications',
        name: 'Breast Cancer Variant (Staaf et al. 2019)',
        spec: EX_SPEC_CANCER_VARIANT_PROTOTYPE,
        image: THUMBNAILS.CANCER_VARIANT
    },
    BAM_PILEUP: {
        group: 'Applications',
        name: 'BAM file pileup tracks',
        spec: EX_SPEC_PILEUP,
        image: THUMBNAILS.BAM_PILEUP
    },
    TEMPLATE: {
        group: 'Track Templates',
        name: 'Genes, Sequence, and Ideograms',
        spec: EX_SPEC_TEMPLATE,
        underDevelopment: true,
        image: THUMBNAILS.TEMPLATE
    },
    ISLANDVIEWER: {
        group: 'Applications',
        name: 'IslandViewer (Bertelli et al. 2017)',
        spec: JSON_SPEC_ISLANDVIEWER,
        specJs: JS_SPEC_ISLANDVIEWER,
        underDevelopment: true,
        image: THUMBNAILS.ISLANDVIEWER
    }
};

export const examples: {
    readonly [id: string]: Example;
} = {
    ...editorExampleObj,
    ...docExampleObj
};
