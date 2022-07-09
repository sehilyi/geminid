declare module 'monaco-editor/esm/vs/editor/edcore.main' {
    export * from 'monaco-editor';
}

// Partial types from https://github.com/higlass/higlass/blob/develop/app/scripts/configs/available-for-plugins.js
declare module '@higlass/types' {
    export type HGC = {
        libraries: typeof import('@higlass/libraries');
        services: typeof import('@higlass/services');
        tracks: typeof import('@higlass/tracks');
        utils: typeof import('@higlass/utils');
    };
    import type { Track, TrackOptions, TrackConfig } from '@higlass/tracks';
    export { Track, TrackOptions, TrackConfig };
    export type { Context } from '@higlass/tracks';
    export type { ChromInfo } from '@higlass/utils';
    export type { TilesetInfo } from '@higlass/services';
    export type PluginTrackFactory<Options extends TrackOptions> = (
        HGC: HGC,
        context: Context<Options>,
        options: Options
    ) => Track;
    type AsConstructor<T> = T extends (...args: infer Args) => infer Ret ? { new (...args: Args): Ret } : never;
    export type PluginTrack<Options extends TrackOptions> = AsConstructor<PluginTrackFactory<Options>> & {
        config: TrackConfig<Options>;
    };
}

declare module '@higlass/libraries' {
    export * as PIXI from 'pixi.js';
    export * as d3Array from 'd3-array';
    export * as d3Axis from 'd3-axis';
    export * as d3Brush from 'd3-brush';
    export * as d3Color from 'd3-color';
    export * as d3Drag from 'd3-drag';
    export * as d3Dsv from 'd3-dsv';
    export * as d3Format from 'd3-format';
    export * as d3Geo from 'd3-geo';
    export * as d3Scale from 'd3-scale';
    export * as d3Selection from 'd3-selection';
    // export * as d3Queue from 'd3-queue';
    // export * as d3Request from 'd3-request';
    export * as d3Transition from 'd3-transition';
    export * as d3Zoom from 'd3-zoom';
    // minimal typing of https://github.com/taskcluster/slugid/blob/main/slugid.js
    export const slugid: {
        nice(): string;
    };
}

declare module '@higlass/services' {
    import type { ScaleContinuousNumeric } from 'd3-scale';
    export type TilesetInfo = {
        min_pos: number[];
        max_pos: number[];
        max_zoom: number;
        tile_size?: number;
    } & (
        | {
              resolutions: number[];
          }
        | {
              max_width: number;
              bins_per_dimension?: number;
          }
    );
    type TileData = {
        dense: number[];
        shape: number[];
        tilePos: unknown[];
    };
    type Tile = {
        tileData: TileData;
    };
    type ColorRGBA = [r: number, g: number, b: number, a: number];

    export const tileProxy: {
        calculateResolution(tilesetInfo: TilesetInfo, zoomLevel: number): number;
        calculateTileAndPosInTile(
            tilesetInfo: TilesetInfo,
            maxDim: number,
            dataStartPos: number,
            zoomLevel: number,
            position: number
        ): [tilePosition: number, positionInTile: number];
        calculateTiles(
            zoomLevel: number,
            scale: ScaleContinuousNumeric<number, number>,
            minX: number,
            maxX: number,
            maxZoom: number,
            maxDim: number
        ): number[];
        calculateTilesFromResolution(
            resolution: number,
            scale: ScaleContinuousNumeric<number, number>,
            minX: number,
            maxX: number,
            pixelsPerTile?: number
        ): number[];
        calculateTileWidth(tilesetInfo: TilesetInfo, zoomLevel: number, binsPerTile: number): number;
        calculateZoomLevel(
            scale: ScaleContinuousNumeric<number, number>,
            minX: number,
            maxX: number,
            binsPerTile?: number
        ): number;
        calculateZoomLevelFromResolutions(resolutions: number[], scale: ScaleContinuousNumeric<number, number>): number;
        // fetchTilesDebounced();
        // json();
        // text();
        // tileDataToPixData();
    };
}

declare module '@higlass/tracks' {
    // TODO(2022-06-28): type out `BarTrack
    type Track = any;
    export const BarTrack: Track;

    import type { ScaleContinuousNumeric } from 'd3-scale';
    import type * as PIXI from 'pixi.js';

    type Scale = ScaleContinuousNumeric<number, number>;

    type Handler = (data: any) => void;

    type Subscription = { event: string; handler: Handler };

