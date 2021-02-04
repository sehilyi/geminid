import { GLYPH_LOCAL_PRESET_TYPE, GLYPH_HIGLASS_PRESET_TYPE } from '../editor/example/deprecated/index';

/**
 * Root-level specification
 */
export type GoslingSpec = {
    assembly?: 'hm38'; // TODO: support others as well

    title?: string;
    subtitle?: string;

    static?: boolean;
    description?: string;

    layout?: 'linear' | 'circular';
    arrangement?: Arrangement;
    tracks: Track[];

    width?: number;
    height?: number;
};

/**
 * Arrangement of multiple tracks
 */
export interface Arrangement {
    direction?: 'vertical' | 'horizontal';
    wrap?: number;

    columnSizes?: number | number[];
    rowSizes?: number | number[];

    columnGaps?: number | number[];
    rowGaps?: number | number[];
}

/**
 * Data specification
 */
export type DataDeep = JSONData | CSVData | MultivecData | BEDData | VectorData;

export interface JSONData {
    type: 'json';
    values: Datum;
    quantitativeFields?: string[];
    chromosomeField?: string;
    genomicFields?: string[];
    sampleLength?: number; // This limit the total number of rows fetched (default: 1000)

    // !!! experimental
    genomicFieldsToConvert?: {
        chromosomeField: string;
        genomicFields: string[];
    }[];
}

export interface Datum {
    [k: string]: number | string;
}

export interface CSVData {
    type: 'csv';
    url: string;
    separator?: string;
    quantitativeFields?: string[];
    chromosomeField?: string;
    genomicFields?: string[];
    sampleLength?: number; // This limit the total number of rows fetched (default: 1000)
    // experimental
    headerNames?: string[];
    chromosomePrefix?: string;
    longToWideId?: string;
    // !!! experimental
    genomicFieldsToConvert?: {
        chromosomeField: string;
        genomicFields: string[];
    }[];
}

export interface MultivecData {
    type: 'multivec';
    url: string;
    column: string;
    row: string;
    value: string;
    categories?: string[];
    start?: string;
    end?: string;
    bin?: number; // Binning the genomic interval in tiles (unit size: 256)
}

export interface VectorData {
    type: 'vector';
    url: string;
    column: string;
    value: string;
    start?: string;
    end?: string;
    bin?: number; // Binning the genomic interval in tiles (unit size: 256)
}

export interface BEDData {
    type: 'bed';
    url: string;
    genomicFields: { index: number; name: string }[];
    valueFields?: { index: number; name: string; type: 'nominal' | 'quantitative' }[];
    // this is a somewhat arbitrary option for reading gene annotation datasets
    // should be multi-value fields (e.g., "1,2,3")
    exonIntervalFields?: [{ index: number; name: string }, { index: number; name: string }];
}

export interface DataTransform {
    filter: Filter[];
}

export type Filter = OneOfFilter | RangeFilter | IncludeFilter;

export interface RangeFilter {
    field: string;
    inRange: number[];
    not?: boolean;
}

export interface IncludeFilter {
    field: string;
    include: string;
    not?: boolean;
}

export interface OneOfFilter {
    field: string;
    oneOf: string[] | number[];
    not?: boolean;
}

export type Track = SingleTrack | SuperposedTrack | DataTrack; // | SuperposedTrackTwoLevels; // we could support this in the future

export type SingleTrack = BasicSingleTrack; // | CustomChannel; // we could support this in the future

// TODO: how to exclude keys defined in the `BasicSingleTrack`?
export type CustomChannel = {
    [k: string]: Channel;
} & {
    [k in CHANNEL_KEYS]?: never;
};

export interface CommonTrackDef {
    title?: string;
    subtitle?: string;
    description?: string;
    static?: boolean;

    // Layout
    width?: number;
    height?: number;
    span?: number;
    superposeOnPreviousTrack?: boolean;

    // Circular Layout
    layout?: 'circular' | 'linear';
    outerRadius?: number;
    innerRadius?: number;
    startAngle?: number; // [0, 360]
    endAngle?: number; // [0, 360]
}

/**
 * Partial specification of `BasicSingleTrack` to use default visual encoding predefined by data type.
 */
export interface DataTrack extends CommonTrackDef {
    // !!! The below properties should be required ones since metadata determines the visualization type.
    data: DataDeep;
}

/**
 * The baic form of a track definition
 */
export interface BasicSingleTrack extends CommonTrackDef {
    // Data
    data: DataDeep;

    // Data transformation
    dataTransform?: DataTransform;

