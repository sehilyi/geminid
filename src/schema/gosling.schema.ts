/* ----------------------------- ROOT SPEC ----------------------------- */
export type GoslingSpec =
    | (RootSpecWithSingleView & ResponsiveSpecOfSingleView)
    | (RootSpecWithMultipleViews & ResponsiveSpecOfMultipleViews);

export type ResponsiveSize = boolean | { width?: boolean; height?: boolean };

export type RootSpecWithSingleView = SingleView & {
    title?: string;
    subtitle?: string;
    description?: string;
    /** Determine whether to make the size of `GoslingComponent` bound to its parent element. __Default__: `false` */
    responsiveSize?: ResponsiveSize;
};

export interface RootSpecWithMultipleViews extends MultipleViews {
    title?: string;
    subtitle?: string;
    description?: string;
    /** Determine whether to make the size of `GoslingComponent` bound to its parent element. __Default__: `false` */
    responsiveSize?: ResponsiveSize;
}

/* ----------------------------- VIEW ----------------------------- */
export type View = SingleView | (MultipleViews & ResponsiveSpecOfMultipleViews);

export type SingleView = (OverlaidTracks | StackedTracks | FlatTracks) & ResponsiveSpecOfSingleView;

export type SelectivityCondition = {
    operation: LogicalOperation;
    /**
     * Does the condition applied to the visualization itself or its container? __Default__: `'self'`
     */
    target?: 'self' | 'container';
    measure: 'width' | 'height' | 'aspectRatio';
    /** Threshold in the unit of pixels. */
    threshold: number;
};

export type ResponsiveSpecOfSingleView = {
    responsiveSpec?: {
        spec: Partial<OverlaidTracks | StackedTracks>;
        selectivity: SelectivityCondition[];
    }[];
};

export interface FlatTracks extends CommonViewDef {
    tracks: Track[];
}

export type PartialTrack = Partial<Track>;

export interface StackedTracks extends CommonViewDef, Partial<SingleTrack> {
    alignment?: 'stack';
    tracks: (PartialTrack | OverlaidTracks)[];
}

export interface OverlaidTracks extends CommonViewDef, Partial<SingleTrack> {
    alignment: 'overlay';
    tracks: PartialTrack[];
}

export interface MultipleViews extends CommonViewDef {
    /**
     * Specify how multiple views are arranged.
     */
    arrangement?: 'parallel' | 'serial' | 'horizontal' | 'vertical';
    /** An array of view specifications */
    views: Array<SingleView | MultipleViews>;

    /** Internal: Used for responsive spec */
    _assignedWidth?: number;
    _assignedHeight?: number;
}

export type ResponsiveSpecOfMultipleViews = {
    responsiveSpec?: {
        spec: Partial<MultipleViews>;
        selectivity: SelectivityCondition[];
    }[];
};

export type Layout = 'linear' | 'circular';
export type Orientation = 'horizontal' | 'vertical';

/** Custom chromosome sizes, e.g., [["foo", 1000], ["bar", 300], ["baz", 240]] */
export type ChromSizes = [string, number][];
export type Assembly = 'hg38' | 'hg19' | 'hg18' | 'hg17' | 'hg16' | 'mm10' | 'mm9' | 'unknown' | ChromSizes;
export type ZoomLimits = [number | null, number | null];

export interface CommonViewDef {
    /** The ID of a view that is maintained for the use of JS API functions, e.g., positions of a view */
    id?: string;
    /** Specify the layout type of all tracks. */
    layout?: Layout;
    /** Specify the orientation. */
    orientation?: Orientation;

    /**
     * The size of the gap (1) between tracks, (2) between views, and (3) of the origin of circular tracks.
     * The effect of this property depends on where on the spec you specify the `spacing`.
     *
     * In a linear layout, this value is used in pixels,
     * while in a circular layout, this value is used relative to the height of the tracks or views.
     */
    spacing?: number;
    /** Whether to disable [Zooming and Panning](http://gosling-lang.org/docs/user-interaction#zooming-and-panning),
     * __Default:__ `false`.
     */
    static?: boolean;
    zoomLimits?: ZoomLimits; // limits of zoom levels. default: [1, null]

    /** Specify the x offset of views in the unit of pixels */
    xOffset?: number;
    /** Specify the y offset of views in the unit of pixels */
    yOffset?: number;

    /**
     * A string that specifies the genome builds to use.
     * Currently support `"hg38"`, `"hg19"`, `"hg18"`, `"hg17"`, `"hg16"`, `"mm10"`, `"mm9"`, and `"unknown"`.
     *
     * __Note:__: with `"unknown"` assembly, genomic axes do not show chrN: in labels.
     */
    assembly?: Assembly;

    /** Specify the visible region of genomic x-axis */
    xDomain?: DomainInterval | DomainChrInterval | DomainChr;

    /** Specify the visible region of genomic y-axis */
    yDomain?: DomainInterval | DomainChrInterval | DomainChr;

    /** Specify an ID for [linking multiple views](http://gosling-lang.org/docs/user-interaction#linking-views) */
    linkingId?: string;
    /** not supported  */
    xAxis?: AxisPosition; // not supported currently

    /**
     * Proportion of the radius of the center white space.
     *
     * __Default:__ `0.3`
     * @Range [0, 1]
     */
    centerRadius?: number;

