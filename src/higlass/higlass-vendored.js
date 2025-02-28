import { scaleLinear, scaleLog, scaleQuantile } from 'd3-scale';
import { precisionPrefix, formatPrefix, format } from 'd3-format';
import slugid from 'slugid';
import { color, rgb } from 'd3-color';
import * as PIXI from 'pixi.js';
import { mean, deviation, variance, sum, range, median, ticks, bisector } from 'd3-array';
import ndarray from 'ndarray';
import { select } from 'd3-selection';
import { brushX, brushY } from 'd3-brush';
import { globalPubSub } from 'pub-sub-es';

/**
 * Check if a 2D or 1D point is within a rectangle or range
 * @param {number} x - The point's X coordinate.
 * @param {number} y - The point's Y coordinate.
 * @param {number} minX - The rectangle's start X coordinate.
 * @param {number} maxX - The rectangle's start X coordinate.
 * @param {number} minY - The rectangle's start X coordinate.
 * @param {number} maxY - The rectangle's start X coordinate.
 * @return {boolean} If `true` the [x,y] point is in the rectangle.
 */
const isWithin = (x, y, minX, maxX, minY, maxY, is1d = false) =>
    is1d ? (x >= minX && x <= maxX) || (y >= minY && y <= maxY) : x >= minX && x <= maxX && y >= minY && y <= maxY;

const fakePubSub = {
    __fake__: true,
    publish: () => {},
    subscribe: () => ({
        event: '',
        handler: () => {}
    }),
    unsubscribe: () => {},
    clear: () => {}
};

/**
 * @typedef TrackContext
 * @property {string} id - The track ID.
 * @property {import('pub-sub-es').PubSub & { __fake__?: boolean }} [pubSub] - The pub-sub channel.
 * @property {() => import('./types').Theme} [getTheme] - A function that returns the current theme.
 */

/**
 * @template T
 * @typedef {T & TrackContext} ExtendedTrackContext
 */

/** @template Options */
class Track {
    /**
     * @param {TrackContext} context
     * @param {Options} options
     */
    constructor(context, options) {
        this.context = context;

        const { id, pubSub, getTheme } = context;
        /** @type {import('pub-sub-es').PubSub} */
        this.pubSub = pubSub ?? fakePubSub;

        /** @type {string} */
        this.id = id;
        /** @type {import('./types').Scale} */
        this._xScale = scaleLinear();
        /** @type {import('./types').Scale} */
        this._yScale = scaleLinear();

        // reference scales used for tracks that can translate and scale
        // their graphics
        // They will draw their graphics on the reference scales and then translate
        // and pan them as needed
        /** @type {import('./types').Scale} */
        this._refXScale = scaleLinear();
        /** @type {import('./types').Scale} */
        this._refYScale = scaleLinear();

        /** @type {[number, number]} */
        this.position = [0, 0];
        /** @type {[number, number]} */
        this.dimensions = [1, 1];
        /** @type {Options} */
        this.options = options;
        /** @type {Array<import('pub-sub-es').Subscription>} */
        this.pubSubs = [];

        /** @type {() => (import('./types').Theme | undefined)} */
        this.getTheme = getTheme ?? (() => undefined);

        this.pubSubs.push(this.pubSub.subscribe?.('app.mouseMove', this.defaultMouseMoveHandler.bind(this)));

        this.isLeftModified = false;
    }

    /**
     * Check if a 2d location (x, y) is within the bounds of this track.
     *
     * @param {number} x - X position to be tested.
     * @param {number} y - Y position to be tested.
     * @return {boolean}  If `true` location is within the track.
     */
    isWithin(x, y) {
        let xx = x;
        let yy = y;
        let left = this.position[0];
        let top = this.position[1];

        if (this.isLeftModified) {
            xx = y;
            yy = x;
            left = this.position[1];
            top = this.position[0];
        }

        return isWithin(xx, yy, left, this.dimensions[0] + left, top, this.dimensions[1] + top);
    }

    /**
     * Get a property from the track.
     * @template {keyof this} T
     * @param {T} prop - The property to get.
     * @return {() => this[T]}
     */
    getProp(prop) {
        return () => this[prop];
    }

    getData() {}

    /**
     * Capture click events. x and y are relative to the track position
     * @template T
     * @param {number} x - X position of the click event.
     * @param {number} y - Y position of the click event.
     * @param {T} evt - The event.
     * @return {{ type: 'generic', event: T, payload: null }}
     */
    click(x, y, evt) {
        return {
            type: 'generic',
            event: evt,
            payload: null
        };
    }

    /** There was a click event outside the track * */
    clickOutside() {}

    /** @returns {[number, number]} */
    getDimensions() {
        return this.dimensions;
    }

    /** @param {[number, number]} newDimensions */
    setDimensions(newDimensions) {
        this.dimensions = newDimensions;

        this._xScale.range([0, this.dimensions[0]]);
        this._yScale.range([0, this.dimensions[1]]);
    }

    /**
     * @overload
     * @return {import('./types').Scale}
     */
    /**
     * @overload
     * @param {import('./types').Scale} scale
     * @return {this}
     */
    /**
     * Either get or set the reference xScale
     *
     * @param {import('./types').Scale=} scale
     * @return {import('./types').Scale | this}
     */
    refXScale(scale) {
        if (!scale) return this._refXScale;
        this._refXScale = scale;
        return this;
    }

    /**
     * @overload
     * @return {import('./types').Scale}
     */
    /**
     * @overload
     * @param {import('./types').Scale} scale
     * @return {this}
     */
    /**
     * Either get or set the reference yScale
     *
     * @param {import('./types').Scale=} scale
     * @return {import('./types').Scale | this}
     */
    refYScale(scale) {
        if (!scale) return this._refYScale;
        this._refYScale = scale;
        return this;
    }

    /**
     * @overload
     * @return {import('./types').Scale}
     */
    /**
     * @overload
     * @param {import('./types').Scale} scale
     * @return {this}
     */
    /**
     * Either get or set the xScale
     *
     * @param {import('./types').Scale=} scale
     * @return {import('./types').Scale | this}
     */
    xScale(scale) {
        if (!scale) return this._xScale;
        this._xScale = scale;
        return this;
    }

    /**
     * @overload
     * @return {import('./types').Scale}
     */
    /**
     * @overload
     * @param {import('./types').Scale} scale
     * @return {this}
     */
    /**
     * Either get or set the yScale
     *
     * @param {import('./types').Scale=} scale
     * @return {import('./types').Scale | this}
     */
    yScale(scale) {
        if (!scale) return this._yScale;
        this._yScale = scale;
        return this;
    }

    /**
     * @param {import('./types').Scale} newXScale
     * @param {import('./types').Scale} newYScale
     * @returns {void}
     */
    zoomed(newXScale, newYScale) {
        this.xScale(newXScale);
        this.yScale(newYScale);
    }

    /**
     * @param {import('./types').Scale} refXScale
     * @param {import('./types').Scale} refYScale
     * @returns {void}
     */
    refScalesChanged(refXScale, refYScale) {
        this._refXScale = refXScale;
        this._refYScale = refYScale;
    }

    /** @returns {void} */
    draw() {}

    /** @returns {[number, number]} */
    getPosition() {
        return this.position;
    }

    /**
     * @param {[number, number]} newPosition
     * @returns {void}
     */
    setPosition(newPosition) {
        this.position = newPosition;
    }

    /**
     * A blank handler for MouseMove / Zoom events. Should be overriden
     * by individual tracks to provide
     *
     * @param {{}} evt
     * @returns {void}
     */
    defaultMouseMoveHandler() {}

    /** @returns {void} */
    remove() {
        // Clear all pubSub subscriptions
        this.pubSubs.forEach(subscription => this.pubSub.unsubscribe(subscription));
        this.pubSubs = [];
    }

    /**
     * @param {Options} options
     * @returns {void}
     */
    rerender() {}

    /**
     * This function is for seeing whether this track should respond
     * to events at this mouse position. The difference to `isWithin()` is that it
     * can be overwritten if a track is inactive for example.
     *
     * @param {number} x - X position to be tested.
     * @param {number} y - Y position to be tested.
     * @returns {boolean}
     */
    respondsToPosition(x, y) {
        return this.isWithin(x, y);
    }

    /**
     * @param {number} trackY
     * @param {number} kMultiplier
     * @returns {void}
     */
    zoomedY() {}

    /**
     * @param {number} dY
     * @returns {void}
     */
    movedY() {}
}

// @ts-nocheck

const GLOBALS = {
    PIXI
};

/**
 * Convert a regular color value (e.g. 'red', '#FF0000', 'rgb(255,0,0)') to a
 * hex value which is legible by PIXI
 *
 * @param {string} colorValue - Color value to convert
 * @return {number} Hex value
 */
const colorToHex = colorValue => {
    /** @type {import('d3-color').RGBColor} */
    // @ts-expect-error - FIXME: `color` can return many different types
    // depending on the string input. We should probably use a different
    // the more strict `rgb` function instead?
    const c = color(colorValue);
    const hex = GLOBALS.PIXI.utils.rgb2hex([c.r / 255.0, c.g / 255.0, c.b / 255.0]);

    return hex;
};

/**
 * @param {import('../types').TrackConfig} trackConfig
 * @return {trackConfig is import('../types').CombinedTrackConfig}
 */

/**
 * @param {unknown} obj
 * @returns {obj is {}}
 */
function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}

/**
 * @param {import('../types').TilesetInfo | undefined} info
 * @returns {info is import('../types').LegacyTilesetInfo}
 */
function isLegacyTilesetInfo(info) {
    return isObject(info) && 'max_width' in info;
}

/**
 * @param {import('../types').TilesetInfo | undefined} info
 * @returns {info is import('../types').ResolutionsTilesetInfo}
 */
function isResolutionsTilesetInfo(info) {
    return isObject(info) && 'resolutions' in info;
}

/**
 * Format a resolution relative to the highest possible resolution.
 *
 * The highest possible resolution determines the granularity of the
 * formatting (e.g. 20K vs 20000)
 * @param {number} resolution The resolution to format (e.g. 30000)
 * @param {number} maxResolutionSize The maximum possible resolution (e.g. 1000)
 *
 * @returns {string} A formatted resolution string (e.g. "30K")
 */
function formatResolutionText(resolution, maxResolutionSize) {
    const pp = precisionPrefix(maxResolutionSize, resolution);
    const f = formatPrefix(`.${pp}`, resolution);
    const formattedResolution = f(resolution);

    return formattedResolution;
}

/**
 * Get a text description of a resolution based on a zoom level
 * and a list of resolutions
 *
 * @param {Array<number>} resolutions: A list of resolutions (e.g. [1000,2000,3000])
 * @param {number} zoomLevel: The current zoom level (e.g. 4)
 *
 * @returns {string} A formatted string representation of the zoom level (e.g. "30K")
 */
function getResolutionBasedResolutionText(resolutions, zoomLevel) {
    const sortedResolutions = resolutions.map(x => +x).sort((a, b) => b - a);
    const resolution = sortedResolutions[zoomLevel];
    const maxResolutionSize = sortedResolutions[sortedResolutions.length - 1];

    return formatResolutionText(resolution, maxResolutionSize);
}

/**
 * Get a text description of the resolution based on the zoom level
 * max width of the dataset, the bins per dimension and the maximum zoom.
 *
 * @param {number} zoomLevel - The current zoomLevel (e.g. 0)
 * @param {number} maxWidth - The max width (e.g. 2 ** maxZoom * highestResolution * binsPerDimension)
 * @param {number} binsPerDimension - The number of bins per tile dimension (e.g. 256)
 * @param {number} maxZoom - The maximum zoom level for this tileset
 *
 * @returns {string} A formatted string representation of the zoom level (e.g. "30K")
 */
function getWidthBasedResolutionText(zoomLevel, maxWidth, binsPerDimension, maxZoom) {
    const resolution = maxWidth / (2 ** zoomLevel * binsPerDimension);

    // we can't display a NaN resolution
    if (!Number.isNaN(resolution)) {
        // what is the maximum possible resolution?
        // this will determine how we format the lower resolutions
        const maxResolutionSize = maxWidth / (2 ** maxZoom * binsPerDimension);

        const pp = precisionPrefix(maxResolutionSize, resolution);
        const f = formatPrefix(`.${pp}`, resolution);
        const formattedResolution = f(resolution);

        return formattedResolution;
    }
    console.warn('NaN resolution, screen is probably too small.');

    return '';
}

/**
 * @typedef PixiTrackOptions
 * @property {string} labelPosition - If the label is to be drawn, where should it be drawn?
 * @property {string} labelText - What should be drawn in the label.
 * If either labelPosition or labelText are false, no label will be drawn.
 * @property {number=} trackBorderWidth
 * @property {string=} trackBorderColor
 * @property {string=} backgroundColor
 * @property {string=} labelColor
 * @property {string=} lineStrokeColor
 * @property {string=} barFillColor
 * @property {string=} name
 * @property {number=} labelTextOpacity
 * @property {string=} labelBackgroundColor
 * @property {number=} labelLeftMargin
 * @property {number=} labelRightMargin
 * @property {number=} labelTopMargin
 * @property {number=} labelBottomMargin
 * @property {number=} labelBackgroundOpacity
 * @property {boolean=} labelShowAssembly
 * @property {boolean=} labelShowResolution
 * @property {string=} dataTransform
 */

/** @extends {Track<PixiTrackOptions>} */
class PixiTrack extends Track {
    /**
     * @param {import('./Track').ExtendedTrackContext<{ scene: import('pixi.js').Container}>} context - Includes the PIXI.js scene to draw to.
     * @param {PixiTrackOptions} options - The options for this track.
     */
    constructor(context, options) {
        super(context, options);
        const { scene } = context;

        // the PIXI drawing areas
        // pMain will have transforms applied to it as users scroll to and fro
        /** @type {import('pixi.js').Container} */
        this.scene = scene;

        // this option is used to temporarily prevent drawing so that
        // updates can be batched (e.g. zoomed and options changed)
        /** @type {boolean} */
        this.delayDrawing = false;

        /** @type {import('pixi.js').Graphics} */
        this.pBase = new GLOBALS.PIXI.Graphics();
        /** @type {import('pixi.js').Graphics} */
        this.pMasked = new GLOBALS.PIXI.Graphics();
        /** @type {import('pixi.js').Graphics} */
        this.pMask = new GLOBALS.PIXI.Graphics();
        /** @type {import('pixi.js').Graphics} */
        this.pMain = new GLOBALS.PIXI.Graphics();

        // for drawing the track label (often its name)
        /** @type {import('pixi.js').Graphics} */
        this.pBorder = new GLOBALS.PIXI.Graphics();
        /** @type {import('pixi.js').Graphics} */
        this.pBackground = new GLOBALS.PIXI.Graphics();
        /** @type {import('pixi.js').Graphics} */
        this.pForeground = new GLOBALS.PIXI.Graphics();
        /** @type {import('pixi.js').Graphics} */
        this.pLabel = new GLOBALS.PIXI.Graphics();
        /** @type {import('pixi.js').Graphics} */
        this.pMobile = new GLOBALS.PIXI.Graphics();
        /** @type {import('pixi.js').Graphics} */
        this.pAxis = new GLOBALS.PIXI.Graphics();

        // for drawing information on mouseover events
        /** @type {import('pixi.js').Graphics} */
        this.pMouseOver = new GLOBALS.PIXI.Graphics();

        this.scene.addChild(this.pBase);

        this.pBase.addChild(this.pMasked);

        this.pMasked.addChild(this.pBackground);
        this.pMasked.addChild(this.pMain);
        this.pMasked.addChild(this.pMask);
        this.pMasked.addChild(this.pMobile);
        this.pMasked.addChild(this.pBorder);
        this.pMasked.addChild(this.pLabel);
        this.pMasked.addChild(this.pForeground);
        this.pMasked.addChild(this.pMouseOver);
        this.pBase.addChild(this.pAxis);

        this.pMasked.mask = this.pMask;

        /** @type {string} */
        this.prevOptions = '';

        // pMobile will be a graphics object that is moved around
        // tracks that wish to use it will replace this.pMain with it

        /** @type {PixiTrackOptions} */
        this.options = Object.assign(this.options, options);

        /** @type {string} */
        const labelTextText = this.getName();
        /** @type {string} */
        this.labelTextFontFamily = 'Arial';
        /** @type {number} */
        this.labelTextFontSize = 12;
        /**
         * Used to avoid label/colormap clashes
         * @type {number}
         */
        this.labelXOffset = 0;

        /** @type {import('pixi.js').Text} */
        this.labelText = new GLOBALS.PIXI.Text(labelTextText, {
            fontSize: `${this.labelTextFontSize}px`,
            fontFamily: this.labelTextFontFamily,
            fill: 'black'
        });
        this.pLabel.addChild(this.labelText);

        /** @type {import('pixi.js').Text} */
        this.errorText = new GLOBALS.PIXI.Text('', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: 'red'
        });
        this.errorText.anchor.x = 0.5;
        this.errorText.anchor.y = 0.5;
        this.pLabel.addChild(this.errorText);
        /** @type {string} */
        this.errorTextText = '';
        /** @type {boolean} */
        this.flipText = false;
        /** @type {import('./types').TilesetInfo | undefined} */
        this.tilesetInfo = undefined;
    }

    setLabelText() {
        // will be drawn in draw() anyway
    }

    /** @param {[number, number]} newPosition */
    setPosition(newPosition) {
        this.position = newPosition;

        this.drawBorder();
        this.drawLabel();
        this.drawBackground();
        this.setMask(this.position, this.dimensions);
        this.setForeground();
    }

    /** @param {[number, number]} newDimensions */
    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        this.drawBorder();
        this.drawLabel();
        this.drawBackground();
        this.setMask(this.position, this.dimensions);
        this.setForeground();
    }

    /**
     * @param {[number, number]} position
     * @param {[number, number]} dimensions
     */
    setMask(position, dimensions) {
        this.pMask.clear();
        this.pMask.beginFill();

        this.pMask.drawRect(position[0], position[1], dimensions[0], dimensions[1]);
        this.pMask.endFill();
    }

    setForeground() {
        this.pForeground.position.y = this.position[1];
        this.pForeground.position.x = this.position[0];
    }

    /**
     * We're going to destroy this object, so we need to detach its
     * graphics from the scene
     */
    remove() {
        // the entire PIXI stage was probably removed
        this.pBase.clear();
        this.scene.removeChild(this.pBase);
    }

    /**
     * Draw a border around each track.
     */
    drawBorder() {
        const graphics = this.pBorder;

        graphics.clear();

        // don't display the track label
        if (!this.options || !this.options.trackBorderWidth) return;

        const stroke = colorToHex(this.options.trackBorderColor ? this.options.trackBorderColor : 'white');

        graphics.lineStyle(this.options.trackBorderWidth, stroke);

        graphics.drawRect(this.position[0], this.position[1], this.dimensions[0], this.dimensions[1]);
    }

    drawError() {
        this.errorText.x = this.position[0] + this.dimensions[0] / 2;
        this.errorText.y = this.position[1] + this.dimensions[1] / 2;

        this.errorText.text = this.errorTextText;

        if (this.errorTextText && this.errorTextText.length) {
            // draw a red border around the track to bring attention to its
            // error
            const graphics = this.pBorder;
            graphics.clear();
            graphics.lineStyle(1, colorToHex('red'));

            graphics.drawRect(this.position[0], this.position[1], this.dimensions[0], this.dimensions[1]);
        }
    }

    drawBackground() {
        const graphics = this.pBackground;

        graphics.clear();

        if (!this.options || !this.options.backgroundColor) {
            return;
        }

        let opacity = 1;
        let color = this.options.backgroundColor;

        if (this.options.backgroundColor === 'transparent') {
            opacity = 0;
            color = 'white';
        }

        const hexColor = colorToHex(color);
        graphics.beginFill(hexColor, opacity);

        graphics.drawRect(this.position[0], this.position[1], this.dimensions[0], this.dimensions[1]);
    }

    /**
     * Determine the label color based on the number of options.
     *
     * @return {string} The color to use for the label.
     */
    getLabelColor() {
        if (this.options.labelColor && this.options.labelColor !== '[glyph-color]') {
            return this.options.labelColor;
        }

        return this.options.lineStrokeColor || this.options.barFillColor || 'black';
    }

    getName() {
        return this.options.name ? this.options.name : (this.tilesetInfo && this.tilesetInfo.name) || '';
    }

    drawLabel() {
        if (!this.labelText) return;

        const graphics = this.pLabel;

        graphics.clear();

        // TODO(Trevor): I don't think this can ever be true. Options are always defined,
        // and options.labelPosition can't be defined if this.options is undefined.
        if (!this.options || !this.options.labelPosition || this.options.labelPosition === 'hidden') {
            // don't display the track label
            this.labelText.alpha = 0;
            return;
        }

        const { labelBackgroundColor = 'white', labelBackgroundOpacity = 0.5 } = this.options;
        graphics.beginFill(colorToHex(labelBackgroundColor), +labelBackgroundOpacity);

        const fontColor = colorToHex(this.getLabelColor());
        const labelBackgroundMargin = 2;

        // we can't draw a label if there's no space
        if (this.dimensions[0] < 0) {
            return;
        }

        let labelTextText =
            this.options.labelShowAssembly && this.tilesetInfo && this.tilesetInfo.coordSystem
                ? `${this.tilesetInfo.coordSystem} | `
                : '';

        labelTextText += this.getName();

        if (
            this.options.labelShowResolution &&
            isLegacyTilesetInfo(this.tilesetInfo) &&
            this.tilesetInfo.bins_per_dimension
        ) {
            const formattedResolution = getWidthBasedResolutionText(
                this.calculateZoomLevel(),
                this.tilesetInfo.max_width,
                this.tilesetInfo.bins_per_dimension,
                this.tilesetInfo.max_zoom
            );

            labelTextText += `\n[Current data resolution: ${formattedResolution}]`;
        } else if (this.options.labelShowResolution && isResolutionsTilesetInfo(this.tilesetInfo)) {
            const formattedResolution = getResolutionBasedResolutionText(
                this.tilesetInfo.resolutions,
                this.calculateZoomLevel()
            );

            labelTextText += `\n[Current data resolution: ${formattedResolution}]`;
        }

        if (this.options && this.options.dataTransform) {
            let chosenTransform = null;

            if (this.tilesetInfo && this.tilesetInfo.transforms) {
                for (const transform of this.tilesetInfo.transforms) {
                    if (transform.value === this.options.dataTransform) {
                        chosenTransform = transform;
                    }
                }
            }

            if (chosenTransform) {
                labelTextText += `\n[Transform: ${chosenTransform.name}]`;
            } else if (this.options.dataTransform === 'None') {
                labelTextText += '\n[Transform: None ]';
            } else {
                labelTextText += '\n[Transform: Default ]';
            }
        }

        this.labelText.text = labelTextText;
        this.labelText.style = {
            fontSize: `${this.labelTextFontSize}px`,
            fontFamily: this.labelTextFontFamily,
            fill: fontColor
        };
        this.labelText.alpha = typeof this.options.labelTextOpacity !== 'undefined' ? this.options.labelTextOpacity : 1;

        this.labelText.visible = true;

        if (this.flipText) {
            this.labelText.scale.x = -1;
        }

        const { labelLeftMargin = 0, labelRightMargin = 0, labelTopMargin = 0, labelBottomMargin = 0 } = this.options;

        if (this.options.labelPosition === 'topLeft') {
            this.labelText.x = this.position[0] + labelLeftMargin + this.labelXOffset;
            this.labelText.y = this.position[1] + labelTopMargin;

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0;

            this.labelText.x += this.labelText.width / 2;

            graphics.drawRect(
                this.position[0] + labelLeftMargin + this.labelXOffset,
                this.position[1] + labelTopMargin,
                this.labelText.width + labelBackgroundMargin,
                this.labelText.height + labelBackgroundMargin
            );
        } else if (
            (this.options.labelPosition === 'bottomLeft' && !this.flipText) ||
            (this.options.labelPosition === 'topRight' && this.flipText)
        ) {
            this.labelText.x = this.position[0] + (labelLeftMargin || labelTopMargin);
            this.labelText.y = this.position[1] + this.dimensions[1] - (labelBottomMargin || labelRightMargin);
            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 1;

            this.labelText.x += this.labelText.width / 2 + this.labelXOffset;
            graphics.drawRect(
                this.position[0] + (labelLeftMargin || labelTopMargin) + this.labelXOffset,
                this.position[1] +
                    this.dimensions[1] -
                    this.labelText.height -
                    labelBackgroundMargin -
                    (labelBottomMargin || labelRightMargin),
                this.labelText.width + labelBackgroundMargin,
                this.labelText.height + labelBackgroundMargin
            );
        } else if (
            (this.options.labelPosition === 'topRight' && !this.flipText) ||
            (this.options.labelPosition === 'bottomLeft' && this.flipText)
        ) {
            this.labelText.x = this.position[0] + this.dimensions[0] - (labelRightMargin || labelBottomMargin);
            this.labelText.y = this.position[1] + (labelTopMargin || labelLeftMargin);
            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0;

            this.labelText.x -= this.labelText.width / 2 + this.labelXOffset;

            graphics.drawRect(
                this.position[0] +
                    this.dimensions[0] -
                    this.labelText.width -
                    labelBackgroundMargin -
                    (labelRightMargin || labelBottomMargin) -
                    this.labelXOffset,
                this.position[1] + (labelTopMargin || labelLeftMargin),
                this.labelText.width + labelBackgroundMargin,
                this.labelText.height + labelBackgroundMargin
            );
        } else if (this.options.labelPosition === 'bottomRight') {
            this.labelText.x = this.position[0] + this.dimensions[0] - labelRightMargin;
            this.labelText.y = this.position[1] + this.dimensions[1] - labelBottomMargin;
            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 1;

            // we set the anchor to 0.5 so that we can flip the text if the track
            // is rotated but that means we have to adjust its position
            this.labelText.x -= this.labelText.width / 2 + this.labelXOffset;

            graphics.drawRect(
                this.position[0] +
                    this.dimensions[0] -
                    this.labelText.width -
                    labelBackgroundMargin -
                    labelRightMargin -
                    this.labelXOffset,
                this.position[1] +
                    this.dimensions[1] -
                    this.labelText.height -
                    labelBackgroundMargin -
                    labelBottomMargin,
                this.labelText.width + labelBackgroundMargin,
                this.labelText.height + labelBackgroundMargin
            );
        } else if (
            (this.options.labelPosition === 'outerLeft' && !this.flipText) ||
            (this.options.labelPosition === 'outerTop' && this.flipText)
        ) {
            this.labelText.x = this.position[0];
            this.labelText.y = this.position[1] + this.dimensions[1] / 2;

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0.5;

            this.labelText.x -= this.labelText.width / 2 + 3;
        } else if (
            (this.options.labelPosition === 'outerTop' && !this.flipText) ||
            (this.options.labelPosition === 'outerLeft' && this.flipText)
        ) {
            this.labelText.x = this.position[0] + this.dimensions[0] / 2;
            this.labelText.y = this.position[1];

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0.5;

            this.labelText.y -= this.labelText.height / 2 + 3;
        } else if (
            (this.options.labelPosition === 'outerBottom' && !this.flipText) ||
            (this.options.labelPosition === 'outerRight' && this.flipText)
        ) {
            this.labelText.x = this.position[0] + this.dimensions[0] / 2;
            this.labelText.y = this.position[1] + this.dimensions[1];

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0.5;

            this.labelText.y += this.labelText.height / 2 + 3;
        } else if (
            (this.options.labelPosition === 'outerRight' && !this.flipText) ||
            (this.options.labelPosition === 'outerBottom' && this.flipText)
        ) {
            this.labelText.x = this.position[0] + this.dimensions[0];
            this.labelText.y = this.position[1] + this.dimensions[1] / 2;

            this.labelText.anchor.x = 0.5;
            this.labelText.anchor.y = 0.5;

            this.labelText.x += this.labelText.width / 2 + 3;
        } else {
            this.labelText.visible = false;
        }

        if (
            this.options.labelPosition === 'outerLeft' ||
            this.options.labelPosition === 'outerRight' ||
            this.options.labelPosition === 'outerTop' ||
            this.options.labelPosition === 'outerBottom'
        ) {
            this.pLabel.setParent(this.pBase);
        } else {
            this.pLabel.setParent(this.pMasked);
        }
    }

    /** @param {PixiTrackOptions} options */
    rerender(options) {
        this.options = options;

        this.draw();
        this.drawBackground();
        this.drawLabel();
        this.drawError();
        this.drawBorder();
    }

    /**
     * Draw all the data associated with this track
     */
    draw() {
        // this rectangle is cleared by functions that override this draw method
        // this.drawBorder();
        // this.drawLabel();
        this.drawError();
    }

    /**
     * Export an SVG representation of this track
     *
     * @returns {[HTMLElement, HTMLElement]} The two returned DOM nodes are both SVG
     * elements [base, track]. Base is a parent which contains track as a
     * child. Track is clipped with a clipping rectangle contained in base.
     *
     */
    exportSVG() {
        const gBase = document.createElement('g');
        const rectBackground = document.createElement('rect');

        rectBackground.setAttribute('x', `${this.position[0]}`);
        rectBackground.setAttribute('y', `${this.position[1]}`);
        rectBackground.setAttribute('width', `${this.dimensions[0]}`);
        rectBackground.setAttribute('height', `${this.dimensions[1]}`);

        if (this.options && this.options.backgroundColor) {
            rectBackground.setAttribute('fill', this.options.backgroundColor);
        } else {
            rectBackground.setAttribute('fill-opacity', '0');
        }

        const gClipped = document.createElement('g');
        gClipped.setAttribute('class', 'g-clipped');
        gBase.appendChild(gClipped);
        gClipped.appendChild(rectBackground);

        const gTrack = document.createElement('g');
        gClipped.setAttribute('class', 'g-track');
        gClipped.appendChild(gTrack);

        const gLabels = document.createElement('g');
        gClipped.setAttribute('class', 'g-labels');
        gClipped.appendChild(gLabels); // labels should always appear on top of the track

        // define the clipping area as a polygon defined by the track's
        // dimensions on the canvas
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        gBase.appendChild(clipPath);

        const clipPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        clipPath.appendChild(clipPolygon);

        clipPolygon.setAttribute(
            'points',
            `${this.position[0]},${this.position[1]} ` +
                `${this.position[0] + this.dimensions[0]},${this.position[1]} ` +
                `${this.position[0] + this.dimensions[0]},${this.position[1] + this.dimensions[1]} ` +
                `${this.position[0]},${this.position[1] + this.dimensions[1]} `
        );

        // the clipping area needs to be a clipPath element
        const clipPathId = slugid.nice();
        clipPath.setAttribute('id', clipPathId);

        gClipped.setAttribute('style', `clip-path:url(#${clipPathId});`);

        const lineParts = this.labelText.text.split('\n');
        let ddy = 0;

        // SVG text alignment is wonky, just adjust the dy values of the tspans
        // instead

        const paddingBottom = 3;
        const labelTextHeight = (this.labelTextFontSize + 2) * lineParts.length + paddingBottom;

        if (this.labelText.anchor.y === 0.5) {
            ddy = labelTextHeight / 2;
        } else if (this.labelText.anchor.y === 1) {
            ddy = -labelTextHeight;
        }

        for (let i = 0; i < lineParts.length; i++) {
            const text = document.createElement('text');

            text.setAttribute('font-family', this.labelTextFontFamily);
            text.setAttribute('font-size', `${this.labelTextFontSize}px`);

            // break up newlines into separate tspan elements because SVG text
            // doesn't support line breaks:
            // http://stackoverflow.com/a/16701952/899470

            text.innerText = lineParts[i];
            if (this.options.labelPosition === 'topLeft' || this.options.labelPosition === 'topRight') {
                const dy = ddy + (i + 1) * (this.labelTextFontSize + 2);
                text.setAttribute('dy', String(dy));
            } else if (this.options.labelPosition === 'bottomLeft' || this.options.labelPosition === 'bottomRight') {
                text.setAttribute('dy', String(ddy + i * (this.labelTextFontSize + 2)));
            }

            text.setAttribute('fill', this.options.labelColor ?? '');

            if (this.labelText.anchor.x === 0.5) {
                text.setAttribute('text-anchor', 'middle');
            } else if (this.labelText.anchor.x === 1) {
                text.setAttribute('text-anchor', 'end');
            }

            gLabels.appendChild(text);
        }

        gLabels.setAttribute(
            'transform',
            `translate(${this.labelText.x},${this.labelText.y})scale(${this.labelText.scale.x},1)`
        );

        // return the whole SVG and where the specific track should draw its
        // contents
        return [gBase, gTrack];
    }

    /**
     * @returns {number}
     */
    calculateZoomLevel() {
        throw new Error('Must be implemented by subclass');
    }
}

