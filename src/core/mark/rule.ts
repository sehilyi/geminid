import type { Tile } from 'src/tracks/gosling-track';
import type { Channel } from '@gosling.schema';
import type { GoslingTrackModel } from '../gosling-track-model';
import { getValueUsingChannel } from '../gosling.schema.guards';
import { cartesianToPolar, valueToRadian } from '../utils/polar';
import colorToHex from '../utils/color-to-hex';

export function drawRule(HGC: import('@higlass/types').HGC, trackInfo: any, tile: Tile, model: GoslingTrackModel) {
    /* track spec */
    const spec = model.spec();

    /* data */
    const data = model.data();

    /* track size */
    const [trackWidth, trackHeight] = trackInfo.dimensions;

    /* circular parameters */
    const circular = spec.layout === 'circular';
    const trackInnerRadius = spec.innerRadius ?? 220;
    const trackOuterRadius = spec.outerRadius ?? 300; // TODO: should be smaller than Math.min(width, height)
    const startAngle = spec.startAngle ?? 0;
    const endAngle = spec.endAngle ?? 360;
    const trackRingSize = trackOuterRadius - trackInnerRadius;
    const cx = trackWidth / 2.0;
    const cy = trackHeight / 2.0;

    /* row separation */
    const rowCategories: string[] = (model.getChannelDomainArray('row') as string[]) ?? ['___SINGLE_ROW___'];
    const rowHeight = trackHeight / rowCategories.length;

    /* style */
    const dashed = spec.style?.dashed;
    const linePattern = spec.style?.linePattern;
    const curved = spec.style?.curve;

    /* render */
    const g = tile.graphics;
    rowCategories.forEach(rowCategory => {
        const rowPosition = model.encodedValue('row', rowCategory);

        data.filter(
            d =>
                !getValueUsingChannel(d, spec.row as Channel) ||
                (getValueUsingChannel(d, spec.row as Channel) as string) === rowCategory
        ).forEach(d => {
            const x = model.encodedPIXIProperty('x', d);
            const xe = model.encodedPIXIProperty('xe', d);
            const y = model.encodedPIXIProperty('y', d); // y middle position
            const color = model.encodedPIXIProperty('color', d);
            const strokeWidth = model.encodedPIXIProperty('strokeWidth', d);
            const opacity = model.encodedPIXIProperty('opacity', d);

            const alphaTransition = model.markVisibility(d, {
                width: xe - x,
                zoomLevel: trackInfo._xScale.invert(trackWidth) - trackInfo._xScale.invert(0)
            });
            const actualOpacity = Math.min(alphaTransition, opacity);

            g.lineStyle(
                strokeWidth,
                colorToHex(color),
                actualOpacity, // alpha
                0.5 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
            );

            // TODO: Large parts of the following code blocks can be reused, reducing the lines
            // Does this rule span entire width or height of a track?
            if (!xe && (!spec.y || !('field' in spec.y))) {
                /* vertical rule */
                if (circular) {
                    // TODO:
                    return;
                } else {
                    if (dashed) {
                        const [dashSize, gapSize] = dashed;
                        let curPos = 0;

                        do {
                            g.moveTo(x, curPos);
                            g.lineTo(x, curPos + dashSize);
                            curPos += dashSize + gapSize;
                        } while (curPos < trackHeight);
                    } else {
                        g.moveTo(x, 0);
                        g.lineTo(x, trackHeight);
                    }
                }
            } else if (!xe && y) {
                // TODO: draw only single rule regardless of multiple tiles.
                /* horizontal rule */
                if (circular) {
                    // Actually, we are drawing arcs instead of lines, so lets remove stroke.
                    g.lineStyle(
                        strokeWidth,
                        colorToHex(color),
                        0, // alpha
                        0.5 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
                    );

                    const midR = trackOuterRadius - ((rowPosition + y) / trackHeight) * trackRingSize;
                    const farR = midR + strokeWidth / 2.0;
                    const nearR = midR - strokeWidth / 2.0;

                    const sPos = cartesianToPolar(0, trackWidth, nearR, cx, cy, startAngle, endAngle);
                    const startRad = valueToRadian(0, trackWidth, startAngle, endAngle);
                    const endRad = valueToRadian(trackWidth, trackWidth, startAngle, endAngle);

                    g.beginFill(colorToHex(color), actualOpacity);
                    g.moveTo(sPos.x, sPos.y);
                    g.arc(cx, cy, nearR, startRad, endRad, true);
                    g.arc(cx, cy, farR, endRad, startRad, false);
                    g.closePath();
                } else {
                    if (dashed) {
                        const [dashSize, gapSize] = dashed;
                        let curPos = 0;

                        do {
                            g.moveTo(curPos, rowPosition + rowHeight - y);
                            g.lineTo(curPos + dashSize, rowPosition + rowHeight - y);
                            curPos += dashSize + gapSize;
                        } while (curPos < trackWidth);
                    } else {
                        g.moveTo(0, rowPosition + rowHeight - y);
                        g.lineTo(trackWidth, rowPosition + rowHeight - y);
                    }
                }
            } else {
                if (circular) {
                    // !!! Currently, we only support simple straight lines for circular layouts.
                    if (strokeWidth === 0) {
                        // Do not render invisible elements.
                        return;
                    }

                    // Actually, we are drawing arcs instead of lines, so lets remove stroke.
                    g.lineStyle(
                        strokeWidth,
                        colorToHex(color),
                        0, // alpha
                        0.5 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
                    );

                    const midR = trackOuterRadius - ((rowPosition + y) / trackHeight) * trackRingSize;
                    const farR = midR + strokeWidth / 2.0;
                    const nearR = midR - strokeWidth / 2.0;

                    const sPos = cartesianToPolar(x, trackWidth, nearR, cx, cy, startAngle, endAngle);
                    const startRad = valueToRadian(x, trackWidth, startAngle, endAngle);
                    const endRad = valueToRadian(xe, trackWidth, startAngle, endAngle);

                    g.beginFill(colorToHex(color), actualOpacity);
                    g.moveTo(sPos.x, sPos.y);
                    g.arc(cx, cy, nearR, startRad, endRad, true);
                    g.arc(cx, cy, farR, endRad, startRad, false);
                    g.closePath();
                } else if (dashed) {
                    const [dashSize, gapSize] = dashed;
                    let curPos = x;

                    do {
                        g.moveTo(curPos, rowPosition + rowHeight - y);
                        g.lineTo(curPos + dashSize, rowPosition + rowHeight - y);
                        curPos += dashSize + gapSize;
                    } while (curPos < xe);
                } else {
                    /* regular horizontal lines */
                    if (curved === undefined) {
                        g.moveTo(x, rowPosition + rowHeight - y);
                        g.lineTo(xe, rowPosition + rowHeight - y);
                    } else if (curved === 'top') {
                        // TODO: to default value
                        const CURVE_HEIGHT = 2;
                        ///

                        const xm = x + (xe - x) / 2.0;

                        g.moveTo(x, rowPosition + rowHeight - y + CURVE_HEIGHT / 2.0);
                        g.lineTo(xm, rowPosition + rowHeight - y - CURVE_HEIGHT / 2.0);
                        g.moveTo(xm, rowPosition + rowHeight - y - CURVE_HEIGHT / 2.0);
                        g.lineTo(xe, rowPosition + rowHeight - y + CURVE_HEIGHT / 2.0);
                    }
                }

                if (linePattern && curved === undefined && !circular) {
                    const { type: pType, size: pSize } = linePattern;
                    let curPos = Math.max(x, 0); // saftly start from visible position

                    g.lineStyle(0);

                    // TODO: to default value
                    const PATTERN_GAP_SIZE = pSize * 2;
                    ///

                    let count = 0;
                    while (curPos < Math.min(xe, trackWidth) && count < 100) {
                        const x0 = curPos;
                        const x1 = curPos + pSize;
                        const ym = rowPosition + rowHeight - y;
                        const y0 = ym - pSize / 2.0;
                        const y1 = ym + pSize / 2.0;

                        g.beginFill(colorToHex(color), actualOpacity);
                        g.drawPolygon(
                            pType === 'triangleLeft'
                                ? [x1, y0, x0, ym, x1, y1, x1, y0]
                                : [x0, y0, x1, ym, x0, y1, x0, y0]
                        );
                        g.endFill();
                        curPos += pSize + PATTERN_GAP_SIZE;

                        count++;

                        // saftly end before the visible position
                    }
                }
            }
        });
    });
}