    /**
     * Define the [style](http://gosling-lang.org/docs/visual-channel#style-related-properties) of multive views.
     * Will be overwritten by the style of children elements (e.g., view, track).
     */
    style?: Style;

    /** Internal: Used for responsive spec */
    _assignedWidth?: number;
    _assignedHeight?: number;
}

/* ----------------------------- TRACK ----------------------------- */
export type Track = SingleTrack | OverlaidTrack | DataTrack | TemplateTrack;

export interface CommonTrackDef extends CommonViewDef {
    /** Assigned to `uid` in a HiGlass view config, used for API and caching. */
    id?: string;

    /** If defined, will show the textual label on the left-top corner of a track. */
    title?: string;
    subtitle?: string; // Being used only for a title track (i.e., 'text-track')

    /** Specify the track width in pixels. */
    width?: number;
    /** Specify the track height in pixels. */
    height?: number;

    // Arrangement
    overlayOnPreviousTrack?: boolean;

    // Circular Layout
    /**
     * Specify the outer radius of tracks when `{"layout": "circular"}`.
     */
    outerRadius?: number;
    /**
     * Specify the inner radius of tracks when (`{"layout": "circular"}`).
     */
    innerRadius?: number;
    /**
     * Specify the start angle (in the range of [0, 360]) of circular tracks (`{"layout": "circular"}`).
     */
    startAngle?: number; // [0, 360]
    /**
     * Specify the end angle (in the range of [0, 360]) of circular tracks (`{"layout": "circular"}`).
     */
    endAngle?: number; // [0, 360]

    // Internally used properties
    /** internal */
    _renderingId?: string;
    /** internal */
    _invalidTrack?: boolean; // flag to ignore rendering certain tracks if they have problems // !!! TODO: add tests

    // To test upcoming feature.
    /** internal */
    prerelease?: {
        // ...
    };
}

/**
 * Partial specification of `BasicSingleTrack` to use default visual encoding predefined by data type.
 */
export interface DataTrack extends CommonTrackDef {
    data: DataDeep;
}

/* ----------------------------- MARK ----------------------------- */
export type Mark =
    | 'point'
    | 'line'
    | 'area'
    | 'bar'
    | 'rect'
    | 'text'
    | 'withinLink'
    | 'betweenLink'
    | 'rule'
    | 'triangleLeft'
    | 'triangleRight'
    | 'triangleBottom'
    // experimental
    | 'brush'
    // TODO: perhaps need to make this invisible to users
    // being used to show title/subtitle internally
    | 'header';

/* ----------------------------- API & MOUSE EVENTS ----------------------------- */
interface CommonEventData {
    /** Source visualization ID, i.e., `track.id` */
    id: string;
    /** Values in a JSON array that represent data after data transformation */
    data: Datum[];
}

export interface GenomicPosition {
    chromosome: string;
    position: number;
}

interface PointMouseEventData extends CommonEventData {
    /** A genomic coordinate, e.g., `chr1:100,000`. */
    genomicPosition: GenomicPosition;
}

interface RangeMouseEventData extends CommonEventData {
    // NOTE: We could include this type to `GenomicDomain`, i.e., enabling users to display genomic range across multiple chromosomes
    /** Start and end genomic coordinates. Null if a range is deselected. */
    genomicRange: [GenomicPosition, GenomicPosition] | null;
}

/**
 * The visual parameters that determine the shape of a linear track or a view.
 * Origin is the left top corner.
 */
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The visual parameters that determine the shape of a circular track */
interface CircularTrackShape {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    /** The first angle in the range of [0, 360]. The origin is 12 o'clock. Anticlockwise. */
    startAngle: number;
    /** The second angle in the range of [0, 360]. The origin is 12 o'clock. Anticlockwise. */
    endAngle: number;
}

/**
 * The information of a view exposed to users through JS API.
 */
export type ViewApiData = {
    /** ID of a source view, i.e., `view.id` */
    id: string;

    /** Expanded view specification processed by the Gosling compiler, e.g., default properties filled in. */
    spec: View;

    /** The shape of the source view */
    shape: BoundingBox;
};

/** The information for a track mouse event */
export type TrackApiData = {
    /** ID of a source track, i.e., `track.id` */
    id: string;

    /** Expanded track specification processed by the Gosling compiler, e.g., default properties filled in. */
    spec: SingleTrack | OverlaidTrack;

    /** The shape of the source track */
    shape: BoundingBox | (BoundingBox & CircularTrackShape);
};

/** The API data of tracks or views */
export type VisUnitApiData = ({ type: 'view' } & ViewApiData) | ({ type: 'track' } & TrackApiData);

export type _EventMap = {
    mouseOver: PointMouseEventData;
    click: PointMouseEventData;
    rangeSelect: RangeMouseEventData;
    rawData: CommonEventData;
    trackMouseOver: TrackApiData;
    trackClick: TrackApiData; // TODO (Jul-25-2022): with https://github.com/higlass/higlass/pull/1098, we can support circular layouts
};