/**
 * Trim trailing slash of an URL.
 * @param {string} url - URL to be trimmed.
 * @return {string} Trimmed URL.
 */
const trimTrailingSlash = url => (url || '').replace(/\/$/, '');

/**
 * Return an array of values that are present in this dictionary
 *
 * @template {object} T
 * @param {T} dictionary
 * @returns {Array<T[keyof T]>}
 */
function dictValues(dictionary) {
    /** @type {Array<T[keyof T]>} */
    const values = [];

    for (const key in dictionary) {
        if (Object.hasOwn(dictionary, key)) {
            values.push(dictionary[key]);
        }
    }

    return values;
}

const epsilon$1 = 0.0000001;

/**
 * Calculate the minimum non-zero value in the data
 * @param {ArrayLike<number>} data - An array of values
 * @returns {number} The minimum non-zero value in the array
 */
function minNonZero(data) {
    /**
     * Calculate the minimum non-zero value in the data
     *
     * Parameters
     * ----------
     *  data: Float32Array
     *    An array of values
     *
     * Returns
     * -------
     *  minNonZero: float
     *    The minimum non-zero value in the array
     */
    let minNonZeroNum = Number.MAX_SAFE_INTEGER;

    for (const datum of data) {
        const x = datum;

        if (x < epsilon$1 && x > -epsilon$1) {
            continue;
        }

        if (x < minNonZeroNum) {
            minNonZeroNum = x;
        }
    }

    return minNonZeroNum;
}

const epsilon = 0.0000001;

/**
 * Calculate the maximum non-zero value in the data
 * @param {ArrayLike<number>} data - An array of values
 * @returns {number} The maximum non-zero value in the array
 */
function maxNonZero(data) {
    /**
     * Calculate the minimum non-zero value in the data
     *
     * Parameters
     * ----------
     *  data: Float32Array
     *    An array of values
     *
     * Returns
     * -------
     *  minNonZero: float
     *    The minimum non-zero value in the array
     */
    let maxNonZeroNum = Number.MIN_SAFE_INTEGER;

    for (const datum of data) {
        const x = datum;

        if (x < epsilon && x > -epsilon) {
            continue;
        }

        if (x > maxNonZeroNum) {
            maxNonZeroNum = x;
        }
    }

    return maxNonZeroNum;
}

// @ts-nocheck
// Number of subset (in one direction) that is used to precompute extrema
// in the case of continuous scaling
const NUM_PRECOMP_SUBSETS_PER_1D_TTILE = 8;

// Number of subset (in one direction) that is used to precompute extrema
// in the case of continuous scaling
const NUM_PRECOMP_SUBSETS_PER_2D_TTILE = 8;

/**
 * @template {ArrayLike<number>} [T=ArrayLike<number>]
 */
class DenseDataExtrema1D {
    /**
     * This module efficiently computes extrema of arbitrary subsets of a given data array.
     * The array is subdivided into 'numSubsets' subsets where extrema are precomputed.
     * These values are used to compute extrema given arbitrary start and end indices via
     * the getMinNonZeroInSubset and getMaxNonZeroInSubset methods.
     * @param {T}  data
     */
    constructor(data) {
        /** @type {number} */
        this.epsilon = 1e-6;
        /** @type {T} */
        this.data = data;

        /** @type {number} */
        this.tileSize = this.data.length; // might not be a power of 2
        /** @type {number} */
        this.paddedTileSize = 2 ** Math.ceil(Math.log2(this.tileSize));

        // This controls how many subsets are created and precomputed.
        // Setting numSubsets to 1, is equivalent to no precomputation in
        // most cases
        /** @type {number} */
        this.numSubsets = Math.min(NUM_PRECOMP_SUBSETS_PER_1D_TTILE, this.paddedTileSize);
        /** @type {number} */
        this.subsetSize = this.paddedTileSize / this.numSubsets;

        this.subsetMinimums = this.computeSubsetNonZeroMinimums();
        this.subsetMaximums = this.computeSubsetNonZeroMaximums();
        this.minNonZeroInTile = this.getMinNonZeroInTile();
        this.maxNonZeroInTile = this.getMaxNonZeroInTile();
    }

    /**
     * Computes the non-zero minimum in a subset using precomputed values,
     * if possible. data[end] is not considered.
     *
     * @param {[start: number, end: number]} indexBounds
     * @return {number} non-zero minium of the subset
     */
    getMinNonZeroInSubset(indexBounds) {
        const start = indexBounds[0];
        const end = indexBounds[1];
        let curMin = Number.MAX_SAFE_INTEGER;

        if (start === 0 && end === this.tileSize) {
            return this.minNonZeroInTile;
        }

        const firstSubsetIndex = Math.ceil(start / this.subsetSize);
        const lastSubsetIndex = Math.floor((end - 1) / this.subsetSize);

        if (firstSubsetIndex >= lastSubsetIndex) {
            // No precomputation was found.
            return this.minNonZero(this.data, start, end);
        }

        // Compute from original data if the beginning is not covered by precomputations
        if (start < firstSubsetIndex * this.subsetSize) {
            curMin = Math.min(curMin, this.minNonZero(this.data, start, firstSubsetIndex * this.subsetSize));
        }

        // Use the precomputed values
        curMin = Math.min(curMin, this.minNonZero(this.subsetMinimums, firstSubsetIndex, lastSubsetIndex));

        // Compute from original data if the end is not covered by precomputations
        if (end > lastSubsetIndex * this.subsetSize) {
            curMin = Math.min(curMin, this.minNonZero(this.data, lastSubsetIndex * this.subsetSize, end));
        }

        return curMin;
    }

    /**
     * Computes the non-zero maximum in a subset using precomputed values, if possible
     *
     * @param {[start: number, end: number]}  indexBounds
     * @return {number} non-zero maxium of the subset
     */
    getMaxNonZeroInSubset(indexBounds) {
        const start = indexBounds[0];
        const end = indexBounds[1];
        let curMax = Number.MIN_SAFE_INTEGER;

        if (start === 0 && end === this.tileSize) {
            return this.maxNonZeroInTile;
        }

        const firstSubsetIndex = Math.ceil(start / this.subsetSize);
        const lastSubsetIndex = Math.floor((end - 1) / this.subsetSize);

        if (firstSubsetIndex >= lastSubsetIndex) {
            // No precomputation was found.
            return this.maxNonZero(this.data, start, end);
        }

        // Compute from original data if the beginning is not covered by precomputations
        if (start < firstSubsetIndex * this.subsetSize) {
            curMax = Math.max(curMax, this.maxNonZero(this.data, start, firstSubsetIndex * this.subsetSize));
        }

        // Use the precomputed values
        curMax = Math.max(curMax, this.maxNonZero(this.subsetMaximums, firstSubsetIndex, lastSubsetIndex));

        // Compute from original data if the end is not covered by precomputations
        if (end > lastSubsetIndex * this.subsetSize) {
            curMax = Math.max(curMax, this.maxNonZero(this.data, lastSubsetIndex * this.subsetSize, end));
        }

        return curMax;
    }

    /**
     * Precomputes non-zero minimums of subsets of the given data vector
     *
     * @returns {Array<number>} - Minimums of the regularly subdivided data vector
     */
    computeSubsetNonZeroMinimums() {
        /** @type {Array<number>} */
        const minimums = [];

        for (let i = 0; i < this.numSubsets; i++) {
            let curMin = Number.MAX_SAFE_INTEGER;

            for (let j = 0; j < this.subsetSize; j++) {
                const x = this.data[i * this.subsetSize + j];
                // if the tilesize is not a power of 2 we might access
                // a value that is not there
                if (x === undefined) {
                    continue;
                }

                if (x < this.epsilon && x > -this.epsilon) {
                    continue;
                }
                if (x < curMin) {
                    curMin = x;
                }
            }
            minimums.push(curMin);
        }
        return minimums;
    }

    /**
     * Precomputes non-zero maximums of subsets of the given data vector
     * @return {Array<number>} Maximums of the regularly subdivided data vector
     */
    computeSubsetNonZeroMaximums() {
        /** @type {Array<number>} */
        const maximums = [];

        for (let i = 0; i < this.numSubsets; i++) {
            let curMax = Number.MIN_SAFE_INTEGER;

            for (let j = 0; j < this.subsetSize; j++) {
                const x = this.data[i * this.subsetSize + j];
                // if the tilesize is not a power of 2 we might access
                // a value that is not there
                if (x === undefined) {
                    continue;
                }

                if (x < this.epsilon && x > -this.epsilon) {
                    continue;
                }
                if (x > curMax) {
                    curMax = x;
                }
            }
            maximums.push(curMax);
        }
        return maximums;
    }

    /**
     * Computes the non-zero minimum in the entire data array using precomputed values
     *
     * @return {number} Non-zeros maximum of the data
     */
    getMinNonZeroInTile() {
        return Math.min(...this.subsetMinimums);
    }

    /**
     * Computes the non-zero maximum in the entire data array using precomputed values
     *
     * @return {number} Non-zeros maximum of the data
     */
    getMaxNonZeroInTile() {
        return Math.max(...this.subsetMaximums);
    }

    /**
     * Calculate the minimum non-zero value in the data from start
     * to end. No precomputations are used to compute the min.
     *
     * @param {ArrayLike<number>} data
     * @param {number} start
     * @param {number} end
     * @return {number} non-zero min in subset
     */
    minNonZero(data, start, end) {
        let minNonZeroNum = Number.MAX_SAFE_INTEGER;

        for (let i = start; i < end; i++) {
            const x = data[i];

            if (x < this.epsilon && x > -this.epsilon) {
                continue;
            }

            if (x < minNonZeroNum) {
                minNonZeroNum = x;
            }
        }

        return minNonZeroNum;
    }

    /**
     * Calculate the maximum non-zero value in the data from start
     * to end. No precomputations are used to compute the max.
     *
     * @param {ArrayLike<number>} data
     * @param {number} start
     * @param {number} end
     * @return {number} non-zero max in subset
     */
    maxNonZero(data, start, end) {
        let maxNonZeroNum = Number.MIN_SAFE_INTEGER;

        for (let i = start; i < end; i++) {
            const x = data[i];

            if (x < this.epsilon && x > -this.epsilon) {
                continue;
            }

            if (x > maxNonZeroNum) {
                maxNonZeroNum = x;
            }
        }

        return maxNonZeroNum;
    }
}

/**
 * @typedef View2D
 * @property {(i: number, j: number) => number} get
 * @property {(i: number, j: number, v: number) => void} set
 */

class DenseDataExtrema2D {
    /**
     * This module efficiently computes extrema of subsets of a given data matrix.
     * The matrix is subdivided into 'numSubsets' subsets where extrema are precomputed.
     * These values are used to efficiently approximate extrema given arbitrary subsets.
     * Larger values of 'numSubsets' lead to more accurate approximations (more expensive).
     *
     * @param {ArrayLike<number>} data array of quadratic length
     */
    constructor(data) {
        /** @type {number} */
        this.epsilon = 1e-6;
        /** @type {number} */
        this.tileSize = Math.sqrt(data.length);

        if (!Number.isSafeInteger(this.tileSize)) {
            console.error('The DenseDataExtrema2D module only works for data of quadratic length.');
        }

        // if this.numSubsets == this.tilesize the extrema are computed exactly (expensive).
        /** @type {number} */
        this.numSubsets = Math.min(NUM_PRECOMP_SUBSETS_PER_2D_TTILE, this.tileSize);
        /** @type {number} */
        this.subsetSize = this.tileSize / this.numSubsets;

        // Convert data to 2d array
        /** @type {View2D} */
        const dataMatrix = ndarray(Array.from(data), [this.tileSize, this.tileSize]);

        /** @type {View2D} */
        this.subsetMinimums = this.computeSubsetNonZeroMinimums(dataMatrix);
        /** @type {View2D} */
        this.subsetMaximums = this.computeSubsetNonZeroMaximums(dataMatrix);
        /** @type {number} */
        this.minNonZeroInTile = this.getMinNonZeroInTile();
        /** @type {number} */
        this.maxNonZeroInTile = this.getMaxNonZeroInTile();
    }

    /**
     * Computes an approximation of the non-zero minimum in a subset
     *
     * @param {[startX: number, startY: number, endX: number, endY: number]} indexBounds
     * @return {number} Non-zero minium of the subset
     */
    getMinNonZeroInSubset(indexBounds) {
        const startX = indexBounds[0];
        const startY = indexBounds[1];
        const endX = indexBounds[2];
        const endY = indexBounds[3];

        // transform indices to the corresponding entries in the
        // precomputed minimum matrix
        const rowOffsetStart = Math.floor(startY / this.subsetSize);
        const colOffsetStart = Math.floor(startX / this.subsetSize);
        const height = Math.ceil((endY + 1) / this.subsetSize) - rowOffsetStart;
        const width = Math.ceil((endX + 1) / this.subsetSize) - colOffsetStart;

        const min = this.getMinNonZeroInNdarraySubset(
            this.subsetMinimums,
            rowOffsetStart,
            colOffsetStart,
            width,
            height
        );

        return min;
    }

    /**
     * Computes an approximation of the non-zero maximum in a subset
     *
     * @param {[startX: number, startY: number, endX: number, endY: number]} indexBounds
     * @return {number} Non-zero maxium of the subset
     */
    getMaxNonZeroInSubset(indexBounds) {
        const startX = indexBounds[0];
        const startY = indexBounds[1];
        const endX = indexBounds[2];
        const endY = indexBounds[3];

        // transform indices to the corresponding entries in the
        // precomputed maximum matrix
        const rowOffsetStart = Math.floor(startY / this.subsetSize);
        const colOffsetStart = Math.floor(startX / this.subsetSize);
        const height = Math.ceil((endY + 1) / this.subsetSize) - rowOffsetStart;
        const width = Math.ceil((endX + 1) / this.subsetSize) - colOffsetStart;

        const max = this.getMaxNonZeroInNdarraySubset(
            this.subsetMaximums,
            rowOffsetStart,
            colOffsetStart,
            width,
            height
        );

        return max;
    }

    /**
     * Precomputes non-zero minimums of subsets of a given matrix
     * @param {View2D} dataMatrix
     * @return {View2D} Matrix containing minimums of the dataMatrix after subdivision using a regular grid
     */
    computeSubsetNonZeroMinimums(dataMatrix) {
        const minimums = ndarray(new Array(this.numSubsets ** 2), [this.numSubsets, this.numSubsets]);

        for (let i = 0; i < this.numSubsets; i++) {
            for (let j = 0; j < this.numSubsets; j++) {
                const curMin = this.getMinNonZeroInNdarraySubset(
                    dataMatrix,
                    i * this.subsetSize,
                    j * this.subsetSize,
                    this.subsetSize,
                    this.subsetSize
                );
                minimums.set(i, j, curMin);
            }
        }
        return minimums;
    }

    /**
     * Precomputes non-zero maximums of subsets of a given matrix
     *
     * @param {View2D} dataMatrix
     * @return {View2D} Matrix containing maximums of the dataMatrix after subdivision using a regular grid
     */
    computeSubsetNonZeroMaximums(dataMatrix) {
        const maximums = ndarray(new Array(this.numSubsets ** 2), [this.numSubsets, this.numSubsets]);

        for (let i = 0; i < this.numSubsets; i++) {
            for (let j = 0; j < this.numSubsets; j++) {
                const curMax = this.getMaxNonZeroInNdarraySubset(
                    dataMatrix,
                    i * this.subsetSize,
                    j * this.subsetSize,
                    this.subsetSize,
                    this.subsetSize
                );
                maximums.set(i, j, curMax);
            }
        }
        return maximums;
    }

    /**
     * Computes the non-zero minimum of a subset of a matrix (ndarray)
     * @param {View2D} arr
     * @param {number} rowOffset - Starting row of the subset
     * @param {number} colOffset - Starting column of the subset
     * @param {number} width - Width (num columns) of the subset
     * @param {number} height - Height (num rows) of the subset
     * @return {number} Non-zeros - minimum of the subset
     */
    getMinNonZeroInNdarraySubset(arr, rowOffset, colOffset, width, height) {
        let curMin = Number.MAX_SAFE_INTEGER;

        for (let k = 0; k < width; k++) {
            for (let l = 0; l < height; l++) {
                const x = arr.get(rowOffset + l, colOffset + k);
                if (x < this.epsilon && x > -this.epsilon) {
                    continue;
                }
                if (x < curMin) {
                    curMin = x;
                }
            }
        }

        return curMin;
    }

    /**
     * Computes the non-zero maximum of a subset of a matrix (ndarray)
     * @param {View2D} arr
     * @param {number} rowOffset - Starting row of the subset
     * @param {number} colOffset - Starting column of the subset
     * @param {number} width - Width (num columns) of the subset
     * @param {number} height - Height (num rows) of the subset
     * @return {number} Non-zeros maximum of the subset
     */
    getMaxNonZeroInNdarraySubset(arr, rowOffset, colOffset, width, height) {
        let curMax = Number.MIN_SAFE_INTEGER;

        for (let k = 0; k < width; k++) {
            for (let l = 0; l < height; l++) {
                const x = arr.get(rowOffset + l, colOffset + k);
                if (x < this.epsilon && x > -this.epsilon) {
                    continue;
                }
                if (x > curMax) {
                    curMax = x;
                }
            }
        }

        return curMax;
    }

    mirrorPrecomputedExtrema() {
        for (let row = 1; row < this.numSubsets; row++) {
            for (let col = 0; col < row; col++) {
                this.subsetMinimums.set(col, row, this.subsetMinimums.get(row, col));
                this.subsetMaximums.set(col, row, this.subsetMaximums.get(row, col));
            }
        }
    }

    /**
     * Computes the non-zero minimum in the entire data array using precomputed values
     *
     * @return {number} Non-zeros minimum of the data
     */
    getMinNonZeroInTile() {
        return this.getMinNonZeroInNdarraySubset(this.subsetMinimums, 0, 0, this.numSubsets, this.numSubsets);
    }

    /**
     * Computes the non-zero maximum in the entire data array using precomputed values
     *
     * @return {number} Non-zeros maximum of the data
     */
    getMaxNonZeroInTile() {
        return this.getMaxNonZeroInNdarraySubset(this.subsetMaximums, 0, 0, this.numSubsets, this.numSubsets);
    }
}

/** @typedef {(values: number[]) => number | undefined} Aggregation */

/**
 * Get an aggregation function from a function name.
 * @param {'mean' | 'sum' | 'variance' | 'deviation'} name - The type of aggregation.
 * If an unknown string is passed, the mean function will be used (and a warning will be logged).
 * @returns {Aggregation} The function of interest as determined by the string,
 */
const getAggregationFunction = name => {
    /** @type {Aggregation} */
    let aggFunc;
    const lowerCaseName = name ? name.toLowerCase() : name;
    switch (lowerCaseName) {
        case 'mean':
            aggFunc = mean;
            break;
        case 'sum':
            aggFunc = sum;
            break;
        case 'variance':
            aggFunc = variance;
            break;
        case 'deviation':
            aggFunc = deviation;
            break;
        default:
            aggFunc = mean;
            console.warn('Encountered an unsupported selectedRowsAggregationMode option.');
    }
    return aggFunc;
};

/**
 * Compute the size associated with a potentially 2d array of selected item indices.
 * For example, this can be used to compute the total height of a `horizontal-multivec` track
 * where rows are selected individually or in aggregation groups.
 *
 * @param {Array<unknown>} selectedItems The 1d or 2d array of items or groups of items.
 * @param {boolean} withRelativeSize Does a group of indices count as 1 unit size
 * or is its size relative to the group size?
 * @returns {number} The computed size value.
 * Between 0 and the total number of items in the (flattened) input array.
 */
const selectedItemsToSize = (selectedItems, withRelativeSize) =>
    selectedItems.reduce((/** @type {number} */ a, h) => a + (Array.isArray(h) && withRelativeSize ? h.length : 1), 0);

/**
 * This function helps to fill in pixData by calling setPixData()
 * when selectedRowsOptions have been passed to workerSetPix().
 *
 * @param {ArrayLike<number>} data - The (2D) tile data array.
 * @param {[numRows: number, numCols: number]} shape - Array shape (number of rows and columns).
 * @param {(pixDataIndex: number, dataPoint: number) => void} setPixData - The setPixData function created by workerSetPix().
 * @param {number[] | number[][]} selectedRows - Row indices, for ordering and filtering rows. Used by the HorizontalMultivecTrack.
 * @param {'mean' | 'sum' | 'variance' | 'deviation'} selectedRowsAggregationMode - The aggregation function to use ("mean", "sum", etc).
 * @param {boolean} selectedRowsAggregationWithRelativeHeight - Whether the height of row groups should be relative to the size of the group.
 * @param {'client' | 'server'} selectedRowsAggregationMethod - Where will the aggregation be performed? Possible values: "client", "server".
 */
function setPixDataForSelectedRows(
    data,
    shape,
    setPixData,
    selectedRows,
    selectedRowsAggregationMode,
    selectedRowsAggregationWithRelativeHeight,
    selectedRowsAggregationMethod
) {
    // We need to set the pixels in the order specified by the `selectedRows` parameter.
    /** @type {((data: number[]) => number | undefined) | undefined} */
    let aggFunc;
    /** @type {((columnIndex: number, rowIndices: number[]) => number) | undefined} */
    let aggFromDataFunc;
    if (selectedRowsAggregationMode) {
        const agg = getAggregationFunction(selectedRowsAggregationMode);
        aggFunc = agg;
        aggFromDataFunc = (colI, rowIs) => agg(rowIs.map(rowI => data[rowI * shape[1] + colI])) ?? 0;
    }
    /** @type {number} */
    let d;
    /** @type {number} */
    let pixRowI;
    /** @type {number} */
    let colI;
    /** @type {number} */
    let selectedRowI;
    /** @type {number} */
    let selectedRowGroupItemI;
    /** @type {number | number[]} */
    let selectedRow;

    for (colI = 0; colI < shape[1]; colI++) {
        // For this column, aggregate along the row axis.
        pixRowI = 0;
        for (selectedRowI = 0; selectedRowI < selectedRows.length; selectedRowI++) {
            selectedRow = selectedRows[selectedRowI];
            if (aggFunc && selectedRowsAggregationMethod === 'server') {
                d = data[selectedRowI * shape[1] + colI];
            } else if (Array.isArray(selectedRow)) {
                if (!aggFromDataFunc) {
                    throw new Error("row aggregation requires 'aggFromDataFunc'");
                }
                // An aggregation step must be performed for this data point.
                d = aggFromDataFunc(colI, selectedRow);
            } else {
                d = data[selectedRow * shape[1] + colI];
            }

            if (selectedRowsAggregationWithRelativeHeight && Array.isArray(selectedRow)) {
                // Set a pixel for multiple rows, proportionate to the size of the row aggregation group.
                for (selectedRowGroupItemI = 0; selectedRowGroupItemI < selectedRow.length; selectedRowGroupItemI++) {
                    setPixData(
                        pixRowI * shape[1] + colI, // pixData index
                        d // data point
                    );
                    pixRowI++;
                }
            } else {
                // Set a single pixel, either representing a single row or an entire row group, if the vertical height for each group should be uniform (i.e. should not depend on group size).
                setPixData(
                    pixRowI * shape[1] + colI, // pixData index
                    d // data point
                );
                pixRowI++;
            }
        } // end row group for
    } // end col for
}

/**
 * @typedef SelectedRowsOptions
 * @property {number[] | number[][]} selectedRows - Row indices, for ordering and filtering rows. Used by the HorizontalMultivecTrack.
 * @property {'mean' | 'sum' | 'variance' | 'deviation'} selectedRowsAggregationMode - The aggregation function to use ("mean", "sum", etc).
 * @property {boolean} selectedRowsAggregationWithRelativeHeight - Whether the height of row groups should be relative to the size of the group.
 * @property {'client' | 'server'} selectedRowsAggregationMethod - Where will the aggregation be performed? Possible values: "client", "server".
 */

/**
 * This function takes in tile data and other rendering parameters,
 * and generates an array of pixel data that can be passed to a canvas
 * (and subsequently passed to a PIXI sprite).
 *
 * @param {number} size - `data` parameter length. Often set to a tile's `tile.tileData.dense.length` value.
 * @param {Array<number>} data - The tile data array.
 * @param {'log' | 'linear'} valueScaleType 'log' or 'linear'.
 * @param {[number, number]} valueScaleDomain
 * @param {number} pseudocount - The pseudocount is generally the minimum non-zero value and is
 * used so that our log scaling doesn't lead to NaN values.
 * @param {Array<[r: number, g: number, b: number, a: number]>} colorScale
 * @param {boolean} ignoreUpperRight
 * @param {boolean} ignoreLowerLeft
 * @param {[numRows: number, numCols: number] | null} shape - Array `[numRows, numCols]`, used when iterating over a subset of rows,
 * when one needs to know the width of each column.
 * @param {[r: number, g: number, b: number, a: number] | null} zeroValueColor - The color to use for rendering zero data values, [r, g, b, a].
 * @param {Partial<SelectedRowsOptions> | null} selectedRowsOptions - Rendering options when using a `selectRows` track option.
 *
 * @returns {Uint8ClampedArray} A flattened array of pixel values.
 */
