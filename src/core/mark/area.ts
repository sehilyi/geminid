import { min as d3min, max as d3max, group } from 'd3-array';
import type { Channel, Datum } from '@gosling.schema';
import type { Tile } from 'src/tracks/gosling-track';
import type { GoslingTrackModel } from '../gosling-track-model';
import { IsStackedMark, getValueUsingChannel } from '../gosling.schema.guards';
import { cartesianToPolar } from '../utils/polar';
import colorToHex from '../utils/color-to-hex';

/**
 * Draw area marks
 */
export function drawArea(HGC: import('@higlass/types').HGC, track: any, tile: Tile, model: GoslingTrackModel) {
    /* track spec */
    const spec = model.spec();

    /* data */
    const data = model.data();

    /* track size */
    const [trackWidth, trackHeight] = track.dimensions;

    /* circular parameters */
    const circular = spec.layout === 'circular';
    const trackInnerRadius = spec.innerRadius ?? 220; // TODO: should default values be filled already
    const trackOuterRadius = spec.outerRadius ?? 300; // TODO: should be smaller than Math.min(width, height)
    const startAngle = spec.startAngle ?? 0;
    const endAngle = spec.endAngle ?? 360;
    const trackRingSize = trackOuterRadius - trackInnerRadius;
    const trackCenterX = trackWidth / 2.0;
    const trackCenterY = trackHeight / 2.0;

    /* genomic scale */
    const xScale = track._xScale;

    /* row separation */
    const rowCategories = (model.getChannelDomainArray('row') as string[]) ?? ['___SINGLE_ROW___'];
    const rowHeight = trackHeight / rowCategories.length;

    /* color separation */
    const colorCategories = (model.getChannelDomainArray('color') as string[]) ?? ['___SINGLE_COLOR___'];

    /* constant values */
    // we do not support encoding opacity, strokeWidth, and stroke for area marks
    const constantOpacity = model.encodedPIXIProperty('opacity');
    const constantStrokeWidth = model.encodedPIXIProperty('strokeWidth');
    const constantStroke = model.encodedPIXIProperty('stroke');

    /* render */
    const graphics = tile.graphics;
    if (IsStackedMark(spec)) {
        // TODO: many parts in this scope are identical as the below `else` statement, so encaptulate this?

        const genomicChannel = model.getGenomicChannel();
        if (!genomicChannel || !genomicChannel.field) {
            console.warn('Genomic field is not provided in the specification');
            return;
        }
        const pivotedData = group(data, d => d[genomicChannel.field as string]);
        const genomicPosCategories = [...pivotedData.keys()]; // TODO: make sure to be sorted from left to right or top to bottom

        // stroke
        graphics.lineStyle(
            constantStrokeWidth,
            colorToHex(constantStroke),
            constantOpacity,
            1 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
        );

        const prevYEndByGPos: { [k: string]: number } = {};

        // TODO: we can have a multiple rows when color and row are mapped with different fields
        // are marks are drawn for each color
        colorCategories.forEach(colorCategory => {
            // we have two sets of points since we need to draw the bottom line as well
            const areaPointsTop: number[][] = [];
            const areaPointsBottom: number[][] = [];

            // TODO: users may want to align rows by values
            genomicPosCategories.forEach((genomicPosCategory, i, array) => {
                pivotedData
                    .get(genomicPosCategory)
                    ?.filter(d => getValueUsingChannel(d, spec.color as Channel) === colorCategory)
                    ?.forEach(d => {
                        const xValue = +genomicPosCategory;

                        const cx = xScale(xValue);
                        const cy = d3max([model.encodedPIXIProperty('y', d), 0]); // make should not to overflow

                        if (typeof prevYEndByGPos[genomicPosCategory] === 'undefined') {
                            prevYEndByGPos[genomicPosCategory] = 0;
                        }

                        const ys = rowHeight - cy - prevYEndByGPos[genomicPosCategory];
                        const ye = rowHeight - prevYEndByGPos[genomicPosCategory];

                        if (circular) {
                            if (i === 0) {
                                // start position of the polygon
                                const r = trackOuterRadius - (rowHeight / trackHeight) * trackRingSize;
                                const pos = cartesianToPolar(
                                    cx,
                                    trackWidth,
                                    r,
                                    trackCenterX,
                                    trackCenterY,
                                    startAngle,
                                    endAngle
                                );
                                areaPointsTop.push([pos.x, pos.y]);
                                areaPointsBottom.push([pos.x, pos.y]);
                            }

                            const rTop = trackOuterRadius - (ys / trackHeight) * trackRingSize;
                            const posTop = cartesianToPolar(
                                cx,
                                trackWidth,
                                rTop,
                                trackCenterX,
                                trackCenterY,
                                startAngle,
                                endAngle
                            );
                            areaPointsTop.push([posTop.x, posTop.y]);

                            const rBot = trackOuterRadius - (ye / trackHeight) * trackRingSize;
                            const posBot = cartesianToPolar(
                                cx,
                                trackWidth,
                                rBot,
                                trackCenterX,
                                trackCenterY,
                                startAngle,
                                endAngle
                            );
                            areaPointsBottom.push([posBot.x, posBot.y]);

                            if (i === array.length - 1) {
                                // end position of the polygon
                                const r = trackOuterRadius - (rowHeight / trackHeight) * trackRingSize;
                                const pos = cartesianToPolar(
                                    cx,
                                    trackWidth,
                                    r,
                                    trackCenterX,
                                    trackCenterY,
                                    startAngle,
                                    endAngle
                                );
                                areaPointsTop.push([pos.x, pos.y]);
                                areaPointsBottom.push([pos.x, pos.y]);
                            }

                            /* Mouse Events */
                            model.getMouseEventModel().addPointBasedEvent(d, [posBot.x, posBot.y, 1]);
                        } else {
                            if (i === 0) {
                                // start position of the polygon
                                areaPointsTop.push([cx, rowHeight]); // TODO: confirm if this is correct
                                areaPointsBottom.push([cx, rowHeight]);
                            }

                            areaPointsTop.push([cx, ys]);
                            areaPointsBottom.push([cx, ye]);

                            if (i === array.length - 1) {
                                // end position of the polygon
                                areaPointsTop.push([cx, rowHeight]);
                                areaPointsBottom.push([cx, rowHeight]);
                            }

                            /* Mouse Events */
                            model.getMouseEventModel().addPointBasedEvent(d, [cx, ys, 1]);
                        }

                        prevYEndByGPos[genomicPosCategory] += cy;
                    });
            });
            const color = model.encodedValue('color', colorCategory);
            graphics.beginFill(colorToHex(color), constantOpacity);
            graphics.drawPolygon([
                ...areaPointsTop.reduce((a, b) => a.concat(b)),
                ...areaPointsBottom.reverse().reduce((a, b) => a.concat(b))
            ]);
            graphics.endFill();
        });
    } else {
        rowCategories.forEach(rowCategory => {
            const rowPosition = model.encodedValue('row', rowCategory);

            // stroke
            graphics.lineStyle(
                constantStrokeWidth,
                colorToHex(constantStroke),
                constantOpacity,
                0 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
            );

            // area marks are drawn for each color
            colorCategories.forEach(colorCategory => {
                const baselinePoints: number[][] = [];
                const areaPoints: number[] = [];
                const baselineR = trackOuterRadius - ((rowPosition + rowHeight) / trackHeight) * trackRingSize;
                let startX = 0;

                data.filter(
                    d =>
                        (typeof getValueUsingChannel(d, spec.row as Channel) === 'undefined' ||
                            (getValueUsingChannel(d, spec.row as Channel) as string) === rowCategory) &&
                        (typeof getValueUsingChannel(d, spec.color as Channel) === 'undefined' ||
                            (getValueUsingChannel(d, spec.color as Channel) as string) === colorCategory)
                )
                    .sort(
                        // should sort properly before visualizing it so that the path is correctly drawn
                        (a: Datum, b: Datum) => model.encodedPIXIProperty('x', a) - model.encodedPIXIProperty('x', b)
                    )
                    .forEach((d, i, array) => {
                        // TODO: this should be included in the `encodedValue` functions
                        // make should not to overflow when using use-defined `domain`
                        const cy = d3min([d3max([model.encodedPIXIProperty('y', d), 0]), rowHeight]);
                        const cx = model.encodedPIXIProperty('x', d);

                        if (circular) {
                            // we need to prepare the points for drawing baseline
                            const baselinePos = cartesianToPolar(
                                cx,
                                trackWidth,
                                baselineR,
                                trackCenterX,
                                trackCenterY,
                                startAngle,
                                endAngle
                            );
                            baselinePoints.push([baselinePos.x, baselinePos.y]);

                            if (i === 0) {
                                // start position of the polygon
                                areaPoints.push(baselinePos.x, baselinePos.y);
                            }

                            const r = trackOuterRadius - ((rowPosition + rowHeight - cy) / trackHeight) * trackRingSize;
                            const pos = cartesianToPolar(
                                cx,
                                trackWidth,
                                r,
                                trackCenterX,
                                trackCenterY,
                                startAngle,
                                endAngle
                            );
                            areaPoints.push(pos.x, pos.y);

                            if (i === array.length - 1) {
                                // close the polygon with a point at the start
                                const startR =
                                    trackOuterRadius - ((rowPosition + rowHeight) / trackHeight) * trackRingSize;
                                const curPos = cartesianToPolar(
                                    cx,
                                    trackWidth,
                                    startR,
                                    trackCenterX,
                                    trackCenterY,
                                    startAngle,
                                    endAngle
                                );

                                areaPoints.push(curPos.x, curPos.y);
                            }

                            /* Mouse Events */
                            model.getMouseEventModel().addPointBasedEvent(d, [pos.x, pos.y, 1]);
                        } else {
                            if (i === 0) {
                                // start position of the polygon
                                areaPoints.push(cx, rowPosition + rowHeight);
                                startX = cx;
                            }

                            areaPoints.push(cx, rowPosition + rowHeight - cy);

                            if (i === array.length - 1) {
                                // close the polygon with a point at the start
                                areaPoints.push(cx, rowPosition + rowHeight);
                                areaPoints.push(startX, rowPosition + rowHeight);
                            }

                            /* Mouse Events */
                            model.getMouseEventModel().addPointBasedEvent(d, [cx, rowPosition + rowHeight - cy, 1]);
                        }
                    });

                if (circular && baselinePoints.length !== 0) {
                    // Add baseline points
                    areaPoints.push(...baselinePoints.reverse().reduce((a, b) => a.concat(b)));
                }

                const color = model.encodedValue('color', colorCategory);
                graphics.beginFill(colorToHex(color), constantOpacity);
                graphics.drawPolygon(areaPoints);
                graphics.endFill();
            });
        });
    }
}