/** Options for determining mouse events in detail, e.g., turning on specific events only */
export type MouseEventsDeep = {
    /** Whether to enable mouseover events. */
    mouseOver?: boolean;

    /** Whether to enable click events. */
    click?: boolean;

    /** Whether to send range selection events. */
    rangeSelect?: boolean;

    /** Group marks using keys in a data field. This affects how a set of marks are highlighted/selected by interaction. __Default__: `undefined` */
    groupMarksByField?: string;

    /** Determine whether all marks underneath the mouse point should be affected by mouse over. __Default__: `false` */
    enableMouseOverOnMultipleMarks?: boolean;
};

/* ----------------------------- TRACK ----------------------------- */
export type SingleTrack = SingleTrackBase & Encoding;

interface SingleTrackBase extends CommonTrackDef {
    // Data
    data: DataDeep;

    // Data transformation
    dataTransform?: DataTransform[];

    // Tooltip
    tooltip?: Tooltip[];

    // Experimental
    experimental?: {
        /*
         * Determine whether to use mouse events, such as click and mouse over on marks. __Default__: `false`
         */
        mouseEvents?: boolean | MouseEventsDeep;

        /**
         * Render visual marks with less smooth curves to increase rendering performance.
         * Only supported for `elliptical` `linkStyle` `withinLink` currently.
         * @default false
         */
        performanceMode?: boolean;
    };

    // Mark
    mark: Mark;

    // Resolving overlaps
    displacement?: Displacement;

    // Visibility
    visibility?: VisibilityCondition[];

    // Experimental
    flipY?: boolean; // This is only supported for `link` marks.
    baselineY?: number; // This is only supported for `link` marks.
    stretch?: boolean; // Stretch the size to the given range? (e.g., [x, xe])
    overrideTemplate?: boolean; // Override a spec template that is defined for a given data type.
}

export interface Encoding {
    x?: X | ChannelValue;
    y?: Y | ChannelValue;
    xe?: X | ChannelValue;
    ye?: Y | ChannelValue;

    x1?: X | ChannelValue;
    y1?: Y | ChannelValue;
    x1e?: X | ChannelValue;
    y1e?: Y | ChannelValue;

    row?: Row | ChannelValue;

    color?: Color | ChannelValue;
    size?: Size | ChannelValue;
    text?: Text | ChannelValue;

    stroke?: Stroke | ChannelValue;
    strokeWidth?: StrokeWidth | ChannelValue;
    opacity?: Opacity | ChannelValue;
}

export interface Tooltip {
    /** Specifiy a data field whose value will show in the tooltip. */
    field: string;
    /** Type of the data field. */
    type: FieldType;
    /** Name of the data field for showing in the tooltip. Will use the field name if not specified. */
    alt?: string;
    /** format of the data value. */
    format?: string;
}

export interface Displacement {
    type: DisplacementType;
    padding?: number; // A pixel value

    // "pile" specific parameters (TODO: make this a separate interface)
    // minRows?: number; // Specify at least how many rows should be generated (default: 0)
    // maxRows?: number; // Specify maximum rows to be generated (default: `undefined` meaning no limit)
}

export type DisplacementType = 'pile' | 'spread';

// TODO: Check whether `Omit` is properly included in the generated `gosling.schema.json`
// https://github.com/vega/ts-json-schema-generator/issues/101
/**
 * Superposing multiple tracks.
 */
export type OverlaidTrack = Partial<SingleTrack> & {
    // This is a property internally used when compiling
    overlay: Partial<Omit<SingleTrack, 'height' | 'width' | 'layout' | 'title' | 'subtitle'>>[];
};

/**
 * The styles defined here will be applied to the target marks of mouse events, such as a point mark after the user clicks on it.
 */
export interface EventStyle {
    /** color of the marks when mouse events are triggered */
    color?: string;
    /** stroke color of the marks when mouse events are triggered */
    stroke?: string;
    /** stroke width of the marks when mouse events are triggered */
    strokeWidth?: number;
    strokeOpacity?: number;
    /** opacity of the marks when mouse events are triggered */
    opacity?: number;

    /** Show event effects behind or in front of marks. */
    arrange?: 'behind' | 'front';
}

export interface Style {
    // Top-level Styles
    background?: string;
    backgroundOpacity?: number;
    outline?: string;
    outlineWidth?: number;
    /**
     * Whether to enable smooth paths when drawing curves.
     *
     * __Default__: `false`
     */
    enableSmoothPath?: boolean;

    // Mark-level styles
    /**
     * Specify the pattern of dashes and gaps for `rule` marks.
     */
    dashed?: [number, number];
    /**
     * Specify the pattern of dashes and gaps for `rule` marks.
     */
    linePattern?: { type: 'triangleLeft' | 'triangleRight'; size: number };
    /**
     * Specify the curve of `rule` marks.
     */
    curve?: 'top' | 'bottom' | 'left' | 'right';
    /**
     * Specify the alignment of marks.
     * This property is currently only supported for `triangle` marks.
     */
    align?: 'left' | 'right';
    /**
     * Offset the position of marks in x direction.
     * This property is currently only supported for `text` marks
     */
    dx?: number;
    /**
     * Offset the position of marks in y direction.
     * This property is currently only supported for `text` marks.
     */
    dy?: number;

    /**
     * The style of `withinLink` and `betweenLink` marks. __Default__: `'circular'`
     * `'elliptical'` will be used as a default option.
     */
    linkStyle?: 'elliptical' | 'circular' | 'straight';