function workerSetPix(
    size,
    data,
    valueScaleType,
    valueScaleDomain,
    pseudocount,
    colorScale,
    ignoreUpperRight = false,
    ignoreLowerLeft = false,
    shape = null,
    zeroValueColor = null,
    selectedRowsOptions = null
) {
    /** @type {import('../types').Scale} */
    let valueScale;

    if (valueScaleType === 'log') {
        valueScale = scaleLog().range([254, 0]).domain(valueScaleDomain);
    } else {
        if (valueScaleType !== 'linear') {
            console.warn('Unknown value scale type:', valueScaleType, ' Defaulting to linear');
        }
        valueScale = scaleLinear().range([254, 0]).domain(valueScaleDomain);
    }

    const {
        selectedRows,
        selectedRowsAggregationMode = 'mean',
        selectedRowsAggregationWithRelativeHeight = false,
        selectedRowsAggregationMethod = 'client'
    } = selectedRowsOptions ?? {};

    let filteredSize = size;
    if (shape && selectedRows) {
        // If using the `selectedRows` parameter, then the size of the `pixData` array
        // will likely be different than `size` (the total size of the tile data array).
        // The potential for aggregation groups in `selectedRows` also must be taken into account.
        filteredSize = selectedItemsToSize(selectedRows, selectedRowsAggregationWithRelativeHeight) * shape[1];
    }

    let rgb;
    let rgbIdx = 0;
    const tileWidth = shape ? shape[1] : Math.sqrt(size);
    const pixData = new Uint8ClampedArray(filteredSize * 4);

    /** @type {(x: number) => number} */
    const dToRgbIdx = x => {
        const v = valueScale(x);
        if (Number.isNaN(v)) return 254;
        return Math.max(0, Math.min(254, Math.floor(v)));
    };

    /**
     * Set the ith element of the pixData array, using value d.
     * (well not really, since i is scaled to make space for each rgb value).
     *
     * @param {number} i - Index of the element.
     * @param {number} d - The value to be transformed and then inserted.
     */
    const setPixData = (i, d) => {
        // Transparent
        rgbIdx = 255;

        if (
            // ignore the upper right portion of a tile because it's on the diagonal
            // and its mirror will fill in that space
            !(ignoreUpperRight && Math.floor(i / tileWidth) < i % tileWidth) &&
            !(ignoreLowerLeft && Math.floor(i / tileWidth) > i % tileWidth) &&
            // Ignore color if the value is invalid
            !Number.isNaN(+d)
        ) {
            // values less than espilon are considered NaNs and made transparent (rgbIdx 255)
            rgbIdx = dToRgbIdx(d + pseudocount);
        }

        // let rgbIdx = qScale(d); //Math.max(0, Math.min(255, Math.floor(valueScale(ct))))
        if (rgbIdx < 0 || rgbIdx > 255) {
            console.warn('out of bounds rgbIdx:', rgbIdx, ' (should be 0 <= rgbIdx <= 255)');
        }

        if (zeroValueColor && !Number.isNaN(+d) && +d === 0.0) {
            rgb = zeroValueColor;
        } else {
            rgb = colorScale[rgbIdx];
        }

        pixData[i * 4] = rgb[0];
        pixData[i * 4 + 1] = rgb[1];
        pixData[i * 4 + 2] = rgb[2];
        pixData[i * 4 + 3] = rgb[3];
    };

    let d;
    try {
        if (selectedRows && shape) {
            // We need to set the pixels in the order specified by the `selectedRows` parameter.
            // Call the setPixDataForSelectedRows helper function,
            // which will loop over the data for us and call setPixData().
            setPixDataForSelectedRows(
                data,
                shape,
                setPixData,
                selectedRows,
                selectedRowsAggregationMode,
                selectedRowsAggregationWithRelativeHeight,
                selectedRowsAggregationMethod
            );
        } else {
            // The `selectedRows` array has not been passed, so we want to use all of the tile data values,
            // in their default ordering.
            for (let i = 0; i < data.length; i++) {
                d = data[i];
                setPixData(i, d);
            }
        }
    } catch (err) {
        console.warn('Odd datapoint');
        console.warn('d:', d);
        d = d ?? 0;
        console.warn('valueScale.domain():', valueScale.domain());
        console.warn('valueScale.range():', valueScale.range());
        console.warn('value:', valueScale(d + pseudocount));
        console.warn('pseudocount:', pseudocount);
        console.warn('rgbIdx:', rgbIdx, 'd:', d, 'ct:', valueScale(d));
        console.error('ERROR:', err);
        return pixData;
    }

    return pixData;
}

/**
 * Yanked from https://github.com/numpy/numpy/blob/master/numpy/core/src/npymath/halffloat.c#L466
 *
 * Does not support infinities or NaN. All requests with such
 * values should be encoded as float32
 *
 * @param {number} h
 * @returns {number}
 */
function float32(h) {
    let hExp = h & 0x7c00;
    let hSig;
    let fExp;
    let fSig;

    const fSgn = (h & 0x8000) << 16;
    switch (hExp) {
        /* 0 or subnormal */
        case 0x0000:
            hSig = h & 0x03ff;
            /* Signed zero */
            if (hSig === 0) {
                return fSgn;
            }
            /* Subnormal */
            hSig <<= 1;
            while ((hSig & 0x0400) === 0) {
                hSig <<= 1;
                hExp++;
            }
            fExp = (127 - 15 - hExp) << 23;
            fSig = (hSig & 0x03ff) << 13;
            return fSgn + fExp + fSig;

        /* inf or NaN */
        case 0x7c00:
            /* All-ones exponent and a copy of the significand */
            return fSgn + 0x7f800000 + ((h & 0x03ff) << 13);

        default:
            /* normalized */
            /* Just need to adjust the exponent and shift */
            return fSgn + (((h & 0x7fff) + 0x1c000) << 13);
    }
}

/**
 * Convert a base64 string to an array buffer
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;

    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
}

/**
 * Convert a uint16 array to a float32 array
 *
 * @param {Uint16Array} uint16array
 * @returns {Float32Array}
 */
function uint16ArrayToFloat32Array(uint16array) {
    const bytes = new Uint32Array(uint16array.length);

    for (let i = 0; i < uint16array.length; i++) {
        bytes[i] = float32(uint16array[i]);
    }

    const newBytes = new Float32Array(bytes.buffer);

    return newBytes;
}

/**
 * @typedef TileData<Server>
 * @property {string} server
 * @property {string} tileId
 * @property {number} zoomLevel
 * @property {[number] | [number, number]} tilePos
 * @property {string} tilesetUid
 */

/**
 * @typedef DenseTileData
 * @property {string} server
 * @property {string} tileId
 * @property {number} zoomLevel
 * @property {[number] | [number, number]} tilePos
 * @property {string} tilesetUid
 * @property {Float32Array} dense
 * @property {string} dtype
 * @property {DenseDataExtrema1D | DenseDataExtrema2D} denseDataExtrema
 * @property {number} minNonZero
 * @property {number} maxNonZero
 */

/**
 * @template T
 * @typedef {Omit<T, keyof DenseTileData> & (TileData | DenseTileData)} CompletedTileData
 */

/**
 * @typedef TileResponse
 * @property {string=} dense - a base64 encoded string
 */

/**
 * Convert a response from the tile server to data that can be used by higlass.
 *
 * WARNING: Mutates the data object.
 *
 * @template {TileResponse} T
 * @param {Record<string, T>} inputData
 * @param {string} server
 * @param {string[]} theseTileIds
 *
 * @returns {Record<string, CompletedTileData<T>>}
 *
 * Trevor: This function is littered with ts-expect-error comments because
 * the type of mutation happening to the input object is very tricky to type.
 * The type signature of the function tries to adequately describe the mutation,
 * to outside users.
 */
function tileResponseToData(inputData, server, theseTileIds) {
    /** @type {Record<string, Partial<DenseTileData>>} */
    // @ts-expect-error - This function works by overriing all the properties of inputData
    // It's not great, but I don't want to touch the implementation.
    const data = inputData ?? {};

    for (const thisId of theseTileIds) {
        if (!(thisId in data)) {
            // the server didn't return any data for this tile
            data[thisId] = {};
        }
        const key = thisId;
        // let's hope the payload doesn't contain a tileId field
        const keyParts = key.split('.');

        data[key].server = server;
        data[key].tileId = key;
        data[key].zoomLevel = +keyParts[1];

        // slice from position 2 to exclude tileId and zoomLevel
        // filter by NaN to exclude metadata portions of the tile request
        /** @type {[number] | [number, number]} */
        // @ts-expect-error - tilePos is [number] or [number, number]
        const tilePos = keyParts
            .slice(2, keyParts.length)
            .map(x => +x)
            .filter(x => !Number.isNaN(x));
        data[key].tilePos = tilePos;
        data[key].tilesetUid = keyParts[0];

        if ('dense' in data[key]) {
            /** @type {string} */
            // @ts-expect-error - The input of this function requires that dense is a string
            // We are overriding the property on the input object, so TS is upset.
            const base64 = data[key].dense;
            const arrayBuffer = base64ToArrayBuffer(base64);
            let a;

            if (data[key].dtype === 'float16') {
                // data is encoded as float16s
                /* comment out until next empty line for 32 bit arrays */
                const uint16Array = new Uint16Array(arrayBuffer);
                const newDense = uint16ArrayToFloat32Array(uint16Array);
                a = newDense;
            } else {
                // data is encoded as float32s
                a = new Float32Array(arrayBuffer);
            }

            const dde = tilePos.length === 2 ? new DenseDataExtrema2D(a) : new DenseDataExtrema1D(a);

            data[key].dense = a;
            data[key].denseDataExtrema = dde;
            data[key].minNonZero = dde.minNonZeroInTile;
            data[key].maxNonZero = dde.maxNonZeroInTile;
        }
    }

    // @ts-expect-error - We have completed the tile data.
    return data;
}

/**
 * Fetch tiles from the server.
 *
 * @param {string} outUrl
 * @param {string} server
 * @param {string[]} theseTileIds
 * @param {string} authHeader
 * @param {(data: Record<string, CompletedTileData<TileResponse>>) => void} done
 * @param {Record<string, unknown>} requestBody
 */
function workerGetTiles(outUrl, server, theseTileIds, authHeader, done, requestBody) {
    /** @type {Record<string, string>} */
    const headers = {
        'content-type': 'application/json'
    };

    if (authHeader) headers.Authorization = authHeader;

    fetch(outUrl, {
        credentials: 'same-origin',
        headers,
        ...(requestBody && Object.keys(requestBody).length > 0
            ? {
                  method: 'POST',
                  body: JSON.stringify(requestBody)
              }
            : {})
    })
        .then(response => response.json())
        .then(data => {
            done(tileResponseToData(data, server, theseTileIds));
        })
        .catch(err => console.warn('err:', err));
}

/** @param {number} ms */
const timeout = ms =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

const TILE_FETCH_DEBOUNCE = 100;

// Number of milliseconds zoom-related actions (e.g., tile loading) are debounced
const ZOOM_DEBOUNCE = 10;

// @ts-nocheck

const MAX_FETCH_TILES = 15;

/*
const str = document.currentScript.src
const pathName = str.substring(0, str.lastIndexOf("/"));
const workerPath = `${pathName}/worker.js`;

const setPixPool = new Pool(1);

setPixPool.run(function(params, done) {
  try {
    const array = new Float32Array(params.data);
    const pixData = worker.workerSetPix(
      params.size,
      array,
      params.valueScaleType,
      params.valueScaleDomain,
      params.pseudocount,
      params.colorScale,
    );

    done.transfer({
      pixData: pixData
    }, [pixData.buffer]);
  } catch (err) {
    console.log('err:', err);
  }
}, [workerPath]);


const fetchTilesPool = new Pool(10);
fetchTilesPool.run(function(params, done) {
  try {
    worker.workerGetTiles(params.outUrl, params.server, params.theseTileIds,
    params.authHeader, done);
    // done.transfer({
    // pixData: pixData
    // }, [pixData.buffer]);
  } catch (err) {
    console.log('err:', err);
  }
}, [workerPath]);
*/

const sessionId = import.meta.env.DEV ? 'dev' : slugid.nice();
const authHeader = null;

const throttleAndDebounce$1 = (func, interval, finalWait) => {
    let timeout;
    let bundledRequest = [];
    let requestMapper = {};
    let blockedCalls = 0;

    const bundleRequests = request => {
        const requestId = requestMapper[request.id];

        if (requestId && bundledRequest[requestId]) {
            bundledRequest[requestId].ids = bundledRequest[requestId].ids.concat(request.ids);
        } else {
            requestMapper[request.id] = bundledRequest.length;
            bundledRequest.push(request);
        }
    };

    const reset = () => {
        timeout = null;
        bundledRequest = [];
        requestMapper = {};
    };

    // In a normal situation we would just call `func(...args)` but since we
    // modify the first argument and always trigger `reset()` afterwards I created
    // this helper function to avoid code duplication. Think of this function
    // as the actual function call that is being throttled and debounced.
    const callFunc = (request, ...args) => {
        func(
            {
                sessionId,
                requests: bundledRequest
            },
            ...args
        );
        reset();
    };

    const debounced = (request, ...args) => {
        const later = () => {
            // Since we throttle and debounce we should check whether there were
            // actually multiple attempts to call this function after the most recent
            // throttled call. If there were no more calls we don't have to call
            // the function again.
            if (blockedCalls > 0) {
                callFunc(request, ...args);
                blockedCalls = 0;
            }
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, finalWait);
    };

    debounced.cancel = () => {
        clearTimeout(timeout);
        reset();
    };

    debounced.immediate = () => {
        func({
            sessionId,
            requests: bundledRequest
        });
    };

    let wait = false;
    const throttled = (request, ...args) => {
        bundleRequests(request);

        if (!wait) {
            callFunc(request, ...args);
            debounced(request, ...args);
            wait = true;
            blockedCalls = 0;
            setTimeout(() => {
                wait = false;
            }, interval);
        } else {
            blockedCalls++;
        }
    };

    return throttled;
};

// Fritz: is this function used anywhere?
function fetchMultiRequestTiles(req, pubSub) {
    const requests = req.requests;

    const fetchPromises = [];

    const requestsByServer = {};
    const requestBodyByServer = {};

    // We're converting the array of IDs into an object in order to filter out duplicated requests.
    // In case different instances request the same data it won't be loaded twice.
    for (const request of requests) {
        if (!requestsByServer[request.server]) {
            requestsByServer[request.server] = {};
            requestBodyByServer[request.server] = [];
        }
        for (const id of request.ids) {
            requestsByServer[request.server][id] = true;

            if (request.options) {
                const firstSepIndex = id.indexOf('.');
                const tilesetUuid = id.substring(0, firstSepIndex);
                const tileId = id.substring(firstSepIndex + 1);
                const tilesetObject = requestBodyByServer[request.server].find(t => t.tilesetUid === tilesetUuid);
                if (tilesetObject) {
                    tilesetObject.tileIds.push(tileId);
                } else {
                    requestBodyByServer[request.server].push({
                        tilesetUid: tilesetUuid,
                        tileIds: [tileId],
                        options: request.options
                    });
                }
            }
        }
    }

    const servers = Object.keys(requestsByServer);

    for (const server of servers) {
        const ids = Object.keys(requestsByServer[server]);
        // console.log('ids:', ids);

        const requestBody = requestBodyByServer[server];

        // if we request too many tiles, then the URL can get too long and fail
        // so we'll break up the requests into smaller subsets
        for (let i = 0; i < ids.length; i += MAX_FETCH_TILES) {
            const theseTileIds = ids.slice(i, i + Math.min(ids.length - i, MAX_FETCH_TILES));

            const renderParams = theseTileIds.map(x => `d=${x}`).join('&');
            const outUrl = `${server}/tiles/?${renderParams}&s=${sessionId}`;

            const p = new Promise(resolve => {
                pubSub.publish('requestSent', outUrl);
                const params = {};

                params.outUrl = outUrl;
                params.server = server;
                params.theseTileIds = theseTileIds;
                params.authHeader = authHeader;

                workerGetTiles(
                    params.outUrl,
                    params.server,
                    params.theseTileIds,
                    params.authHeader,
                    resolve,
                    requestBody
                );

                /*
        fetchTilesPool.send(params)
          .promise()
          .then(ret => {
            resolve(ret);
          });
        */
                pubSub.publish('requestReceived', outUrl);
            });

            fetchPromises.push(p);
        }
    }

    Promise.all(fetchPromises).then(datas => {
        const tiles = {};

        // merge back all the tile requests
        for (const data of datas) {
            const tileIds = Object.keys(data);

            for (const tileId of tileIds) {
                tiles[`${data[tileId].server}/${tileId}`] = data[tileId];
            }
        }

        // trigger the callback for every request
        for (const request of requests) {
            const reqDate = {};
            const { server } = request;

            // pull together the data per request
            for (const id of request.ids) {
                reqDate[id] = tiles[`${server}/${id}`];
            }

            request.done(reqDate);
        }
    });
}

/**
 * Retrieve a set of tiles from the server
 *
 * Plenty of room for optimization and caching here.
 *
 * @param server: A string with the server's url (e.g. "http://127.0.0.1")
 * @param tileIds: The ids of the tiles to fetch (e.g. asdf-sdfs-sdfs.0.0.0)
 */
const fetchTilesDebounced = throttleAndDebounce$1(fetchMultiRequestTiles, TILE_FETCH_DEBOUNCE, TILE_FETCH_DEBOUNCE);

/**
 * Calculate the zoom level from a list of available resolutions
 */
const calculateZoomLevelFromResolutions = (resolutions, scale) => {
    const sortedResolutions = resolutions.map(x => +x).sort((a, b) => b - a);

    const trackWidth = scale.range()[1] - scale.range()[0];

    const binsDisplayed = sortedResolutions.map(r => (scale.domain()[1] - scale.domain()[0]) / r);
    const binsPerPixel = binsDisplayed.map(b => b / trackWidth);

    // we're going to show the highest resolution that requires more than one
    // pixel per bin
    const displayableBinsPerPixel = binsPerPixel.filter(b => b < 1);

    if (displayableBinsPerPixel.length === 0) return 0;

    return binsPerPixel.indexOf(displayableBinsPerPixel[displayableBinsPerPixel.length - 1]);
};

const calculateResolution = (tilesetInfo, zoomLevel) => {
    if (tilesetInfo.resolutions) {
        const sortedResolutions = tilesetInfo.resolutions.map(x => +x).sort((a, b) => b - a);
        const resolution = sortedResolutions[zoomLevel];

        return resolution;
    }

    const maxWidth = tilesetInfo.max_width;
    const binsPerDimension = +tilesetInfo.bins_per_dimension;
    const resolution = maxWidth / (2 ** zoomLevel * binsPerDimension);

    return resolution;
};

/**
 * Calculate the current zoom level.
 */
const calculateZoomLevel = (scale, minX, maxX, binsPerTile) => {
    const rangeWidth = scale.range()[1] - scale.range()[0];

    const zoomScale = Math.max((maxX - minX) / (scale.domain()[1] - scale.domain()[0]), 1);

    const viewResolution = 384;
    // const viewResolution = 2048;

    // fun fact: the number 384 is halfway between 256 and 512
    const addedZoom = Math.max(0, Math.ceil(Math.log(rangeWidth / viewResolution) / Math.LN2));
    let zoomLevel = Math.round(Math.log(zoomScale) / Math.LN2) + addedZoom;

    let binsPerTileCorrection = 0;

    if (binsPerTile) {
        binsPerTileCorrection = Math.floor(Math.log(256) / Math.log(2) - Math.log(binsPerTile) / Math.log(2));
    }

    zoomLevel += binsPerTileCorrection;

    return zoomLevel;
};

/**
 * Calculate the element within this tile containing the given
 * position.
 *
 * Returns the tile position and position within the tile for
 * the given element.
 *
 * @param {object} tilesetInfo: The information about this tileset
 * @param {Number} maxDim: The maximum width of the dataset (only used for
 *        tilesets without resolutions)
 * @param {Number} dataStartPos: The position where the data begins
 * @param {int} zoomLevel: The current zoomLevel
 * @param {Number} position: The position (in absolute coordinates) to caculate
 *                 the tile and position in tile for
 */
function calculateTileAndPosInTile(tilesetInfo, maxDim, dataStartPos, zoomLevel, position) {
    let tileWidth = null;
    const PIXELS_PER_TILE = tilesetInfo.bins_per_dimension || 256;

    if (tilesetInfo.resolutions) {
        tileWidth = tilesetInfo.resolutions[zoomLevel] * PIXELS_PER_TILE;
    } else {
        tileWidth = maxDim / 2 ** zoomLevel;
    }

    const tilePos = Math.floor((position - dataStartPos) / tileWidth);
    const posInTile = Math.floor((PIXELS_PER_TILE * (position - tilePos * tileWidth)) / tileWidth);

    return [tilePos, posInTile];
}

/**
 * Calculate the tiles that should be visible get a data domain
 * and a tileset info
 *
 * All the parameters except the first should be present in the
 * tileset_info returned by the server.
 *
 * @param {number} zoomLevel - The zoom level at which to find the tiles (can be
 *   calculated using this.calcaulteZoomLevel, but needs to synchronized across
 *   both x and y scales so should be calculated externally)
 * @param {import('../type').Scale} scale - A d3 scale mapping data domain to visible values
 * @param {number} minX - The minimum possible value in the dataset
 * @param {number} maxX - The maximum possible value in the dataset
 * @param {number} maxZoom - The maximum zoom value in this dataset
 * @param {number} maxDim - The largest dimension of the tileset (e.g., width or height)
 *   (roughlty equal to 2 ** maxZoom * tileSize * tileResolution)
 * @returns {number[]} The indices of the tiles that should be visible
 */
const calculateTiles = (zoomLevel, scale, minX, maxX, maxZoom, maxDim) => {
    const zoomLevelFinal = Math.min(zoomLevel, maxZoom);

    // the ski areas are positioned according to their
    // cumulative widths, which means the tiles need to also
    // be calculated according to cumulative width

    const tileWidth = maxDim / 2 ** zoomLevelFinal;
    // console.log('maxDim:', maxDim);

    const epsilon = 0.0000001;

    /*
  console.log('minX:', minX, 'zoomLevel:', zoomLevel);
  console.log('domain:', scale.domain(), scale.domain()[0] - minX,
  ((scale.domain()[0] - minX) / tileWidth))
  */

    return range(
        Math.max(0, Math.floor((scale.domain()[0] - minX) / tileWidth)),
        Math.min(2 ** zoomLevelFinal, Math.ceil((scale.domain()[1] - minX - epsilon) / tileWidth))
    );
};

const calculateTileWidth = (tilesetInfo, zoomLevel, binsPerTile) => {
    if (tilesetInfo.resolutions) {
        const sortedResolutions = tilesetInfo.resolutions.map(x => +x).sort((a, b) => b - a);
        return sortedResolutions[zoomLevel] * binsPerTile;
    }
    return tilesetInfo.max_width / 2 ** zoomLevel;
};

/**
 * Calculate the tiles that sould be visisble given the resolution and
 * the minX and maxX values for the region
 *
 * @param {number} resolution - The number of base pairs per bin
 * @param {import('../type').Scale} scale - The scale to use to calculate the currently visible tiles
 * @param {number} minX - The minimum x position of the tileset
 * @param {number} maxX - The maximum x position of the tileset
 * @param {number=} pixelsPerTile - The number of pixels per tile
 * @returns {number[]} The indices of the tiles that should be visible
 */
const calculateTilesFromResolution = (resolution, scale, minX, maxX, pixelsPerTile) => {
    const epsilon = 0.0000001;
    const PIXELS_PER_TILE = pixelsPerTile || 256;
    const tileWidth = resolution * PIXELS_PER_TILE;
    const MAX_TILES = 20;
    // console.log('PIXELS_PER_TILE:', PIXELS_PER_TILE);

    if (!maxX) {
        maxX = Number.MAX_VALUE;
    }

    const lowerBound = Math.max(0, Math.floor((scale.domain()[0] - minX) / tileWidth));
    const upperBound = Math.ceil(Math.min(maxX, scale.domain()[1] - minX - epsilon) / tileWidth);
    let tileRange = range(lowerBound, upperBound);

    if (tileRange.length > MAX_TILES) {
        // too many tiles visible in this range
        console.warn(`Too many visible tiles: ${tileRange.length} truncating to ${MAX_TILES}`);
        tileRange = tileRange.slice(0, MAX_TILES);
    }
    // console.log('tileRange:', tileRange);

    return tileRange;
};

/**
 * Render 2D tile data. Convert the raw values to an array of
 * color values
 *
 * @param finished: A callback to let the caller know that the worker thread
 *   has converted tileData to pixData
 * @param minVisibleValue: The minimum visible value (used for setting the color
 *   scale)
 * @param maxVisibleValue: The maximum visible value
 * @param valueScaleType: Either 'log' or 'linear'
 * @param valueScaleDomain: The domain of the scale (the range is always [254,0])
 * @param colorScale: a 255 x 4 rgba array used as a color scale
 * @param synchronous: Render this tile synchronously or pass it on to the threadpool (which doesn't exist yet).
 * @param ignoreUpperRight: If this is a tile along the diagonal and there will
 * be mirrored tiles present ignore the upper right values
 * @param ignoreLowerLeft: If this is a tile along the diagonal and there will be
 * mirrored tiles present ignore the lower left values
 * @param {array} zeroValueColor: The color to use for rendering zero data values, [r, g, b, a].
 * @param {object} selectedRowsOptions Rendering options when using a `selectRows` track option.
 */
const tileDataToPixData = (
    tile,
    valueScaleType,
    valueScaleDomain,
    pseudocount,
    colorScale,
    finished,
    ignoreUpperRight,
    ignoreLowerLeft,
    zeroValueColor,
    selectedRowsOptions
) => {
    const { tileData } = tile;

    if (!tileData.dense) {
        // if we didn't get any data from the server, don't do anything
        finished(null);
        return;
    }

    if (
        tile.mirrored &&
        // Data is already copied over
        !tile.isMirrored &&
        tile.tileData.tilePos.length > 0 &&
        tile.tileData.tilePos[0] === tile.tileData.tilePos[1]
    ) {
        // Copy the data before mutating it in case the same data is used elsewhere.
        // During throttling/debouncing tile requests we also merge the requests so
        // the very same tile data might be used by different tracks.
        tile.tileData.dense = tile.tileData.dense.slice();

        // if a center tile is mirrored, we'll just add its transpose
        const tileWidth = Math.floor(Math.sqrt(tile.tileData.dense.length));
        for (let row = 0; row < tileWidth; row++) {
            for (let col = row + 1; col < tileWidth; col++) {
                tile.tileData.dense[row * tileWidth + col] = tile.tileData.dense[col * tileWidth + row];
            }
        }
        if (ignoreLowerLeft) {
            for (let row = 0; row < tileWidth; row++) {
                for (let col = 0; col < row; col++) {
                    tile.tileData.dense[row * tileWidth + col] = NaN;
                }
            }
        }
        tile.isMirrored = true;
    }

    // console.log('tile', tile);
    // clone the tileData so that the original array doesn't get neutered
    // when being passed to the worker script
    // const newTileData = tileData.dense;

    // comment this and uncomment the code afterwards to enable threading
    const pixData = workerSetPix(
        tileData.dense.length,
        tileData.dense,
        valueScaleType,
        valueScaleDomain,
        pseudocount,
        colorScale,
        ignoreUpperRight,
        ignoreLowerLeft,
        tile.tileData.shape,
        zeroValueColor,
        selectedRowsOptions
    );

    finished({ pixData });

    // const newTileData = new Float32Array(tileData.dense.length);
    // newTileData.set(tileData.dense);
    /*
  var params = {
    size: newTileData.length,
    data: newTileData,
    valueScaleType: valueScaleType,
    valueScaleDomain: valueScaleDomain,
    pseudocount: pseudocount,
    colorScale: colorScale
  };

  setPixPool.send(params, [ newTileData.buffer ])
    .promise()
    .then(returned => {
      finished(returned);
    })
    .catch(reason => {
      finished(null);
    });
  ;
  */
};

function fetchEither(url, callback, textOrJson, pubSub) {
    pubSub.publish('requestSent', url);

    let mime = null;
    if (textOrJson === 'text') {
        mime = null;
    } else if (textOrJson === 'json') {
        mime = 'application/json';
    } else {
        throw new Error(`fetch either "text" or "json", not "${textOrJson}"`);
    }
    const headers = {};

    if (mime) {
        headers['Content-Type'] = mime;
    }
    return fetch(url, { credentials: 'same-origin', headers })
        .then(rep => {
            if (!rep.ok) {
                throw Error(rep.statusText);
            }

            return rep[textOrJson]();
        })
        .then(content => {
            callback(undefined, content);
            return content;
        })
        .catch(error => {
            console.error(`Could not fetch ${url}`, error);
            callback(error, undefined);
            return error;
        })
        .finally(() => {
            pubSub.publish('requestReceived', url);
        });
}

/**
 * Send a text request and mark it so that we can tell how many are in flight
 *
 * @param url: URL to fetch
 * @param callback: Callback to execute with content from fetch
 */
function text(url, callback, pubSub) {
    return fetchEither(url, callback, 'text', pubSub);
}

/**
 * Send a JSON request and mark it so that we can tell how many are in flight
 *
 * @param url: URL to fetch
 * @param callback: Callback to execute with content from fetch
 */
async function json(url, callback, pubSub) {
    // Fritz: What is going on here? Can someone explain?
    if (url.indexOf('hg19') >= 0) {
        await timeout(1);
    }
    // console.log('url:', url);
    return fetchEither(url, callback, 'json', pubSub);
}

/**
 * Request a tilesetInfo for a track
 *
 * @param {string} server: The server where the data resides
 * @param {string} tilesetUid: The identifier for the dataset
 * @param {func} doneCb: A callback that gets called when the data is retrieved
 * @param {func} errorCb: A callback that gets called when there is an error
 */
