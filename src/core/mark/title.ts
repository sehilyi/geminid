import type * as PIXI from 'pixi.js';
import type { Tile } from 'src/tracks/gosling-track';
import type { GoslingTrackModel } from '../gosling-track-model';
import { cartesianToPolar, valueToRadian } from '../utils/polar';
import colorToHex from '../utils/color-to-hex';
import type { CompleteThemeDeep } from '../utils/theme';
import { getTextStyle } from '../utils/text-style';

export function drawCircularTitle(
    HGC: import('@higlass/types').HGC,
    trackInfo: any,
    tile: Tile,
    model: GoslingTrackModel,
    theme: Required<CompleteThemeDeep>
) {
    const spec = model.spec();
    const { title } = spec;

    if (spec.layout !== 'circular') {
        // Wrong function call, this is for circular tracks.
        return;
    }

    if (!title) {
        // No point to render a title.
        return;
    }

    /* track size */
    const [tw, th] = trackInfo.dimensions;

    /* circular parameters */
    const trackOuterRadius = spec.outerRadius ?? 300;
    const startAngle = spec.startAngle ?? 0;
    const endAngle = spec.endAngle ?? 360;
    const cx = tw / 2.0;
    const cy = th / 2.0;

    /* render */
    const g = tile.graphics; // We do not use `pBorder` as in linear layouts.

    // The current position, i.e., radius, of this label
    const titleR = trackOuterRadius - 1;

    // The position of a tick in the polar system
    const padding = 1;
    const pos = cartesianToPolar(padding, tw, titleR, cx, cy, startAngle, endAngle);

    /* Title label */
    const styleConfig = getTextStyle({
        color: theme.track.titleColor,
        size: 12, // `theme.track.titleFontSize` seems to use much larger fonts
        fontFamily: theme.axis.labelFontFamily, // TODO: support
        fontWeight: theme.axis.labelFontWeight // TODO: support
    });
    const textGraphic = new HGC.libraries.PIXI.Text(title, styleConfig);
    textGraphic.anchor.x = 1;
    textGraphic.anchor.y = 0.5;
    textGraphic.position.x = pos.x;
    textGraphic.position.y = pos.y;

    textGraphic.resolution = 4;
    const txtStyle = new HGC.libraries.PIXI.TextStyle(styleConfig);
    const metric = HGC.libraries.PIXI.TextMetrics.measureText(textGraphic.text, txtStyle);

    // Scale the width of text label so that its width is the same when converted into circular form
    const txtWidth = ((metric.width / (2 * titleR * Math.PI)) * tw * 360) / (endAngle - startAngle);
    const scaledStartX = padding;
    const scaledEndX = padding + txtWidth;

    // Determine the points of a rope element for a lebel
    const ropePoints: PIXI.Point[] = [];
    for (let i = scaledEndX; i >= scaledStartX; i -= txtWidth / 10.0) {
        const p = cartesianToPolar(i, tw, titleR - metric.height / 2.0, cx, cy, startAngle, endAngle);
        ropePoints.push(new HGC.libraries.PIXI.Point(p.x, p.y));
    }

    /* Background */
    const startRad = valueToRadian(scaledStartX, tw, startAngle, endAngle);
    const endRad = valueToRadian(scaledEndX + padding, tw, startAngle, endAngle);

    g.lineStyle(1, colorToHex('red'), 0, 0.5);
    g.beginFill(colorToHex(theme.track.titleBackground), 0.5); // TODO: support `theme.track.titleBackgroundOpacity`
    g.moveTo(pos.x, pos.y);
    g.arc(cx, cy, titleR - metric.height, startRad, endRad, true);
    g.arc(cx, cy, titleR, endRad, startRad, false);
    g.closePath();

    // Render a label
    // @ts-expect-error, missing argument to updateText
    textGraphic.updateText();
    const rope = new HGC.libraries.PIXI.SimpleRope(textGraphic.texture, ropePoints);
    g.addChild(rope);
}