    /**
     * The minimum height of `withinLink` and `betweenLink` marks. Unit is a percentagle. __Default__: `0.5`
     * @Range [0, 1]
     */
    linkMinHeight?: number;

    /**
     * Whether to show vertical lines that connect to the baseline (axis) when `y` and `ye` are both used. __Default__: `false`
     */
    withinLinkVerticalLines?: boolean;

    /**
     * Specify whether to show legend in a single horizontal line?
     */
    inlineLegend?: boolean;
    /**
     * If defined, show legend title on the top or left
     */
    legendTitle?: string;

    // below options could instead be used with channel options (e.g., size, stroke, strokeWidth)
    /**
     * Specify the font size of `text` marks.
     * Can also be specified using the `size` channel option of `text` marks.
     */
    textFontSize?: number;
    /**
     * Specify the stroke of `text` marks.
     * Can also be specified using the `stroke` channel option of `text` marks.
     */
    textStroke?: string;
    /**
     * Specify the stroke width of `text` marks.
     * Can also be specified using the `strokeWidth` channel option of `text` marks.
     */
    textStrokeWidth?: number;
    /** Specify the font weight of `text` marks. */
    textFontWeight?: 'bold' | 'normal';
    /** Specify the alignment of `text` marks to a given point.
     */
    textAnchor?: 'start' | 'middle' | 'end';
    /** Specify the connetion type of `betweenLink` marks.
     *
     * __Default__: `"corner"`
     */
    linkConnectionType?: 'straight' | 'curve' | 'corner';

    /**
     * Determine to show only one side of the diagonal in a HiGlass matrix. __Default__: `"full"`
     */
    matrixExtent?: 'full' | 'upper-right' | 'lower-left';

    /**
     * Customize visual effects of `mouseOver` events on marks.
     */
    mouseOver?: EventStyle;

    /**
     * Customize visual effects of `rangeSelect` events on marks .
     */
    select?: EventStyle;

    /**
     * Customize the style of the brush mark in the `rangeSelect` mouse event.
     */
    brush?: Omit<EventStyle, 'arrange'>;
}

/* ----------------------------- SEMANTIC ZOOM ----------------------------- */
export type VisibilityCondition = SizeVisibilityCondition | ZoomLevelVisibilityCondition;

interface CommonVisibilityCondition {
    /**
     * A string that specifies the logical operation to conduct between `threshold` and the `measure` of `target`.
     * Support
     *
     * - greater than : "greater-than", "gt", "GT"
     *
     * - less than : "less-than", "lt", "LT"
     *
     * - greater than or equal to : "greater-than-or-equal-to", "gtet", "GTET"
     *
     * - less than or equal to : "less-than-or-equal-to", "ltet", "LTET"
     */
    operation: LogicalOperation;
    /**
     * Specify the buffer size (in pixel) of width or height when calculating the visibility.
     *
     * __Default__: `0`
     */
    conditionPadding?: number;
    /**
     * Specify the buffer size (in pixel) of width or height for smooth transition.
     *
     * __Default__: `0`
     */
    transitionPadding?: number;
}

export interface SizeVisibilityCondition extends CommonVisibilityCondition {
    /**
     * Target specifies the object that you want to compare with the threshold.
     */
    target: 'track' | 'mark';
    /**
     * Specify which aspect of the `target` will be compared to the `threshold`.
     */
    measure: 'width' | 'height';
    /**
     * Specify the threshold as one of:
     *
     * - A number representing a fixed threshold in the unit of pixels;
     *
     * - `"|xe-x|"`, using the distance between `xe` and `x` as threshold
     */
    threshold: number | '|xe-x|';
}

export interface ZoomLevelVisibilityCondition extends CommonVisibilityCondition {
    /**
     * Target specifies the object that you want to compare with the threshold.
     */
    target: 'track' | 'mark';
    /**
     * Specify which aspect of the `target` will be compared to the `threshold`.
     */
    measure: 'zoomLevel';
    /**
     * Set a threshold in the unit of base pairs (bp)
     */
    threshold: number;
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

/* ----------------------------- VISUAL CHANNEL ----------------------------- */
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

export interface AxisCommon {
    /** Name of the data field. */
    field?: string;
    /** Specify the data type. */
    type?: 'quantitative' | 'nominal' | 'genomic';
    /** Values of the data */
    domain?: ValueExtent | GenomicDomain;
    /** Values of the visual channel. */
    range?: ValueExtent;
    /** Specify where should the axis be put  */
    axis?: AxisPosition;
    /** Whether to display legend. __Default__: `false` */
    legend?: boolean;
    /** Users need to assign a unique linkingId for [linking views](/docs/user-interaction#linking-views) and [Brushing and Linking](/docs/user-interaction#brushing-and-linking) */
    linkingId?: string;
    /** Specify how to aggregate data. __Default__: `undefined` */
    aggregate?: Aggregate;
    /** Whether to display grid. __Default__: `false` */
    grid?: boolean;
}

export interface X extends AxisCommon {
    type?: 'genomic';
    domain?: GenomicDomain;
}

export interface Y extends AxisCommon {
    /** Custom baseline of the y-axis. __Default__: `0` */
    baseline?: string | number;
    /** Specify whether to use zero baseline. __Default__: `true`  */
    zeroBaseline?: boolean; // TODO: We could remove this and use the `baseline` option instead
    /** Whether to flip the y-axis. This is done by inverting the `range` property. __Default__: `false` */
    flip?: boolean;
}

export interface ChannelDeepCommon {
    /** Name of the data field */
    field?: string;
    /** Specify the data type */
    type?: 'quantitative' | 'nominal' | 'genomic';
    /** Values of the data */
    domain?: ValueExtent;
    /** Ranges of visual channel values */
    range?: ValueExtent | Range;
}

export interface Row extends ChannelDeepCommon {
    type?: 'nominal';
    domain?: ValueExtent;
    /** Determine the start and end position of rendering area of this track along vertical axis. __Default__: `[0, height]` */
    range?: ValueExtent;
    /** Whether to display legend. __Default__: `false` */
    legend?: boolean;
    /** Determines the size of inner white spaces on the top and bottom of individiual rows. __Default__: `0` */
    padding?: number;
    /** Whether to display grid. __Default__: `false` */
    grid?: boolean;
    /** Clip row when the actual y value exceeds the max value of the y scale. Used only for bar marks at the moment. __Default__: `true` */
    clip?: boolean;
}

export interface Color extends ChannelDeepCommon {
    type?: 'quantitative' | 'nominal';
    domain?: ValueExtent;
    /** Determine the colors that should be bound to data value. Default properties are determined considering the field type. */
    range?: Range;
    /** Title of the legend. __Default__: `undefined` */
    title?: string;
    /** Whether to display legend. __Default__: `false` */
    legend?: boolean;