const trackInfo = (server, tilesetUid, doneCb, errorCb, pubSub) => {
    const url = `${trimTrailingSlash(server)}/tileset_info/?d=${tilesetUid}&s=${sessionId}`;
    pubSub.publish('requestSent', url);
    // TODO: Is this used?
    json(
        url,
        (error, data) => {
            pubSub.publish('requestReceived', url);
            if (error) {
                // console.log('error:', error);
                // don't do anything
                // no tileset info just means we can't do anything with this file...
                if (errorCb) {
                    errorCb(`Error retrieving tilesetInfo from: ${server}`);
                } else {
                    console.warn('Error retrieving: ', url);
                }
            } else {
                // console.log('got data', data);
                doneCb(data);
            }
        },
        pubSub
    );
};

const api = {
    calculateResolution,
    calculateTileAndPosInTile,
    calculateTiles,
    calculateTilesFromResolution,
    calculateTileWidth,
    calculateZoomLevel,
    calculateZoomLevelFromResolutions,
    fetchTilesDebounced,
    json,
    text,
    tileDataToPixData,
    trackInfo
};

/** @typedef {import('../types').DataConfig} DataConfig */
/** @typedef {import('../types').TilesetInfo} TilesetInfo */
/**
 * @template T
 * @typedef {import('../types').AbstractDataFetcher<T>} AbstractDataFetcher
 */

/**
 * @typedef Tile
 * @property {number} min_value
 * @property {number} max_value
 * @property {DenseDataExtrema1D | DenseDataExtrema2D} denseDataExtrema
 * @property {number} minNonZero
 * @property {number} maxNonZero
 * @property {Array<number> | Float32Array} dense
 * @property {string} dtype
 * @property {string} server
 * @property {number[]} tilePos
 * @property {string} tilePositionId
 * @property {string} tilesetUid
 * @property {number} zoomLevel
 */

/** @typedef {Pick<Tile, 'zoomLevel' | 'tilePos' | 'tilePositionId'>} DividedTileA */
/** @typedef {Pick<Tile, 'zoomLevel' | 'tilePos' | 'tilePositionId' | 'dense' | 'denseDataExtrema' | 'minNonZero' | 'maxNonZero'>} DividedTileB */
/** @typedef {DividedTileA | DividedTileB} DividedTile */
/** @typedef {Omit<DataConfig, 'children'> & { children?: DataFetcher[], tilesetUid?: string, tilesetInfo: TilesetInfo }} ResolvedDataConfig */

/**
 * @template T
 * @param {Array<T>} x
 * @returns {x is [T, T]}
 */
function isTuple(x) {
    return x.length === 2;
}

/** @implements {AbstractDataFetcher<Tile | DividedTile>} */
class DataFetcher {
    /**
     * @param {import('../types').DataConfig} dataConfig
     * @param {import('pub-sub-es').PubSub} pubSub
     */
    constructor(dataConfig, pubSub) {
        /** @type {boolean} */
        this.tilesetInfoLoading = true;

        if (!dataConfig) {
            // Trevor: This should probably throw?
            console.error('No dataconfig provided');
            return;
        }

        // copy the dataConfig so that it doesn't dirty so that
        // it doesn't get modified when we make objects of its
        // children below
        /** @type {ResolvedDataConfig} */
        this.dataConfig = JSON.parse(JSON.stringify(dataConfig));
        /** @type {string} */
        this.uuid = slugid.nice();
        /** @type {import('pub-sub-es').PubSub} */
        this.pubSub = pubSub;

        if (dataConfig.children) {
            // convert each child into an object
            this.dataConfig.children = dataConfig.children.map(c => new DataFetcher(c, pubSub));
        }
    }

    /**
     * We don't a have a tilesetUid for this track. But we do have a url, filetype
     * and server. Using these, we can use the server to fullfill tile requests
     * from this dataset.
     *
     * @param {object} opts
     * @param {string} opts.server - The server api location (e.g. 'localhost:8000/api/v1')
     * @param {string} opts.url - The location of the data file (e.g. 'encode.org/my.file.bigwig')
     * @param {string} opts.filetype - The type of file being served (e.g. 'bigwig')
     * @param {string=} opts.coordSystem - The coordinate system being served (e.g. 'hg38')
     */
    async registerFileUrl({ server, url, filetype, coordSystem }) {
        const serverUrl = `${trimTrailingSlash(server)}/register_url/`;

        const payload = {
            fileurl: url,
            filetype,
            coordSystem
        };

        return fetch(serverUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        });
    }

    /**
     * Obtain tileset infos for all of the tilesets listed
     * @param {import('../types').HandleTilesetInfoFinished} finished - A callback that will be called
     */
    tilesetInfo(finished) {
        // if this track has a url, server and filetype
        // then we need to register those with the server
        const { server, url, filetype, coordSystem } = this.dataConfig;
        if (server && url && filetype) {
            return this.registerFileUrl({ server, url, filetype, coordSystem })
                .then(data => data.json())
                .then(data => {
                    this.dataConfig.tilesetUid = data.uid;
                    this.tilesetInfoAfterRegister(finished);
                })
                .catch(rejected => {
                    console.error('Error registering url', rejected);
                });
        }

        return new Promise(() => {
            this.tilesetInfoAfterRegister(finished);
        });
    }

    /**
     * Obtain tileset infos for all of the tilesets listed
     *
     * If there is more than one tileset info, this function
     * should (not currently implemented) check if the tileset
     * infos have the same dimensions and then return a common
     * one.
     *
     * @param {import('../types').HandleTilesetInfoFinished} finished - A callback that will be called
     *  when all tileset infos are loaded
     */
    tilesetInfoAfterRegister(finished) {
        if (!this.dataConfig.children) {
            // this data source has no children so we
            // just need to retrieve one tileset info
            const { server, tilesetUid } = this.dataConfig;
            if (!server || !tilesetUid) {
                console.warn('No dataConfig children, server or tilesetUid:', this.dataConfig);
                finished(null);
            } else {
                // pass in the callback
                trackInfo(
                    server,
                    tilesetUid,
                    (/** @type {Record<string, TilesetInfo>} */ tilesetInfo) => {
                        // tileset infos are indxed by by tilesetUids, we can just resolve
                        // that here before passing it back to the track
                        this.dataConfig.tilesetInfo = tilesetInfo[tilesetUid];
                        finished(tilesetInfo[tilesetUid], tilesetUid);
                    },
                    (/** @type {string} */ error) => {
                        this.tilesetInfoLoading = false;
                        finished({ error });
                    },
                    this.pubSub
                );
            }
        } else {
            // this data source has children, so we need to wait to get
            // all of their tileset infos in order to return them to the track
            const promises = this.dataConfig.children.map(
                x =>
                    /** @type {Promise<TilesetInfo>} */
                    new Promise(resolve => {
                        x.tilesetInfo(resolve);
                    })
            );

            Promise.all(promises).then(values => {
                // this is where we should check if all the children's tileset
                // infos match
                finished(values[0]);
            });
        }
    }

    /**
     * @param {string} tilesetUid - Uid of the tileset on the server
     * @param {string} tileId - The tileId of the tile
     * @returns {string} The full tile id that the server will parse.
     *
     * @example
     * ```javascript
     * // returns 'xyxx.0.0.0'
     * fullTileId('xyxx', '0.0.0');
     * ```
     */
    fullTileId(tilesetUid, tileId) {
        return `${tilesetUid}.${tileId}`;
    }

    /**
     * Fetch a set of tiles.
     *
     * Because the track shouldn't care about tileset ids, the tile ids
     * should just include positions and any necessary transforms.
     *
     * @param {(tiles: Record<string, DividedTile | Tile>) => void} receivedTiles - A function to call once the tiles have been fetched
     * @param {string[]} tileIds - The tile ids to fetch
     * @returns {Promise<Record<string, DividedTile | Tile>>}
     */
    fetchTilesDebounced(receivedTiles, tileIds) {
        if (this.dataConfig.type === 'horizontal-section') {
            return this.fetchHorizontalSection(receivedTiles, tileIds);
        }
        if (this.dataConfig.type === 'vertical-section') {
            return this.fetchHorizontalSection(receivedTiles, tileIds, true);
        }

        if (!this.dataConfig.children && this.dataConfig.tilesetUid) {
            // no children, just return the fetched tiles as is
            /** @type {Promise<Record<string, Tile>>} */
            const promise = new Promise(resolve => {
                fetchTilesDebounced(
                    {
                        id: slugid.nice(),
                        server: this.dataConfig.server,
                        done: resolve,
                        ids: tileIds.map(x => `${this.dataConfig.tilesetUid}.${x}`),
                        options: this.dataConfig.options
                    },
                    this.pubSub,
                    true
                );
            });

            return promise.then(returnedTiles => {
                const tilesetUid = dictValues(returnedTiles)[0].tilesetUid;
                /** @type {Record<string, Tile>} */
                const newTiles = {};

                for (const tileId of tileIds) {
                    const fullTileId = this.fullTileId(tilesetUid, tileId);

                    returnedTiles[fullTileId].tilePositionId = tileId;
                    newTiles[tileId] = returnedTiles[fullTileId];
                }
                receivedTiles(newTiles);
                return newTiles;
            });
        }

        // multiple child tracks, need to wait for all of them to
        // fetch their data before returning to the parent
        /** @type {Promise<Record<string, DividedTile | Tile>>[]} Tiles */
        const promises =
            this.dataConfig.children?.map(
                x =>
                    /** @type {Promise<Record<string, Tile | DividedTile>>} */
                    new Promise(resolve => {
                        x.fetchTilesDebounced(resolve, tileIds);
                    })
            ) ?? [];

        return Promise.all(promises).then(returnedTiles => {
            // if we're trying to divide two datasets,
            if (this.dataConfig.type === 'divided' && isTuple(returnedTiles)) {
                const newTiles = this.makeDivided(returnedTiles, tileIds);
                receivedTiles(newTiles);
                return newTiles;
            }
            // assume we're just returning raw tiles
            console.warn('Unimplemented dataConfig type. Returning first data source.', this.dataConfig);
            receivedTiles(returnedTiles[0]);
            return returnedTiles[0];
        });
    }

    /**
     * Return an array consisting of the division of the numerator
     * array by the denominator array
     *
     * @param {ArrayLike<number>} numeratorData - An array of numerical values
     * @param {ArrayLike<number>} denominatorData - An array of numerical values
     *
     * @returns {Float32Array} An array consisting of the division of the numerator by the denominator
     */
    divideData(numeratorData, denominatorData) {
        const result = new Float32Array(numeratorData.length);

        for (let i = 0; i < result.length; i++) {
            if (denominatorData[i] === 0.0) result[i] = NaN;
            else result[i] = numeratorData[i] / denominatorData[i];
        }

        return result;
    }

    /*
     * Take a horizontal slice across the returned tiles at the
     * given position.
     *
     * @param {list} returnedTiles: The tiles returned from a fetch request
     * @param {Number} sliceYPos: The y position across which to slice
     */
    horizontalSlice(/* returnedTiles, sliceYPos */) {
        return null;
    }

    /**
     * Extract a slice from a matrix at a given position.
     *
     * @param {Array<number>} inputData - An array containing a matrix stored row-wise
     * @param {Array<number>} arrayShape - The shape of the array, should be a
     *  two element array e.g. [256,256].
     * @param {number} sliceIndex - The index across which to take the slice
     * @param {number=} axis - The axis along which to take the slice
     * @returns {Array<number>} an array corresponding to a slice of this matrix
     */
    extractDataSlice(inputData, arrayShape, sliceIndex, axis) {
        if (!axis) {
            return inputData.slice(arrayShape[1] * sliceIndex, arrayShape[1] * (sliceIndex + 1));
        }

        const returnArray = new Array(arrayShape[1]);
        for (let i = sliceIndex; i < inputData.length; i += arrayShape[0]) {
            returnArray[Math.floor(i / arrayShape[0])] = inputData[i];
        }
        return returnArray;
    }

    /**
     * Fetch a horizontal section of a 2D dataset
     * @param {(tiles: Record<string, Tile>) => void} receivedTiles - A function to call once the tiles have been fetched
     * @param {string[]} tileIds - The tile ids to fetch
     * @param {boolean=} vertical - Whether to fetch a vertical section
     * @returns {Promise<Record<string, Tile>>}
     */
    fetchHorizontalSection(receivedTiles, tileIds, vertical = false) {
        // We want to take a horizontal section of a 2D dataset
        // that means that a 1D track is requesting data from a 2D source
        // because the 1D track only requests 1D tiles, we need to calculate
        // the 2D tile from which to take the slice
        /** @type {string[]} */
        const newTileIds = [];
        /** @type {boolean[]} */
        const mirrored = [];

        const { slicePos, tilesetInfo } = this.dataConfig;
        if (!slicePos || !tilesetInfo) {
            throw new Error('No slice position or tileset info');
        }

        for (const tileId of tileIds) {
            const parts = tileId.split('.');
            const zoomLevel = +parts[0];
            const xTilePos = +parts[1];

            // this is a dummy scale that we'll use to fetch tile positions
            // along the y-axis of the 2D dataset (we already have the x positions
            // from the track that is querying this data)
            const scale = scaleLinear().domain([slicePos, slicePos]);

            // there's two different ways of calculating tile positions
            // this needs to be consolidated into one function eventually
            let yTiles = [];

            if ('resolutions' in tilesetInfo) {
                const sortedResolutions = tilesetInfo.resolutions.map(x => +x).sort((a, b) => b - a);

                yTiles = calculateTilesFromResolution(
                    sortedResolutions[zoomLevel],
                    scale,
                    tilesetInfo.min_pos[vertical ? 1 : 0],
                    tilesetInfo.max_pos[vertical ? 1 : 0]
                );
            } else {
                yTiles = calculateTiles(
                    zoomLevel,
                    scale,
                    tilesetInfo.min_pos[vertical ? 1 : 0],
                    tilesetInfo.max_pos[vertical ? 1 : 0],
                    tilesetInfo.max_zoom,
                    tilesetInfo.max_width
                );
            }
            const sortedPosition = [xTilePos, yTiles[0]].sort((a, b) => a - b);

            // make note of whether we reversed the x and y tile positions
            if (sortedPosition[0] === xTilePos) {
                mirrored.push(false);
            } else {
                mirrored.push(true);
            }

            const newTileId = `${zoomLevel}.${sortedPosition[0]}.${sortedPosition[1]}`;
            newTileIds.push(newTileId);
            // we may need to add something about the data transform
        }

        // actually fetch the new tileIds
        const promise = new Promise(resolve => {
            fetchTilesDebounced(
                {
                    id: slugid.nice(),
                    server: this.dataConfig.server,
                    done: resolve,
                    ids: newTileIds.map(x => `${this.dataConfig.tilesetUid}.${x}`)
                },
                this.pubSub,
                true
            );
        });
        return promise.then(returnedTiles => {
            // we've received some new tiles, but they're 2D
            // we need to extract the row corresponding to the data we need

            const tilesetUid = dictValues(returnedTiles)[0].tilesetUid;
            // console.log('tilesetUid:', tilesetUid);
            /** @type {Record<string, Tile>} */
            const newTiles = {};

            for (let i = 0; i < newTileIds.length; i++) {
                const parts = newTileIds[i].split('.');
                const zoomLevel = +parts[0];
                const xTilePos = +parts[1];
                const yTilePos = +parts[2];

                const sliceIndex = calculateTileAndPosInTile(
                    tilesetInfo,
                    // @ts-expect-error - This is undefined for legacy tilesets, but
                    // `calculateTileAndPosInTile` ignores this argument with `resolutions`.
                    // We should probably refactor `calculateTileAndPosInTile` to just take
                    // the `tilesetInfo` object.
                    tilesetInfo.max_width,
                    tilesetInfo.min_pos[1],
                    zoomLevel,
                    +slicePos
                )[1];

                const fullTileId = this.fullTileId(tilesetUid, newTileIds[i]);
                const tile = returnedTiles[fullTileId];

                let dataSlice = null;

                if (xTilePos === yTilePos) {
                    // this is tile along the diagonal that we have to mirror
                    dataSlice = this.extractDataSlice(tile.dense, [256, 256], sliceIndex);
                    const mirroredDataSlice = this.extractDataSlice(tile.dense, [256, 256], sliceIndex, 1);
                    for (let j = 0; j < dataSlice.length; j++) {
                        dataSlice[j] += mirroredDataSlice[j];
                    }
                } else if (mirrored[i]) {
                    // this tile is in the upper right triangle but the data is only available for
                    // the lower left so we have to mirror it
                    dataSlice = this.extractDataSlice(tile.dense, [256, 256], sliceIndex, 1);
                } else {
                    dataSlice = this.extractDataSlice(tile.dense, [256, 256], sliceIndex);
                }

                const newTile = {
                    min_value: Math.min.apply(null, dataSlice),
                    max_value: Math.max.apply(null, dataSlice),
                    denseDataExtrema: new DenseDataExtrema1D(dataSlice),
                    minNonZero: minNonZero(dataSlice),
                    maxNonZero: maxNonZero(dataSlice),
                    dense: dataSlice,
                    dtype: tile.dtype,
                    server: tile.server,
                    tilePos: mirrored[i] ? [yTilePos] : [xTilePos],
                    tilePositionId: tileIds[i],
                    tilesetUid,
                    zoomLevel: tile.zoomLevel
                };

                newTiles[tileIds[i]] = newTile;
            }

            receivedTiles(newTiles);
            return newTiles;
        });
    }

    /**
     * @typedef {{ zoomLevel: number, tilePos: number[], dense?: ArrayLike<number> }} Dividable
     * @param {[Record<string, Dividable>, Record<string, Dividable>]} returnedTiles
     * @param {string[]} tileIds
     * @returns {Record<string, DividedTile>}
     */
    makeDivided(returnedTiles, tileIds) {
        if (returnedTiles.length < 2) {
            console.warn('Only one tileset specified for a divided datafetcher:', this.dataConfig);
        }

        /** @type {Record<string, DividedTile>} */
        const newTiles = {};

        for (const tileId of tileIds) {
            // const numeratorUid = this.fullTileId(numeratorTilesetUid, tileIds[i]);
            // const denominatorUid = this.fullTileId(denominatorTilesetUid, tileIds[i]);
            const zoomLevel = returnedTiles[0][tileId].zoomLevel;
            const tilePos = returnedTiles[0][tileId].tilePos;

            /** @type {DividedTile} */
            let newTile = {
                zoomLevel,
                tilePos,
                tilePositionId: tileId
            };

            const denseA = returnedTiles[0][tileId].dense;
            const denseB = returnedTiles[1][tileId].dense;

            if (denseA && denseB) {
                const newData = this.divideData(denseA, denseB);
                const dde = tilePos.length === 2 ? new DenseDataExtrema2D(newData) : new DenseDataExtrema1D(newData);

                newTile = {
                    dense: newData,
                    denseDataExtrema: dde,
                    minNonZero: minNonZero(newData),
                    maxNonZero: maxNonZero(newData),
                    zoomLevel,
                    tilePos,
                    tilePositionId: tileId
                };
            }

            // returned ids will be indexed by the tile id and won't include the
            // tileset uid
            newTiles[tileId] = newTile;
        }

        return newTiles;
    }
}

/**
 * Throttle and debounce a function call
 *
 * Throttling a function call means that the function is called at most every
 * `interval` milliseconds no matter how frequently you trigger a call.
 * Debouncing a function call means that the function is called the earliest
 * after `finalWait` milliseconds wait time where the function was not called.
 * Combining the two ensures that the function is called at most every
 * `interval` milliseconds and is ensured to be called with the very latest
 * arguments after after `finalWait` milliseconds wait time at the end.
 *
 * The following imaginary scenario describes the behavior:
 *
 * MS | interval=2 and finalWait=2
 * 01. y(f, 2, 2)(args_01) => f(args_01) call
 * 02. y(f, 2, 2)(args_02) => throttled call
 * 03. y(f, 2, 2)(args_03) => f(args_03) call
 * 04. y(f, 2, 2)(args_04) => throttled call
 * 05. y(f, 2, 2)(args_05) => f(args_05) call
 * 06. y(f, 2, 2)(args_06) => throttled call
 * 07. y(f, 2, 2)(args_07) => f(args_03) call
 * 08. y(f, 2, 2)(args_08) => throttled call
 * 09. nothing
 * 10. y(f, 2, 2)(args_10) => f(args_10) call from debouncing
 *
 * @template {any[]} Args
 * @param {(...args: Args) => void} func - Function to be throttled and debounced
 * @param {number} interval - Throttle intevals in milliseconds
 * @param {number} finalWait - Debounce wait time in milliseconds
 * @return {(request: unknown, ...args: Args) => void} - Throttled and debounced function
 */
const throttleAndDebounce = (func, interval, finalWait) => {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timeout;
    let blockedCalls = 0;

    const reset = () => {
        timeout = undefined;
    };

    /** @param {Args} args */
    const debounced = (...args) => {
        const later = () => {
            // Since we throttle and debounce we should check whether there were
            // actually multiple attempts to call this function after the most recent
            // throttled call. If there were no more calls we don't have to call
            // the function again.
            if (blockedCalls > 0) {
                func(...args);
                blockedCalls = 0;
            }
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, finalWait);
    };

    debounced.cancel = () => {
        clearTimeout(timeout);
        reset();
    };

    /** @param {Args} args */
    debounced.immediate = (...args) => {
        func(...args);
    };

    let wait = false;
    /**
     * @param {unknown} _request
     * @param {Args} args
     */
    const throttled = (_request, ...args) => {
        if (!wait) {
            func(...args);
            debounced(...args);

            wait = true;
            blockedCalls = 0;

            setTimeout(() => {
                wait = false;
            }, interval);
        } else {
            blockedCalls++;
        }
    };

    return throttled;
};

/** @typedef {[string, number]} ChromsizeRow */

/**
 * @typedef CumulativeChromsizeEntry
 * @property {number} id
 * @property {string} chr
 * @property {number} pos
 */

/**
 * @typedef ParsedChromsizes
 * @property {CumulativeChromsizeEntry[]} cumPositions
 * @property {Record<string, CumulativeChromsizeEntry>} chrPositions
 * @property {number} totalLength
 * @property {Record<string, number>} chromLengths
 */

/**
 * Parse an array of chromsizes, for example that result from reading rows of a chromsizes CSV file.
 *
 * @param {ArrayLike<ChromsizeRow>} data - Array of [chrName, chrLen] "tuples".
 * @returns {ParsedChromsizes}
 */
function parseChromsizesRows(data) {
    /** @type {Array<CumulativeChromsizeEntry>} */
    const cumValues = [];
    /** @type {Record<string, number>} */
    const chromLengths = {};
    /** @type {Record<string, CumulativeChromsizeEntry>} */
    const chrPositions = {};

    let totalLength = 0;

    for (let i = 0; i < data.length; i++) {
        const length = Number(data[i][1]);
        totalLength += length;

        const newValue = {
            id: i,
            chr: data[i][0],
            pos: totalLength - length
        };

        cumValues.push(newValue);
        chrPositions[newValue.chr] = newValue;
        chromLengths[data[i][0]] = length;
    }

    return {
        cumPositions: cumValues,
        chrPositions,
        totalLength,
        chromLengths
    };
}

/**
 * @template T
 * @typedef DataTask
 * @property {T} data
 * @property {(data: T) => void} handler
 * @property {string=} trackId
 */

/**
 * @typedef NullDataTask
 * @property {null} data
 * @property {() => void} handler
 * @property {string=} trackId
 */

/** @typedef {DataTask<any> | NullDataTask} Task */

/**
 * @param {Task} task
 * @return {task is NullDataTask}
 */
function isNullDataTask(task) {
    return task.data === null;
}

/**
 */
class BackgroundTaskScheduler {
    constructor() {
        /** @type {Task[]} */
        this.taskList = [];
        this.taskHandle = null;
        this.requestIdleCallbackTimeout = 300;
    }

    /**
     * @template T
     * @overload
     * @param {(data: T) => void} taskHandler
     * @param {T} taskData
     * @param {string | null=} trackId
     * @return {void}
     */
    /**
     * If `taskData` is `null` the `taskHandler` will eventaully be called without any arguments.
     *
     * @overload
     * @param {() => void} taskHandler
     * @param {null} taskData
     * @param {string | null=} trackId
     * @return {void}
     */
    /**
     * @param {(data: any) => void} taskHandler
     * @param {any} taskData
     * @param {string | null} trackId
     * @return {void}
     */
    enqueueTask(taskHandler, taskData, trackId = null) {
        if (trackId === null) {
            this.taskList.push({
                handler: taskHandler,
                data: taskData
            });
        } else {
            // If a trackId is given we delete all previous tasks in the taskList of the same track
            // We only want to rerender the latest version of a track
            this.taskList = this.taskList.filter(task => task.trackId !== trackId);

            this.taskList.push({
                handler: taskHandler,
                data: taskData,
                trackId
            });
        }

        if (!this.taskHandle) {
            this.taskHandle = requestIdleCallback(this.runTaskQueue.bind(this), {
                timeout: this.requestIdleCallbackTimeout
            });
        }
    }

    /**
     * @param {{ timeRemaining(): number, didTimeout: boolean }} deadline
     */
    runTaskQueue(deadline) {
        while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && this.taskList.length) {
            const task = this.taskList.shift();

            if (task && isNullDataTask(task)) {
                task.handler();
            } else if (task) {
                task.handler(task.data);
            }
        }

        if (this.taskList.length) {
            this.taskHandle = requestIdleCallback(this.runTaskQueue.bind(this), {
                timeout: this.requestIdleCallbackTimeout
            });
        } else {
            this.taskHandle = 0;
        }
    }
}

const backgroundTaskScheduler = new BackgroundTaskScheduler();

// @ts-nocheck

/**
 * Get a valueScale for a heatmap.
 *
 * If the scalingType isn't specified, then default to the defaultScaling.
 *
 * @param {string} scalingType: The type of the (e.g. 'linear', or 'log')
 * @param {number} minValue: The minimum data value to which this scale will apply
 * @param {number} pseudocount: A value to add to all numbers to prevent taking the log of 0
 * @param {number} maxValue: The maximum data value to which this scale will apply
 * @param {string} defaultScaling: The default scaling type to use in case
 * 'scalingType' is null (e.g. 'linear' or 'log')
 *
 * @returns {array} An array of [string, scale] containin the scale type
 *  and a scale with an appropriately set domain and range
 */
function getValueScale(scalingType, minValue, pseudocountIn, maxValue, defaultScaling) {
    const scalingTypeToUse = scalingType || defaultScaling;

    // purposely set to not equal pseudocountIn for now
    // eventually this will be an option
    const pseudocount = 0;

    if (scalingTypeToUse === 'log' && minValue > 0) {
        return [
            'log',
            scaleLog()
                .range([254, 0])
                .domain([minValue + pseudocount, maxValue + pseudocount])
        ];
    }

    return ['linear', scaleLinear().range([254, 0]).domain([minValue, maxValue])];
}

class TiledPixiTrack extends PixiTrack {
    /**
     * A track that must pull remote tiles
     *
     * @param (PIXI.scene) scene A PIXI.js scene to draw everything to.
     * @param (Object) dataConfig: A data source. Usually a
     *  ``{{server: 'x/api/v1/', tilesetUuid: 'y'}}`` Object.
     * @param {Object} handleTilesetInfoReceived: A callback to do something once once the tileset
     *  info is received. Usually it registers some information about the tileset with its
     * definition
     * @param {Object} options The track's options
     * @param {function} animate A function to redraw this track. Typically called when an
     *  asynchronous event occurs (i.e. tiles loaded)
     * @param {function} onValueScaleChanged The range of values has changed so we need to inform
     *  the higher ups that the value scale has changed. Only occurs on tracks with ``dense`` data.
     */
    constructor(context, options) {
        super(context, options);
        const { pubSub, dataConfig, handleTilesetInfoReceived, animate, onValueScaleChanged } = context;

        // keep track of which render we're on so that we save ourselves
        // rerendering all rendering in the same version will have the same
        // scaling so tiles rendered in the same version will have the same
        // output. Mostly useful for heatmap tiles.
        this.renderVersion = 1;

        // the tiles which should be visible (although they're not necessarily fetched)
        this.visibleTiles = new Set();
        this.visibleTileIds = new Set();

        // keep track of tiles that are currently being rendered
        this.renderingTiles = new Set();

        // the tiles we already have requests out for
        this.fetching = new Set();
        this.scale = {};

        // tiles we have fetched and ready to be rendered
        this.fetchedTiles = {};

        // the graphics that have already been drawn for this track
        this.tileGraphics = {};

        this.maxZoom = 0;
        this.medianVisibleValue = null;

        this.backgroundTaskScheduler = backgroundTaskScheduler;

        // If the browser supports requestIdleCallback we use continuous
        // instead of tile based scaling
        this.continuousScaling = 'requestIdleCallback' in window;

        this.valueScaleMin = null;
        this.fixedValueScaleMin = null;
        this.valueScaleMax = null;
        this.fixedValueScaleMax = null;

        this.listeners = {};

        this.pubSub = pubSub;
        this.animate = animate;
        this.onValueScaleChanged = onValueScaleChanged;

        // store the server and tileset uid so they can be used in draw()
        // if the tileset info is not found
        this.prevValueScale = null;

        if (!context.dataFetcher) {
            this.dataFetcher = new DataFetcher(dataConfig, this.pubSub);
        } else {
            this.dataFetcher = context.dataFetcher;
        }

        // To indicate that this track is requiring a tileset info
        this.tilesetInfo = null;
        this.uuid = slugid.nice();

        // this needs to be above the tilesetInfo() call because if that
        // executes first, the call to draw() will complain that this text
        // doesn't exist
        this.trackNotFoundText = new GLOBALS.PIXI.Text('', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: 'black'
        });

