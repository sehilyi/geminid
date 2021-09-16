import type { GoslingSpec } from 'gosling.js';
import { EX_SPEC_LAYOUT_AND_ARRANGEMENT_1, EX_SPEC_LAYOUT_AND_ARRANGEMENT_2 } from './layout-and-arrangement';
import { EX_SPEC_VISUAL_ENCODING, EX_SPEC_VISUAL_ENCODING_CIRCULAR } from './visual-encoding';
import { EX_SPEC_CANCER_VARIANT_PROTOTYPE } from './cancer-variant';
import { EX_SPEC_MATRIX_HFFC6 } from './matrix-hffc6';
import { EX_SPEC_LINKING } from './visual-linking';
import { EX_SPEC_BASIC_SEMANTIC_ZOOM } from './basic-semantic-zoom';
import { EX_SPEC_MARK_DISPLACEMENT } from './mark-displacement';
import { EX_SPEC_CIRCULAR_OVERVIEW_LINEAR_DETAIL } from './circular-overview-linear-detail-views';
import { EX_SPEC_SARS_COV_2 } from './sars-cov-2';
import { EX_SPEC_CIRCOS, EX_SPEC_CIRCULR_RANGE } from './circos';
import { EX_SPEC_GREMLIN } from './gremlin';
import { EX_SPEC_GENE_ANNOTATION } from './gene-annotation';
import { EX_SPEC_CLINVAR_LOLLIPOP, EX_SPEC_SEQUENCE_TRACK } from './semantic-zoom';
import { EX_SPEC_GIVE } from './give';
import { EX_SPEC_CORCES_ET_AL } from './corces';
import { EX_SPEC_CYTOBANDS } from './ideograms';
import { EX_SPEC_PILEUP } from './pileup';
import { EX_SPEC_BAND } from './vertical-band';
import { EX_SPEC_TEMPLATE } from './track-template';
import { EX_SPEC_DEBUG } from './debug';

export const examples: ReadonlyArray<{
    name: string;
    spec: GoslingSpec;
    id: string;
    description?: string;
    underDevelopment?: boolean;
    hidden?: boolean;
    forceShow?: boolean;
}> = [
    {
        name: 'DEBUG',
        spec: EX_SPEC_DEBUG,
        id: 'DEBUG',
        hidden: true
    },
    {
        name: 'Basic Example: Visual Encoding',
        id: 'VISUAL_ENCODING',
        spec: EX_SPEC_VISUAL_ENCODING
    },
    {
        name: 'Basic Example: Circular Visual Encoding',
        id: 'VISUAL_ENCODING_CIRCULAR',
        spec: EX_SPEC_VISUAL_ENCODING_CIRCULAR
    },
    {
        name: 'Basic Example: Band Connection',
        id: 'BAND',
        spec: EX_SPEC_BAND
    },
    {
        name: 'Basic Example: Visual Linking',
        id: 'LINKING',
        spec: EX_SPEC_LINKING
    },
    {
        name: 'Basic Example: Layouts and Arrangements',
        id: 'LAYOUT_AND_ARRANGEMENT_1',
        spec: EX_SPEC_LAYOUT_AND_ARRANGEMENT_1,
        hidden: true
    },
    {
        name: 'Layouts and Arrangements 2',
        id: 'LAYOUT_AND_ARRANGEMENT_2',
        spec: EX_SPEC_LAYOUT_AND_ARRANGEMENT_2,
        hidden: true
    },
    {
        name: 'Basic Example: Basic Idea of Semantic Zoom',
        id: 'BASIC_SEMANTIC_ZOOM',
        spec: EX_SPEC_BASIC_SEMANTIC_ZOOM,
        hidden: true
    },
    {
        name: 'Basic Example: Mark Displacement',
        id: 'MARK_DISPLACEMENT',
        spec: EX_SPEC_MARK_DISPLACEMENT
    },
    {
        name: 'Basic Example: Circular Overview + Linear Detail Views',
        id: 'CIRCULAR_OVERVIEW_LINEAR_DETAIL',
        spec: EX_SPEC_CIRCULAR_OVERVIEW_LINEAR_DETAIL
    },
    {
        name: 'Multi-Scale Sequence Track',
        id: 'SEQUENCE',
        spec: EX_SPEC_SEQUENCE_TRACK
    },
    {
        name: 'Multi-Scale Clinvar Lollipop Plot',
        id: 'SEMANTIC_ZOOM',
        spec: EX_SPEC_CLINVAR_LOLLIPOP
    },
    {
        name: 'Ideograms',
        id: 'CYTOBANDS',
        spec: EX_SPEC_CYTOBANDS
    },
    {
        name: 'Custom Gene Annotation',
        id: 'GENE_ANNOTATION',
        spec: EX_SPEC_GENE_ANNOTATION
    },
    {
        name: 'Comparative Matrices (Micro-C vs. Hi-C)',
        id: 'MATRIX_HFFC6',
        spec: EX_SPEC_MATRIX_HFFC6
    },
    {
        name: 'Circos',
        id: 'CIRCOS',
        spec: EX_SPEC_CIRCOS
    },
    {
        name: 'Circular Range (Inspired By Weather Radials)',
        id: 'Circular Range',
        spec: EX_SPEC_CIRCULR_RANGE,
        hidden: true
    },
    {
        name: 'SARS-CoV-2',
        id: 'SARS_COV_2',
        spec: EX_SPEC_SARS_COV_2
    },
    {
        name: 'Corces et al. 2020',
        id: 'CORCES_ET_AL',
        spec: EX_SPEC_CORCES_ET_AL
    },
    {
        name: "Gremlin (O'Brien et al. 2010)",
        id: 'GREMLIN',
        spec: EX_SPEC_GREMLIN,
        underDevelopment: true
    },
    {
        name: 'GIVE (Cao et al. 2018)',
        id: 'GIVE',
        spec: EX_SPEC_GIVE,
        underDevelopment: true
    },
    {
        name: 'Breast Cancer Variant (Staaf et al. 2019)',
        id: 'CANCER_VARIANT',
        spec: EX_SPEC_CANCER_VARIANT_PROTOTYPE,
        underDevelopment: true
    },
    {
        name: 'BAM file pileup tracks',
        id: 'BAM_PILEUP',
        spec: EX_SPEC_PILEUP,
        underDevelopment: true
    },
    {
        name: 'Track Template',
        id: 'TEMPLATE',
        spec: EX_SPEC_TEMPLATE,
        underDevelopment: true
    }
].filter(d => !d.hidden);
