import type { Tile } from 'src/tracks/gosling-track';
import type { Channel } from '@gosling.schema';
import type { GoslingTrackModel } from '../gosling-track-model';
import { group } from 'd3-array';
import { getValueUsingChannel, IsStackedMark } from '../gosling.schema.guards';
import { cartesianToPolar } from '../utils/polar';

// Merge with the one in the `utils/text-style.ts`
export const TEXT_STYLE_GLOBAL = {
    fontSize: '12px',
    fontFamily: 'sans-serif', // 'Arial',
    fontWeight: 'normal',
    fill: 'black',
    background: 'white',
    lineJoin: 'round',
    stroke: '#ffffff',
    strokeThickness: 0
} as const;

export function drawText(HGC: import('@higlass/types').HGC, trackInfo: any, tile: Tile, model: GoslingTrackModel) {
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
    const tcx = trackWidth / 2.0;
    const tcy = trackHeight / 2.0;

    /* row separation */
    const rowCategories = (model.getChannelDomainArray('row') as string[]) ?? ['___SINGLE_ROW___'];
    const rowHeight = trackHeight / rowCategories.length;

    /* styles */
    const dx = spec.style?.dx ?? 0;
    const dy = spec.style?.dy ?? 0;
    const textAnchor = !spec.style?.textAnchor ? 'middle' : spec.style.textAnchor;

    /* render */
    if (IsStackedMark(spec)) {
        if (circular) {
            // TODO: Not supported for circular layouts yet.
            return;
        }

        const rowGraphics = tile.graphics; // new HGC.libraries.PIXI.Graphics(); // only one row for stacked marks

        const genomicChannel = model.getGenomicChannel();
        if (!genomicChannel || !genomicChannel.field) {
            console.warn('Genomic field is not provided in the specification');
            return;
        }
        const pivotedData = group(data, d => d[genomicChannel.field as string]);
        const xKeys = [...pivotedData.keys()];

        // TODO: users may want to align rows by values
        xKeys.forEach(k => {
            let prevYEnd = 0;
            pivotedData.get(k)?.forEach(d => {
                const text = model.encodedPIXIProperty('text', d);
                const color = model.encodedPIXIProperty('color', d);
                const x = model.encodedPIXIProperty('x', d) + dx;
                const xe = model.encodedPIXIProperty('xe', d) + dx;
                const cx = model.encodedPIXIProperty('x-center', d) + dx;
                const y = model.encodedPIXIProperty('y', d) + dy;
                const size = model.encodedPIXIProperty('size', d);
                const stroke = model.encodedPIXIProperty('stroke', d);
                const strokeWidth = model.encodedPIXIProperty('strokeWidth', d);
                const opacity = model.encodedPIXIProperty('opacity', d);

                if (cx < 0 || cx > trackWidth) {
                    // we do not draw texts that are out of the view
                    return;
                }

                if (trackInfo.textsBeingUsed > 1000) {
                    // prevent from drawing too many text elements for the performance
                    return;
                }

                /* text styles */
                const localTextStyle = {
                    ...TEXT_STYLE_GLOBAL,
                    fontSize:
                        size ??
                        (spec.style?.textFontSize ? `${spec.style?.textFontSize}px` : TEXT_STYLE_GLOBAL.fontSize),
                    stroke: stroke ?? spec.style?.textStroke ?? TEXT_STYLE_GLOBAL.stroke,
                    strokeThickness: strokeWidth ?? spec.style?.textStrokeWidth ?? TEXT_STYLE_GLOBAL.strokeThickness,
                    fontWeight: spec.style?.textFontWeight ?? TEXT_STYLE_GLOBAL.fontWeight
                };
                const textStyleObj = new HGC.libraries.PIXI.TextStyle(localTextStyle);

                let textGraphic;
                if (trackInfo.textGraphics.length > trackInfo.textsBeingUsed) {
                    textGraphic = trackInfo.textGraphics[trackInfo.textsBeingUsed];
                    textGraphic.style.fill = color;
                    textGraphic.visible = true;
                    textGraphic.text = text;
                    textGraphic.alpha = 1;
                } else {
                    textGraphic = new HGC.libraries.PIXI.Text(text, {
                        ...localTextStyle,
                        fill: color
                    });
                    trackInfo.textGraphics.push(textGraphic);
                }

                const metric = HGC.libraries.PIXI.TextMetrics.measureText(text, textStyleObj);
                trackInfo.textsBeingUsed++;

                const alphaTransition = model.markVisibility(d, {
                    ...metric,
                    zoomLevel: trackInfo._xScale.invert(trackWidth) - trackInfo._xScale.invert(0)
                });
                const actualOpacity = Math.min(alphaTransition, opacity);

                if (!text || actualOpacity === 0) {
                    trackInfo.textsBeingUsed--;
                    textGraphic.visible = false;
                    return;
                }

                textGraphic.alpha = actualOpacity;

                textGraphic.resolution = 8;
                textGraphic.updateText();

                textGraphic.texture.baseTexture.scaleMode = HGC.libraries.PIXI.SCALE_MODES.LINEAR; // or .NEAREST

                const sprite = new HGC.libraries.PIXI.Sprite(textGraphic.texture);
                sprite.x = x;
                sprite.y = rowHeight - y - prevYEnd;
                sprite.width = xe - x;
                sprite.height = y;

                rowGraphics.addChild(sprite);

                prevYEnd += y;
            });
        });
    } else {
        rowCategories.forEach(rowCategory => {
            // we are separately drawing each row so that y scale can be more effectively shared across tiles without rerendering from the bottom
            const rowGraphics = tile.graphics;
            const rowPosition = model.encodedValue('row', rowCategory);

            data.filter(
                d =>
                    !getValueUsingChannel(d, spec.row as Channel) ||
                    (getValueUsingChannel(d, spec.row as Channel) as string) === rowCategory
            ).forEach(d => {
                const text = model.encodedPIXIProperty('text', d);
                const color = model.encodedPIXIProperty('color', d);
                const cx = model.encodedPIXIProperty('x-center', d) + dx;
                const y = model.encodedPIXIProperty('y', d) + dy;
                const size = model.encodedPIXIProperty('size', d);
                const stroke = model.encodedPIXIProperty('stroke', d);
                const strokeWidth = model.encodedPIXIProperty('strokeWidth', d);
                const opacity = model.encodedPIXIProperty('opacity', d);

                if (cx < 0 || cx > trackWidth) {
                    // we do not draw texts that are out of the view
                    return;
                }

                if (trackInfo.textsBeingUsed > 1000) {
                    // prevent from drawing too many text elements for the performance
                    return;
                }

                /* text styles */
                const localTextStyle = {
                    ...TEXT_STYLE_GLOBAL,
                    fontSize:
                        size ??
                        (spec.style?.textFontSize ? `${spec.style?.textFontSize}px` : TEXT_STYLE_GLOBAL.fontSize),
                    stroke: stroke ?? spec.style?.textStroke ?? TEXT_STYLE_GLOBAL.stroke,
                    strokeThickness: strokeWidth ?? spec.style?.textStrokeWidth ?? TEXT_STYLE_GLOBAL.strokeThickness,
                    fontWeight: spec.style?.textFontWeight ?? TEXT_STYLE_GLOBAL.fontWeight
                };
                const textStyleObj = new HGC.libraries.PIXI.TextStyle(localTextStyle);

                let textGraphic;
                if (trackInfo.textGraphics.length > trackInfo.textsBeingUsed) {
                    textGraphic = trackInfo.textGraphics[trackInfo.textsBeingUsed];
                    textGraphic.style.fill = color;
                    textGraphic.visible = true;
                    textGraphic.text = text;
                    textGraphic.alpha = 1;
                } else {
                    textGraphic = new HGC.libraries.PIXI.Text(text, {
                        ...localTextStyle,
                        fill: color
                    });
                    trackInfo.textGraphics.push(textGraphic);
                }

                const metric = HGC.libraries.PIXI.TextMetrics.measureText(text, textStyleObj);
                trackInfo.textsBeingUsed++;

                const alphaTransition = model.markVisibility(d, {
                    ...metric,
                    zoomLevel: trackInfo._xScale.invert(trackWidth) - trackInfo._xScale.invert(0)
                });
                const actualOpacity = Math.min(alphaTransition, opacity);

                if (!text || actualOpacity === 0) {
                    trackInfo.textsBeingUsed--;
                    textGraphic.visible = false;
                    return;
                }

                textGraphic.alpha = actualOpacity;
                textGraphic.anchor.y = 0.5;
                textGraphic.anchor.x = textAnchor === 'middle' ? 0.5 : textAnchor === 'start' ? 0 : 1;

                let polygonForMouseEvents: number[] = [];

                if (circular) {
                    const r = trackOuterRadius - ((rowPosition + rowHeight - y) / trackHeight) * trackRingSize;
                    const centerPos = cartesianToPolar(cx, trackWidth, r, tcx, tcy, startAngle, endAngle);
                    textGraphic.x = centerPos.x;
                    textGraphic.y = centerPos.y;

                    textGraphic.resolution = 4;
                    // const txtStyle = new HGC.libraries.PIXI.TextStyle(textStyleObj);
                    // const metric = HGC.libraries.PIXI.TextMetrics.measureText(textGraphic.text, txtStyle);

                    // scale the width of text label so that its width is the same when converted into circular form
                    const tw = (metric.width / (2 * r * Math.PI)) * trackWidth;
                    let [minX, maxX] = [cx - tw / 2.0, cx + tw / 2.0];

                    // make sure not to place the label on the origin
                    if (minX < 0) {
                        const gap = -minX;
                        minX = 0;
                        maxX += gap;
                    } else if (maxX > trackWidth) {
                        const gap = maxX - trackWidth;
                        maxX = trackWidth;
                        minX -= gap;
                    }

                    const ropePoints: import('pixi.js').Point[] = [];
                    const eventPointsFar: number[] = [];
                    const eventPointsNear: number[] = [];
                    for (let i = maxX; i >= minX; i -= tw / 10.0) {
                        const p = cartesianToPolar(i, trackWidth, r, tcx, tcy, startAngle, endAngle);
                        ropePoints.push(new HGC.libraries.PIXI.Point(p.x, p.y));

                        const pFar = cartesianToPolar(
                            i,
                            trackWidth,
                            r + metric.height / 2.0,
                            tcx,
                            tcy,
                            startAngle,
                            endAngle
                        );
                        const pNear = cartesianToPolar(
                            i,
                            trackWidth,
                            r - metric.height / 2.0,
                            tcx,
                            tcy,
                            startAngle,
                            endAngle
                        );
                        eventPointsFar.push(pFar.x, pFar.y);
                        if (i === maxX) {
                            eventPointsNear.push(pFar.y, pFar.x);
                        }
                        eventPointsNear.push(pNear.y, pNear.x);
                    }

                    textGraphic.updateText();
                    const rope = new HGC.libraries.PIXI.SimpleRope(textGraphic.texture, ropePoints);
                    rope.alpha = actualOpacity;
                    rowGraphics.addChild(rope);

                    /* Mouse Events */
                    eventPointsNear.reverse();
                    polygonForMouseEvents = eventPointsFar.concat(eventPointsNear);
                } else {
                    textGraphic.position.x = cx;
                    textGraphic.position.y = rowPosition + rowHeight - y;
                    rowGraphics.addChild(textGraphic);

                    /* Mouse Events */
                    const { height: h, width: w } = metric;
                    const ys = textGraphic.position.y - h / 2.0;
                    const ye = ys + h;
                    let xs = 0;
                    let xe = 0;
                    if (textAnchor === 'start') {
                        xs = cx;
                        xe = cx + w;
                    } else if (textAnchor === 'middle') {
                        xs = cx - w / 2;
                        xe = cx + w / 2;
                    } else {
                        xs = cx - w;
                        xe = cx;
                    }
                    polygonForMouseEvents = [xs, ys, xs, ye, xe, ye, xe, ys];
                }

                model.getMouseEventModel().addPolygonBasedEvent(d, polygonForMouseEvents);
            });
        });
    }
}
