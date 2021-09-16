import * as PIXI from 'pixi.js';
import PubSub from 'pubsub-js';
import uuid from 'uuid';
import { isEqual, sampleSize, uniqBy } from 'lodash';
import { scaleLinear } from 'd3-scale';
import { format } from 'd3-format';
import { drawMark, drawPostEmbellishment, drawPreEmbellishment } from '../core/mark';
import { GoslingTrackModel } from '../core/gosling-track-model';
import { validateTrack } from '../core/utils/validate';
import { shareScaleAcrossTracks } from '../core/utils/scales';
import { resolveSuperposedTracks } from '../core/utils/overlay';
import { SingleTrack, OverlaidTrack, Datum } from '../core/gosling.schema';
import { TooltipData } from '../gosling-tooltip';
import colorToHex from '../core/utils/color-to-hex';
import {
    aggregateCoverage,
    calculateData,
    concatString,
    displace,
    filterData,
    parseSubJSON,
    replaceString,
    splitExon
} from '../core/utils/data-transform';
import { getTabularData } from './data-abstraction';
import { BAMDataFetcher } from '../data-fetcher/bam';
import { getRelativeGenomicPosition } from '../core/utils/assembly';
import { Is2DTrack } from '../core/gosling.schema.guards';
import { spawn, Worker } from 'threads';

import bamWorkerSrc from 'js-asset:../data-fetcher/bam/bam-worker.js';
import { InteractionEvent } from 'pixi.js';

// Set `true` to print in what order each function is called
export const PRINT_RENDERING_CYCLE = false;

// Experimental function to test with prerelease rendering
function usePrereleaseRendering(spec: SingleTrack | OverlaidTrack) {
    return spec.data?.type === 'bam'; // spec.prerelease?.testUsingNewRectRenderingForBAM &&
}

// For using libraries, refer to https://github.com/higlass/higlass/blob/f82c0a4f7b2ab1c145091166b0457638934b15f3/app/scripts/configs/available-for-plugins.js
// `getTilePosAndDimensions()` definition: https://github.com/higlass/higlass/blob/1e1146409c7d7c7014505dd80d5af3e9357c77b6/app/scripts/Tiled1DPixiTrack.js#L133
// Refer to the following already supported graphics:
// https://github.com/higlass/higlass/blob/54f5aae61d3474f9e868621228270f0c90ef9343/app/scripts/PixiTrack.js#L115

/**
 * Each GoslingTrack draws either a track of multiple tracks with SAME DATA that are overlaid.
 * @param HGC
 * @param args
 * @returns
 */