    tooltip?: { field: string; type: FieldType; alt?: string }[];

    // Mark
    mark: Mark;

    // Visual channels
    x?: Channel; // We could have a special type of Channel for axes
    y?: Channel;
    xe?: Channel;
    ye?: Channel;

    x1?: Channel;
    y1?: Channel;
    x1e?: Channel;
    y1e?: Channel;

    row?: Channel;
    column?: Channel;

    color?: Channel;
    size?: Channel;
    text?: Channel;

    stroke?: Channel;
    strokeWidth?: Channel;
    opacity?: Channel;

    // Experimental
    stackY?: boolean; // Eventually, will be added to y's `Channel` w/ gap

    // Stretch the size to the given range? (e.g., [x, xe])
    stretch?: boolean;

    // Visibility
    visibility?: VisibilityCondition;

    // Styling
    style?: TrackStyle;

    // Override a spec template that is defined for a given data type
    overrideTemplate?: boolean;
}

/**
 * Superposing multiple tracks.
 */
export type SuperposedTrack = Partial<SingleTrack> & {
    superpose: Partial<SingleTrack>[];
};

/**
 * Juxtaposing multiple tracks.
 */
export type JuxtaposedTrack = Partial<SingleTrack> & {
    juxtapose: Partial<SingleTrack>[];
};

// TODO: support this to be able to ues two level superposition
export type SuperposedTrackTwoLevels = Partial<SingleTrack> & {
    superpose: Partial<SuperposedTrack>[];
};

export interface TrackStyle {
    background?: string;
    backgroundOpacity?: number;
    dashed?: [number, number];
    linePattern?: { type: 'triangle-l' | 'triangle-r'; size: number };
    curve?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'left' | 'right';
    dy?: number;
    outline?: string;
    outlineWidth?: number;
    circularLink?: boolean; // draw arc instead of bazier curve?
    // below options could instead be used with channel options (e.g., size, stroke, strokeWidth)
    textFontSize?: number;
    textStroke?: string;
    textStrokeWidth?: number;
    textFontWeight?: 'bold' | 'normal';
    //
    stroke?: string; // deprecated
    strokeWidth?: number; // deprecated
}

export type LogicalOperation =
    | 'less-than'
    | 'lt'
    | 'LT'
    | 'greater-than'
    | 'gt'
    | 'GT'
    | 'less-than-or-equal-to'
    | 'ltet'
    | 'LTET'
    | 'greater-than-or-equal-to'
    | 'gtet'
    | 'GTET';

export type VisibilityCondition = SizeVisibilityCondition | ZoomLevelVisibilityCondition;

interface CommonVisibilityCondition {
    operation: LogicalOperation;
}

export interface SizeVisibilityCondition extends CommonVisibilityCondition {
    target: 'track' | 'mark';
    measure: 'width' | 'height';
    threshold: number | '|xe-x|';
    conditionPadding?: number;
    transitionPadding?: number;
}

export interface ZoomLevelVisibilityCondition extends CommonVisibilityCondition {
    target: 'track';
    measure: 'zoomLevel';
    threshold: number;
}

export const enum CHANNEL_KEYS {
    x = 'x',
    y = 'y',
    xe = 'xe',
    ye = 'ye',
    x1 = 'x1',
    y1 = 'y1',
    x1e = 'x1e',
    y1e = 'y1e',
    color = 'color',
    row = 'row',
    opacity = 'opacity',
    stroke = 'stroke',
    strokeWidth = 'strokeWidth',
    size = 'size',
    text = 'text'
}

/**
 * Channel
 */
export const ChannelTypes = {
    // coordinates
    x: 'x',
    y: 'y',
    xe: 'xe',
    ye: 'ye',
    // coordinates for link
    x1: 'x1',
    y1: 'y1',
    x1e: 'x1e',
    y1e: 'y1e',
    // others
    color: 'color',
    row: 'row',
    opacity: 'opacity',
    stroke: 'stroke',
    strokeWidth: 'strokeWidth',
    size: 'size',
    text: 'text'
} as const;

export type ChannelType = keyof typeof ChannelTypes | string;

export type Channel = ChannelDeep | ChannelValue; // TODO: support null to allow removing spec when overriding