        this.pLabel.addChild(this.trackNotFoundText);

        this.refreshTilesDebounced = throttleAndDebounce(this.refreshTiles.bind(this), ZOOM_DEBOUNCE, ZOOM_DEBOUNCE);

        this.dataFetcher.tilesetInfo((tilesetInfo, tilesetUid) => {
            if (!tilesetInfo) return;

            this.tilesetInfo = tilesetInfo;
            // If the dataConfig contained a fileUrl, then
            // we need to update the tilesetUid based
            // on the registration of the fileUrl.
            if (!this.dataFetcher.dataConfig.tilesetUid) {
                this.dataFetcher.dataConfig.tilesetUid = tilesetUid;
            }

            this.tilesetUid = this.dataFetcher.dataConfig.tilesetUid;
            this.server = this.dataFetcher.dataConfig.server || 'unknown';

            if (this.tilesetInfo && this.tilesetInfo.chromsizes) {
                this.chromInfo = parseChromsizesRows(this.tilesetInfo.chromsizes);
            }

            if ('error' in this.tilesetInfo) {
                // no tileset info for this track
                console.warn('Error retrieving tilesetInfo:', dataConfig, this.tilesetInfo.error);

                // Fritz: Not sure why it's reset
                // this.trackNotFoundText = '';
                this.tilesetInfo = null;

                this.setError(this.tilesetInfo.error);
                return;
            }

            if (this.tilesetInfo.resolutions) {
                this.maxZoom = this.tilesetInfo.resolutions.length;
            } else {
                this.maxZoom = +this.tilesetInfo.max_zoom;
            }

            if (this.options && this.options.maxZoom) {
                if (this.options.maxZoom >= 0) {
                    this.maxZoom = Math.min(this.options.maxZoom, this.maxZoom);
                } else {
                    console.error('Invalid maxZoom on track:', this);
                }
            }

            this.refreshTiles();

            if (handleTilesetInfoReceived) handleTilesetInfoReceived(tilesetInfo);

            if (!this.options) this.options = {};

            this.options.name = this.options.name || tilesetInfo.name;

            this.checkValueScaleLimits();

            this.draw();
            this.drawLabel(); // draw the label so that the current resolution is displayed
            this.animate();
        });
    }

    setError(error) {
        this.errorTextText = error;
        this.draw();
        this.animate();
    }

    setFixedValueScaleMin(value) {
        if (!Number.isNaN(+value)) this.fixedValueScaleMin = +value;
        else this.fixedValueScaleMin = null;
    }

    setFixedValueScaleMax(value) {
        if (!Number.isNaN(+value)) this.fixedValueScaleMax = +value;
        else this.fixedValueScaleMax = null;
    }

    checkValueScaleLimits() {
        this.valueScaleMin = typeof this.options.valueScaleMin !== 'undefined' ? +this.options.valueScaleMin : null;

        if (this.fixedValueScaleMin !== null) {
            this.valueScaleMin = this.fixedValueScaleMin;
        }

        this.valueScaleMax = typeof this.options.valueScaleMax !== 'undefined' ? +this.options.valueScaleMax : null;

        if (this.fixedValueScaleMax !== null) {
            this.valueScaleMax = this.fixedValueScaleMax;
        }
    }

    /**
     * Register an event listener for track events. Currently, the only supported
     * event is ``dataChanged``.
     *
     * @param {string} event The event to listen for
     * @param {function} callback The callback to call when the event occurs. The
     *  parameters for the event depend on the event called.
     *
     * @example
     *
     *  trackObj.on('dataChanged', (newData) => {
     *   console.log('newData:', newData)
     *  });
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event].push(callback);
    }

    off(event, callback) {
        const id = this.listeners[event].indexOf(callback);
        if (id === -1 || id >= this.listeners[event].length) return;

        this.listeners[event].splice(id, 1);
    }

    rerender(options) {
        super.rerender(options);

        this.renderVersion += 1;

        if (!this.tilesetInfo) {
            return;
        }

        this.checkValueScaleLimits();

        if (this.tilesetInfo.resolutions) {
            this.maxZoom = this.tilesetInfo.resolutions.length;
        } else {
            this.maxZoom = +this.tilesetInfo.max_zoom;
        }

        if (this.options && this.options.maxZoom) {
            if (this.options.maxZoom >= 0) {
                this.maxZoom = Math.min(this.options.maxZoom, this.maxZoom);
            } else {
                console.error('Invalid maxZoom on track:', this);
            }
        }
    }

    /**
     * Return the set of ids of all tiles which are both visible and fetched.
     */
    visibleAndFetchedIds() {
        return Object.keys(this.fetchedTiles).filter(x => this.visibleTileIds.has(x));
    }

    visibleAndFetchedTiles() {
        return this.visibleAndFetchedIds().map(x => this.fetchedTiles[x]);
    }

    /**
     * Set which tiles are visible right now.
     *
     * @param tiles: A set of tiles which will be considered the currently visible
     * tile positions.
     */
    setVisibleTiles(tilePositions) {
        this.visibleTiles = tilePositions.map(x => ({
            tileId: this.tileToLocalId(x),
            remoteId: this.tileToRemoteId(x),
            mirrored: x.mirrored
        }));

        this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));
    }

    removeOldTiles() {
        this.calculateVisibleTiles();

        // tiles that are fetched
        const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));
        //
        // calculate which tiles are obsolete and remove them
        // fetchedTileID are remote ids
        const toRemove = [...fetchedTileIDs].filter(x => !this.visibleTileIds.has(x));

        this.removeTiles(toRemove);
    }

    refreshTiles() {
        if (!this.tilesetInfo) {
            return;
        }

        this.calculateVisibleTiles();

        // tiles that are fetched
        const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

        // fetch the tiles that should be visible but haven't been fetched
        // and aren't in the process of being fetched
        const toFetch = [...this.visibleTiles].filter(
            x => !this.fetching.has(x.remoteId) && !fetchedTileIDs.has(x.tileId)
        );

        for (const curFetch of toFetch) {
            this.fetching.add(curFetch.remoteId);
        }

        this.removeOldTiles();
        this.fetchNewTiles(toFetch);
    }

    parentInFetched(tile) {
        const uid = tile.tileData.tilesetUid;
        let zl = tile.tileData.zoomLevel;
        let pos = tile.tileData.tilePos;

        while (zl > 0) {
            zl -= 1;
            pos = pos.map(x => Math.floor(x / 2));

            const parentId = `${uid}.${zl}.${pos.join('.')}`;
            if (parentId in this.fetchedTiles) {
                return true;
            }
        }

        return false;
    }

    parentTileId(tile) {
        const parentZoomLevel = tile.tileData.zoomLevel - 1;
        const parentPos = tile.tileData.tilePos.map(x => Math.floor(x / 2));
        const parentUid = tile.tileData.tilesetUid;

        return `${parentUid}.${parentZoomLevel}.${parentPos.join('.')}`;
    }

    /**
     * Remove obsolete tiles
     *
     * @param toRemoveIds: An array of tile ids to remove from the list of fetched tiles.
     */
    removeTiles(toRemoveIds) {
        // if there's nothing to remove, don't bother doing anything
        if (!toRemoveIds.length || !this.areAllVisibleTilesLoaded() || this.renderingTiles.size) {
            return;
        }

        toRemoveIds.forEach(x => {
            const tileIdStr = x;
            this.destroyTile(this.fetchedTiles[tileIdStr]);

            if (tileIdStr in this.tileGraphics) {
                this.pMain.removeChild(this.tileGraphics[tileIdStr]);
                delete this.tileGraphics[tileIdStr];
            }

            delete this.fetchedTiles[tileIdStr];
        });

        this.synchronizeTilesAndGraphics();
        this.draw();
    }

    zoomed(newXScale, newYScale, k = 1, tx = 0) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.refreshTilesDebounced();

        this.pMobile.position.x = tx;
        this.pMobile.position.y = this.position[1];

        this.pMobile.scale.x = k;
        this.pMobile.scale.y = 1;
    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        // this.draw();
    }

    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        // this.draw();
    }

    /**
     * Check to see if all the visible tiles are loaded.
     *
     * If they are, remove all other tiles.
     */
    areAllVisibleTilesLoaded() {
        // tiles that are fetched
        const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

        const visibleTileIdsList = [...this.visibleTileIds];

        for (const tileId of visibleTileIdsList) {
            if (!fetchedTileIDs.has(tileId)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Function is called when all tiles that should be visible have
     * been received.
     */
    allTilesLoaded() {}

    minValue(_) {
        if (_) {
            this.scale.minValue = _;
            return this;
        }
        return this.valueScaleMin !== null ? this.valueScaleMin : this.scale.minValue;
    }

    maxValue(_) {
        if (_) {
            this.scale.maxValue = _;
            return this;
        }
        return this.valueScaleMax !== null ? this.valueScaleMax : this.scale.maxValue;
    }

    minRawValue() {
        // this is the minimum value from all the tiles that
        // hasn't been externally modified by locked scales
        return this.scale.minRawValue;
    }

    maxRawValue() {
        // this is the maximum value from all the tiles that
        // hasn't been externally modified by locked scales
        return this.scale.maxRawValue;
    }

    initTile(/* tile */) {
        // create the tile
        // should be overwritten by child classes
        this.scale.minRawValue = this.continuousScaling ? this.minVisibleValue() : this.minVisibleValueInTiles();
        this.scale.maxRawValue = this.continuousScaling ? this.maxVisibleValue() : this.maxVisibleValueInTiles();

        this.scale.minValue = this.scale.minRawValue;
        this.scale.maxValue = this.scale.maxRawValue;
    }

    updateTile(/* tile */) {}

    destroyTile(/* tile */) {
        // remove all data structures needed to draw this tile
    }

    addMissingGraphics() {
        /**
         * Add graphics for tiles that have no graphics
         */
        const fetchedTileIDs = Object.keys(this.fetchedTiles);
        this.renderVersion += 1;

        for (const tileId of fetchedTileIDs) {
            if (!(tileId in this.tileGraphics)) {
                // console.trace('adding:', fetchedTileIDs[i]);

                const newGraphics = new GLOBALS.PIXI.Graphics();
                this.pMain.addChild(newGraphics);

                this.fetchedTiles[tileId].graphics = newGraphics;
                this.initTile(this.fetchedTiles[tileId]);

                this.tileGraphics[tileId] = newGraphics;
            }
        }

        /*
        if (added)
            this.draw();
        */
    }

    /**
     * Change the graphics for existing tiles
     */
    updateExistingGraphics() {
        const fetchedTileIDs = Object.keys(this.fetchedTiles);

        for (const tileId of fetchedTileIDs) {
            const tile = this.fetchedTiles[tileId];

            this.updateTile(tile);
        }
    }

    synchronizeTilesAndGraphics() {
        /**
         * Make sure that we have a one to one mapping between tiles
         * and graphics objects
         *
         */

        // keep track of which tiles are visible at the moment
        this.addMissingGraphics();
        this.removeOldTiles();
        this.updateExistingGraphics();

        if (this.listeners.dataChanged) {
            for (const callback of this.listeners.dataChanged) {
                callback(this.visibleAndFetchedTiles().map(x => x.tileData));
            }
        }
    }

    loadTileData(tile, dataLoader) {
        /**
         * Extract drawable data from a tile loaded by a generic tile loader
         *
         * @param tile: A tile returned by a TiledArea.
         * @param dataLoader: A function for extracting drawable data from a tile. This
         *                    usually means differentiating the between dense and sparse
         *                    tiles and putting the data into an array.
         */

        // see if the data is already cached
        let loadedTileData = this.lruCache.get(tile.tileId);

        // if not, load it and put it in the cache
        if (!loadedTileData) {
            loadedTileData = dataLoader(tile.data, tile.type);
            this.lruCache.put(tile.tileId, loadedTileData);
        }

        return loadedTileData;
    }

    fetchNewTiles(toFetch) {
        if (toFetch.length > 0) {
            const toFetchList = [...new Set(toFetch.map(x => x.remoteId))];

            this.dataFetcher.fetchTilesDebounced(this.receivedTiles.bind(this), toFetchList);
        }
    }

    /**
     * We've gotten a bunch of tiles from the server in
     * response to a request from fetchTiles.
     */
    receivedTiles(loadedTiles) {
        for (const tileIdObj of this.visibleTiles) {
            const { tileId, remoteId } = tileIdObj;

            if (!loadedTiles[remoteId]) continue;

            if (remoteId in loadedTiles) {
                if (!(tileId in this.fetchedTiles)) {
                    // this tile may have graphics associated with it
                    this.fetchedTiles[tileId] = tileIdObj;
                }

                // Fritz: Store a shallow copy. If necessary we perform a deep copy of
                // the dense data in `tile-proxy.js :: tileDataToPixData()`
                // Somehow 2d rectangular domain tiles do not come in the flavor of an
                // object but an object array...
                if (Array.isArray(loadedTiles[remoteId])) {
                    const tileData = loadedTiles[remoteId];
                    this.fetchedTiles[tileId].tileData = [...tileData];
                    // Fritz: this is sooo hacky... we should really not use object arrays
                    Object.keys(tileData)
                        .filter(key => Number.isNaN(+key))
                        .forEach(key => {
                            this.fetchedTiles[tileId].tileData[key] = tileData[key];
                        });
                } else {
                    this.fetchedTiles[tileId].tileData = {
                        ...loadedTiles[remoteId]
                    };
                }

                if (this.fetchedTiles[tileId].tileData.error) {
                    console.warn('Error in loaded tile', tileId, this.fetchedTiles[tileId].tileData);
                }
            }
        }

        // const fetchedTileIDs = new Set(Object.keys(this.fetchedTiles));

        for (const key in loadedTiles) {
            if (loadedTiles[key]) {
                const tileId = loadedTiles[key].tilePositionId;

                if (this.fetching.has(tileId)) {
                    this.fetching.delete(tileId);
                }
            }
        }

        /*
         * Mainly called to remove old unnecessary tiles
         */
        this.synchronizeTilesAndGraphics();

        // we need to draw when we receive new data
        this.draw();
        this.drawLabel(); // update the current zoom level

        // Let HiGlass know we need to re-render
        // check if the value scale has changed
        if (this.valueScale) {
            if (
                !this.prevValueScale ||
                JSON.stringify(this.valueScale.domain()) !== JSON.stringify(this.prevValueScale.domain())
            ) {
                this.prevValueScale = this.valueScale.copy();

                if (this.onValueScaleChanged) {
                    // this is used to synchronize tracks with locked value scales
                    this.onValueScaleChanged();
                }
            }
        }

        this.animate();

        // 1. Check if all visible tiles are loaded
        // 2. If `true` then send out event
        if (this.areAllVisibleTilesLoaded()) {
            if (this.pubSub) {
                this.pubSub.publish('TiledPixiTrack.tilesLoaded', { uuid: this.uuid });
            }
        }
    }

    draw() {
        if (this.delayDrawing) return;

        if (!this.tilesetInfo) {
            if (this.dataFetcher.tilesetInfoLoading) {
                this.trackNotFoundText.text = 'Loading...';
            } else {
                this.trackNotFoundText.text = `Tileset info not found. Server: [${this.server}] tilesetUid: [${this.tilesetUid}]`;
            }

            [this.trackNotFoundText.x, this.trackNotFoundText.y] = this.position;

            if (this.flipText) {
                this.trackNotFoundText.anchor.x = 1;
                this.trackNotFoundText.scale.x = -1;
            }

            this.trackNotFoundText.visible = true;
        } else {
            this.trackNotFoundText.visible = false;
        }

        if (this.pubSub) {
            this.pubSub.publish('TiledPixiTrack.tilesDrawnStart', {
                uuid: this.uuid
            });
        }
        const errors = Object.values(this.fetchedTiles)
            .map(x => x.tileData && x.tileData.error && `${x.tileId}: ${x.tileData.error}`)
            .filter(x => x);

        if (errors.length) {
            this.errorTextText = errors.join('\n');
        } else {
            this.errorTextText = '';
        }

        super.draw();

        Object.keys(this.fetchedTiles).forEach(tilesetUid => {
            this.drawTile(this.fetchedTiles[tilesetUid]);
        });
        // console.log('errors:', errors);

        if (this.pubSub) {
            this.pubSub.publish('TiledPixiTrack.tilesDrawnEnd', { uuid: this.uuid });
        }
    }

    /**
     * Draw a tile on some graphics
     */
    drawTile(/* tileData, graphics */) {}

    calculateMedianVisibleValue() {
        if (this.areAllVisibleTilesLoaded()) {
            this.allTilesLoaded();
        }

        let visibleAndFetchedIds = this.visibleAndFetchedIds();

        if (visibleAndFetchedIds.length === 0) {
            visibleAndFetchedIds = Object.keys(this.fetchedTiles);
        }

        const values = []
            .concat(
                ...visibleAndFetchedIds
                    .filter(x => this.fetchedTiles[x].tileData.dense)
                    .map(x => Array.from(this.fetchedTiles[x].tileData.dense))
            )
            .filter(x => x > 0);

        this.medianVisibleValue = median(values);
        return this.medianVisibleValue;
    }

    allVisibleValues() {
        return [].concat(...this.visibleAndFetchedIds().map(x => Array.from(this.fetchedTiles[x].tileData.dense)));
    }

    // Should be overwriten by child clases to get the true minimal
    // visible value in the currently viewed area
    minVisibleValue(ignoreFixedScale = false) {
        return this.minVisibleValueInTiles(ignoreFixedScale);
    }

    minVisibleValueInTiles(ignoreFixedScale = false) {
        // Get minimum in currently visible tiles
        let visibleAndFetchedIds = this.visibleAndFetchedIds();

        if (visibleAndFetchedIds.length === 0) {
            visibleAndFetchedIds = Object.keys(this.fetchedTiles);
        }

        let min = Math.min(...visibleAndFetchedIds.map(x => this.fetchedTiles[x].tileData.minNonZero));

        // if there's no data, use null
        if (min === Number.MAX_SAFE_INTEGER) {
            min = null;
        }

        if (ignoreFixedScale) return min;

        return this.valueScaleMin !== null ? this.valueScaleMin : min;
    }

    // Should be overwriten by child clases to get the true maximal
    // visible value in the currently viewed area
    maxVisibleValue(ignoreFixedScale = false) {
        return this.maxVisibleValueInTiles(ignoreFixedScale);
    }

    maxVisibleValueInTiles(ignoreFixedScale = false) {
        // Get maximum in currently visible tiles
        let visibleAndFetchedIds = this.visibleAndFetchedIds();

        if (visibleAndFetchedIds.length === 0) {
            visibleAndFetchedIds = Object.keys(this.fetchedTiles);
        }

        let max = Math.max(...visibleAndFetchedIds.map(x => this.fetchedTiles[x].tileData.maxNonZero));

        // if there's no data, use null
        if (max === Number.MIN_SAFE_INTEGER) {
            max = null;
        }

        if (ignoreFixedScale) return max;

        return this.valueScaleMax !== null ? this.valueScaleMax : max;
    }

    makeValueScale(minValue, medianValue, maxValue, inMargin) {
        /*
         * Create a value scale that will be used to position values
         * along the y axis.
         *
         * Parameters
         * ----------
         *  minValue: number
         *    The minimum value of the data
         *  medianValue: number
         *    The median value of the data. Potentially used for adding
         *    a pseudocount
         *  maxValue: number
         *    The maximum value of the data
         *  margin: number
         *    A number of pixels to be left free on the top and bottom
         *    of the track. For example if the glyphs have a certain
         *    width and we want all of them to fit into the space.
         *
         * Returns
         * -------
         *  valueScale: d3.scale
         *      A d3 value scale
         */
        let valueScale = null;
        let offsetValue = 0;

        let margin = inMargin;

        if (margin === null || typeof margin === 'undefined') {
            margin = 6; // set a default value
        }

        let minDimension = Math.min(this.dimensions[1] - margin, margin);
        let maxDimension = Math.max(this.dimensions[1] - margin, margin);

        if (this.dimensions[1] - margin < margin) {
            // if the track becomes smaller than the margins, then just draw a flat
            // line in the center
            minDimension = this.dimensions[1] / 2;
            maxDimension = this.dimensions[1] / 2;
        }

        if (this.options.valueScaling === 'log') {
            offsetValue = medianValue;

            if (!offsetValue) {
                offsetValue = minValue;
            }

            valueScale = scaleLog()
                // .base(Math.E)
                .domain([offsetValue, maxValue + offsetValue])
                // .domain([offsetValue, this.maxValue()])
                .range([minDimension, maxDimension]);

            // pseudocount = offsetValue;
        } else if (this.options.valueScaling === 'quantile') {
            const start = this.dimensions[1] - margin;
            const end = margin;
            const quantScale = scaleQuantile()
                .domain(this.allVisibleValues())
                .range(range(start, end, (end - start) / 256));
            quantScale.ticks = n => ticks(start, end, n);

            return [quantScale, 0];
        } else if (this.options.valueScaling === 'setquantile') {
            const start = this.dimensions[1] - margin;
            const end = margin;
            const s = new Set(this.allVisibleValues());
            const quantScale = scaleQuantile()
                .domain([...s])
                .range(range(start, end, (end - start) / 256));
            quantScale.ticks = n => ticks(start, end, n);

            return [quantScale, 0];
        } else {
            // linear scale
            valueScale = scaleLinear().domain([minValue, maxValue]).range([maxDimension, minDimension]);
        }

        return [valueScale, offsetValue];
    }
}

// @ts-nocheck

class SVGTrack extends Track {
    constructor(context, options) {
        super(context, options);
        const { svgElement } = context;
        /**
         * Create a new SVG track. It will contain a g element
         * that maintains all of its element.
         */
        this.gMain = select(svgElement).append('g');
        this.clipUid = slugid.nice();

        this.clipRect = this.gMain.append('clipPath').attr('id', `track-bounds-${this.clipUid}`).append('rect');

        this.gMain.attr('clip-path', `url(#track-bounds-${this.clipUid})`);
    }

    setPosition(newPosition) {
        this.position = newPosition;

        this.gMain.attr('transform', `translate(${this.position[0]},${this.position[1]})`);
        this.draw();
    }

    setDimensions(newDimensions) {
        this.dimensions = newDimensions;

        this._xScale.range([0, this.dimensions[0]]);
        this._yScale.range([0, this.dimensions[1]]);

        if (newDimensions[0] >= 0 && newDimensions[1] >= 0) {
            this.clipRect.attr('width', newDimensions[0]);
            this.clipRect.attr('height', newDimensions[1]);
        } else {
            this.clipRect.attr('width', 0);
            this.clipRect.attr('height', 0);
        }

        this.draw();
    }

    remove() {
        this.gMain.remove();
        this.gMain = null;
    }

    draw() {
        return this;
    }
}

// @ts-nocheck

class ViewportTrackerHorizontal extends SVGTrack {
    constructor(context, options) {
        // create a clipped SVG Path
        super(context, options);
        const { registerViewportChanged, removeViewportChanged, setDomainsCallback } = context;

        const uid = slugid.nice();
        this.uid = uid;
        this.options = options;

        // Is there actually a linked _from_ view? Or is this projection "independent"?
        this.hasFromView = !context.projectionXDomain;

        this.removeViewportChanged = removeViewportChanged;
        this.setDomainsCallback = setDomainsCallback;

        this.viewportXDomain = this.hasFromView ? null : context.projectionXDomain;
        this.viewportYDomain = this.hasFromView ? null : [0, 0];

        this.brush = brushX().on('brush', this.brushed.bind(this));

        this.gBrush = this.gMain.append('g').attr('id', `brush-${this.uid}`).call(this.brush);

        // turn off the ability to select new regions for this brush
        this.gBrush.selectAll('.overlay').style('pointer-events', 'none');

        // turn off the ability to modify the aspect ratio of the brush
        this.gBrush.selectAll('.handle--ne').style('pointer-events', 'none');

        this.gBrush.selectAll('.handle--nw').style('pointer-events', 'none');

        this.gBrush.selectAll('.handle--sw').style('pointer-events', 'none');

        this.gBrush.selectAll('.handle--se').style('pointer-events', 'none');

        this.gBrush.selectAll('.handle--n').style('pointer-events', 'none');

        this.gBrush.selectAll('.handle--s').style('pointer-events', 'none');

        // the viewport will call this.viewportChanged immediately upon
        // hearing registerViewportChanged
        registerViewportChanged(uid, this.viewportChanged.bind(this));

        this.rerender();
        this.draw();
    }

    brushed(event) {
        /**
         * Should only be called  on active brushing, not in response to the
         * draw event
         */
        const s = event.selection;

        if (!this._xScale || !this._yScale) {
            return;
        }

        const xDomain = [this._xScale.invert(s[0]), this._xScale.invert(s[1])];

        const yDomain = this.viewportYDomain;

        if (!this.hasFromView) {
            this.viewportXDomain = xDomain;
        }

        // console.log('xDomain:', xDomain);
        // console.log('yDomain:', yDomain);

        this.setDomainsCallback(xDomain, yDomain);
    }

    viewportChanged(viewportXScale, viewportYScale) {
        // console.log('viewport changed:', viewportXScale.domain());
        const viewportXDomain = viewportXScale.domain();
        const viewportYDomain = viewportYScale.domain();

        this.viewportXDomain = viewportXDomain;
        this.viewportYDomain = viewportYDomain;

        this.draw();
    }

    remove() {
        // remove the event handler that updates this viewport tracker
        this.removeViewportChanged(this.uid);

        super.remove();
    }

    rerender() {
        // set the fill and stroke colors
        this.gBrush
            .selectAll('.selection')
            .attr('fill', this.options.projectionFillColor)
            .attr('stroke', this.options.projectionStrokeColor)
            .attr('fill-opacity', this.options.projectionFillOpacity)
            .attr('stroke-opacity', this.options.projectionStrokeOpacity)
            .attr('stroke-width', this.options.strokeWidth);
    }

    draw() {
        if (!this._xScale || !this.yScale) {
            return;
        }

        if (!this.viewportXDomain || !this.viewportYDomain) {
            return;
        }

        const x0 = this._xScale(this.viewportXDomain[0]);
        const x1 = this._xScale(this.viewportXDomain[1]);

        const dest = [x0, x1];

        // console.log('dest:', dest[0], dest[1]);

        // user hasn't actively brushed so we don't want to emit a
        // 'brushed' event
        this.brush.on('brush', null);
        this.gBrush.call(this.brush.move, dest);
        this.brush.on('brush', this.brushed.bind(this));
    }

    zoomed(newXScale, newYScale) {
        this.xScale(newXScale);
        this.yScale(newYScale);

        this.draw();
    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        this.draw();
    }

    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        const xRange = this._xScale.range();
        const yRange = this._yScale.range();
        const xDiff = xRange[1] - xRange[0];

        this.brush.extent([
            [xRange[0] - xDiff, yRange[0]],
            [xRange[1] + xDiff, yRange[1]]
        ]);
        this.gBrush.call(this.brush);

        this.draw();
    }
}

/**
 * Convert a regular color value (e.g. 'red', '#FF0000', 'rgb(255,0,0)') to a
 * RGBA array, with support for the value "transparent".
 *
 * @param {string} colorValue - An RGB(A) color value to convert.
 * @return {[r: number, g: number, b: number, a: number]} An RGBA array.
 */
const colorToRgba = colorValue => {
    if (colorValue === 'transparent') {
        return [255, 255, 255, 0];
    }
    /** @type {import('d3-color').RGBColor} */
    // @ts-expect-error - FIXME: `color` can return many different types
    // depending on the string input. We should probably use a different
    // the more strict `rgb` function instead?
    const c = color(colorValue);
    return [c.r, c.g, c.b, 255];
};

const chromInfoBisector = bisector((/** @type {{ pos: number }} */ d) => d.pos).left;

/**
 * @template {string} Name
 * @typedef {[name: Name, pos: number, offset: number, insertPoint: number ]} ChromosomePosition
 */

/**
 * Convert an absolute genome position to a chromosome position.
 * @template {string} Name
 * @param {number} absPosition - Absolute genome position.
 * @param {import('../types').ChromInfo<Name>} chromInfo - Chromosome info object.
 * @return {ChromosomePosition<Name> | null} The chromosome position.
 */
const absToChr = (absPosition, chromInfo) => {
    if (!chromInfo || !chromInfo.cumPositions || !chromInfo.cumPositions.length) {
        return null;
    }

    let insertPoint = chromInfoBisector(chromInfo.cumPositions, absPosition);
    const lastChr = chromInfo.cumPositions[chromInfo.cumPositions.length - 1].chr;
    const lastLength = chromInfo.chromLengths[lastChr];

    if (insertPoint > 0) {
        insertPoint -= 1;
    }

    let chrPosition = Math.floor(absPosition - chromInfo.cumPositions[insertPoint].pos);
    let offset = 0;

    if (chrPosition < 0) {
        // before the start of the genome
        offset = chrPosition - 1;
        chrPosition = 1;
    }

    if (insertPoint === chromInfo.cumPositions.length - 1 && chrPosition > lastLength) {
        // beyond the last chromosome
        offset = chrPosition - lastLength;
        chrPosition = lastLength;
    }

    return [chromInfo.cumPositions[insertPoint].chr, chrPosition, offset, insertPoint];
};

// @ts-nocheck

/**
 * Convert a color domain to a 255 element array of [r,g,b,a]
 * values (all from 0 to 255). The last color (255) will always be
 * transparent
 */
const colorDomainToRgbaArray = (colorRange, noTansparent = false) => {
    // we should always have at least two values in the color range
    const domain = colorRange.map((x, i) => i * (255 / (colorRange.length - 1)));

    const d3Scale = scaleLinear().domain(domain).range(colorRange);

    const fromX = noTansparent ? 255 : 254;

    const rgbaArray = range(fromX, -1, -1)
        .map(d3Scale)
        .map(x => {
            const r = rgb(x);
            return [r.r, r.g, r.b, r.opacity * 255];
        });

    // add a transparent color at the end for missing values and, more
    // importantly, non-existing values such as the empty upper right or lower
    // left triangle of tiles on the diagonal.
    if (rgbaArray.length < 256) rgbaArray.push([255, 255, 255, 0]);

    return rgbaArray;
};

/**
 * Download a file to the user's computer.
 * @param {string} filename - Name of the file to download
 * @param {string | Blob} stringOrBlob - Contents of the file to download
 */
function download(filename, stringOrBlob) {
    // yanked from here
    // https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server

    const blob =
        typeof stringOrBlob === 'string'
            ? new Blob([stringOrBlob], { type: 'application/octet-stream' })
            : stringOrBlob;
    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
    URL.revokeObjectURL(elem.href);
}

// @ts-nocheck
const ndarrayAssign = (target, source) => {
    const numSource = +source;
    const isScalar = !Number.isNaN(numSource);

    if (isScalar) {
        if (target.dimension === 1) {
            for (let i = 0; i < target.shape[0]; ++i) {
                target.set(i, numSource);
            }
        } else {
            for (let i = 0; i < target.shape[0]; ++i) {
                for (let j = 0; j < target.shape[1]; ++j) {
                    target.set(i, j, numSource);
                }
            }
        }
    } else {
        const ty = target.shape[0];
        const tx = target.shape[1];
        const sy = source.shape[0];
        const sx = source.shape[1];

        if (ty !== sy || tx !== sx) {
            console.warn('Cannot assign source to target ndarray as the dimensions do not match', ty, sy, tx, sx);
            return;
        }

        if (target.dimension === 1) {
            for (let i = 0; i < target.shape[0]; ++i) {
                target.set(i, source.get(i));
            }
        } else {
            for (let i = 0; i < target.shape[0]; ++i) {
                for (let j = 0; j < target.shape[1]; ++j) {
                    target.set(i, j, source.get(i, j));
                }
            }
        }
    }
};

// @ts-nocheck
const ndarrayToList = arr => {
    const size = arr.shape.reduce((s, x) => s * x, 1);
    const list = new Array(size);

    if (arr.dimension === 1) {
        let l = 0;
        for (let i = 0; i < arr.shape[0]; ++i) {
            list[l] = arr.get(i);
            l++;
        }
    } else {
        let l = 0;
        for (let i = 0; i < arr.shape[0]; ++i) {
            for (let j = 0; j < arr.shape[1]; ++j) {
                list[l] = arr.get(i, j);
                l++;
            }
        }
    }

    return list;
};

// @ts-nocheck

const ndarrayFlatten = arr => {
    if (arr.shape.length === 1) return arr;

    return ndarray(ndarrayToList(arr));
};

/**
 * Exposed map function. You can do cool stuff with that!
 *
 * @description
 * The pure map function is more powerful because it can be used on data types
 * other than Array too.
 *
 * @template T, B
 * @param {(item: T, idx?: number) => B} f - Mapping function.
 * @return {(x: Array<T>) => Array<B>} Mapped array.
 */
// @ts-expect-error - TS can't infer the type of the returned function.
const map = f => x => Array.prototype.map.call(x, f);

// @ts-nocheck

/**
 * Convert an object into array which entries are the prop values of the object
 *
 * @param {Object} obj - Object to be arrayified
 * @return {Array} Array of the object.
 */
const objVals = obj => map(key => obj[key])(Object.keys(obj));

/**
 * Convert a HEX string into a HEX integer.
 *
 * @example
 * ```js
 * // returns 16711680
 * hexStrToInt("#FF0000");
 * ```
 *
 * @param {string} str - HEX string
 * @return {number} An (integer) HEX number
 */
const hexStrToInt = str => parseInt(str.replace(/^#/, ''), 16);

const COLOR = 0xaaaaaa;
const ALPHA = 1.0;

/**
 * @typedef MouseTrackOptions
 * @property {string=} mousePositionColor - Color of the mouse position.
 * @property {number=} mousePositionAlpha - Alpha of the mouse position.
 */

/**
 * Actual interface for initializing to show the mouse location
 *
 * @param {import('pub-sub-es').PubSub} pubSub - PubSub service.
 * @param {Array<import('pub-sub-es').Subscription>} pubSubs - Subscribed PubSub events.
 * @param {MouseTrackOptions} options - Track options.
 * @param {() => [import('../types').Scale, import('../types').Scale]} getScales - Getter for the track's X and Y scales.
 * @param {() => [number, number]} getPosition - Getter for the track's position.
 * @param {() => [number, number]} getDimensions - Getter for the track's dimensions.
 * @param {() => boolean} getIsFlipped - Getter determining if a track has been
 *   flipped from horizontal to vertical.
 * @param {boolean} is2d - If `true` draw both dimensions of the mouse location.
 * @param {boolean} isGlobal - If `true` local and global events will trigger
 *   the mouse position drawing.
 * @return {import('pixi.js').Graphics} - PIXI graphics the mouse location is drawn on.
 */
const showMousePosition = (
    pubSub,
    pubSubs,
    options,
    getScales,
    getPosition,
    getDimensions,
    getIsFlipped,
    is2d,
    isGlobal
) => {
    pubSub.publish('app.animateOnMouseMove', true);

    const color = options.mousePositionColor ? hexStrToInt(options.mousePositionColor) : COLOR;

    const alpha = options.mousePositionAlpha || ALPHA;

    // Graphics for cursor position
    const graphics = new GLOBALS.PIXI.Graphics();

    // This clears the mouse position graphics, i.e., the mouse position will not
    // be visible afterwards.
    const clearGraphics = () => {
        graphics.clear();
    };

    /**
     * Draw 1D mouse location (cross) hair onto the PIXI graphics.
     *
     * @param {number} mousePos - One dimension of the mouse location (integer).
     * @param {boolean=} isHorizontal - If `true` the dimension to be drawn is
     *   horizontal.
     * @param  {boolean=}   isNoClear  If `true` do not clear the graphics.
     * @return {void}
     */
    const drawMousePosition = (mousePos, isHorizontal, isNoClear) => {
        if (!isNoClear) clearGraphics();

        graphics.lineStyle(1, color, alpha);

        if (isHorizontal) {
            const addition = is2d ? getPosition()[0] : 0;
            graphics.moveTo(0, mousePos);
            graphics.lineTo(getDimensions()[0] + addition, mousePos);
        } else {
            const addition = is2d ? getPosition()[1] : 0;
            graphics.moveTo(mousePos, 0);
            graphics.lineTo(mousePos, getDimensions()[1] + addition);
        }
    };

    /**
     * @typedef NoHoveredTracksEvent
     * @property {true} noHoveredTracks - If `true` no tracks are hovered.
     * @property {false=} isFromVerticalTrack - If `true` the event is from a vertical track.
     */

    /**
     * @typedef TrackEvent
     * @property {false=} noHoveredTracks - If `true` no tracks are hovered.
     * @property {boolean} isFromVerticalTrack - If `true` the event is from a vertical track.
     * @property {boolean} isFrom2dTrack - If `true` the event is from a 2D track.
     * @property {number} dataY - Y position of the mouse.
     * @property {number} dataX - X position of the mouse.
     */

    /**
     * Mouse move handler
     *
     * @param {Event & (NoHoveredTracksEvent | TrackEvent)} event - Event object.
     */
    const mouseMoveHandler = event => {
        if (event.noHoveredTracks) {
            clearGraphics();
            return graphics;
        }

        let x;
        let y;
        if (event.isFromVerticalTrack) {
            x = event.dataY;
            y = event.dataY;
        } else {
            x = event.dataX;
            y = event.isFrom2dTrack ? event.dataY : event.dataX;
        }

        // 2d or central tracks are not offset and rather rely on a mask, i.e., the
        // top left *visible* position is *not* [0,0] but given by `getPosition()`.
        const offset = is2d ? getPosition() : [0, 0];

        // `getIsFlipped()` is `true` when a horizontal track has been flipped by 90
        // degree, i.e., is a vertical track.
        const mousePos = getIsFlipped() ? getScales()[0](y) + offset[1] : getScales()[0](x) + offset[0];

        drawMousePosition(mousePos);

        // Also draw the second dimension
        if (is2d) drawMousePosition(getScales()[1](y) + offset[1], true, true);

        return graphics;
    };

    pubSubs.push(pubSub.subscribe('app.mouseMove', mouseMoveHandler));
    pubSubs.push(pubSub.subscribe('app.mouseLeave', clearGraphics));
    pubSubs.push(pubSub.subscribe('blur', clearGraphics));

    if (isGlobal) {
        pubSubs.push(globalPubSub.subscribe('higlass.mouseMove', mouseMoveHandler));
    }

    return graphics;
};

/**
 * @typedef ClassContext
 * @property {import('pixi.js').Container=} pForeground
 * @property {import('pixi.js').Container=} pMasked
 * @property {import('pixi.js').Container=} pMain
 * @property {() => import('../types').Scale} xScale
 * @property {() => import('../types').Scale} yScale
 * @property {() => [number, number]} getPosition
 * @property {() => [number, number]} getDimensions
 * @property {import('pub-sub-es').PubSub} pubSub
 * @property {Array<import('pub-sub-es').Subscription>} pubSubs
 * @property {(prop: 'flipText') => () => boolean} getProp
 * @property {{}} options
 */

/**
 * Public API for showing the mouse location.
 *
 * @description
 * This is just a convenience wrapper to avoid code duplication.
 * `showMousePosition` is the actual function and could be called from within
 * each class as well.
 *
 * @param {ClassContext} context - Class context, i.e., `this`.
 * @param {Boolean} is2d - If `true` both dimensions of the mouse location
 *   should be shown. E.g., on a central track.
 * @param {Boolean} isGlobal - If `true` local and global events will trigger
 *   the mouse position drawing.
 * @return {Function} - Method to remove graphics showing the mouse location.
 */
const setupShowMousePosition = (context, is2d = false, isGlobal = false) => {
    const scene = is2d ? context.pMasked : context.pForeground || context.pMain;
    if (!scene) {
        throw new Error(
            'setupShowMousePosition: No scene found. Please make sure to call this method after the scene has been initialized.'
        );
    }
    /** @type {() => [import('../types').Scale, import('../types').Scale]} */
    const getScales = () => [context.xScale(), context.yScale()];

    const graphics = showMousePosition(
        context.pubSub,
        context.pubSubs,
        context.options,
        getScales,
        context.getPosition.bind(context),
        context.getDimensions.bind(context),
        context.getProp('flipText'),
        is2d,
        isGlobal
    );

    scene.addChild(graphics);

    return () => {
        scene.removeChild(graphics);
    };
};

/**
 * Factory function for a value to RGB color converter
 *
 * @template T
 * @param {(value: number) => number} valueScale - Value scaling function.
 * @param {Array<T>} colorScale - Color scale array.
 * @param {number} pseudoCounts - Pseudo counts used as a pseudocount to prevent taking the log of 0.
 * @param {number} eps - Epsilon.
 * @return {(value: number) => T} RGB color array.
 */
const valueToColor =
    (valueScale, colorScale, pseudoCounts = 0, eps = 0.000001) =>
    value => {
        let rgbIdx = 255;

        if (value > eps) {
            // values less than espilon are considered NaNs and made transparent
            // (rgbIdx 255)
            rgbIdx = Math.max(0, Math.min(255, Math.floor(valueScale(value + pseudoCounts))));
        }

        return colorScale[rgbIdx];
    };

// @ts-nocheck

const THEME_DARK = Symbol('Dark theme');

// @ts-nocheck

const TICK_HEIGHT = 40;
const TICK_MARGIN = 0;
const TICK_LENGTH = 5;
const TICK_LABEL_MARGIN = 4;

class AxisPixi {
    constructor(track) {
        this.pAxis = new GLOBALS.PIXI.Graphics();
        this.track = track;

        this.axisTexts = [];
        this.axisTextFontFamily = 'Arial';
        this.axisTextFontSize = 10;
    }

    startAxis(axisHeight) {
        const graphics = this.pAxis;

        graphics.clear();
        graphics.lineStyle(1, this.track.getTheme() === THEME_DARK ? colorToHex('#ffffff') : 0x000000, 1);

        // draw the axis line
        graphics.moveTo(0, 0);
        graphics.lineTo(0, axisHeight);
    }

    createAxisTexts(valueScale, axisHeight) {
        this.tickValues = this.calculateAxisTickValues(valueScale, axisHeight);
        let i = 0;

        const color = this.track.getTheme() === THEME_DARK ? 'white' : 'black';

        if (
            !this.track.options ||
            !this.track.options.axisLabelFormatting ||
            this.track.options.axisLabelFormatting === 'scientific'
        ) {
            this.tickFormat = format('.2');
        } else {
            this.tickFormat = x => x;
        }

        while (i < this.tickValues.length) {
            const tick = this.tickValues[i];

            while (this.axisTexts.length <= i) {
                const newText = new GLOBALS.PIXI.Text(tick, {
                    fontSize: `${this.axisTextFontSize}px`,
                    fontFamily: this.axisTextFontFamily,
                    fill: color
                });
                this.axisTexts.push(newText);

                this.pAxis.addChild(newText);
            }

            this.axisTexts[i].text = this.tickFormat(tick);
            this.axisTexts[i].anchor.y = 0.5;
            this.axisTexts[i].anchor.x = 0.5;
            i++;
        }

        while (this.axisTexts.length > this.tickValues.length) {
            const lastText = this.axisTexts.pop();
            this.pAxis.removeChild(lastText);
            lastText.destroy(true);
        }
    }

    calculateAxisTickValues(valueScale, axisHeight) {
        const tickCount = Math.max(Math.ceil(axisHeight / TICK_HEIGHT), 1);

        // create scale ticks but not all the way to the top
        // tick values have not been formatted here
        let tickValues = valueScale.ticks(tickCount);

        if (tickValues.length < 1) {
            tickValues = valueScale.ticks(tickCount + 1);

            if (tickValues.length > 1) {
                // sometimes the ticks function will return 0 and then 2
                // if it didn't return enough previously, we probably only want a single
                // tick
                tickValues = [tickValues[0]];
            }
        }

        return tickValues;
    }

    drawAxisLeft(valueScale, axisHeight) {
        // Draw a left-oriented axis (ticks pointing to the right)
        this.startAxis(axisHeight);
        this.createAxisTexts(valueScale, axisHeight);

        const graphics = this.pAxis;

        if (this.track.getTheme() === THEME_DARK) {
            graphics.lineStyle(graphics.lineWidth || graphics._lineStyle.width, colorToHex('#ffffff'));
        }

        // draw the top, potentially unlabelled, ticke
        graphics.moveTo(0, 0);
        graphics.lineTo(-(TICK_MARGIN + TICK_LENGTH), 0);

        graphics.moveTo(0, axisHeight);
        graphics.lineTo(-(TICK_MARGIN + TICK_LENGTH), axisHeight);

        for (let i = 0; i < this.axisTexts.length; i++) {
            const tick = this.tickValues[i];

            // draw ticks to the left of the axis
            this.axisTexts[i].x = -(TICK_MARGIN + TICK_LENGTH + TICK_LABEL_MARGIN + this.axisTexts[i].width / 2);
            this.axisTexts[i].y = valueScale(tick);

            graphics.moveTo(-TICK_MARGIN, valueScale(tick));
            graphics.lineTo(-(TICK_MARGIN + TICK_LENGTH), valueScale(tick));

            if (this.track && this.track.flipText) {
                this.axisTexts[i].scale.x = -1;
            }
        }

        this.hideOverlappingAxisLabels();
    }

    drawAxisRight(valueScale, axisHeight) {
        // Draw a right-oriented axis (ticks pointint to the left)
        this.startAxis(axisHeight);
        this.createAxisTexts(valueScale, axisHeight);

        const graphics = this.pAxis;

        if (this.track.getTheme() === THEME_DARK) {
            graphics.lineStyle(graphics.lineWidth || graphics._lineStyle.width, colorToHex('#ffffff'));
        }

        // draw the top, potentially unlabelled, ticke
        graphics.moveTo(0, 0);
        graphics.lineTo(TICK_MARGIN + TICK_LENGTH, 0);

        graphics.moveTo(0, axisHeight);
        graphics.lineTo(TICK_MARGIN + TICK_LENGTH, axisHeight);

        for (let i = 0; i < this.axisTexts.length; i++) {
            const tick = this.tickValues[i];

            this.axisTexts[i].x = TICK_MARGIN + TICK_LENGTH + TICK_LABEL_MARGIN + this.axisTexts[i].width / 2;
            this.axisTexts[i].y = valueScale(tick);

            graphics.moveTo(TICK_MARGIN, valueScale(tick));
            graphics.lineTo(TICK_MARGIN + TICK_LENGTH, valueScale(tick));

            if (this.track && this.track.flipText) {
                this.axisTexts[i].scale.x = -1;
            }
        }

        this.hideOverlappingAxisLabels();
    }

    hideOverlappingAxisLabels() {
        // show all tick marks initially
        for (let i = this.axisTexts.length - 1; i >= 0; i--) {
            this.axisTexts[i].visible = true;
        }

        for (let i = this.axisTexts.length - 1; i >= 0; i--) {
            // if this tick mark is invisible, it's not going to
            // overlap with any others
            if (!this.axisTexts[i].visible) {
                continue;
            }

            let j = i - 1;

            while (j >= 0) {
                // go through and hide all overlapping tick marks
                if (
                    this.axisTexts[i].y + this.axisTexts[i].height / 2 >
                    this.axisTexts[j].y - this.axisTexts[j].height / 2
                ) {
                    this.axisTexts[j].visible = false;
                } else {
                    // because the tick marks are ordered from top to bottom, if this
                    // one doesn't overlap, then the ones below it won't either, so
                    // we can stop looking
                    break;
                }

                j -= 1;
            }
        }
    }

    exportVerticalAxis(axisHeight) {
        const gAxis = document.createElement('g');
        gAxis.setAttribute('class', 'axis-vertical');

        let stroke = 'black';

        if (this.track && this.track.options.lineStrokeColor) {
            stroke = this.track.options.lineStrokeColor;
        }
        // TODO: On the canvas, there is no vertical line beside the scale,
        // but it also has the draggable control to the right.
        // Confirm that this difference between SVG and Canvas is intentional,
        // and if not, remove this.
        if (this.track.getTheme() === THEME_DARK) stroke = '#cccccc';

        const line = document.createElement('path');

        line.setAttribute('fill', 'transparent');
        line.setAttribute('stroke', stroke);
        line.setAttribute('id', 'axis-line');

        line.setAttribute('d', `M0,0 L0,${axisHeight}`);

        gAxis.appendChild(line);

        return gAxis;
    }

    createAxisSVGLine() {
        // factor out the styling for axis lines
        let stroke = 'black';

        if (this.track && this.track.options.lineStrokeColor) {
            stroke = this.track.options.lineStrokeColor;
        }

        if (this.track.getTheme() === THEME_DARK) stroke = '#cccccc';

        const line = document.createElement('path');
        line.setAttribute('id', 'tick-mark');
        line.setAttribute('fill', 'transparent');
        line.setAttribute('stroke', stroke);

        return line;
    }

    createAxisSVGText(text) {
        // factor out the creation of axis texts
        const t = document.createElement('text');

        t.innerHTML = text;
        t.setAttribute('id', 'axis-text');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-family', this.axisTextFontFamily);
        t.setAttribute('font-size', this.axisTextFontSize);
        t.setAttribute('dy', this.axisTextFontSize / 2 - 2);

        return t;
    }

    exportAxisLeftSVG(valueScale, axisHeight) {
        const gAxis = this.exportVerticalAxis(axisHeight);

        const topTickLine = this.createAxisSVGLine();
        gAxis.appendChild(topTickLine);
        topTickLine.setAttribute('d', `M0,0 L${+(TICK_MARGIN + TICK_LENGTH)},0`);

        const bottomTickLine = this.createAxisSVGLine();
        gAxis.appendChild(bottomTickLine);
        bottomTickLine.setAttribute('d', `M0,${axisHeight} L${+(TICK_MARGIN + TICK_LENGTH)},${axisHeight}`);

        for (let i = 0; i < this.axisTexts.length; i++) {
            const tick = this.tickValues[i];
            const text = this.axisTexts[i];

            const tickLine = this.createAxisSVGLine();

            gAxis.appendChild(tickLine);

            tickLine.setAttribute(
                'd',
                `M${+TICK_MARGIN},${valueScale(tick)} L${+(TICK_MARGIN + TICK_LENGTH)},${valueScale(tick)}`
            );

            const g = document.createElement('g');
            gAxis.appendChild(g);
            if (text.visible) {
                const t = this.createAxisSVGText(text.text);
                g.appendChild(t);
            }

            g.setAttribute(
                'transform',
                `translate(${text.position.x},${text.position.y})
             scale(${text.scale.x},${text.scale.y})`
            );
        }

        return gAxis;
    }

    exportAxisRightSVG(valueScale, axisHeight) {
        const gAxis = this.exportVerticalAxis(axisHeight);

        const topTickLine = this.createAxisSVGLine();
        gAxis.appendChild(topTickLine);
        topTickLine.setAttribute('d', `M0,0 L${-(TICK_MARGIN + TICK_LENGTH)},0`);

        const bottomTickLine = this.createAxisSVGLine();
        gAxis.appendChild(bottomTickLine);
        bottomTickLine.setAttribute('d', `M0,${axisHeight} L${-(TICK_MARGIN + TICK_LENGTH)},${axisHeight}`);

        for (let i = 0; i < this.axisTexts.length; i++) {
            const tick = this.tickValues[i];
            const text = this.axisTexts[i];

            const tickLine = this.createAxisSVGLine();

            gAxis.appendChild(tickLine);

            tickLine.setAttribute(
                'd',
                `M${-TICK_MARGIN},${valueScale(tick)} L${-(TICK_MARGIN + TICK_LENGTH)},${valueScale(tick)}`
            );

            const g = document.createElement('g');
            gAxis.appendChild(g);

            if (text.visible) {
                const t = this.createAxisSVGText(text.text);
                g.appendChild(t);
            }

            g.setAttribute(
                'transform',
                `translate(${text.position.x},${text.position.y})
             scale(${text.scale.x},${text.scale.y})`
            );
        }

        return gAxis;
    }

    clearAxis() {
        const graphics = this.pAxis;
        while (this.axisTexts.length) {
            const axisText = this.axisTexts.pop();
            graphics.removeChild(axisText);
        }

        graphics.clear();
    }
}

// @ts-nocheck
const HEATED_OBJECT_MAP = [
    [0, 0, 0, 255],
    [35, 0, 0, 255],
    [52, 0, 0, 255],
    [60, 0, 0, 255],
    [63, 1, 0, 255],
    [64, 2, 0, 255],
    [68, 5, 0, 255],
    [69, 6, 0, 255],
    [72, 8, 0, 255],
    [74, 10, 0, 255],
    [77, 12, 0, 255],
    [78, 14, 0, 255],
    [81, 16, 0, 255],
    [83, 17, 0, 255],
    [85, 19, 0, 255],
    [86, 20, 0, 255],
    [89, 22, 0, 255],
    [91, 24, 0, 255],
    [92, 25, 0, 255],
    [94, 26, 0, 255],
    [95, 28, 0, 255],
    [98, 30, 0, 255],
    [100, 31, 0, 255],
    [102, 33, 0, 255],
    [103, 34, 0, 255],
    [105, 35, 0, 255],
    [106, 36, 0, 255],
    [108, 38, 0, 255],
    [109, 39, 0, 255],
    [111, 40, 0, 255],
    [112, 42, 0, 255],
    [114, 43, 0, 255],
    [115, 44, 0, 255],
    [117, 45, 0, 255],
    [119, 47, 0, 255],
    [119, 47, 0, 255],
    [120, 48, 0, 255],
    [122, 49, 0, 255],
    [123, 51, 0, 255],
    [125, 52, 0, 255],
    [125, 52, 0, 255],
    [126, 53, 0, 255],
    [128, 54, 0, 255],
    [129, 56, 0, 255],
    [129, 56, 0, 255],
    [131, 57, 0, 255],
    [132, 58, 0, 255],
    [134, 59, 0, 255],
    [134, 59, 0, 255],
    [136, 61, 0, 255],
    [137, 62, 0, 255],
    [137, 62, 0, 255],
    [139, 63, 0, 255],
    [139, 63, 0, 255],
    [140, 65, 0, 255],
    [142, 66, 0, 255],
    [142, 66, 0, 255],
    [143, 67, 0, 255],
    [143, 67, 0, 255],
    [145, 68, 0, 255],
    [145, 68, 0, 255],
    [146, 70, 0, 255],
    [146, 70, 0, 255],
    [148, 71, 0, 255],
    [148, 71, 0, 255],
    [149, 72, 0, 255],
    [149, 72, 0, 255],
    [151, 73, 0, 255],
    [151, 73, 0, 255],
    [153, 75, 0, 255],
    [153, 75, 0, 255],
    [154, 76, 0, 255],
    [154, 76, 0, 255],
    [154, 76, 0, 255],
    [156, 77, 0, 255],
    [156, 77, 0, 255],
    [157, 79, 0, 255],
    [157, 79, 0, 255],
    [159, 80, 0, 255],
    [159, 80, 0, 255],
    [159, 80, 0, 255],
    [160, 81, 0, 255],
    [160, 81, 0, 255],
    [162, 82, 0, 255],
    [162, 82, 0, 255],
    [163, 84, 0, 255],
    [163, 84, 0, 255],
    [165, 85, 0, 255],
    [165, 85, 0, 255],
    [166, 86, 0, 255],
    [166, 86, 0, 255],
    [166, 86, 0, 255],
    [168, 87, 0, 255],
    [168, 87, 0, 255],
    [170, 89, 0, 255],
    [170, 89, 0, 255],
    [171, 90, 0, 255],
    [171, 90, 0, 255],
    [173, 91, 0, 255],
    [173, 91, 0, 255],
    [174, 93, 0, 255],
    [174, 93, 0, 255],
    [176, 94, 0, 255],
    [176, 94, 0, 255],
    [177, 95, 0, 255],
    [177, 95, 0, 255],
    [179, 96, 0, 255],
    [179, 96, 0, 255],
    [180, 98, 0, 255],
    [182, 99, 0, 255],
    [182, 99, 0, 255],
    [183, 100, 0, 255],
    [183, 100, 0, 255],
    [185, 102, 0, 255],
    [185, 102, 0, 255],
    [187, 103, 0, 255],
    [187, 103, 0, 255],
    [188, 104, 0, 255],
    [188, 104, 0, 255],
    [190, 105, 0, 255],
    [191, 107, 0, 255],
    [191, 107, 0, 255],
    [193, 108, 0, 255],
    [193, 108, 0, 255],
    [194, 109, 0, 255],
    [196, 110, 0, 255],
    [196, 110, 0, 255],
    [197, 112, 0, 255],
    [197, 112, 0, 255],
    [199, 113, 0, 255],
    [200, 114, 0, 255],
    [200, 114, 0, 255],
    [202, 116, 0, 255],
    [202, 116, 0, 255],
    [204, 117, 0, 255],
    [205, 118, 0, 255],
    [205, 118, 0, 255],
    [207, 119, 0, 255],
    [208, 121, 0, 255],
    [208, 121, 0, 255],
    [210, 122, 0, 255],
    [211, 123, 0, 255],
    [211, 123, 0, 255],
    [213, 124, 0, 255],
    [214, 126, 0, 255],
    [214, 126, 0, 255],
    [216, 127, 0, 255],
    [217, 128, 0, 255],
    [217, 128, 0, 255],
    [219, 130, 0, 255],
    [221, 131, 0, 255],
    [221, 131, 0, 255],
    [222, 132, 0, 255],
    [224, 133, 0, 255],
    [224, 133, 0, 255],
    [225, 135, 0, 255],
    [227, 136, 0, 255],
    [227, 136, 0, 255],
    [228, 137, 0, 255],
    [230, 138, 0, 255],
    [230, 138, 0, 255],
    [231, 140, 0, 255],
    [233, 141, 0, 255],
    [233, 141, 0, 255],
    [234, 142, 0, 255],
    [236, 144, 0, 255],
    [236, 144, 0, 255],
    [238, 145, 0, 255],
    [239, 146, 0, 255],
    [241, 147, 0, 255],
    [241, 147, 0, 255],
    [242, 149, 0, 255],
    [244, 150, 0, 255],
    [244, 150, 0, 255],
    [245, 151, 0, 255],
    [247, 153, 0, 255],
    [247, 153, 0, 255],
    [248, 154, 0, 255],
    [250, 155, 0, 255],
    [251, 156, 0, 255],
    [251, 156, 0, 255],
    [253, 158, 0, 255],
    [255, 159, 0, 255],
    [255, 159, 0, 255],
    [255, 160, 0, 255],
    [255, 161, 0, 255],
    [255, 163, 0, 255],
    [255, 163, 0, 255],
    [255, 164, 0, 255],
    [255, 165, 0, 255],
    [255, 167, 0, 255],
    [255, 167, 0, 255],
    [255, 168, 0, 255],
    [255, 169, 0, 255],
    [255, 169, 0, 255],
    [255, 170, 0, 255],
    [255, 172, 0, 255],
    [255, 173, 0, 255],
    [255, 173, 0, 255],
    [255, 174, 0, 255],
    [255, 175, 0, 255],
    [255, 177, 0, 255],
    [255, 178, 0, 255],
    [255, 179, 0, 255],
    [255, 181, 0, 255],
    [255, 181, 0, 255],
    [255, 182, 0, 255],
    [255, 183, 0, 255],
    [255, 184, 0, 255],
    [255, 187, 7, 255],
    [255, 188, 10, 255],
    [255, 189, 14, 255],
    [255, 191, 18, 255],
    [255, 192, 21, 255],
    [255, 193, 25, 255],
    [255, 195, 29, 255],
    [255, 197, 36, 255],
    [255, 198, 40, 255],
    [255, 200, 43, 255],
    [255, 202, 51, 255],
    [255, 204, 54, 255],
    [255, 206, 61, 255],
    [255, 207, 65, 255],
    [255, 210, 72, 255],
    [255, 211, 76, 255],
    [255, 214, 83, 255],
    [255, 216, 91, 255],
    [255, 219, 98, 255],
    [255, 221, 105, 255],
    [255, 223, 109, 255],
    [255, 225, 116, 255],
    [255, 228, 123, 255],
    [255, 232, 134, 255],
    [255, 234, 142, 255],
    [255, 237, 149, 255],
    [255, 239, 156, 255],
    [255, 240, 160, 255],
    [255, 243, 167, 255],
    [255, 246, 174, 255],
    [255, 248, 182, 255],
    [255, 249, 185, 255],
    [255, 252, 193, 255],
    [255, 253, 196, 255],
    [255, 255, 204, 255],
    [255, 255, 207, 255],
    [255, 255, 211, 255],
    [255, 255, 218, 255],
    [255, 255, 222, 255],
    [255, 255, 225, 255],
    [255, 255, 229, 255],
    [255, 255, 233, 255],
    [255, 255, 236, 255],
    [255, 255, 240, 255],
    [255, 255, 244, 255],
    [255, 255, 247, 255],
    [255, 255, 255, 0]
];

// @ts-nocheck

const COLORBAR_MAX_HEIGHT = 200;
const COLORBAR_WIDTH = 10;
const COLORBAR_LABELS_WIDTH = 40;
const COLORBAR_MARGIN = 10;
const BRUSH_WIDTH = COLORBAR_MARGIN;
const BRUSH_HEIGHT = 4;
const BRUSH_COLORBAR_GAP = 1;
const BRUSH_MARGIN = 4;
const SCALE_LIMIT_PRECISION = 5;
const BINS_PER_TILE = 256;
const COLORBAR_AREA_WIDTH =
    COLORBAR_WIDTH + COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN + BRUSH_COLORBAR_GAP + BRUSH_WIDTH + BRUSH_MARGIN;

class HeatmapTiledPixiTrack extends TiledPixiTrack {
    constructor(context, options) {
        // Fritz: this smells very hacky!
        const newContext = { ...context };
        newContext.onValueScaleChanged = () => {
            context.onValueScaleChanged();
            this.drawColorbar();
        };
        super(newContext, options);
        const {
            pubSub,
            animate,
            svgElement,
            onTrackOptionsChanged,
            onMouseMoveZoom,
            isShowGlobalMousePosition,
            isValueScaleLocked
        } = context;

        this.pubSub = pubSub;
        this.is2d = true;
        this.animate = animate;
        this.uid = slugid.nice();
        this.scaleBrush = brushY();

        this.onTrackOptionsChanged = onTrackOptionsChanged;
        this.isShowGlobalMousePosition = isShowGlobalMousePosition;

        this.isValueScaleLocked = isValueScaleLocked;

        // Graphics for drawing the colorbar
        this.pColorbarArea = new GLOBALS.PIXI.Graphics();
        this.pMasked.addChild(this.pColorbarArea);

        this.pColorbar = new GLOBALS.PIXI.Graphics();
        this.pColorbarArea.addChild(this.pColorbar);

        this.axis = new AxisPixi(this);
        this.pColorbarArea.addChild(this.axis.pAxis);

        // [[255,255,255,0], [237,218,10,4] ...
        // a 256 element array mapping the values 0-255 to rgba values
        // not a d3 color scale for speed
        this.colorScale = HEATED_OBJECT_MAP;

        if (options && options.colorRange) {
            this.colorScale = colorDomainToRgbaArray(options.colorRange);
        }

        this.gBase = select(svgElement).append('g');
        this.gMain = this.gBase.append('g');
        this.gColorscaleBrush = this.gMain.append('g');

        this.brushing = false;
        this.prevOptions = '';

        // Contains information about which part of the upper left tile is visible
        this.prevIndUpperLeftTile = '';

        /*
    chromInfoService
      .get(`${dataConfig.server}/chrom-sizes/?id=${dataConfig.tilesetUid}`)
      .then((chromInfo) => { this.chromInfo = chromInfo; });
    */

        this.onMouseMoveZoom = onMouseMoveZoom;
        this.setDataLensSize(11);
        this.dataLens = new Float32Array(this.dataLensSize ** 2);

        this.mouseMoveHandlerBound = this.mouseMoveHandler.bind(this);

        if (this.onMouseMoveZoom) {
            this.pubSubs.push(this.pubSub.subscribe('app.mouseMove', this.mouseMoveHandlerBound));
        }

        if (this.options && this.options.showMousePosition && !this.hideMousePosition) {
            this.hideMousePosition = setupShowMousePosition(this, this.is2d, this.isShowGlobalMousePosition());
        }

        this.prevOptions = JSON.stringify(options);
    }

    /**
     * Mouse move handler
     *
     * @param  {Object}  e  Event object.
     */
    mouseMoveHandler(e) {
        if (!this.isWithin(e.x, e.y)) return;

        this.mouseX = e.x;
        this.mouseY = e.y;

        this.mouseMoveZoomHandler();
    }

    /**
     * Mouse move and zoom handler. Is triggered on both events.
     *
     * @param  {Number}  absX  Absolute X coordinate.
     * @param  {Number}  absY  Absolute Y coordinate
     */
    mouseMoveZoomHandler(absX = this.mouseX, absY = this.mouseY) {
        if (typeof absX === 'undefined' || typeof absY === 'undefined' || !this.areAllVisibleTilesLoaded()) return;

        if (!this.tilesetInfo) {
            return;
        }

        const relX = absX - this.position[0];
        const relY = absY - this.position[1];

        let data;
        let dataLens;
        try {
            dataLens = this.getVisibleRectangleData(
                relX - this.dataLensPadding,
                relY - this.dataLensPadding,
                this.dataLensSize,
                this.dataLensSize
            );
            // The center value
            data = dataLens.get(this.dataLensPadding, this.dataLensPadding);
        } catch {
            return;
        }

        const dim = this.dataLensSize;

        let toRgb;
        try {
            toRgb = valueToColor(this.limitedValueScale, this.colorScale, this.valueScale.domain()[0]);
        } catch {
            return;
        }

        if (!toRgb) return;

        const dataX = Math.round(this._xScale.invert(relX));
        const dataY = Math.round(this._yScale.invert(relY));

        let center = [dataX, dataY];
        let xRange = [
            Math.round(this._xScale.invert(relX - this.dataLensPadding)),
            Math.round(this._xScale.invert(relX + this.dataLensPadding))
        ];
        let yRange = [
            Math.round(this._yScale.invert(relY - this.dataLensPadding)),
            Math.round(this._yScale.invert(relY + this.dataLensPadding))
        ];

        if (this.chromInfo) {
            center = center.map(pos => absToChr(pos, this.chromInfo).slice(0, 2));
            xRange = xRange.map(pos => absToChr(pos, this.chromInfo).slice(0, 2));
            yRange = yRange.map(pos => absToChr(pos, this.chromInfo).slice(0, 2));
        }

        this.onMouseMoveZoom({
            trackId: this.id,
            data,
            absX,
            absY,
            relX,
            relY,
            dataX,
            dataY,
            orientation: '2d',
            // Specific to 2D matrices
            dataLens,
            dim,
            toRgb,
            center,
            xRange,
            yRange,
            isGenomicCoords: !!this.chromInfo
        });
    }

    scheduleRerender() {
        this.backgroundTaskScheduler.enqueueTask(this.handleRerender.bind(this), null, this.uuid);
    }

    handleRerender() {
        this.rerender(this.options, true);
    }

    /**
     * Get absolute (i.e., display) tile dimension and position.
     *
     * @param {Number}  zoomLevel  Current zoom level.
     * @param {Array}  tilePos  Tile position.
     * @return {Object}  Object holding the absolute x, y, width, and height.
     */
    getAbsTileDim(zoomLevel, tilePos, mirrored) {
        const { tileX, tileY, tileWidth, tileHeight } = this.getTilePosAndDimensions(zoomLevel, tilePos);

        const dim = {};

        dim.width = this._refXScale(tileX + tileWidth) - this._refXScale(tileX);
        dim.height = this._refYScale(tileY + tileHeight) - this._refYScale(tileY);

        if (mirrored) {
            // this is a mirrored tile that represents the other half of a
            // triangular matrix
            dim.x = this._refXScale(tileY);
            dim.y = this._refYScale(tileX);
        } else {
            dim.x = this._refXScale(tileX);
            dim.y = this._refYScale(tileY);
        }

        return dim;
    }

    updateValueScale() {
        let minValue = this.minValue();
        let maxValue = this.maxValue();

        // There might be only one value in the visible area. We extend the
        // valuescale artificially, so that point is still displayed
        const epsilon = 1e-6;
        if (
            minValue !== undefined &&
            minValue !== null &&
            maxValue !== undefined &&
            maxValue !== null &&
            Math.abs(minValue - maxValue) < epsilon
        ) {
            // don't go to or below 0 in case there is a log scale
            const offset = 1e-3;
            minValue = Math.max(epsilon, minValue - offset);
            maxValue += offset;
        }

        const [scaleType, valueScale] = getValueScale(
            (this.options && this.options.heatmapValueScaling) || 'log',
            minValue,
            this.medianVisibleValue,
            maxValue,
            'log'
        );

        this.valueScale = valueScale;

        this.limitedValueScale = this.valueScale.copy();

        if (
            this.options &&
            typeof this.options.scaleStartPercent !== 'undefined' &&
            typeof this.options.scaleEndPercent !== 'undefined'
        ) {
            this.limitedValueScale.domain([
                this.valueScale.domain()[0] +
                    (this.valueScale.domain()[1] - this.valueScale.domain()[0]) * this.options.scaleStartPercent,
                this.valueScale.domain()[0] +
                    (this.valueScale.domain()[1] - this.valueScale.domain()[0]) * this.options.scaleEndPercent
            ]);
        }

        return [scaleType, valueScale];
    }

    rerender(options, force) {
        super.rerender(options, force);

        // We need to update the value scale prior to updating the colorbar
        this.updateValueScale();

        // if force is set, then we force a rerender even if the options
        // haven't changed rerender will force a brush.move
        const strOptions = JSON.stringify(options);
        this.drawColorbar();

        if (!force && strOptions === this.prevOptions) return;

        this.prevOptions = strOptions;
        this.options = options;

        super.rerender(options, force);

        // the normalization method may have changed
        this.calculateVisibleTiles();

        if (options && options.colorRange) {
            this.colorScale = colorDomainToRgbaArray(options.colorRange);
        }

        this.visibleAndFetchedTiles().forEach(tile => this.renderTile(tile));

        // hopefully draw isn't rerendering all the tiles
        // this.drawColorbar();

        if (this.hideMousePosition) {
            this.hideMousePosition();
            this.hideMousePosition = undefined;
        }

        if (this.options && this.options.showMousePosition && !this.hideMousePosition) {
            this.hideMousePosition = setupShowMousePosition(this, this.is2d, this.isShowGlobalMousePosition());
        }
    }

    drawLabel() {
        if (this.options.labelPosition === this.options.colorbarPosition) {
            this.labelXOffset = COLORBAR_AREA_WIDTH;
        } else {
            this.labelXOffset = 0;
        }

        super.drawLabel();
    }

    tileDataToCanvas(pixData) {
        const canvas = document.createElement('canvas');

        canvas.width = this.binsPerTile();
        canvas.height = this.binsPerTile();

        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const pix = new ImageData(pixData, canvas.width, canvas.height);

        ctx.putImageData(pix, 0, 0);

        return canvas;
    }

    exportData() {
        if (this.tilesetInfo) {
            // const currentResolution = tileProxy.calculateResolution(this.tilesetInfo,
            //  this.zoomLevel);

            // const pixelsWidth = (this._xScale.domain()[1]  - this._xScale.domain()[0])
            // / currentResolution;
            // const pixelsHeight = (this._yScale.domain()[1]  - this._yScale.domain()[0])
            // / currentResolution;

            const data = this.getVisibleRectangleData(0, 0, this.dimensions[0], this.dimensions[1]);
            const output = {
                bounds: [this._xScale.domain(), this._yScale.domain()],
                dimensions: data.shape,
                data: ndarrayFlatten(data)
            };

            download('data.json', JSON.stringify(output));
        }
    }

    /**
     * Position sprite (the rendered tile)
     *
     * @param  {Object}  sprite  PIXI sprite object.
     * @param  {Number}  zoomLevel  Current zoom level.
     * @param  {Array}  tilePos  X,Y position of tile.
     * @param  {Boolean}  mirrored  If `true` tile is mirrored.
     */
    setSpriteProperties(sprite, zoomLevel, tilePos, mirrored) {
        const dim = this.getAbsTileDim(zoomLevel, tilePos, mirrored);

        sprite.width = dim.width;
        sprite.height = dim.height;
        sprite.x = dim.x;
        sprite.y = dim.y;

        if (mirrored && tilePos[0] !== tilePos[1]) {
            // sprite.pivot = [this._refXScale()[1] / 2, this._refYScale()[1] / 2];

            // I think PIXIv3 used a different method to set the pivot value
            // because the code above no longer works as of v4
            sprite.rotation = -Math.PI / 2;
            sprite.scale.x = Math.abs(sprite.scale.x) * -1;
        }
    }

    refXScale(_) {
        super.refXScale(_);

        this.draw();
    }

    refYScale(_) {
        super.refYScale(_);

        this.draw();
    }

    draw() {
        super.draw();

        // this.drawColorbar();
    }

    newBrushOptions(selection) {
        const newOptions = JSON.parse(JSON.stringify(this.options));

        const axisValueScale = this.valueScale.copy().range([this.colorbarHeight, 0]);

        const endDomain = axisValueScale.invert(selection[0]);
        const startDomain = axisValueScale.invert(selection[1]);

        // Fritz: I am disabling ESLint here twice because moving the slash onto the
        // next line breaks my editors style template somehow.
        const startPercent =
            (startDomain - axisValueScale.domain()[0]) / (axisValueScale.domain()[1] - axisValueScale.domain()[0]);
        const endPercent =
            (endDomain - axisValueScale.domain()[0]) / (axisValueScale.domain()[1] - axisValueScale.domain()[0]);

        newOptions.scaleStartPercent = startPercent.toFixed(SCALE_LIMIT_PRECISION);
        newOptions.scaleEndPercent = endPercent.toFixed(SCALE_LIMIT_PRECISION);

        return newOptions;
    }

    brushStart() {
        this.brushing = true;
    }

    brushMoved(event) {
        if (!event.selection) {
            return;
        }
        const newOptions = this.newBrushOptions(event.selection);

        const strOptions = JSON.stringify(newOptions);

        this.gColorscaleBrush
            .selectAll('.handle--custom')
            .attr('y', d => (d.type === 'n' ? event.selection[0] : event.selection[1] - BRUSH_HEIGHT / 2));

        if (strOptions === this.prevOptions) return;

        this.prevOptions = strOptions;

        // force a rerender because we've already set prevOptions
        // to the new options
        // this is necessary for when value scales are synced between
        // tracks
        this.rerender(newOptions, true);

        this.onTrackOptionsChanged(newOptions);

        if (this.isValueScaleLocked()) {
            this.onValueScaleChanged();
        }
    }

    brushEnd() {
        // let newOptions = this.newBrushOptions(event.selection);

        // this.rerender(newOptions);
        // this.animate();
        this.brushing = false;
    }

    setPosition(newPosition) {
        super.setPosition(newPosition);

        this.drawColorbar();
    }

    setDimensions(newDimensions) {
        super.setDimensions(newDimensions);

        this.drawColorbar();
    }

    removeColorbar() {
        this.pColorbarArea.visible = false;

        if (this.scaleBrush.on('.brush')) {
            this.gColorscaleBrush.call(this.scaleBrush.move, null);
        }

        // turn off the color scale brush
        this.gColorscaleBrush.on('.brush', null);
        this.gColorscaleBrush.selectAll('rect').remove();
    }

    drawColorbar() {
        this.pColorbar.clear();
        // console.trace('draw colorbar');

        if (!this.options || !this.options.colorbarPosition || this.options.colorbarPosition === 'hidden') {
            this.removeColorbar();

            return;
        }

        this.pColorbarArea.visible = true;

        if (!this.valueScale) {
            return;
        }

        if (Number.isNaN(+this.valueScale.domain()[0]) || Number.isNaN(+this.valueScale.domain()[1])) {
            return;
        }

        const colorbarAreaHeight = Math.min(this.dimensions[1] / 2, COLORBAR_MAX_HEIGHT);
        this.colorbarHeight = colorbarAreaHeight - 2 * COLORBAR_MARGIN;

        //  no point in drawing the colorbar if it's not going to be visible
        if (this.colorbarHeight < 0) {
            // turn off the color scale brush
            this.removeColorbar();
            return;
        }

        if (this.valueScale.domain()[1] === this.valueScale.domain()[0]) {
            // degenerate color bar
            this.removeColorbar();
            return;
        }

        const axisValueScale = this.valueScale.copy().range([this.colorbarHeight, 0]);

        // this.scaleBrush = brushY();

        // this is to make the handles of the scale brush stick out away
        // from the colorbar
        if (this.options.colorbarPosition === 'topLeft' || this.options.colorbarPosition === 'bottomLeft') {
            this.scaleBrush.extent([
                [BRUSH_MARGIN, 0],
                [BRUSH_WIDTH, this.colorbarHeight]
            ]);
        } else {
            this.scaleBrush.extent([
                [0, 0],
                [BRUSH_WIDTH - BRUSH_MARGIN, this.colorbarHeight]
            ]);
        }

        if (this.options.colorbarPosition === 'topLeft') {
            // draw the background for the colorbar
            [this.pColorbarArea.x, this.pColorbarArea.y] = this.position;

            this.pColorbar.y = COLORBAR_MARGIN;
            this.axis.pAxis.y = COLORBAR_MARGIN;

            this.axis.pAxis.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP + COLORBAR_WIDTH;
            this.pColorbar.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP;

            this.gColorscaleBrush.attr(
                'transform',
                `translate(${this.pColorbarArea.x + BRUSH_MARGIN},${this.pColorbarArea.y + this.pColorbar.y - 1})`
            );
        }

        if (this.options.colorbarPosition === 'topRight') {
            // draw the background for the colorbar
            this.pColorbarArea.x = this.position[0] + this.dimensions[0] - COLORBAR_AREA_WIDTH;
            this.pColorbarArea.y = this.position[1];

            this.pColorbar.y = COLORBAR_MARGIN;
            this.axis.pAxis.y = COLORBAR_MARGIN;

            // default to 'inside'
            this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

            this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

            this.gColorscaleBrush.attr(
                'transform',
                `translate(${this.pColorbarArea.x + this.pColorbar.x + COLORBAR_WIDTH + 2},${
                    this.pColorbarArea.y + this.pColorbar.y - 1
                })`
            );
        }

        if (this.options.colorbarPosition === 'bottomRight') {
            this.pColorbarArea.x = this.position[0] + this.dimensions[0] - COLORBAR_AREA_WIDTH;
            this.pColorbarArea.y = this.position[1] + this.dimensions[1] - colorbarAreaHeight;

            this.pColorbar.y = COLORBAR_MARGIN;
            this.axis.pAxis.y = COLORBAR_MARGIN;

            // default to "inside"
            this.axis.pAxis.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;
            this.pColorbar.x = COLORBAR_LABELS_WIDTH + COLORBAR_MARGIN;

            this.gColorscaleBrush.attr(
                'transform',
                `translate(${this.pColorbarArea.x + this.pColorbar.x + COLORBAR_WIDTH + BRUSH_COLORBAR_GAP},${
                    this.pColorbarArea.y + this.pColorbar.y - 1
                })`
            );
        }

        if (this.options.colorbarPosition === 'bottomLeft') {
            this.pColorbarArea.x = this.position[0];
            this.pColorbarArea.y = this.position[1] + this.dimensions[1] - colorbarAreaHeight;

            this.pColorbar.y = COLORBAR_MARGIN;
            this.axis.pAxis.y = COLORBAR_MARGIN;

            // default to "inside"
            this.axis.pAxis.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP + COLORBAR_WIDTH;
            this.pColorbar.x = BRUSH_MARGIN + BRUSH_WIDTH + BRUSH_COLORBAR_GAP;

            this.gColorscaleBrush.attr(
                'transform',
                `translate(${this.pColorbarArea.x + 2},${this.pColorbarArea.y + this.pColorbar.y - 1})`
            );
        }

        this.pColorbarArea.clear();
        this.pColorbarArea.beginFill(
            colorToHex(this.options.colorbarBackgroundColor || 'white'),
            +this.options.colorbarBackgroundOpacity >= 0 ? +this.options.colorbarBackgroundOpacity : 0.6
        );
        this.pColorbarArea.drawRect(0, 0, COLORBAR_AREA_WIDTH, colorbarAreaHeight);

        if (!this.options) {
            this.options = { scaleStartPercent: 0, scaleEndPercent: 1 };
        } else {
            if (!this.options.scaleStartPercent) {
                this.options.scaleStartPercent = 0;
            }
            if (!this.options.scaleEndPercent) {
                this.options.scaleEndPercent = 1;
            }
        }

        const domainWidth = axisValueScale.domain()[1] - axisValueScale.domain()[0];

        const startBrush = axisValueScale(this.options.scaleStartPercent * domainWidth + axisValueScale.domain()[0]);
        const endBrush = axisValueScale(this.options.scaleEndPercent * domainWidth + axisValueScale.domain()[0]);

        // endBrush and startBrush are reversed because lower values come first
        // only set if the user isn't brushing at the moment
        if (!this.brushing) {
            this.scaleBrush
                .on('start', this.brushStart.bind(this))
                .on('brush', this.brushMoved.bind(this))
                .on('end', this.brushEnd.bind(this))
                .handleSize(0);

            this.gColorscaleBrush.on('.brush', null);
            this.gColorscaleBrush.call(this.scaleBrush);

            this.northHandle = this.gColorscaleBrush
                .selectAll('.handle--custom')
                .data([{ type: 'n' }, { type: 's' }])
                .enter()
                .append('rect')
                .classed('handle--custom', true)
                .attr('cursor', 'ns-resize')
                .attr('width', BRUSH_WIDTH)
                .attr('height', BRUSH_HEIGHT)
                .style('fill', '#666')
                .style('stroke', 'white');

            if (this.flipText) {
                this.northHandle.attr('cursor', 'ew-resize');
            }

            this.gColorscaleBrush.call(this.scaleBrush.move, [endBrush, startBrush]);
        }

        const posScale = scaleLinear().domain([0, 255]).range([0, this.colorbarHeight]);

        // draw a small rectangle for each color of the colorbar
        for (let i = 0; i < this.colorbarHeight; i++) {
            const value = this.limitedValueScale(axisValueScale.invert(i));

            const rgbIdx = Math.max(0, Math.min(254, Math.floor(value)));

            this.pColorbar.beginFill(
                colorToHex(
                    `rgb(${this.colorScale[rgbIdx][0]},${this.colorScale[rgbIdx][1]},${this.colorScale[rgbIdx][2]})`
                )
            );

            // each rectangle in the colorbar will be one pixel high
            this.pColorbar.drawRect(0, i, COLORBAR_WIDTH, 1);
        }

        // draw an axis on the right side of the colorbar
        this.pAxis.position.x = COLORBAR_WIDTH;
        this.pAxis.position.y = posScale(0);

        if (this.options.colorbarPosition === 'topLeft' || this.options.colorbarPosition === 'bottomLeft') {
            this.axis.drawAxisRight(axisValueScale, this.colorbarHeight);
        } else if (this.options.colorbarPosition === 'topRight' || this.options.colorbarPosition === 'bottomRight') {
            this.axis.drawAxisLeft(axisValueScale, this.colorbarHeight);
        }
    }

    exportColorBarSVG() {
        const gColorbarArea = document.createElement('g');
        gColorbarArea.setAttribute('class', 'color-bar');

        if (!this.options.colorbarPosition || this.options.colorbarPosition === 'hidden') {
            // if there's no visible colorbar, we don't need to export anything
            return gColorbarArea;
        }

        // no value scale, no colorbar
        if (!this.valueScale) return gColorbarArea;

        gColorbarArea.setAttribute('transform', `translate(${this.pColorbarArea.x}, ${this.pColorbarArea.y})`);

        const rectColorbarArea = document.createElement('rect');
        gColorbarArea.appendChild(rectColorbarArea);

        const gColorbar = document.createElement('g');
        gColorbarArea.appendChild(gColorbar);

        gColorbar.setAttribute('transform', `translate(${this.pColorbar.x}, ${this.pColorbar.y})`);

        const colorbarAreaHeight = Math.min(this.dimensions[1] / 2, COLORBAR_MAX_HEIGHT);
        this.colorbarHeight = colorbarAreaHeight - 2 * COLORBAR_MARGIN;

        rectColorbarArea.setAttribute('x', 0);
        rectColorbarArea.setAttribute('y', 0);
        rectColorbarArea.setAttribute('width', COLORBAR_AREA_WIDTH);
        rectColorbarArea.setAttribute('height', colorbarAreaHeight);
        rectColorbarArea.setAttribute('style', 'fill: white; stroke-width: 0; opacity: 0.7');

        const barsToDraw = 256;
        const posScale = scaleLinear()
            .domain([0, barsToDraw - 1])
            .range([0, this.colorbarHeight]);
        const colorHeight = this.colorbarHeight / barsToDraw;

        for (let i = 0; i < barsToDraw; i++) {
            const rectColor = document.createElement('rect');
            gColorbar.appendChild(rectColor);

            rectColor.setAttribute('x', 0);
            rectColor.setAttribute('y', posScale(i));
            rectColor.setAttribute('width', COLORBAR_WIDTH);
            rectColor.setAttribute('height', colorHeight);
            rectColor.setAttribute('class', 'color-rect');

            const limitedIndex = Math.min(
                this.colorScale.length - 1,
                Math.max(0, Math.floor(this.limitedValueScale(this.valueScale.invert(i))))
            );

            const color = this.colorScale[limitedIndex];
            if (color) {
                rectColor.setAttribute('style', `fill: rgb(${color[0]}, ${color[1]}, ${color[2]})`);
            } else {
                // when no tiles are loaded, color will be undefined and we don't want to crash
                rectColor.setAttribute('style', `fill: rgb(255,255,255,0)`);
            }
        }

        const gAxisHolder = document.createElement('g');
        gColorbarArea.appendChild(gAxisHolder);
        gAxisHolder.setAttribute('transform', `translate(${this.axis.pAxis.position.x},${this.axis.pAxis.position.y})`);

        let gAxis = null;

        const axisValueScale = this.valueScale.copy().range([this.colorbarHeight, 0]);
        if (this.options.colorbarPosition === 'topLeft' || this.options.colorbarPosition === 'bottomLeft') {
            gAxis = this.axis.exportAxisRightSVG(axisValueScale, this.colorbarHeight);
        } else if (this.options.colorbarPosition === 'topRight' || this.options.colorbarPosition === 'bottomRight') {
            gAxis = this.axis.exportAxisLeftSVG(axisValueScale, this.colorbarHeight);
        }

        gAxisHolder.appendChild(gAxis);

        return gColorbarArea;
    }

    /**
     * Set data lens size
     *
     * @param  {Integer}  newDataLensSize  New data lens size. Needs to be an odd
     *   integer.
     */
    setDataLensSize(newDataLensSize) {
        this.dataLensPadding = Math.max(0, Math.floor((newDataLensSize - 1) / 2));
        this.dataLensSize = this.dataLensPadding * 2 + 1;
    }

    binsPerTile() {
        return this.tilesetInfo.bins_per_dimension || BINS_PER_TILE;
    }

    /**
     * Get the data in the visible rectangle
     *
     * The parameter coordinates are in pixel coordinates
     *
     * @param {int} x: The upper left corner of the rectangle in pixel coordinates
     * @param {int} y: The upper left corner of the rectangle in pixel coordinates
     * @param {int} width: The width of the rectangle (pixels)
     * @param {int} height: The height of the rectangle (pixels)
     *
     * @returns {Array} A numjs array containing the data in the visible region
     *
     */
    getVisibleRectangleData(x, y, width, height) {
        let zoomLevel = this.calculateZoomLevel();
        zoomLevel = this.tilesetInfo.max_zoom ? Math.min(this.tilesetInfo.max_zoom, zoomLevel) : zoomLevel;

        const calculatedWidth = calculateTileWidth(this.tilesetInfo, zoomLevel, this.binsPerTile());

        // BP resolution of a tile's bin (i.e., numbe of base pairs per bin / pixel)
        const tileRes = calculatedWidth / this.binsPerTile();

        // the data domain of the currently visible region
        const xDomain = [this._xScale.invert(x), this._xScale.invert(x + width)];
        const yDomain = [this._yScale.invert(y), this._yScale.invert(y + height)];

        // we need to limit the domain of the requested region
        // to the bounds of the data
        const limitedXDomain = [
            Math.max(xDomain[0], this.tilesetInfo.min_pos[0]),
            Math.min(xDomain[1], this.tilesetInfo.max_pos[0])
        ];

        const limitedYDomain = [
            Math.max(yDomain[0], this.tilesetInfo.min_pos[1]),
            Math.min(yDomain[1], this.tilesetInfo.max_pos[1])
        ];

        // the bounds of the currently visible region in bins
        const leftXBin = Math.floor(limitedXDomain[0] / tileRes);
        const leftYBin = Math.floor(limitedYDomain[0] / tileRes);
        const binWidth = Math.max(0, Math.ceil((limitedXDomain[1] - limitedXDomain[0]) / tileRes));
        const binHeight = Math.max(0, Math.ceil((limitedYDomain[1] - limitedYDomain[0]) / tileRes));

        const out = ndarray(new Array(binHeight * binWidth).fill(NaN), [binHeight, binWidth]);

        // iterate through all the visible tiles
        this.visibleAndFetchedTiles().forEach(tile => {
            const tilePos = tile.mirrored
                ? [tile.tileData.tilePos[1], tile.tileData.tilePos[0]]
                : tile.tileData.tilePos;

            // get the tile's position and width (in data coordinates)
            // if it's mirrored then we have to switch the position indeces
            const { tileX, tileY, tileWidth, tileHeight } = this.getTilePosAndDimensions(
                tile.tileData.zoomLevel,
                tilePos,
                this.binsPerTile()
            );

            // calculate the tile's position in bins
            const tileXStartBin = Math.floor(tileX / tileRes);
            const tileXEndBin = Math.floor((tileX + tileWidth) / tileRes);
            const tileYStartBin = Math.floor(tileY / tileRes);
            const tileYEndBin = Math.floor((tileY + tileHeight) / tileRes);

            // calculate which part of this tile is present in the current window
            let tileSliceXStart = Math.max(leftXBin, tileXStartBin) - tileXStartBin;
            let tileSliceYStart = Math.max(leftYBin, tileYStartBin) - tileYStartBin;
            const tileSliceXEnd = Math.min(leftXBin + binWidth, tileXEndBin) - tileXStartBin;
            const tileSliceYEnd = Math.min(leftYBin + binHeight, tileYEndBin) - tileYStartBin;

            // where in the output array will the portion of this tile which is in the
            // visible window be placed?
            const tileXOffset = Math.max(tileXStartBin - leftXBin, 0);
            const tileYOffset = Math.max(tileYStartBin - leftYBin, 0);
            const tileSliceWidth = tileSliceXEnd - tileSliceXStart;
            const tileSliceHeight = tileSliceYEnd - tileSliceYStart;

            // the region is outside of this tile
            if (tileSliceWidth < 0 || tileSliceHeight < 0) return;

            if (tile.mirrored && tileSliceXStart > tileSliceYStart) {
                const tmp = tileSliceXStart;
                tileSliceXStart = tileSliceYStart;
                tileSliceYStart = tmp;
            }

            ndarrayAssign(
                out.hi(tileYOffset + tileSliceHeight, tileXOffset + tileSliceWidth).lo(tileYOffset, tileXOffset),
                tile.dataArray
                    .hi(tileSliceYStart + tileSliceHeight, tileSliceXStart + tileSliceWidth)
                    .lo(tileSliceYStart, tileSliceXStart)
            );
        });

        return out;
    }

    /**
     * Convert the raw tile data to a rendered array of values which can be represented as a sprite.
     *
     * @param tile: The data structure containing all the tile information. Relevant to
     *              this function are tile.tileData = \{'dense': [...], ...\}
     *              and tile.graphics
     */
    initTile(tile) {
        super.initTile(tile);

        // prepare the data for fast retrieval in getVisibleRectangleData
        if (tile.tileData.dense.length === this.binsPerTile() ** 2) {
            tile.dataArray = ndarray(Array.from(tile.tileData.dense), [this.binsPerTile(), this.binsPerTile()]);

            // Recompute DenseDataExtrema for diagonal tiles which have been mirrored
            if (this.continuousScaling && tile.tileData.tilePos[0] === tile.tileData.tilePos[1] && tile.mirrored) {
                tile.tileData.denseDataExtrema.mirrorPrecomputedExtrema();
                super.initTile(tile);
            }
        }

        // no data present
        if (this.scale.minValue === null || this.scale.maxValue === null) {
            return;
        }

        this.renderTile(tile);
    }

    // /**
    //  * Draw a border around tiles
    //  *
    //  * @param  {Array}  pixData  Pixel data to be adjusted
    //  */
    // addBorder(pixData) {
    //   for (let i = 0; i < 256; i++) {
    //     if (i === 0) {
    //       const prefix = i * 256 * 4;
    //       for (let j = 0; j < 255; j++) {
    //         pixData[prefix + (j * 4)] = 0;
    //         pixData[prefix + (j * 4) + 1] = 0;
    //         pixData[prefix + (j * 4) + 2] = 255;
    //         pixData[prefix + (j * 4) + 3] = 255;
    //       }
    //     }
    //     pixData[(i * 256 * 4)] = 0;
    //     pixData[(i * 256 * 4) + 1] = 0;
    //     pixData[(i * 256 * 4) + 2] = 255;
    //     pixData[(i * 256 * 4) + 3] = 255;
    //   }
    // }
    //
    updateTile(tile) {
        if (
            tile.scale &&
            this.scale &&
            this.scale.minValue === tile.scale.minValue &&
            this.scale.maxValue === tile.scale.maxValue
        );
        else {
            // not rendered using the current scale, so we need to rerender
            this.renderTile(tile);
            this.drawColorbar();
        }
    }

    destroyTile(tile) {
        // sprite have to be explicitly destroyed in order to
        // free the texture cache
        tile.sprite.destroy(true);

        tile.canvas = null;
        tile.sprite = null;
        tile.texture = null;

        // this is a handy method for checking what's in the texture
        // cache
        // console.log('destroy', PIXI.utils.BaseTextureCache);
    }

    pixDataFunction(tile, pixData) {
        // the tileData has been converted to pixData by the worker script and
        // needs to be loaded as a sprite
        if (pixData) {
            const { graphics } = tile;
            const canvas = this.tileDataToCanvas(pixData.pixData);

            if (tile.sprite) {
                // if this tile has already been rendered with a sprite, we
                // have to destroy it before creating a new one
                tile.sprite.destroy(true);
            }

            const texture =
                GLOBALS.PIXI.VERSION[0] === '4'
                    ? GLOBALS.PIXI.Texture.fromCanvas(canvas, GLOBALS.PIXI.SCALE_MODES.NEAREST)
                    : GLOBALS.PIXI.Texture.from(canvas, {
                          scaleMode: GLOBALS.PIXI.SCALE_MODES.NEAREST
                      });

            const sprite = new GLOBALS.PIXI.Sprite(texture);

            tile.sprite = sprite;
            tile.texture = texture;
            // store the pixData so that we can export it
            tile.canvas = canvas;
            this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos, tile.mirrored);

            graphics.removeChildren();
            graphics.addChild(tile.sprite);
        }
        this.renderingTiles.delete(tile.tileId);
    }

    /**
     * Render / draw a tile.
     *
     * @param {Object}  tile  Tile data to be rendered.
     */
    renderTile(tile) {
        const [scaleType] = this.updateValueScale();
        const pseudocount = 0;

        this.renderingTiles.add(tile.tileId);

        if (this.tilesetInfo.tile_size) {
            if (tile.tileData.dense.length < this.tilesetInfo.tile_size) {
                // we haven't gotten a full tile from the server so we want to pad
                // it with nan values
                const newArray = new Float32Array(this.tilesetInfo.tile_size);

                newArray.fill(NaN);
                newArray.set(tile.tileData.dense);

                tile.tileData.dense = newArray;
            }
        }

        tileDataToPixData(
            tile,
            scaleType,
            this.limitedValueScale.domain(),
            pseudocount, // used as a pseudocount to prevent taking the log of 0
            this.colorScale,
            pixData => this.pixDataFunction(tile, pixData),
            this.mirrorTiles() && !tile.mirrored && tile.tileData.tilePos[0] === tile.tileData.tilePos[1],
            this.options.extent === 'upper-right' && tile.tileData.tilePos[0] === tile.tileData.tilePos[1],
            this.options.zeroValueColor ? colorToRgba(this.options.zeroValueColor) : undefined,
            {
                selectedRows: this.options.selectRows,
                selectedRowsAggregationMode: this.options.selectRowsAggregationMode,
                selectedRowsAggregationWithRelativeHeight: this.options.selectRowsAggregationWithRelativeHeight,
                selectedRowsAggregationMethod: this.options.selectRowsAggregationMethod
            }
        );
    }

    /**
     * Remove this track from the view
     */
    remove() {
        this.gMain.remove();
        this.gMain = null;

        super.remove();
    }

    refScalesChanged(refXScale, refYScale) {
        super.refScalesChanged(refXScale, refYScale);

        objVals(this.fetchedTiles)
            .filter(tile => tile.sprite)
            .forEach(tile =>
                this.setSpriteProperties(tile.sprite, tile.tileData.zoomLevel, tile.tileData.tilePos, tile.mirrored)
            );
    }

    /**
     * Bypass this track's exportSVG function
     */
    superSVG() {
        return super.exportSVG();
    }

    exportSVG() {
        let track = null;
        let base = null;

        if (super.exportSVG) {
            [base, track] = super.exportSVG();
        } else {
            base = document.createElement('g');
            track = base;
        }

        const output = document.createElement('g');
        track.appendChild(output);

        output.setAttribute(
            'transform',
            `translate(${this.pMain.position.x},${this.pMain.position.y}) scale(${this.pMain.scale.x},${this.pMain.scale.y})`
        );

        for (const tile of this.visibleAndFetchedTiles()) {
            const rotation = (tile.sprite.rotation * 180) / Math.PI;
            const g = document.createElement('g');
            g.setAttribute(
                'transform',
                `translate(${tile.sprite.x},${tile.sprite.y}) rotate(${rotation}) scale(${tile.sprite.scale.x},${tile.sprite.scale.y})`
            );

            const image = document.createElement('image');
            image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', tile.canvas.toDataURL());
            image.setAttribute('width', tile.canvas.width);
            image.setAttribute('height', tile.canvas.height);
            image.setAttribute('style', 'image-rendering: pixelated');

            g.appendChild(image);
            output.appendChild(g);
        }

        const gColorbar = this.exportColorBarSVG();
        track.appendChild(gColorbar);

        return [base, base];
    }

    // This function gets the indices of the visible part of the upper left tile.
    // The indices are 'rounded' to the grid used by the DenseDataExrema module.
    // It is used to determine if we should check for a new value scale in
    // the case of continuous scaling
    getVisiblePartOfUppLeftTile() {
        const tilePositions = this.visibleAndFetchedTiles().map(tile => {
            const tilePos = tile.mirrored
                ? [tile.tileData.tilePos[1], tile.tileData.tilePos[0]]
                : tile.tileData.tilePos;
            return [tilePos[0], tilePos[1], tile.tileId];
        });

        if (tilePositions.length === 0) return null;

        let minTilePosition = tilePositions[0];

        for (const curPos of tilePositions) {
            if (curPos[0] < minTilePosition[0] || curPos[1] < minTilePosition[1]) {
                minTilePosition = curPos;
            }
        }

        const numSubsets = Math.min(NUM_PRECOMP_SUBSETS_PER_2D_TTILE, this.binsPerTile());
        const subsetSize = this.binsPerTile() / numSubsets;

        const upperLeftTile = this.visibleAndFetchedTiles().filter(tile => tile.tileId === minTilePosition[2])[0];

        const upperLeftTileInd = this.getIndicesOfVisibleDataInTile(upperLeftTile);

        const startX = upperLeftTileInd[0];
        const startY = upperLeftTileInd[1];
        // round to nearest grid point as used in the DenseDataExtrema Module
        const startXadjusted = startX - (startX % subsetSize);
        const startYadjusted = startY - (startY % subsetSize);

        return [upperLeftTile.tileId, startXadjusted, startYadjusted];
    }

    getIndicesOfVisibleDataInTile(tile) {
        const visibleX = this._xScale.range();
        const visibleY = this._yScale.range();

        const tilePos = tile.mirrored ? [tile.tileData.tilePos[1], tile.tileData.tilePos[0]] : tile.tileData.tilePos;

        const { tileX, tileY, tileWidth, tileHeight } = this.getTilePosAndDimensions(
            tile.tileData.zoomLevel,
            tilePos,
            this.binsPerTile()
        );

        const tileXScale = scaleLinear()
            .domain([0, this.binsPerTile()])
            .range([tileX, tileX + tileWidth]);

        const startX = Math.max(0, Math.round(tileXScale.invert(this._xScale.invert(visibleX[0]))) - 1);

        const endX = Math.min(this.binsPerTile(), Math.round(tileXScale.invert(this._xScale.invert(visibleX[1]))));

        const tileYScale = scaleLinear()
            .domain([0, this.binsPerTile()])
            .range([tileY, tileY + tileHeight]);

        const startY = Math.max(0, Math.round(tileYScale.invert(this._yScale.invert(visibleY[0]))) - 1);

        const endY = Math.min(this.binsPerTile(), Math.round(tileYScale.invert(this._yScale.invert(visibleY[1]))));

        const result =
            tile.mirrored && tilePos[0] !== tilePos[1] ? [startY, startX, endY, endX] : [startX, startY, endX, endY];

        return result;
    }

    minVisibleValue(ignoreFixedScale = false) {
        const minimumsPerTile = this.visibleAndFetchedTiles().map(tile => {
            if (tile.tileData.denseDataExtrema === undefined) {
                return null;
            }
            const ind = this.getIndicesOfVisibleDataInTile(tile);
            return tile.tileData.denseDataExtrema.getMinNonZeroInSubset(ind);
        });

        if (minimumsPerTile.length === 0 && this.valueScaleMax === null) {
            return null;
        }

        const min = Math.min.apply(null, minimumsPerTile);

        // If there is no data or no denseDataExtrema, go to parent method
        if (min === Number.MAX_SAFE_INTEGER) {
            return super.minVisibleValue(ignoreFixedScale);
        }

        if (ignoreFixedScale) return min;

        return this.valueScaleMin !== null ? this.valueScaleMin : min;
    }

    maxVisibleValue(ignoreFixedScale = false) {
        const maximumsPerTile = this.visibleAndFetchedTiles().map(tile => {
            if (tile.tileData.denseDataExtrema === undefined) {
                return null;
            }

            const ind = this.getIndicesOfVisibleDataInTile(tile);

            return tile.tileData.denseDataExtrema.getMaxNonZeroInSubset(ind);
        });

        if (maximumsPerTile.length === 0 && this.valueScaleMax === null) {
            return null;
        }

        const max = Math.max.apply(null, maximumsPerTile);

        // If there is no data  or no deseDataExtrema, go to parent method
        if (max === Number.MIN_SAFE_INTEGER) {
            return super.maxVisibleValue(ignoreFixedScale);
        }

        if (ignoreFixedScale) return max;

        return this.valueScaleMax !== null ? this.valueScaleMax : max;
    }

    zoomed(newXScale, newYScale, k, tx, ty) {
        if (this.brushing) {
            return;
        }

        super.zoomed(newXScale, newYScale);

        this.pMain.position.x = tx; // translateX;
        this.pMain.position.y = ty; // translateY;

        this.pMain.scale.x = k; // scaleX;
        this.pMain.scale.y = k; // scaleY;

        const isValueScaleLocked = this.isValueScaleLocked();

        if (this.continuousScaling && this.minValue() !== undefined && this.maxValue() !== undefined) {
            // Get the indices of the visible part of the upper left tile.
            // Helps to determine if we zoomed far enough to justify a min/max computation
            const indUpperLeftTile = JSON.stringify(this.getVisiblePartOfUppLeftTile());

            if (
                this.valueScaleMin === null &&
                this.valueScaleMax === null &&
                !isValueScaleLocked &&
                // syncs the recomputation with the grid used in the DenseDataExtrema module
                indUpperLeftTile !== this.prevIndUpperLeftTile
            ) {
                const newMin = this.minVisibleValue();
                const newMax = this.maxVisibleValue();

                const epsilon = 1e-6;

                if (
                    newMin !== null && // can happen if tiles haven't loaded
                    newMax !== null &&
                    (Math.abs(this.minValue() - newMin) > epsilon || Math.abs(this.maxValue() - newMax) > epsilon)
                ) {
                    this.minValue(newMin);
                    this.maxValue(newMax);

                    this.scheduleRerender();
                }
                this.prevIndUpperLeftTile = indUpperLeftTile;
            }

            if (isValueScaleLocked) {
                this.onValueScaleChanged();
            }
        }

        this.mouseMoveZoomHandler();
    }

    /**
     * Helper method for adding a tile ID in place. Used by `tilesToId()`.
     *
     * @param  {Array}  tiles  Array tile ID should be added to.
     * @param  {Integer}  zoomLevel  Zoom level.
     * @param  {Integer}  row  Column ID, i.e., y.
     * @param  {Integer}  column  Column ID, i.e., x.
     * @param  {Objwect}  dataTransform  ??
     * @param  {Boolean}  mirrored  If `true` tile is mirrored.
     */
    addTileId(tiles, zoomLevel, row, column, dataTransform, mirrored = false) {
        const newTile = [zoomLevel, row, column];
        newTile.mirrored = mirrored;
        newTile.dataTransform = dataTransform;
        tiles.push(newTile);
    }

    /**
     * Convert tile positions to tile IDs
     *
     * @param  {Array}  xTiles  X positions of tiles
     * @param  {Array}  yTiles  Y positions of tiles
     * @param  {Array}  zoomLevel  Current zoom level
     * @return  {Array}  List of tile IDs
     */
    tilesToId(xTiles, yTiles, zoomLevel) {
        const rows = xTiles;
        const cols = yTiles;
        const dataTransform = (this.options && this.options.dataTransform) || 'default';

        // if we're mirroring tiles, then we only need tiles along the diagonal
        const tiles = [];

        // calculate the ids of the tiles that should be visible
        for (const row of rows) {
            for (const col of cols) {
                if (this.mirrorTiles()) {
                    if (row >= col) {
                        if (this.options.extent !== 'lower-left') {
                            // if we're in the upper triangular part of the matrix, then we need
                            // to load a mirrored tile
                            this.addTileId(tiles, zoomLevel, col, row, dataTransform, true);
                        }
                    } else if (this.options.extent !== 'upper-right') {
                        // otherwise, load an original tile
                        this.addTileId(tiles, zoomLevel, row, col, dataTransform);
                    }

                    if (row === col && this.options.extent === 'lower-left') {
                        // on the diagonal, load original tiles
                        this.addTileId(tiles, zoomLevel, row, col, dataTransform);
                    }
                } else {
                    this.addTileId(tiles, zoomLevel, row, col, dataTransform);
                }
            }
        }

        return tiles;
    }

    calculateVisibleTiles() {
        // if we don't know anything about this dataset, no point
        // in trying to get tiles
        if (!this.tilesetInfo) {
            return;
        }

        this.zoomLevel = this.calculateZoomLevel();

        // this.zoomLevel = 0;
        if (this.tilesetInfo.resolutions) {
            const sortedResolutions = this.tilesetInfo.resolutions.map(x => +x).sort((a, b) => b - a);

            this.xTiles = calculateTilesFromResolution(
                sortedResolutions[this.zoomLevel],
                this._xScale,
                this.tilesetInfo.min_pos[0],
                this.tilesetInfo.max_pos[0]
            );
            this.yTiles = calculateTilesFromResolution(
                sortedResolutions[this.zoomLevel],
                this._yScale,
                this.tilesetInfo.min_pos[0],
                this.tilesetInfo.max_pos[0]
            );
        } else {
            this.xTiles = calculateTiles(
                this.zoomLevel,
                this._xScale,
                this.tilesetInfo.min_pos[0],
                this.tilesetInfo.max_pos[0],
                this.tilesetInfo.max_zoom,
                this.tilesetInfo.max_width
            );

            this.yTiles = calculateTiles(
                this.zoomLevel,
                this._yScale,
                this.options.reverseYAxis ? -this.tilesetInfo.max_pos[1] : this.tilesetInfo.min_pos[1],
                this.options.reverseYAxis ? -this.tilesetInfo.min_pos[1] : this.tilesetInfo.max_pos[1],
                this.tilesetInfo.max_zoom,
                this.tilesetInfo.max_width1 || this.tilesetInfo.max_width
            );
        }

        this.setVisibleTiles(this.tilesToId(this.xTiles, this.yTiles, this.zoomLevel));
    }

    mirrorTiles() {
        return !(
            this.tilesetInfo.mirror_tiles &&
            (this.tilesetInfo.mirror_tiles === false || this.tilesetInfo.mirror_tiles === 'false')
        );
    }

    getMouseOverHtml(trackX, trackY) {
        if (!this.options || !this.options.showTooltip) {
            return '';
        }

        if (!this.tilesetInfo) {
            return '';
        }

        const currentResolution = calculateResolution(this.tilesetInfo, this.zoomLevel);

        const maxWidth = Math.max(
            this.tilesetInfo.max_pos[1] - this.tilesetInfo.min_pos[1],
            this.tilesetInfo.max_pos[0] - this.tilesetInfo.min_pos[0]
        );

        const formatResolution = Math.ceil(Math.log(maxWidth / currentResolution) / Math.log(10));

        this.setDataLensSize(1);

        const dataX = this._xScale.invert(trackX);
        const dataY = this._yScale.invert(trackY);

        let positionText = '<b>Position:</b> ';

        if (this.chromInfo) {
            const atcX = absToChr(dataX, this.chromInfo);
            const atcY = absToChr(dataY, this.chromInfo);

            const f = n => format(`.${formatResolution}s`)(n);

            positionText += `${atcX[0]}:${f(atcX[1])} & ${atcY[0]}:${f(atcY[1])}`;
            positionText += '<br/>';
        }

        let data = null;
        try {
            data = this.getVisibleRectangleData(trackX, trackY, 1, 1).get(0, 0);
        } catch {
            return '';
        }

        if (this.options && this.options.heatmapValueScaling === 'log') {
            if (data > 0) {
                return `${positionText}<b>Value:</b> 1e${format('.3f')(Math.log(data) / Math.log(10))}`;
            }

            if (data === 0) {
                return `${positionText}<b>Value:</b> 0`;
            }

            return `${positionText}<b>Value:</b> N/A`;
        }
        return `${positionText}<b>Value:</b> ${format('.3f')(data)}`;
    }

    /**
     * Get the tile's position in its coordinate system.
     *
     * @description
     * Normally the absolute coordinate system are the genome basepair positions
     */
    getTilePosAndDimensions(zoomLevel, tilePos, binsPerTileIn) {
        /**
         * Get the tile's position in its coordinate system.
         */
        const binsPerTile = binsPerTileIn || this.binsPerTile();

        if (this.tilesetInfo.resolutions) {
            const sortedResolutions = this.tilesetInfo.resolutions.map(x => +x).sort((a, b) => b - a);

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
        }

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

    calculateZoomLevel() {
        // These four lines below don't do anything?
        // this.tilesetInfo.min_pos[0];
        // this.tilesetInfo.max_pos[0];
        // this.tilesetInfo.min_pos[1];
        // this.tilesetInfo.max_pos[1];

        let zoomLevel = null;

        if (this.tilesetInfo.resolutions) {
            const zoomIndexX = calculateZoomLevelFromResolutions(this.tilesetInfo.resolutions, this._xScale);
            const zoomIndexY = calculateZoomLevelFromResolutions(this.tilesetInfo.resolutions, this._yScale);

            zoomLevel = Math.min(zoomIndexX, zoomIndexY);
        } else {
            const xZoomLevel = calculateZoomLevel(
                this._xScale,
                this.tilesetInfo.min_pos[0],
                this.tilesetInfo.max_pos[0],
                this.binsPerTile()
            );

            const yZoomLevel = calculateZoomLevel(
                this._xScale,
                this.tilesetInfo.min_pos[1],
                this.tilesetInfo.max_pos[1],
                this.binsPerTile()
            );

            zoomLevel = Math.max(xZoomLevel, yZoomLevel);
            zoomLevel = Math.min(zoomLevel, this.maxZoom);
        }

        if (this.options && this.options.maxZoom) {
            if (this.options.maxZoom >= 0) {
                zoomLevel = Math.min(this.options.maxZoom, zoomLevel);
            } else {
                console.error('Invalid maxZoom on track:', this);
            }
        }

        return zoomLevel;
    }

    /**
     * The local tile identifier
     *
     * @param {array}  tile  Tile definition array to be converted to id. Tile
     *   array must contain `[zoomLevel, xPos, yPos]` and two props `mirrored` and
     *   `dataTransform`.
     */
    tileToLocalId(tile) {
        // tile
        if (tile.dataTransform && tile.dataTransform !== 'default') {
            return `${tile.join('.')}.${tile.mirrored}.${tile.dataTransform}`;
        }
        return `${tile.join('.')}.${tile.mirrored}`;
    }

    /**
     * The tile identifier used on the server
     */
    tileToRemoteId(tile) {
        // tile contains [zoomLevel, xPos, yPos]
        if (tile.dataTransform && tile.dataTransform !== 'default') {
            return `${tile.join('.')}.${tile.dataTransform}`;
        }
        return `${tile.join('.')}`;
    }

    localToRemoteId(remoteId) {
        const idParts = remoteId.split('.');
        return idParts.slice(0, idParts.length - 1).join('.');
    }
}

/**
 * Convert a chromosome position to an absolute genome position.
 *
 * @template {string} Name
 * @param {Name} chrom - Chromosome name
 * @param {number} chromPos - Chromosome position
 * @param {import('../types').ChromInfo<Name>} chromInfo - Chromosome info object
 */
const chrToAbs = (chrom, chromPos, chromInfo) => chromInfo.chrPositions[chrom].pos + chromPos;

// @ts-nocheck
/**
 * Export a PIXI text to an SVG element
 *
 * param {PIXI.Text} pixiText A PIXI.Text object that we want to create an SVG element for
 * returns {Element} A DOM SVG Element with all of the attributes set as to display
 * the given text.
 */
const pixiTextToSvg = pixiText => {
    const g = document.createElement('g');
    const t = document.createElement('text');

    if (pixiText.anchor.x === 0) {
        t.setAttribute('text-anchor', 'start');
    } else if (pixiText.anchor.x === 1) {
        t.setAttribute('text-anchor', 'end');
    } else {
        t.setAttribute('text-anchor', 'middle');
    }

    t.setAttribute('font-family', pixiText.style.fontFamily);
    t.setAttribute('font-size', pixiText.style.fontSize);
    g.setAttribute('transform', `scale(${pixiText.scale.x},1)`);

    t.setAttribute('fill', pixiText.style.fill);
    t.innerHTML = pixiText.text;

    g.appendChild(t);
    g.setAttribute('transform', `translate(${pixiText.x},${pixiText.y})scale(${pixiText.scale.x},1)`);

    return g;
};

// @ts-nocheck
/**
 * Generate a SVG line
 * @param   {number}  x1  Start X
 * @param   {number}  y1  Start Y
 * @param   {number}  x2  End X
 * @param   {number}  y2  End Y
 * @param   {number}  strokeWidth  Line width
 * @param   {number}  strokeColor  Color HEX string
 * @return  {object}  SVG line object
 */
const svgLine = (x1, y1, x2, y2, strokeWidth, strokeColor) => {
    const line = document.createElement('line');

    line.setAttribute('x1', x1);
    line.setAttribute('x2', x2);
    line.setAttribute('y1', y1);
    line.setAttribute('y2', y2);

    if (strokeWidth) {
        line.setAttribute('stroke-width', strokeWidth);
    }
    if (strokeColor) {
        line.setAttribute('stroke', strokeColor);
    }

    return line;
};

export {
    DataFetcher,
    DenseDataExtrema1D,
    HeatmapTiledPixiTrack,
    PixiTrack,
    SVGTrack,
    TiledPixiTrack,
    Track,
    ViewportTrackerHorizontal,
    absToChr,
    chrToAbs,
    chromInfoBisector,
    colorToHex,
    fakePubSub,
    pixiTextToSvg,
    setupShowMousePosition as showMousePosition,
    svgLine,
    api as tileProxy
};
