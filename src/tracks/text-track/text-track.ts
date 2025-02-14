import { PixiTrack } from '@higlass/tracks';
import { type PixiTrackContext } from '@higlass/tracks';
import * as PIXI from 'pixi.js';
import { uuid } from '../../core/utils/uuid';
import colorToHex from '../../core/utils/color-to-hex';

const defaultOptions = {
    backgroundColor: '#ededed',
    textColor: '#333333',
    fontSize: 14,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    align: 'left' as const,
    offsetY: 0,
    text: ''
};

export interface TextTrackOptions {
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    align: 'left' | 'right' | 'middle';
    offsetY: number;
    text?: string;
}

export type TextTrackContext = PixiTrackContext;

function initColors(textColor: string) {
    return {
        textColor: colorToHex(textColor),
        black: colorToHex('#000000'),
        white: colorToHex('#ffffff'),
        lightgrey: colorToHex('#ededed')
    };
}

export class TextTrackClass extends PixiTrack<TextTrackOptions> {
    colors: { [key: string]: number } = {};
    text = '';
    fontSize = 14;
    textOptions = {};
    isTrackShownVertically: boolean;
    svgAnchor: string;
    svgX: number;

    constructor(context: TextTrackContext, options: Partial<TextTrackOptions>) {
        const completeOptions = { ...defaultOptions, ...options };
        super(context, completeOptions);

        // TODO: make this a part of the options
        this.isTrackShownVertically = false;
        this.initOptions();

        // These are the default values, will be updated in renderText
        this.svgAnchor = 'start';
        this.svgX = 0;
    }

    initOptions() {
        this.colors = initColors(this.options.textColor);
        this.text = this.options.text;
        this.fontSize = +this.options.fontSize;

        this.textOptions = {
            fontSize: `${this.fontSize}px`,
            fontFamily: this.options.fontFamily,
            fontWeight: this.options.fontWeight,
            fill: this.colors['textColor']
        };
    }

    /*
     * Redraw the track because the options
     * changed
     */
    rerender(options: TextTrackOptions, force: boolean) {
        const strOptions = JSON.stringify(options);
        if (!force && strOptions === this.prevOptions) return;

        this.options = options;
        this.initOptions();

        this.prevOptions = strOptions;

        this.renderText();
    }

    draw() {}

    renderText() {
        // this.pForeground.clear();
        // this.pForeground.removeChildren();

        const text = new PIXI.Text(this.text, this.textOptions);
        text.interactive = true;
        text.anchor.x = 0;
        text.anchor.y = 0;
        text.visible = true;
        text.y = this.options.offsetY;

        const margin = 5;
        text.x = margin;

        if (!this.isTrackShownVertically) {
            if (this.options.align === 'left') {
                text.anchor.x = 0;
                text.x = margin;
                this.svgAnchor = 'start';
            } else if (this.options.align === 'middle') {
                text.anchor.x = 0.5;
                text.x = this.dimensions[0] / 2;
                this.svgAnchor = 'middle';
            } else if (this.options.align === 'right') {
                text.anchor.x = 1;
                text.x = this.dimensions[0] - margin;
                this.svgAnchor = 'end';
            }
        } else {
            if (this.options.align === 'right') {
                text.anchor.x = 1;
                text.scale.x *= -1;
                this.svgAnchor = 'end';
            } else if (this.options.align === 'middle') {
                text.anchor.x = 0.5;
                text.scale.x *= -1;
                text.x = this.dimensions[0] / 2;
                this.svgAnchor = 'middle';
            } else if (this.options.align === 'left') {
                text.anchor.x = 0;
                text.scale.x *= -1;
                text.x = this.dimensions[0] - margin;
                this.svgAnchor = 'start';
            }
        }

        this.svgX = text.x;

        this.pForeground.addChild(text);
    }

    setDimensions(newDimensions: [number, number]) {
        super.setDimensions(newDimensions);
        // We have to rerender here, otherwise it does not fire at all sometimes
        this.rerender(this.options, false);
    }

    getMouseOverHtml() {}

    exportSVG() {
        let track = null;
        let base = null;

        base = document.createElement('g');
        track = base;

        const clipPathId = uuid();

        const gClipPath = document.createElement('g');
        gClipPath.setAttribute('style', `clip-path:url(#${clipPathId});`);

        track.appendChild(gClipPath);

        // define the clipping area as a polygon defined by the track's
        // dimensions on the canvas
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', clipPathId);
        track.appendChild(clipPath);

        const clipPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        clipPath.appendChild(clipPolygon);

        clipPolygon.setAttribute(
            'points',
            `${this.position[0]},${this.position[1]} ` +
                `${this.position[0] + this.dimensions[0]},${this.position[1]} ` +
                `${this.position[0] + this.dimensions[0]},${this.position[1] + this.dimensions[1]} ` +
                `${this.position[0]},${this.position[1] + this.dimensions[1]} `
        );

        const output = document.createElement('g');

        output.setAttribute('transform', `translate(${this.position[0]},${this.position[1]})`);

        gClipPath.appendChild(output);

        // Background
        const gBackground = document.createElement('g');
        const rBackground = document.createElement('path');
        const dBackground = `M 0 0 H ${this.dimensions[0]} V ${this.dimensions[1]} H 0 Z`;
        rBackground.setAttribute('d', dBackground);
        rBackground.setAttribute('fill', this.options.backgroundColor);
        rBackground.setAttribute('opacity', '1');
        gBackground.appendChild(rBackground);
        output.appendChild(gBackground);

        // Text
        const gText = document.createElement('g');
        const t = document.createElement('text');
        t.setAttribute('text-anchor', this.svgAnchor);
        t.setAttribute('font-family', this.options.fontFamily);
        t.setAttribute('font-size', `${this.fontSize}px`);
        //t.setAttribute("alignment-baseline", "top");
        t.setAttribute('font-weight', this.options.fontWeight);

        gText.setAttribute('transform', `scale(1,1)`);

        t.setAttribute('fill', this.options.textColor);
        t.innerHTML = this.options.text;

        const scalefactor = this.isTrackShownVertically ? -1 : 1;

        gText.appendChild(t);
        gText.setAttribute(
            'transform',
            `translate(${this.svgX},${this.options.offsetY + this.fontSize})scale(${scalefactor},1)`
        );
        output.appendChild(gText);

        return [base, base] as [typeof base, typeof base];
    }
}