    scale?: 'linear' | 'log';
    /** Whether to use offset of the domain proportionally. This is bound to brushes on the color legend. __Default__: `[0, 1]` */
    scaleOffset?: [number, number];
}

export interface Stroke extends ChannelDeepCommon {
    type?: 'quantitative' | 'nominal';
    domain?: ValueExtent;
    range?: Range;
    /** Title of the legend. __Default__: `undefined` */
    title?: string;
    /** Whether to display legend. __Default__: `false` */
    legend?: boolean;
    /** Whether to use offset of the domain proportionally. This is bound to brushes on the color legend. __Default__: `[0, 1]` */
    scaleOffset?: [number, number];
}

export interface StrokeWidth extends ChannelDeepCommon {
    type?: 'quantitative' | 'nominal';
    domain?: ValueExtent;
    range?: ValueExtent;
}

export interface Size extends ChannelDeepCommon {
    type?: 'quantitative' | 'nominal';
    domain?: ValueExtent;
    range?: ValueExtent;
    /** not supported: Whether to display legend. __Default__: `false` */
    legend?: boolean;
}

export interface Opacity extends ChannelDeepCommon {
    type?: 'quantitative' | 'nominal';
    domain?: ValueExtent;
    range?: ValueExtent;
}

export interface Text extends Omit<ChannelDeepCommon, 'baseline'> {
    type?: 'quantitative' | 'nominal';
    domain?: string[];
    range?: string[];
}

export type ChannelDeep = X | Y | Row | Color | Size | Stroke | StrokeWidth | Opacity | Text;

export interface ChannelValue {
    /** Assign a constant value for a visual channel. */
    value: number | string;
}

export type AxisPosition = 'none' | 'top' | 'bottom' | 'left' | 'right';
export type FieldType = 'genomic' | 'nominal' | 'quantitative';
export type ValueExtent = string[] | number[];
export type GenomicDomain = DomainInterval | DomainChrInterval | DomainChr;
export type Domain = ValueExtent | GenomicDomain;
export type Range = ValueExtent | PredefinedColors;
export type PredefinedColors = 'viridis' | 'grey' | 'spectral' | 'warm' | 'cividis' | 'bupu' | 'rdbu' | 'hot' | 'pink';

export interface DomainChr {
    // For showing a certain chromosome
    chromosome: string;
}
export interface DomainChrInterval {
    /** If specified, only showing a certain interval in a chromosome. */
    chromosome: string;
    interval: [number, number];
}
export interface DomainInterval {
    /** Show a certain interval within entire chromosome */
    interval: [number, number]; // This is consistent to HiGlass's initXDomain and initYDomain.
}

export type Aggregate = 'max' | 'min' | 'mean' | 'bin' | 'count';
export type BinAggregate = 'mean' | 'sum';

/* ----------------------------- DATA ----------------------------- */
export type DataDeep =
    | JsonData
    | CsvData
    | BedData
    | BigWigData
    | MultivecData
    | BeddbData
    | VectorData
    | MatrixData
    | BamData
    | VcfData
    | GffData;

/** Values in the form of JSON. */
export interface Datum {
    [k: string]: number | string;
}

/**
 * The JSON data format allows users to include data directly in the Gosling's JSON specification.
 */
export interface JsonData {
    /**
     * Define data type.
     */
    type: 'json';

    /** Values in the form of JSON. */
    values: Datum[];

    /** Specify the name of chromosome data fields. */
    chromosomeField?: string;

    /** Specify the name of genomic data fields. */
    genomicFields?: string[];

    /** Specify the number of rows loaded from the URL.
     *
     * __Default:__ `1000`
     */
    sampleLength?: number;