    type PubSub = {
        publish(msg: string, data: any): void;
        subscribe(msg: string, handler: Handler): Subscription;
        unsubscribe(msg: string): void;
    };

    type TrackOptions = Record<string, unknown>;

    interface OnMouseMoveZoomOptions {
        trackId: string;
        data: number;
        absX: number;
        absY: number;
        relX: number;
        relY: number;
        dataX: number;
        dataY: number;
    }

    interface OnMouseMoveZoomOptions1D extends OnMouseMoveZoomOptions {
        orientation: '1d-horizontal' | '1d-vertical';
    }

    interface OnMouseMoveZoomOptions2D extends OnMouseMoveZoomOptions {
        orientation: '2d';
        dataLens: ArrayLike<number>;
        dim: number;
        toRgb: [number, number, number, number];
        center: [number, number];
        xRange: [number, number];
        yRange: [number, number];
        isGenomicCoords: boolean;
    }

    export type Context<Options> = {
        id: string;
        viewUid: string;
        pubSub: PubSub;
        scene: PIXI.Graphics;
        dataConfig: DataConfig;
        dataFetcher: DataFetcher;
        getLockGroupExtrema(): [min: number, max: number] | null;
        handleTilesetInfoReceived(tilesetInfo: TilesetInfo): void;
        animate(): void;
        svgElement: HTMLElement;
        isValueScaleLocked(): boolean;
        onValueScaleChanged(): void;
        onTrackOptionsChanged(newOptions: Options): void;
        onMouseMoveZoom(opts: OnMouseMoveZoomOptions1D | OnMouseMoveZoomOptions2D): void;
        chromInfoPath: string;
        isShowGlobalMousePosition(): boolean;
        getTheme(): string;
    };

    export class _Track {
        /* Properites */
        id: string;
        _xScale: Scale;
        _yScale: Scale;
        _refXScale: Scale;
        _refYScale: Scale;
        position: [number, number];
        dimensions: [number, number];
        options: TrackOptions;
        pubSubs: Subscription[];
        /* Constructor */
        constructor(props: { id: string; pubSub: PubSub; getTheme?: () => string });
        /* Methods */
        isWithin(x: number, y: number): boolean;
        getProp<Prop extends keyof this>(prop: Prop): this[Prop];
        getData(): void;
        getDimensions(): this['dimensions'];
        getDimensions(newDimensions: [number, number]): void;
        refXScale(): this['_refXScale'];
        refXScale(scale: Scale): void;
        refYScale(): this['_refYScale'];
        refYScale(scale: Scale): void;
        xScale(): this['_xScale'];
        xScale(scale: Scale): void;
        yScale(): this['_yScale'];
        yScale(scale: Scale): void;
        zoomed(xScale: Scale, yScale: Scale): void;
        draw(): void;
        getPosition(): this['position'];
        setPosition(newPosition: [number, number]): void;
        /**
         * A blank handler for MouseMove / Zoom events. Should be overriden
         * by individual tracks to provide
         */
        defaultMouseMoveHandler(evt: MouseEvent): void;
        remove(): void;
        rerender(options?: TrackOptions, force?: boolean): void;
        /**
         * Whether this track should respond to events at this mouse position.
         *
         * The difference to `isWithin()` is that it can be overwritten if a track is inactive for example.
         */
        respondsToPosition(x: number, y: number): boolean;
        zoomedY<T extends Track>(trackY: T, kMultiplier: number): void;
        movedY(dY: number): void;
    }

    type DataConfig = Record<string, any>;
    type DataFetcher = Record<string, any>;
    type TilesetInfo = Record<string, any>;

    export class PixiTrack<Options extends TrackOptions> extends _Track {
        /* Properties */
        delayDrawing: boolean;
        scene: PIXI.Graphics;
        pBase: PIXI.Graphics;
        pMasked: PIXI.Graphics;
        pMask: PIXI.Graphics;
        pMain: PIXI.Graphics;
        pBorder: PIXI.Graphics;
        pBackground: PIXI.Graphics;
        pForeground: PIXI.Graphics;
        pLabel: PIXI.Graphics;
        pMobile: PIXI.Graphics;
        pAxis: PIXI.Graphics;
        pMouseOver: PIXI.Graphics;
        options: Options;
        labelTextFontFamily: string;
        labelTextFontSize: number;
        labelXOffset: number;
        labelText: PIXI.Text;
        errorText: PIXI.Text;
        prevOptions: string;
        flipText?: boolean; // Property never assigned https://github.com/higlass/higlass/blob/develop/app/scripts/PixiTrack.js
        /* Constructor */
        constructor(context: Context<Options>, options: Options);
        /* Methods */
        setMask(position: [number, number], dimensions: [number, number]): void;
        getForeground(): void;
        drawBorder(): void;
        drawError(): void;
        drawBackground(): void;
        getLabelColor(): string;
        getName(): string;
        drawLabel(): void;
        rerender(options: Options, force?: boolean): void;
        exportSVG(): [HTMLElement, HTMLElement];
    }