export interface ChannelDeep {
    field?: string;
    type?: FieldType;
    aggregate?: Aggregate;
    domain?: Domain;
    range?: Range;
    axis?: AxisPosition;
    legend?: boolean;
    baseline?: string | number;
    zeroBaseline?: boolean; // We could remove this and use the `baseline` option instead
    mirrored?: boolean; // Show baseline on the top or right instead of bottom or left
    grid?: boolean;
    linkingID?: string;
    flip?: boolean; // Flip a track vertically or horizontally?
    stack?: boolean; // Experimental: We could use this option to stack visual marks, addressing the visual overlap (e.g., stacked bar).
}
export type AxisPosition = 'none' | 'top' | 'bottom' | 'left' | 'right';
export type FieldType = 'genomic' | 'nominal' | 'quantitative';

export interface ChannelValue {
    value: number | string;
}

export type Domain = string[] | number[] | DomainInterval | DomainChrInterval | DomainChr | DomainGene;
export type Range = string[] | number[] | PREDEFINED_COLORS;
export type PREDEFINED_COLORS = 'viridis' | 'grey' | 'spectral' | 'warm' | 'cividis' | 'bupu' | 'rdbu';

export interface DomainChr {
    // For showing a certain chromosome
    chromosome: string;
}
export interface DomainChrInterval {
    // For showing a certain interval in a chromosome
    chromosome: string;
    interval: [number, number];
}
export interface DomainInterval {
    // For showing a certain interval in intire chromosomes
    interval: [number, number]; // This is consistent to HiGlass's initXDomain and initYDomain.
}
export interface DomainGene {
    // For showing genes
    // TODO: Not supported yet
    gene: string | [string, string];
}

export type Aggregate = 'max' | 'min' | 'mean' | 'bin' | 'count';

/**
 * Mark
 */
export type Mark = MarkType | MarkDeep;

export type MarkType =
    | 'point'
    | 'line'
    | 'area'
    | 'bar'
    | 'rect'
    | 'text'
    | 'link'
    | 'rule'
    | 'triangle-l'
    | 'triangle-r'
    | 'triangle-d'
    // experimental
    | 'brush'
    // TODO: perhaps need to make this invisible to users
    // being used to show title/subtitle internally
    | 'header';

/**
 * Glyph
 */
export type MarkDeep = MarkGlyphPreset | MarkGlyph | MarkWithStyle;

export interface MarkWithStyle {
    type: MarkType;
    curvature?: 'straight' | 'stepwise' | 'curved';
}

export interface MarkGlyphPreset {
    type: GLYPH_LOCAL_PRESET_TYPE | GLYPH_HIGLASS_PRESET_TYPE;
    server: string; // TODO: Not supported yet
}

export interface MarkGlyph {
    type: 'compositeMark';
    name: string;
    referenceColumn?: string; // reference column for selecting data tuples for each glyph
    requiredChannels: ChannelType[]; // channels that must be assigned // TODO: What about optional channels?
    elements: GlyphElement[];
}

export interface GlyphElement {
    // primitives
    description?: string;
    select?: { channel: ChannelType; oneOf: string[] }[];
    mark: MarkType | MarkBind;
    // coordinates
    x?: ChannelBind | ChannelValue | 'none';
    y?: ChannelBind | ChannelValue | 'none';
    xe?: ChannelBind | ChannelValue | 'none';
    ye?: ChannelBind | ChannelValue | 'none';
    // coordinates for link
    x1?: ChannelBind | ChannelValue | 'none';
    y1?: ChannelBind | ChannelValue | 'none';
    x1e?: ChannelBind | ChannelValue | 'none';
    y1e?: ChannelBind | ChannelValue | 'none';
    // others
    stroke?: ChannelBind | ChannelValue | 'none';
    strokeWidth?: ChannelBind | ChannelValue | 'none';
    row?: ChannelBind | ChannelValue | 'none';
    color?: ChannelBind | ChannelValue | 'none';
    size?: ChannelBind | ChannelValue | 'none';
    w?: ChannelBind | ChannelValue | 'none';
    opacity?: ChannelBind | ChannelValue | 'none';
    text?: ChannelBind | ChannelValue | 'none';
    background?: ChannelBind | ChannelValue | 'none';
    style?: MarkStyle;
}

export interface MarkStyle {
    dashed?: string;
    dy?: number;
    stroke?: string;
    strokeWidth?: number;
    background?: string;
}

export interface MarkBind {
    bind: string;
    domain: string[];
    range: MarkType[];
}

export interface ChannelBind {
    bind: ChannelType;
    aggregate?: Aggregate;
}

export interface AnyGlyphChannels {
    // Allow defining any kinds of chennels for binding data in Glyph
    [key: string]: ChannelBind | ChannelValue;
}