    /** experimental */
    genomicFieldsToConvert?: {
        chromosomeField: string;
        genomicFields: string[];
    }[];
}

/**
 * BED file format
 */
export interface BedData {
    type: 'bed';
    /**
     * Specify the URL address of the data file.
     */
    url: string;
    /**
     * Specify the URL address of the data file index.
     */
    indexUrl: string;
    /**
     * An array of strings, where each string is the name of a non-standard field in the BED file.
     * If there are `n` custom fields, we assume that the last `n` columns of the BED file correspond to the custom fields.
     */
    customFields?: string[];
    /**
     * Specify the number of rows loaded from the URL.
     *
     * __Default:__ `1000`
     */
    sampleLength?: number; // This limit the total number of rows fetched (default: 1000)
}

/**
 * Any small enough tabular data files, such as tsv, csv, BED, BEDPE, and GFF, can be loaded using "csv" data specification.
 */

export interface CsvData {
    type: 'csv';

    /**
     * Specify the URL address of the data file.
     */
    url: string;

    /**
     * Specify file separator, __Default:__ ','
     */
    separator?: string;

    /**
     * Specify the name of chromosome data fields.
     */
    chromosomeField?: string;

    /**
     * Specify the name of genomic data fields.
     */
    genomicFields?: string[];

    /**
     * Specify the number of rows loaded from the URL.
     *
     * __Default:__ `1000`
     */
    sampleLength?: number; // This limit the total number of rows fetched (default: 1000)

    /**
     * Specify the names of data fields if a CSV file does not contain a header.
     */
    headerNames?: string[];

    /**
     * Specify the chromosome prefix if chromosomes are denoted using a prefix besides "chr" or a number
     */
    chromosomePrefix?: string;

    /**
     * experimental
     */
    longToWideId?: string;

    /**
     * experimental
     */
    genomicFieldsToConvert?: {
        chromosomeField: string;
        genomicFields: string[];
    }[];
}

/**
 * Two-dimensional quantitative values,
 * one axis for genomic coordinate and the other for different samples, can be converted into HiGlass' `"multivec"` data.
 * For example, multiple BigWig files can be converted into a single multivec file.
 * You can also convert sequence data (FASTA) into this format where rows will be different nucleotide bases (e.g., A, T, G, C)
 * and quantitative values represent the frequency. Find out more about this format at [HiGlass Docs](https://docs.higlass.io/data_preparation.html#multivec-files).
 */
export interface MultivecData {
    type: 'multivec';

    /**
     * Specify the URL address of the data file.
     */
    url: string;

    /**
     * Assign a field name of the middle position of genomic intervals. __Default__: `"position"`
     */
    column?: string;

    /**
     * Assign a field name of samples. __Default__: `"category"`
     */
    row?: string;

    /**
     * Assign a field name of quantitative values. __Default__: `"value"`
     */
    value?: string;

    /**
     *  assign names of individual samples.
     */
    categories?: string[];

    /**
     * Assign a field name of the start position of genomic intervals. __Default__: `"start"`
     */
    start?: string;

    /**
     * Assign a field name of the end position of genomic intervals. __Default__: `"end"`
     */
    end?: string;

    /**
     * Binning the genomic interval in tiles (unit size: 256).
     */
    binSize?: number;

    /** Determine aggregation function to apply within bins. __Default__: `"mean"` */
    aggregation?: BinAggregate;
}

export interface BigWigData {
    type: 'bigwig';

    /**
     * Specify the URL address of the data file.
     */
    url: string;

    /**
     * Assign a field name of the middle position of genomic intervals. __Default__: `"position"`
     */
    column?: string;

    /**
     * Assign a field name of quantitative values. __Default__: `"value"`
     */
    value?: string;

    /**
     * Assign a field name of the start position of genomic intervals. __Default__: `"start"`
     */
    start?: string;

    /**
     * Assign a field name of the end position of genomic intervals. __Default__: `"end"`
     */
    end?: string;

    /**
     * Binning the genomic interval in tiles (unit size: 256).
     */
    binSize?: number;

    /** Determine aggregation function to apply within bins. __Default__: `"mean"` */
    aggregation?: BinAggregate;
}

/**
 * One-dimensional quantitative values along genomic position (e.g., bigwig) can be converted into HiGlass' `"vector"` format data.
 * Find out more about this format at [HiGlass Docs](https://docs.higlass.io/data_preparation.html#bigwig-files).
 */

export interface VectorData {
    type: 'vector';
    /**
     * Specify the URL address of the data file.
     */
    url: string;

    /** Assign a field name of the middle position of genomic intervals. __Default__: `"position"` */
    column?: string;

    /** Assign a field name of quantitative values. __Default__: `"value"` */
    value?: string;

    /** Assign a field name of the start position of genomic intervals. __Default__: `"start"` */
    start?: string;

    /** Assign a field name of the end position of genomic intervals. __Default__: `"end"` */
    end?: string;

    /** Binning the genomic interval in tiles (unit size: 256). */
    binSize?: number;

    /** Determine aggregation function to apply within bins. __Default__: `"mean"` */
    aggregation?: BinAggregate;
}

/**
 * Regular BED or similar files can be pre-aggregated for the scalable data exploration.
 * Find our more about this format at [HiGlass Docs](https://docs.higlass.io/data_preparation.html#bed-files).
 */
export interface BeddbData {
    type: 'beddb';

