// HiGlass Specification Should be consistent to the following scheme:
// https://github.com/higlass/higlass/blob/develop/app/schema.json (2ced037)

import type { Assembly, FilterTransform } from '@gosling.schema';

// The json schema is converted to TypeScript codes using:
// https://github.com/quicktype/quicktype
// and then revised manually.
export interface HiGlassSpec {
    editable?: boolean;
    zoomFixed?: boolean;
    viewEditable?: boolean;
    tracksEditable?: boolean;
    compactLayout?: boolean;
    trackSourceServers?: string[];
    exportViewUrl?: string;
    chromInfoPath?: string;
    views: View[];
    zoomLocks: GenericLocks;
    locationLocks: GenericLocks;
    valueScaleLocks?: ValueScaleLocks;
}

export interface View {
    uid?: string;
    initialXDomain?: number[];
    initialYDomain?: number[];
    zoomLimits?: [number | null, number | null];
    autocompleteSource?: string;
    genomePositionSearchBox?: GenomePositionSearchBox;
    genomePositionSearchBoxVisible?: boolean;
    chromInfoPath?: string;
    tracks: Tracks;
    layout: Layout;
    overlays?: Overlay[];
    selectionView?: boolean;
    zoomFixed?: boolean;
}
export interface GenomePositionSearchBox {
    chromInfoId: string;
    chromInfoServer: string;
    autocompleteId?: string;
    autocompleteServer?: string;
    visible?: boolean;
}

export interface Tracks {
    top: Track[];
    left: Track[];
    center: Track[];
    right: Track[];
    bottom: Track[];
    gallery: Track[];
    whole: Track[];
}
export type Track = HeatmapTrack | CombinedTrack | IndependentViewportProjectionTrack | EnumTrack;
export interface HeatmapTrack {
    type: 'heatmap';
    uid?: string;
    data?: Data;
    server?: string;
    tilesetUid?: string;
    position?: string;
    width?: number;
    height?: number;
    options?: any;
}
export interface CombinedTrack {
    type: 'combined';
    contents: Track[];
    uid?: string;
    width?: number;
    height?: number;
    position?: string;
    options?: any;
}
export interface IndependentViewportProjectionTrack {
    type: 'viewport-projection-horizontal' | 'viewport-projection-vertical' | 'viewport-projection-center';
    uid?: string;
    fromViewUid?: null;
    projectionXDomain?: number[];
    projectionYDomain?: number[];
    transforms?: any[];
    width?: number;
    x?: number;
    y?: number;
    options?: any;
}
export interface EnumTrack {
    type: EnumTrackType;
    uid?: string;
    server?: string;
    tilesetUid?: string;
    chromInfoPath?: string;
    data?: Data;
    fromViewUid?: null | string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    options?: any;
}
export interface Data {
    type?: string; // TODO: What kinds of types exist?
    children?: any[];
    tiles?: any;
    tilesetInfo?: any;
    url?: string;

    // Options Gosling internally use
    assembly?: Assembly;

    // Option to filter datasets
    // This has been added to filter data properly during fetching tiles
    filter?: FilterTransform[];
}

export interface Overlay {
    uid?: string;
    type?: string; // TODO: What kinds of types exist?
    chromInfoPath?: string;
    includes?: any[];
    options?: OverlayOptions;
}
export interface OverlayOptions {
    extent?: any[];
    fill?: string;
    fillOpacity?: number;
    minWidth?: number;
    outline?: string;
    outlineOpacity?: number;
    outlinePos?: any[] | string;
    outlineWidth?: number;
    stroke?: string;
    strokeOpacity?: number;
    strokePos?: any[] | string;
    strokeWidth?: number;
}

export interface Layout {
    h: number;
    w: number;
    x: number;
    y: number;
}

export interface GenericLocks {
    locksByViewUid: LocksByViewUid;
    locksDict: any; // We are checking the type of `locksDict` with typescript functions.
}

export interface LocksByViewUid {
    [k: string]: string;
}

export interface ValueScaleLocks {
    locksByViewUid: LocksByViewUid;
    locksDict?: any; // We are checking the type of `locksDict` with typescript functions.
}

// export type TrackType = 'heatmap' | 'combined' | 'viewport-projection-horizontal' | 'viewport-projection-vertical' | 'viewport-projection-center' | EnumTrackType;
export type EnumTrackType =
    | 'heatmap'
    | '2d-annotations'
    | '2d-chromosome-annotations'
    | '2d-chromosome-grid'
    | '2d-chromosome-labels'
    | '2d-rectangle-domains'
    | '2d-tiles'
    | 'arrowhead-domains'
    | 'bedlike'
    | 'cross-rule'
    | 'dummy'
    | 'horizontal-1d-annotations'
    | 'horizontal-1d-heatmap'
    | 'horizontal-1d-tiles'
    | 'horizontal-1d-value-interval'
    | 'horizontal-2d-rectangle-domains'
    | 'horizontal-bar'
    | 'horizontal-chromosome-grid'
    | 'horizontal-chromosome-labels'
    | 'horizontal-divergent-bar'
    | 'horizontal-gene-annotations'
    | 'horizontal-heatmap'
    | 'horizontal-line'
    | 'horizontal-multivec'
    | 'horizontal-point'
    | 'horizontal-rule'
    | 'horizontal-vector-heatmap'
    | 'image-tiles'
    | 'left-axis'
    | 'left-stacked-interval'
    | 'mapbox-tiles'
    | 'osm-2d-tile-ids'
    | 'osm-tiles'
    | 'raster-tiles'
    | 'simple-svg'
    | 'square-markers'
    | 'top-axis'
    | 'top-stacked-interval'
    | 'vertical-1d-annotations'
    | 'vertical-1d-heatmap'
    | 'vertical-1d-tiles'
    | 'vertical-1d-value-interval'
    | 'vertical-2d-rectangle-domains'
    | 'vertical-bar'
    | 'vertical-bedlike'
    | 'vertical-chromosome-grid'
    | 'vertical-chromosome-labels'
    | 'vertical-gene-annotations'
    | 'vertical-heatmap'
    | 'vertical-line'
    | 'vertical-multivec'
    | 'vertical-point'
    | 'vertical-rule'
    | 'vertical-vector-heatmap'
    | 'viewport-projection-center'
    | 'viewport-projection-horizontal'
    | 'viewport-projection-vertical'
    // custom tracks
    | 'gosling-track'
    | 'gosling-2d-track'
    | 'axis-track'
    | 'text';