function GoslingTrack(HGC: any, ...args: any[]): any {
    if (!new.target) {
        throw new Error('Uncaught TypeError: Class constructor cannot be invoked without "new"');
    }

    // Services
    const { tileProxy } = HGC.services;
    const { showMousePosition } = HGC.utils;

    class GoslingTrackClass extends HGC.tracks.BarTrack {
        private tooltips: TooltipData[];
        private tileSize: number;
        private worker: any;
        // TODO: add members that are used explicitly in the code

        constructor(params: any[]) {
            const [context, options] = params;

            // Check whether to load a worker
            let bamWorker;
            if (usePrereleaseRendering(options.spec)) {
                try {
                    bamWorker = spawn(new Worker(bamWorkerSrc));
                    context.dataFetcher = new BAMDataFetcher(HGC, context.dataConfig, bamWorker);
                } catch (e) {
                    console.warn('Error loading worker', e);
                }
            }

            super(context, options);

            this.worker = bamWorker;
            context.dataFetcher.track = this;
            this.context = context;

            // Temp. Add ids to each overalid tracks that will be rendered independently
            if ('overlay' in this.options.spec) {
                this.options.spec.overlay = (this.options.spec as OverlaidTrack).overlay.map(o => {
                    return { ...o, _renderingId: uuid.v1() };
                });
            } else {
                this.options.spec._renderingId = uuid.v1();
            }

            this.tileSize = this.tilesetInfo?.tile_size ?? 1024;

            // This tracks the xScale of an entire view, which is used when no tiling concepts are used
            this.drawnAtScale = HGC.libraries.d3Scale.scaleLinear();
            this.scalableGraphics = {};

            // this.loadingText = new HGC.libraries.PIXI.Text('Loading', {
            //     fontSize: '14px',
            //     fontFamily: 'Arial',
            //     fill: 'black'
            // });

            // this.loadingText.x = 0;
            // this.loadingText.y = 0;

            // this.loadingText.anchor.x = 0;
            // this.loadingText.anchor.y = 0;

            // this.pLabel.addChild(this.loadingText);

            const { valid, errorMessages } = validateTrack(this.options.spec);

            if (!valid) {
                console.warn('The specification of the following track is invalid', errorMessages, this.options.spec);
            }

            this.extent = { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER };

            // Graphics for highlighting visual elements under the cursor
            this.mouseOverGraphics = new HGC.libraries.PIXI.Graphics();
            this.pMain.addChild(this.mouseOverGraphics);

            // Enable click event
            this.pMask.interactive = true;
            this.pMask.mousedown = (e: InteractionEvent) =>
                this.onMouseDown(e.data.getLocalPosition(this.pMain).x, e.data.getLocalPosition(this.pMain).y);
            this.pMask.mouseup = (e: InteractionEvent) =>
                this.onClick(e.data.getLocalPosition(this.pMain).x, e.data.getLocalPosition(this.pMain).y);
            this.pMask.mousemove = () => this.onMouseOut();

            // Remove a mouse graphic if created by a parent, and draw ourselves
            // https://github.com/higlass/higlass/blob/38f0c4415f0595c3b9d685a754d6661dc9612f7c/app/scripts/utils/show-mouse-position.js#L28
            // this.getIsFlipped = () => { return this.originalSpec.orientation === 'vertical' };
            this.flipText = this.options.spec.orientation === 'vertical';

            if (this.hideMousePosition) {
                this.hideMousePosition();
                this.hideMousePosition = undefined;
            }
            if (this.options?.showMousePosition && !this.hideMousePosition) {
                this.hideMousePosition = showMousePosition(
                    this,
                    Is2DTrack(resolveSuperposedTracks(this.options.spec)[0]),
                    this.isShowGlobalMousePosition()
                );
            }

            // Custom error label
            // this.errorText = new HGC.libraries.PIXI.Text('', {
            //     fontSize: '16px',
            //     fontFamily: 'Arial',
            //     fill: 'black',
            //     fontWeight: 'bold',
            // });
            // this.errorText.anchor.x = 0.5;
            // this.errorText.anchor.y = 0.5;
            // this.pLabel.addChild(this.errorText);

            this.tooltips = [];
            this.svgData = [];
            this.textGraphics = [];
            this.textsBeingUsed = 0; // this variable is being used to improve the performance of text rendering

            // This improves the arc/link rendering performance
            HGC.libraries.PIXI.GRAPHICS_CURVES.adaptive = this.options.spec.style?.enableSmoothPath ?? false;
            if (HGC.libraries.PIXI.GRAPHICS_CURVES.adaptive) {
                HGC.libraries.PIXI.GRAPHICS_CURVES.maxLength = 1;
                HGC.libraries.PIXI.GRAPHICS_CURVES.maxSegments = 2048 * 10;
            }
        }

        /* ----------------------------------- RENDERING CYCLE ----------------------------------- */

        /**
         * Draw all tiles from the bottom.
         * (https://github.com/higlass/higlass/blob/54f5aae61d3474f9e868621228270f0c90ef9343/app/scripts/TiledPixiTrack.js#L727)
         */
        draw() {
            if (PRINT_RENDERING_CYCLE) console.warn('draw()');

            this.tooltips = [];
            this.svgData = [];
            this.textsBeingUsed = 0;
            this.mouseOverGraphics?.clear();

            // this.pMain.clear();
            // this.pMain.removeChildren();

            // this.pBackground.clear();
            // this.pBackground.removeChildren();
            // this.pBorder.clear();
            // this.pBorder.removeChildren();

            const processTilesAndDraw = () => {
                // Preprocess all tiles at once so that we can share scales across tiles.
                this.preprocessAllTiles();

                // This function calls `drawTile` on each tile.
                super.draw();

                // Record tiles so that we ignore loading same tiles again
                this.prevVisibleAndFetchedTiles = this.visibleAndFetchedTiles();
            };

            if (
                usePrereleaseRendering(this.options.spec) &&
                !isEqual(this.visibleAndFetchedTiles(), this.prevVisibleAndFetchedTiles)
            ) {
                this.updateTileAsync(processTilesAndDraw);
            } else {
                processTilesAndDraw();
            }
        }

        /*
         * Do whatever is necessary before rendering a new tile. This function is called from `receivedTiles()`.
         * (Refer to https://github.com/higlass/higlass/blob/54f5aae61d3474f9e868621228270f0c90ef9343/app/scripts/HorizontalLine1DPixiTrack.js#L50)
         */
        initTile(tile: any) {
            if (PRINT_RENDERING_CYCLE) console.warn('initTile(tile)');

            // super.initTile(tile); // This calls `drawTile()`

            // Since `super.initTile(tile)` prints warning, we call `drawTile` ourselves without calling `super.initTile(tile)`.
            this.drawTile(tile);
        }

        updateTile(/* tile: any */) {} // Never mind about this function for the simplicity.
        renderTile(/* tile: any */) {} // Never mind about this function for the simplicity.

        /**
         * Display a tile upon receiving a new one or when explicitly called by a developer, e.g., calling `this.draw()`
         */
        drawTile(tile: any) {
            if (PRINT_RENDERING_CYCLE) console.warn('drawTile(tile)');

            tile.drawnAtScale = this._xScale.copy(); // being used in `super.draw()`

            if (!tile.goslingModels) {
                // We do not have a track model prepared to visualize
                return;
            }

            tile.graphics.clear();
            tile.graphics.removeChildren();

            /* Embellishment before rendering marks */
            if (tile.goslingModels && tile.goslingModels[0]) {
                const tm = tile.goslingModels[0];

                // check visibility condition
                const trackWidth = this.dimensions[1];
                const zoomLevel = this._xScale.invert(trackWidth) - this._xScale.invert(0);
                if (!tm.trackVisibility({ zoomLevel })) {
                    return;
                }

                drawPreEmbellishment(HGC, this, tile, tm, this.options.theme);
            }

            /* Mark */
            // A single tile contains one track or multiple tracks overlaid
            tile.goslingModels.forEach((tm: GoslingTrackModel) => {
                // check visibility condition
                const trackWidth = this.dimensions[1];
                const zoomLevel = this._xScale.invert(trackWidth) - this._xScale.invert(0);
                if (!tm.trackVisibility({ zoomLevel })) {
                    return;
                }

                // This is for testing the upcoming rendering methods
                // if (usePrereleaseRendering(this.originalSpec)) {
                //     // Use worker to create visual properties
                //     drawScaleMark(HGC, this, tile, tm);
                //     return;
                // }

                drawMark(HGC, this, tile, tm);
            });

            /* Embellishment after rendering marks */
            if (tile.goslingModels && tile.goslingModels[0]) {
                const tm = tile.goslingModels[0];

                // check visibility condition
                const trackWidth = this.dimensions[1];
                const zoomLevel = this._xScale.invert(trackWidth) - this._xScale.invert(0);
                if (!tm.trackVisibility({ zoomLevel })) {
                    return;
                }

                drawPostEmbellishment(HGC, this, tile, tm, this.options.theme);
            }

            this.forceDraw();
        }

        /**
         * Rerender tiles using the manually changed options.
         * (Refer to https://github.com/higlass/higlass/blob/54f5aae61d3474f9e868621228270f0c90ef9343/app/scripts/HorizontalLine1DPixiTrack.js#L75)
         */
        rerender(newOptions: any) {
            if (PRINT_RENDERING_CYCLE) console.warn('rerender(options)');
            // !! We only call draw for the simplicity
            // super.rerender(newOptions); // This calls `renderTile()` on every tiles

            this.options = newOptions;

            this.tooltips = [];
            this.svgData = [];
            this.textsBeingUsed = 0;

            // this.flipText = this.originalSpec.orientation === 'vertical';

            // if (this.hideMousePosition) {
            //     this.hideMousePosition();
            //     this.hideMousePosition = undefined;
            // }
            // if (this.options?.showMousePosition && !this.hideMousePosition) {
            //     this.hideMousePosition = showMousePosition(
            //       this,
            //       Is2DTrack(resolveSuperposedTracks(this.originalSpec)[0]),
            //       this.isShowGlobalMousePosition(),
            //     );
            // }

            this.preprocessAllTiles(true);
            this.draw();
            this.forceDraw();
        }

        /*
         * Rerender all tiles when track size is changed.
         * (Refer to https://github.com/higlass/higlass/blob/54f5aae61d3474f9e868621228270f0c90ef9343/app/scripts/PixiTrack.js#L186).
         */
        setDimensions(newDimensions: any) {
            if (PRINT_RENDERING_CYCLE) console.warn('setDimensions()');

            this.oldDimensions = this.dimensions;
            super.setDimensions(newDimensions); // This simply updates `this._xScale` and `this._yScale`

            // const visibleAndFetched = this.visibleAndFetchedTiles();
            // visibleAndFetched.map((tile: any) => this.initTile(tile));
        }

        /**
         * Record new position.
         */
        setPosition(newPosition: any) {
            super.setPosition(newPosition); // This simply changes `this.position`

            [this.pMain.position.x, this.pMain.position.y] = this.position;
        }

        /**
         * A function to redraw this track. Typically called when an asynchronous event occurs (i.e. tiles loaded)
         * (Refer to https://github.com/higlass/higlass/blob/54f5aae61d3474f9e868621228270f0c90ef9343/app/scripts/TiledPixiTrack.js#L71)
         */
        forceDraw() {
            this.animate();
        }

        /**
         * Called when location or zoom level has been changed by click-and-drag interaction
         * (https://github.com/higlass/higlass/blob/54f5aae61d3474f9e868621228270f0c90ef9343/app/scripts/HorizontalLine1DPixiTrack.js#L215)
         * For brushing, refer to https://github.com/higlass/higlass/blob/caf230b5ee41168ea491572618612ac0cc804e5a/app/scripts/HeatmapTiledPixiTrack.js#L1493
         */
        zoomed(newXScale: any, newYScale: any) {
            if (PRINT_RENDERING_CYCLE) console.warn('zoomed()');

            // super.zoomed(newXScale, newYScale); // This function updates `this._xScale` and `this._yScale` and call this.draw();
            this.xScale(newXScale);
            this.yScale(newYScale);

            this.refreshTiles();

            // if (this.scalableGraphics) {
            // this.scaleScalableGraphics(Object.values(this.scalableGraphics), newXScale, this.drawnAtScale);
            // }

            // if (!usePrereleaseRendering(this.originalSpec)) {
            this.draw();
            // }
            this.forceDraw();
        }

        /**
         * This is currently for testing the new way of rendering visual elements.
         */
        updateTileAsync(callback: () => void) {
            this.xDomain = this._xScale.domain();
            this.xRange = this._xScale.range();

            this.labelText.text = ' Loading...';

            this.worker.then((tileFunctions: any) => {
                tileFunctions
                    .getTabularData(
                        this.dataFetcher.uid,
                        Object.values(this.fetchedTiles).map((x: any) => x.remoteId)
                    )
                    .then((toRender: any) => {
                        const tiles = this.visibleAndFetchedTiles();

                        const tabularData = JSON.parse(Buffer.from(toRender).toString());
                        if (tiles?.[0]) {
                            const tile = tiles[0];
                            tile.tileData.tabularData = tabularData;
                            const [refTile] = HGC.utils.trackUtils.calculate1DVisibleTiles(
                                this.tilesetInfo,
                                this._xScale
                            );
                            tile.tileData.zoomLevel = refTile[0];
                            tile.tileData.tilePos = [refTile[1]];
                        }
                        callback();

                        this.labelText.text = this.options.spec.title ?? '';
                    });
            });
        }

        /**
         * Stretch out the scaleble graphics to have proper effect upon zoom and pan.
         */
        scaleScalableGraphics(graphics: PIXI.Graphics[], xScale: any, drawnAtScale: any) {
            const drawnAtScaleExtent = drawnAtScale.domain()[1] - drawnAtScale.domain()[0];
            const xScaleExtent = xScale.domain()[1] - xScale.domain()[0];

            const tileK = drawnAtScaleExtent / xScaleExtent;
            const newRange = xScale.domain().map(drawnAtScale);

            const posOffset = newRange[0];
            graphics.forEach(g => {
                g.scale.x = tileK;
                g.position.x = -posOffset * tileK;
            });
        }

        /**
         * Return the set of ids of all tiles which are both visible and fetched.
         */
        visibleAndFetchedIds() {
            return Object.keys(this.fetchedTiles).filter(x => this.visibleTileIds.has(x));
        }

        /**
         * Return the set of all tiles which are both visible and fetched.
         */
        visibleAndFetchedTiles() {
            return this.visibleAndFetchedIds().map((x: any) => this.fetchedTiles[x]);
        }

        // !! This is called in the constructor, `super(context, options)`. So be aware not to use variables that is not prepared.
        calculateVisibleTiles() {
            if (usePrereleaseRendering(this.options.spec)) {
                const tiles = HGC.utils.trackUtils.calculate1DVisibleTiles(this.tilesetInfo, this._xScale);

                for (const tile of tiles) {
                    const { tileWidth } = this.getTilePosAndDimensions(tile[0], [tile[1]], this.tilesetInfo.tile_size);

                    const DEFAULT_MAX_TILE_WIDTH = 2e4; // base pairs

                    if (tileWidth > (this.tilesetInfo.max_tile_width || DEFAULT_MAX_TILE_WIDTH)) {
                        this.forceDraw();
                        return;
                    }
                    this.forceDraw();
                }

                this.setVisibleTiles(tiles);
            } else {
                if (!this.tilesetInfo) {
                    // if we don't know anything about this dataset, no point in trying to get tiles
                    return;
                }

                // calculate the zoom level given the scales and the data bounds
                this.zoomLevel = this.calculateZoomLevel();

                if (this.tilesetInfo.resolutions) {
                    const sortedResolutions = this.tilesetInfo.resolutions
                        .map((x: number) => +x)
                        .sort((a: number, b: number) => b - a);

                    this.xTiles = tileProxy.calculateTilesFromResolution(
                        sortedResolutions[this.zoomLevel],
                        this._xScale,
                        this.tilesetInfo.min_pos[0],
                        this.tilesetInfo.max_pos[0]
                    );

                    if (Is2DTrack(resolveSuperposedTracks(this.options.spec)[0])) {
                        // it makes sense only when the y-axis is being used for a genomic field
                        tileProxy.calculateTilesFromResolution(
                            sortedResolutions[this.zoomLevel],
                            this._yScale,
                            this.tilesetInfo.min_pos[0],
                            this.tilesetInfo.max_pos[0]
                        );
                    }

                    const tiles = this.tilesToId(this.xTiles, this.yTiles, this.zoomLevel);
                    this.setVisibleTiles(tiles);
                } else {
                    this.xTiles = tileProxy.calculateTiles(
                        this.zoomLevel,
                        this.relevantScale(),
                        this.tilesetInfo.min_pos[0],
                        this.tilesetInfo.max_pos[0],
                        this.tilesetInfo.max_zoom,
                        this.tilesetInfo.max_width
                    );

                    if (Is2DTrack(resolveSuperposedTracks(this.options.spec)[0])) {
                        // it makes sense only when the y-axis is being used for a genomic field
                        this.yTiles = tileProxy.calculateTiles(
                            this.zoomLevel,
                            this._yScale,
                            this.tilesetInfo.min_pos[1],
                            this.tilesetInfo.max_pos[1],
                            this.tilesetInfo.max_zoom,
                            this.tilesetInfo.max_width1 || this.tilesetInfo.max_width
                        );
                    }

                    const tiles = this.tilesToId(this.xTiles, this.yTiles, this.zoomLevel);
                    this.setVisibleTiles(tiles);
                }
            }
        }

        /**
         * Get the tile's position in its coordinate system.
         */
        getTilePosAndDimensions(zoomLevel: number, tilePos: any, binsPerTileIn: any) {
            const binsPerTile = binsPerTileIn || this.tilesetInfo.bins_per_dimension || 256;

            if (this.tilesetInfo.resolutions) {
                const sortedResolutions = this.tilesetInfo.resolutions
                    .map((x: number) => +x)
                    .sort((a: number, b: number) => b - a);

                const chosenResolution = sortedResolutions[zoomLevel];

                const tileWidth = chosenResolution * binsPerTile;
                const tileHeight = tileWidth;

                const tileX = chosenResolution * binsPerTile * tilePos[0];
                const tileY = chosenResolution * binsPerTile * tilePos[1];

                return {
                    tileX,
                    tileY,
                    tileWidth,
                    tileHeight
                };
            } else {
                const xTilePos = tilePos[0];
                const yTilePos = tilePos[1];

                const minX = this.tilesetInfo.min_pos[0];

                const minY = this.options.reverseYAxis ? -this.tilesetInfo.max_pos[1] : this.tilesetInfo.min_pos[1];

                const tileWidth = this.tilesetInfo.max_width / 2 ** zoomLevel;
                const tileHeight = this.tilesetInfo.max_width / 2 ** zoomLevel;

                const tileX = minX + xTilePos * tileWidth;
                const tileY = minY + yTilePos * tileHeight;

                return {
                    tileX,
                    tileY,
                    tileWidth,
                    tileHeight
                };
            }
        }

        /**
         * Convert tile positions to tile IDs
         */
        tilesToId(xTiles: any[], yTiles: any[], zoomLevel: any) {
            if (xTiles && !yTiles) {
                // this means only the `x` axis is being used
                return xTiles.map(x => [zoomLevel, x]);
            } else {
                // this means both `x` and `y` axes are being used together
                const tiles: any = [];
                xTiles.forEach(x => yTiles.forEach(y => tiles.push([zoomLevel, x, y])));
                return tiles;
            }
        }

        // Custom error message
        // drawError() {
        //     this.errorText.x = this.position[0] + this.dimensions[0] / 2;
        //     this.errorText.y = this.position[1] + this.dimensions[1] / 2;

        //     this.errorText.text = this.errorTextText;

        //     if (this.errorTextText && this.errorTextText.length) {
        //       // draw a red border around the track to bring attention to its error
        //       const g = this.pBorder;
        //       g.clear();
        //       g.lineStyle(1, colorToHex('black'), 1);
        //       g.beginFill(colorToHex('black'), 0.2);
        //       g.drawRect(
        //             this.position[0],
        //             this.position[1],
        //             this.dimensions[0],
        //             this.dimensions[1],
        //         );
        //     }
        // }

        /**
         * This function reorganize the tileset information so that it can be more conveniently managed afterwards.
         */
        reorganizeTileInfo() {
            const tiles = this.visibleAndFetchedTiles();

            this.tileSize = this.tilesetInfo?.tile_size ?? 1024;

            tiles.forEach((t: any) => {
                // A new object to store all datasets
                t.gos = {};

                // ! `tileData` is an array-like object
                const keys = Object.keys(t.tileData).filter(d => !+d && d !== '0'); // ignore array indexes

                // Store objects first
                keys.forEach(k => {
                    t.gos[k] = t.tileData[k];
                });

                // Store raw data
                t.gos.raw = Array.from(t.tileData);
            });
        }

        /**
         * Check whether tiles should be merged.
         */
        shouldCombineTiles() {
            return (
                ((this.options.spec as SingleTrack | OverlaidTrack).dataTransform?.find(t => t.type === 'displace') &&
                    this.visibleAndFetchedTiles()?.[0]?.tileData &&
                    // we do not need to combine tiles w/ multivec, vector, matrix
                    !this.visibleAndFetchedTiles()?.[0]?.tileData.dense) ||
                this.options.spec.data?.type === 'bam'
            ); // BAM data fetcher already combines the datasets;
        }

        /**
         * Combile multiple tiles into a single large tile.
         * This is sometimes necessary, for example, when applying a displacement algorithm.
         */
        combineAllTilesIfNeeded() {
            if (!this.shouldCombineTiles()) {
                // This means we do not need to combine tiles
                return;
            }

            const tiles = this.visibleAndFetchedTiles();

            if (!tiles || tiles.length === 0) {
                // Does not make sense to combine tiles
                return;
            }

            // Increase the size of tiles by length
            this.tileSize = (this.tilesetInfo?.tile_size ?? 1024) * tiles.length;

            let newData: Datum[] = [];

            tiles.forEach((t: any, i: number) => {
                // Combine data
                newData = [...newData, ...t.tileData];

                // Flag to force using only one tile
                t.mergedToAnotherTile = i !== 0;
            });

            tiles[0].gos.raw = newData;

            // Remove duplicated if possible
            if (tiles[0].gos.raw[0]?.uid) {
                tiles[0].gos.raw = uniqBy(tiles[0].gos.raw, 'uid');
            }
        }

        preprocessAllTiles(force = false) {
            const gms: GoslingTrackModel[] = [];

            this.reorganizeTileInfo();

            this.combineAllTilesIfNeeded();

            this.visibleAndFetchedTiles().forEach((tile: any) => {
                if (force) {
                    tile.goslingModels = [];
                }
                // tile preprocessing is done only once per tile
                const tileModels = this.preprocessTile(tile);
                tileModels?.forEach((m: GoslingTrackModel) => {
                    gms.push(m);
                });
            });

            shareScaleAcrossTracks(gms);

            // console.log('processed gosling model', gms);

            // IMPORTANT: If no genomic fields specified, no point to use multiple tiles, i.e., we need to draw a track only once with the data combined.
            /*
            if (!getGenomicChannelKeyFromTrack(this.originalSpec) && false) {
                // TODO:
                const visibleModels: GoslingTrackModel[][] = this.visibleAndFetchedTiles().map(
                    (d: any) => d.goslingModels
                );
                const modelsWeUse: GoslingTrackModel[] = visibleModels[0];
                const modelsWeIgnore: GoslingTrackModel[][] = visibleModels.slice(1);

                // concatenate the rows in the data
                modelsWeIgnore.forEach((ignored, i) => {
                    modelsWeUse.forEach(m => {
                        m.addDataRows(ignored[0].data());
                    });
                    this.visibleAndFetchedTiles()[i + 1].goslingModels = [];
                });
            }
            */
        }

        /**
         * Construct tabular data from a higlass tileset and a gosling track model.
         * Return the generated gosling track model.
         */
        preprocessTile(tile: any) {
            if (tile.mergedToAnotherTile) {
                tile.goslingModels = [];
                return;
            }

            if (tile.goslingModels && tile.goslingModels.length !== 0) {
                // already have the gosling models constructed
                return tile.goslingModels;
            }

            // Single tile can contain multiple gosling models if multiple tracks are superposed.
            tile.goslingModels = [];

            const spec = JSON.parse(JSON.stringify(this.options.spec));

            // const [trackWidth, trackHeight] = this.dimensions; // actual size of a track

            resolveSuperposedTracks(spec).forEach(resolved => {
                if (resolved.mark === 'brush') {
                    // we do not draw rectangular brush ourselves, higlass does.
                    return;
                }

                if (resolved.data.type === 'matrix') {
                    // we do not draw matrix ourselves, higlass does.
                    return;
                }
                // console.log(tile);
                if (!tile.gos.tabularData) {
                    // If the data is not already stored in a tabular form, convert them.
                    const { tileX, tileWidth } = this.getTilePosAndDimensions(
                        tile.gos.zoomLevel,
                        tile.gos.tilePos,
                        this.tileSize
                    );

                    tile.gos.tabularData = getTabularData(resolved, {
                        ...tile.gos,
                        tileX,
                        tileWidth,
                        tileSize: this.tileSize
                    });
                }

                tile.gos.tabularDataFiltered = Array.from(tile.gos.tabularData);

                // !! TODO: why are we transforming data multiple times for each track?
                /*
                 * Data Transformation
                 */
                if (resolved.dataTransform) {
                    resolved.dataTransform.forEach(t => {
                        switch (t.type) {
                            case 'filter':
                                tile.gos.tabularDataFiltered = filterData(t, tile.gos.tabularDataFiltered);
                                break;
                            case 'concat':
                                tile.gos.tabularDataFiltered = concatString(t, tile.gos.tabularDataFiltered);
                                break;
                            case 'replace':
                                tile.gos.tabularDataFiltered = replaceString(t, tile.gos.tabularDataFiltered);
                                break;
                            case 'log':
                                tile.gos.tabularDataFiltered = calculateData(t, tile.gos.tabularDataFiltered);
                                break;
                            case 'exonSplit':
                                tile.gos.tabularDataFiltered = splitExon(
                                    t,
                                    tile.gos.tabularDataFiltered,
                                    resolved.assembly
                                );
                                break;
                            case 'coverage':
                                tile.gos.tabularDataFiltered = aggregateCoverage(
                                    t,
                                    tile.gos.tabularDataFiltered,
                                    this._xScale.copy()
                                );
                                break;
                            case 'subjson':
                                tile.gos.tabularDataFiltered = parseSubJSON(t, tile.gos.tabularDataFiltered);
                                break;
                            case 'displace':
                                tile.gos.tabularDataFiltered = displace(
                                    t,
                                    tile.gos.tabularDataFiltered,
                                    this._xScale.copy()
                                );
                                break;
                        }
                    });
                }

                // Send data preview to the editor so that it can be shown to users.
                try {
                    if (PubSub) {
                        const NUM_OF_ROWS_IN_PREVIEW = 100;
                        const numOrRows = tile.gos.tabularDataFiltered.length;
                        PubSub.publish('data-preview', {
                            id: this.context.id,
                            dataConfig: JSON.stringify({ data: resolved.data }),
                            data:
                                NUM_OF_ROWS_IN_PREVIEW > numOrRows
                                    ? tile.gos.tabularDataFiltered
                                    : sampleSize(tile.gos.tabularDataFiltered, NUM_OF_ROWS_IN_PREVIEW)
                            // ...
                        });
                    }
                } catch (e) {
                    // ..
                }

                // Replace width and height information with the actual values
                // TODO: we don't need this?
                // resolved.width = trackWidth;
                // resolved.height = trackHeight;

                // Construct separate gosling models for individual tiles
                const gm = new GoslingTrackModel(resolved, tile.gos.tabularDataFiltered, this.options.theme);

                // Add a track model to the tile object
                tile.goslingModels.push(gm);
            });

            return tile.goslingModels;
        }

        getIndicesOfVisibleDataInTile(tile: any) {
            const visible = this._xScale.range();

            if (!this.tilesetInfo) return [null, null];

            const { tileX, tileWidth } = this.getTilePosAndDimensions(
                tile.gos.zoomLevel,
                tile.gos.tilePos,
                this.tilesetInfo.bins_per_dimension || this.tilesetInfo?.tile_size
            );

            const tileXScale = scaleLinear()
                .domain([0, this.tilesetInfo?.tile_size || this.tilesetInfo?.bins_per_dimension])
                .range([tileX, tileX + tileWidth]);

            const start = Math.max(0, Math.round(tileXScale.invert(this._xScale.invert(visible[0]))));
            const end = Math.min(tile.gos.dense.length, Math.round(tileXScale.invert(this._xScale.invert(visible[1]))));

            return [start, end];
        }

        /**
         * Returns the minimum in the visible area (not visible tiles)
         */
        minVisibleValue() {}

        /**
         * Returns the maximum in the visible area (not visible tiles)
         */
        maxVisibleValue() {}

        exportSVG() {} // We do not support SVG export

        onMouseOut() {
            document.body.style.cursor = 'default';
        }

        onMouseDown(mouseX: number, mouseY: number) {
            // Record these so that we do not triger click event when dragged.
            this.mouseDownX = mouseX;
            this.mouseDownY = mouseY;
        }

        onClick(mouseX: number, mouseY: number) {
            if (!this.tilesetInfo || !this.tooltips) {
                // Do not have enough information to show tooltips
                return;
            }

            if (Math.sqrt((this.mouseDownX - mouseX) ** 2 + (this.mouseDownY - mouseY) ** 2) > 1) {
                // Move distance is relatively long, so this might be a drag
                return;
            }

            const tooltip: TooltipData | undefined = this.tooltips.find((d: TooltipData) =>
                d.isMouseOver(mouseX, mouseY)
            );

            if (tooltip) {
                PubSub.publish('click', {
                    data: { ...tooltip.datum },
                    genomicPosition: getRelativeGenomicPosition(Math.floor(this._xScale.invert(mouseX)))
                });
            }
        }

        getMouseOverHtml(mouseX: number, mouseY: number) {
            const isMouseOverPrepared = false; // TODO: We do not support this yet.

            if (!this.tilesetInfo || !this.tooltips) {
                // Do not have enough information to show tooltips
                return;
            }

            this.mouseOverGraphics.clear();
            // place on the top
            this.pMain.removeChild(this.mouseOverGraphics);
            this.pMain.addChild(this.mouseOverGraphics);

            // TODO: Get tooltip information prepared during the mark rendering, and use the info here to show tooltips.

            const tooltip: TooltipData | undefined = this.tooltips.find((d: TooltipData) =>
                d.isMouseOver(mouseX, mouseY)
            );

            // https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
            if (tooltip) {
                document.body.style.cursor = 'pointer';
            } else {
                document.body.style.cursor = 'default';
            }

            if (tooltip) {
                PubSub.publish('mouseover', {
                    data: { ...tooltip.datum },
                    genomicPosition: getRelativeGenomicPosition(Math.floor(this._xScale.invert(mouseX)))
                });
            }

            if (tooltip) {
                // render mouse over effect
                if (tooltip.markInfo.type === 'rect' && isMouseOverPrepared) {
                    this.mouseOverGraphics.lineStyle(
                        1,
                        colorToHex('black'),
                        1, // alpha
                        1 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
                    );
                    this.mouseOverGraphics.beginFill(colorToHex('white'), 0);

                    // Experimental
                    const showOutline = true;
                    if (showOutline) {
                        this.mouseOverGraphics.drawRect(
                            tooltip.markInfo.x,
                            tooltip.markInfo.y,
                            tooltip.markInfo.width,
                            tooltip.markInfo.height
                        );
                    } else {
                        const [tw, th] = this.dimensions;
                        const cx = tooltip.markInfo.x + tooltip.markInfo.width / 2.0;
                        const cy = tooltip.markInfo.y + tooltip.markInfo.height / 2.0;

                        // horizontal line
                        this.mouseOverGraphics.moveTo(0, cy);
                        this.mouseOverGraphics.lineTo(tw, cy);

                        // vertical line
                        this.mouseOverGraphics.moveTo(cx, 0);
                        this.mouseOverGraphics.lineTo(cx, th);

                        // center point
                        this.mouseOverGraphics.beginFill(colorToHex('black'), 1);
                        this.mouseOverGraphics.drawCircle(cx, cy, 1);
                    }
                }

                // Display a tooltip
                if (this.options.spec.tooltip) {
                    const content = (this.options.spec.tooltip as any)
                        .map((d: any) => {
                            const rawValue = tooltip.datum[d.field];
                            let value = rawValue;
                            if (d.type === 'quantitative' && d.format) {
                                value = format(d.format)(+rawValue);
                            } else if (d.type === 'genomic') {
                                // e.g., chr1:204133
                                value = getRelativeGenomicPosition(+rawValue);
                            }

                            return (
                                '<tr>' +
                                `<td style='padding: 4px 8px'>${d.alt ?? d.field}</td>` +
                                `<td style='padding: 4px 8px'><b>${value}</b></td>` +
                                '</tr>'
                            );
                        })
                        .join('');
                    return `<table style='text-align: left; margin-top: 12px'>${content}</table>`;
                }
            }
        }
    }
    return new GoslingTrackClass(args);
}

const goslingIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width={30} height={30}>
    <rect style={{ fill: 'none' }} width="400" height="400" />
    <circle cx="110.62" cy="129.64" r="41.69" />
    <circle style={{ fill: '#fff' }} cx="124.14" cy="114.12" r="10.76" />
    <circle cx="288.56" cy="129.64" r="41.69" />
    <circle style={{ fill: '#fff' }} cx="302.07" cy="114.12" r="10.76" />
    <path
        style={{ fill: '#e18241' }}
        d="M313.1,241.64l8.61-22.09a430.11,430.11,0,0,0-88-15.87L224,225.63A384.54,384.54,0,0,1,313.1,241.64Z"
    />
    <path
        style={{ fill: '#e18241' }}
        d="M208.63,260.53a299.77,299.77,0,0,1,90.56,16.79L308,254.79a371.68,371.68,0,0,0-90-15.47Z"
    />
    <path
        style={{ fill: '#e18241' }}
        d="M174.4,225.56l-9-22a431.34,431.34,0,0,0-88,15.43l8.9,22A385.08,385.08,0,0,1,174.4,225.56Z"
    />
    <path
        style={{ fill: '#e18241' }}
        d="M100.71,276.35a300.51,300.51,0,0,1,87.91-15.82L180,239.29a372.51,372.51,0,0,0-88.3,14.76Z"
    />
    <path
        style={{ fill: '#e18241' }}
        d="M106.52,290.71c27.53,13.92,59.05,21.34,92.05,21.34h0c33.68,0,65.83-7.72,93.75-22.2a291.31,291.31,0,0,0-186.33-.4Z"
    />
</svg>`;

GoslingTrack.config = {
    type: 'gosling-track',
    datatype: ['multivec', 'epilogos'],
    rotatable: true,
    local: false,
    orientation: '1d-horizontal',
    thumbnail: new DOMParser().parseFromString(goslingIcon, 'text/xml').documentElement,
    availableOptions: [
        'labelPosition',
        'labelColor',
        'labelTextOpacity',
        'labelBackgroundOpacity',
        'trackBorderWidth',
        'trackBorderColor',
        'trackType',
        'scaledHeight',
        'backgroundColor',
        'barBorder',
        'sortLargestOnTop',
        'theme',
        'axisPositionHorizontal' // TODO: support this
    ],
    defaultOptions: {
        labelPosition: 'none',
        labelColor: 'black',
        labelTextOpacity: 0.4,
        trackBorderWidth: 0,
        trackBorderColor: 'black',
        backgroundColor: 'white',
        barBorder: false,
        sortLargestOnTop: true,
        axisPositionHorizontal: 'left',
        theme: 'light'
    }
};

export default GoslingTrack;