    /** Specify the URL address of the data file. */
    url: string;

    /** Specify the name of genomic data fields. */
    genomicFields: { index: number; name: string }[];

    /** Specify the column indexes, field names, and field types. */
    valueFields?: { index: number; name: string; type: 'nominal' | 'quantitative' }[];

    // this is a somewhat arbitrary option for reading gene annotation datasets
    // should be multi-value fields (e.g., "1,2,3")
    /** experimental */
    exonIntervalFields?: [{ index: number; name: string }, { index: number; name: string }];
}

/**
 * Binary Alignment Map (BAM) is the comprehensive raw data of genome sequencing;
 * it consists of the lossless, compressed binary representation of the Sequence Alignment Map-files.
 */
export interface BamData {
    type: 'bam';

    /** URL link to the BAM data file */
    url: string;

    /** URL link to the index file of the BAM file */
    indexUrl: string;

    /** Load mates that are located in the same chromosome. __Default__: `false` */
    loadMates?: boolean;

    /** Determine whether to extract exon-to-exon junctions. __Default__: `false` */
    extractJunction?: boolean;

    /** Determine the threshold of coverage when extracting exon-to-exon junctions. __Default__: `1` */
    junctionMinCoverage?: number;

    /** Determines the threshold of insert sizes for determining the structural variants. __Default__: `5000` */
    maxInsertSize?: number; // https://github.com/GMOD/bam-js#async-getrecordsforrangerefname-start-end-opts
}

/**
 * Generic Feature Format Version 3 (GFF3) format data. It parses files that follow the
 * [GFF3 specification](https://github.com/The-Sequence-Ontology/Specifications/blob/master/gff3.md).
 */
export interface GffData {
    type: 'gff';
    /** URL link to the GFF file */
    url: string;

    /** URL link to the tabix index file */
    indexUrl: string;

    /** The maximum number of samples to be shown on the track. Samples are uniformly randomly selected so that this
     * threshold is not exceeded. __Default:__ `1000` */
    sampleLength?: number;
    /**
     * Specifies which attributes to include as a fields.
     * GFF files have an "attributes" column which contains a list of attributes which are each tag-value pairs (`tag=value`).
     * This option allows for specific attributes to be accessible as a field. For example, if you have an attribute called
     * "gene_name" and you want label features on your track using those values, you can use this option so that you can use
     * `"field": "gene_name"` in the schema.
     *
     * If there is a single `value` corresponding to the `tag`, Gosling will parse that value as a string. If there are
     * multiple `value`s corresponding to a `tag`, Gosling will parse it as a comma-separated list string. If a feature
     * does not have a particular attribute, then the attribute value will be set to the `defaultValue`.
     */
    attributesToFields?: { attribute: string; defaultValue: string }[];
}

/**
 * The Variant Call Format (VCF).
 */
export interface VcfData {
    type: 'vcf';

    /** URL link to the VCF file */
    url: string;

    /** URL link to the tabix index file */
    indexUrl: string;

    /** The maximum number of rows to be loaded from the URL. __Default:__ `1000` */
    sampleLength?: number;
}

export interface MatrixData {
    type: 'matrix';

    /** URL link to the matrix data file */
    url: string;

    /** The name of the first genomic field. __Default__: `x` */
    column?: string;

    /** The name of the first genomic field. __Default__: `y` */
    row?: string;

    /** The name of the value field. __Default__: `value` */
    value?: string;

    /** Determine the number of nearby cells to aggregate. __Default__: `1` */
    binSize?: number;
}

/* ----------------------------- DATA TRANSFORM ----------------------------- */

export type DataTransform =
    | FilterTransform
    | StrConcatTransform
    | StrReplaceTransform
    | LogTransform
    | DisplaceTransform
    | ExonSplitTransform
    | GenomicLengthTransform
    | SvTypeTransform
    | CoverageTransform
    | JsonParseTransform;

export type FilterTransform = OneOfFilter | RangeFilter | IncludeFilter;

interface CommonFilterTransform {
    type: 'filter';
    /** A filter is applied based on the values of the specified data field */
    field: string;
    /**
     * when `{"not": true}`, apply a NOT logical operation to the filter.
     *
     * __Default:__ `false` */
    not?: boolean;
}

export interface RangeFilter extends CommonFilterTransform {
    /** Check whether the value is in a number range. */
    inRange: number[];
}

export interface IncludeFilter extends CommonFilterTransform {
    /** Check whether the value includes a substring. */
    include: string;
}

export interface OneOfFilter extends CommonFilterTransform {
    /** Check whether the value is an element in the provided list. */
    oneOf: (string | number | null)[];
}

// !! Not supported yet
export interface ComparisonFilter extends CommonFilterTransform {
    /**
     * The second field to compare the value with.
     */
    field2: string;

    /**
     * A logical operation to apply between two fields.
     */
    operation: LogicalOperation;