    /* eslint-disable-next-line @typescript-eslint/ban-types */
    type LiteralUnion<T, U = string> = T | (U & {});

    type Orientation = '2d' | '1d-vertical' | '1d-horizontal' | 'whole' | 'any';

    type DataType =
        | 'map-tiles'
        | 'axis'
        | 'x-coord'
        | 'y-coord'
        | 'xy-coord'
        | 'matrix'
        | 'vector'
        | 'multivec'
        | 'bed-value'
        | 'stacked-interval'
        | '1d-projection'
        | '2d-projection'
        | 'gene-annotation'
        | 'arrowhead-domains'
        | '2d-rectangle-domains'
        | 'nothing'
        | '2d-annotations'
        | 'bedpe'
        | 'any'
        | 'chromsizes'
        | '1d-tiles'
        | 'image-tiles'
        | 'bedlike';

    type OptionsInfo<Options> = {
        [Key in keyof Options]?: {
            name: string;
            inlineOptions: Record<string, { name: string; value: Options[Key] }>;
        };
    };

    export type TrackConfig<Options extends TrackOptions> = {
        type: string;
        defaultOptions?: Options;
        availableOptions?: (keyof Options)[];
        name?: string;
        datatype?: readonly LiteralUnion<DataType>[];
        aliases?: string[];
        local?: boolean;
        orientation?: Orientation;
        thumbnail?: Element;
        chromInfoPath?: string;
        optionsInfo?: OptionsInfo<Options>;
    };
}

declare module '@higlass/utils' {
    import type { ScaleContinuousNumeric } from 'd3-scale';
    import type { TilesetInfo } from '@higlass/services';

    type ChromInfo<Name extends string = string> = {
        cumPositions: { id?: number; pos: number; chr: string }[];
        chrPositions: Record<Name, { pos: number }>;
        chromLengths: Record<Name, number>;
        totalLength: number;
    };

    /**
     * @param context Class context, i.e., `this`.
     * @param is2d If `true` both dimensions of the mouse location should be shown. E.g., on a central track.
     * @param isGlobal  If `true` local and global events will trigger the mouse position drawing.
     * @return  {Function}  Method to remove graphics showing the mouse location.
     */
    export function showMousePosition<T>(context: T, is2d?: boolean, isGlobal?: boolean): () => void;
    export function absToChr(
        absPosition: number,
        chrInfo: Pick<ChromInfo, 'cumPositions' | 'chromLengths'>
    ): [chr: string, chrPositon: number, offset: number, insertPoint: number];
    export function chrToAbs<Name>(
        chrom: Name,
        chromPos: number,
        chromInfo: Pick<ChromInfo<Name>, 'chrPositions'>
    ): number;
    export function colorToHex(colorValue: string | number): number;
    export function pixiTextToSvg(text: import('pixi.js').Text): HTMLElement;
    export function svgLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        strokeWidth: number,
        strokeColor: number
    ): HTMLElement;
    export class DenseDataExtrema1D {
        constructor(arr: ArrayLike<number | null>);
        minNonZeroInTile: number;
        maxNonZeroInTile: number;
    }
    export const trackUtils: {
        calculate1DVisibleTiles(
            tilesetInfo: TilesetInfo,
            scale: ScaleContinuousNumeric<number, number>
        ): [zoomLevel: number, x: number][];
    };
}

// Types for https://github.com/higlass/higlass-register/blob/master/src/index.js
declare module 'higlass-register' {
    import type { PluginTrack, TrackConfig } from '@higlass/types';
    type TrackDef<Options> = {
        name: string;
        track: PluginTrack<Options>;
        config: TrackConfig<Options>;
    };
    type DataFetcherDef = {
        // TODO(2022-07-09): type out data fetchers
        dataFetcher: any;
        config: any;
    };
    interface RegisterOptions {
        pluginType: 'track' | 'dataFetcher';
    }
    function register(definition: TrackDef<Options> | DataFetcherDef, options: RegisterOptions = {}): void;
    export = register;
}