    not: undefined; // Not used
}

export type LogBase = number | 'e';
export interface LogTransform {
    type: 'log';
    field: string;
    /** If not specified, 10 is used. */
    base?: LogBase;
    /** If specified, store transformed values in a new field. */
    newField?: string;
}

export interface StrConcatTransform {
    type: 'concat';
    fields: string[];
    newField: string;
    separator: string;
}

export interface StrReplaceTransform {
    type: 'replace';
    field: string;
    newField: string;
    replace: { from: string; to: string }[];
}

export interface DisplaceTransform {
    type: 'displace';
    // We could support different types of bounding boxes (e.g., using a center position and a size)
    boundingBox: {
        /** The name of a quantitative field that represents the start position. */
        startField: string;

        /** The name of a quantitative field that represents the end position. */
        endField: string;

        /** The padding around visual lements. Either px or bp */
        padding?: number;

        /** Whether to consider `padding` as the bp length. */
        isPaddingBP?: boolean;

        /** The name of a nominal field to group rows by in prior to piling-up. */
        groupField?: string;
    };
    /** A string that specifies the type of displacement.  */
    method: DisplacementType;
    newField: string;

    /** Specify maximum rows to be generated (default has no limit). */
    maxRows?: number;
}

export interface ExonSplitTransform {
    type: 'exonSplit';
    separator: string;
    flag: { field: string; value: number | string };
    fields: { field: string; type: FieldType; newField: string; chrField: string }[];
}

/**
 * Calculate genomic length using two genomic fields
 */
export interface GenomicLengthTransform {
    type: 'genomicLength';
    startField: string;
    endField: string;
    newField: string;
}

/**
 * Based on the BEDPE, infer SV types.
 * SV types are specified as one of the following strings: DUP, TRA, DEL, t2tINV, h2hINV.
 */
type BpFields = {
    chrField: string;
    posField: string;
    strandField: string;
};
export interface SvTypeTransform {
    type: 'svType';
    firstBp: BpFields;
    secondBp: BpFields;
    newField: string;
}

/**
 * Aggregate rows and calculate coverage
 */
export interface CoverageTransform {
    type: 'coverage';
    startField: string;
    endField: string;
    newField?: string;
    /** The name of a nominal field to group rows by in prior to piling-up */
    groupField?: string;
}

/**
 * Parse JSON Object Array and append vertically
 */
export interface JsonParseTransform {
    type: 'subjson';
    /** The field that contains the JSON object array. */
    field: string;
    /** Base genomic position when parsing relative position. */
    baseGenomicField: string;
    /** Relative genomic position to parse. */
    genomicField: string;
    /** Length of genomic interval. */
    genomicLengthField: string;
}

/* ----------------------------- Templates ----------------------------- */

/**
 * Template specification that will be internally converted into `SingleTrack` for rendering.
 */
export interface TemplateTrack extends CommonTrackDef {
    // Template name (e.g., 'gene')
    template: string;

    // Data specification that is identical to the one in `SingleTrack`
    data: DataDeep;

    // ! TODO: Is there a way to make this not nested while preserving the other specific properties like `data` and `template`?
    // https://basarat.gitbook.io/typescript/type-system/index-signatures#excluding-certain-properties-from-the-index-signature
    // https://stackoverflow.com/questions/51465182/how-to-remove-index-signature-using-mapped-types
    encoding?: {
        // Custom channels (e.g., geneHeight, strandColor, ...)
        [k: string]: Channel;
    };
}

/**
 * Definition of Track Templates.
 */
export interface TemplateTrackDef {
    name: string;
    channels: CustomChannelDef[];
    mapping: TemplateTrackMappingDef[];
}

/**
 * Definition of custom channels used in a track template.
 */
export interface CustomChannelDef {
    name: string;
    type: FieldType | 'value';
    required?: boolean;
}

// TODO: LogTransform already has `base`
export type DataTransformWithBase = Partial<DataTransform> & { base?: string };

/**
 * This is based on `SingleTrack` but the differences are only the type of channels
 * which additionally have `base` properties to override properties from a template spec
 * and remove of certain properties (e.g., `data`)
 */
export type TemplateTrackMappingDef = Omit<
    CommonTrackDef,
    'data' | 'height' | 'width' | 'layout' | 'title' | 'subtitle'
> & {
    // Data transformation
    dataTransform?: DataTransformWithBase[];

    tooltip?: Tooltip[];

    // Mark
    mark: Mark;

    // Visual channels
    x?: ChannelWithBase;
    y?: ChannelWithBase;
    xe?: ChannelWithBase;
    ye?: ChannelWithBase;

    x1?: ChannelWithBase;
    y1?: ChannelWithBase;
    x1e?: ChannelWithBase;
    y1e?: ChannelWithBase;

    row?: ChannelWithBase;

    color?: ChannelWithBase;
    size?: ChannelWithBase;
    text?: ChannelWithBase;

    stroke?: ChannelWithBase;
    strokeWidth?: ChannelWithBase;
    opacity?: ChannelWithBase;

    // Resolving overlaps
    displacement?: Displacement;

    // Visibility
    visibility?: VisibilityCondition[];

    // !! TODO: Remove these?
    // Experimental
    flipY?: boolean; // This is only supported for `link` marks.
    stretch?: boolean; // Stretch the size to the given range? (e.g., [x, xe])
    overrideTemplate?: boolean; // Override a spec template that is defined for a given data type.
};

// The main difference is that this allows to specify a `base` property
export type ChannelWithBase = Channel & {
    base?: string;
};
