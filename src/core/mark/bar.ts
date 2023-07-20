import type { Tile } from 'src/tracks/gosling-track';
import type { Channel } from '@gosling.schema';
import type { GoslingTrackModel } from '../gosling-track-model';
import { group } from 'd3-array';
import type { PIXIVisualProperty } from '../visual-property.schema';
import { IsChannelDeep, IsStackedMark, getValueUsingChannel } from '../gosling.schema.guards';
import { cartesianToPolar, valueToRadian } from '../utils/polar';
import colorToHex from '../utils/color-to-hex';

export function drawBar(track: any, tile: Tile, model: GoslingTrackModel) {
    /* track spec */
    const spec = model.spec();

    if (!spec.width || !spec.height) {
        console.warn('Size of a track is not properly determined, so visual mark cannot be rendered');
        return;
    }

    /* data */
    const data = model.data();

    /* track size */
    const [trackWidth, trackHeight] = track.dimensions;
    const tileSize = track.tilesetInfo.tile_size;
    const zoomLevel =
        (model.getChannelScale('x') as any).invert(trackWidth) - (model.getChannelScale('x') as any).invert(0);

    /* circular parameters */
    const circular = spec.layout === 'circular';
    const trackInnerRadius = spec.innerRadius ?? 220;
    const trackOuterRadius = spec.outerRadius ?? 300; // TODO: should be smaller than Math.min(width, height)
    const startAngle = spec.startAngle ?? 0;
    const endAngle = spec.endAngle ?? 360;
    const trackRingSize = trackOuterRadius - trackInnerRadius;
    const cx = trackWidth / 2.0;
    const cy = trackHeight / 2.0;

    /* genomic scale */
    const xScale = model.getChannelScale('x');
    let tileUnitWidth: number;
    if (tile.tileData.tilePos) {
        const { tileX, tileWidth } = track.getTilePosAndDimensions(
            tile.tileData.zoomLevel,
            tile.tileData.tilePos,
            tileSize
        );
        tileUnitWidth = xScale(tileX + tileWidth / tileSize) - xScale(tileX);
    }

    /* row separation */
    const rowCategories = (model.getChannelDomainArray('row') as string[]) ?? ['___SINGLE_ROW___'];
    const rowHeight = trackHeight / rowCategories.length;
    const clipRow =
        !IsChannelDeep(spec.row) || (IsChannelDeep(spec.row) && typeof spec.row.clip === 'undefined') || spec.row.clip;

    /* baseline */
    const baselineValue = IsChannelDeep(spec.y) ? spec.y?.baseline : undefined;
    const staticBaseY = model.encodedValue('y', baselineValue) ?? 0;

    /* render */
    const g = tile.graphics;
    if (IsStackedMark(spec)) {
        // TODO: many parts in this scope are identical to the below `else` statement, so encaptulate this?
        // const rowGraphics = tile.graphics; // new HGC.libraries.PIXI.Graphics(); // only one row for stacked marks

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
                const color = model.encodedPIXIProperty('color', d);
                const stroke = model.encodedPIXIProperty('stroke', d);
                const strokeWidth = model.encodedPIXIProperty('strokeWidth', d);
                const opacity = model.encodedPIXIProperty('opacity', d);
                const y = model.encodedPIXIProperty('y', d);

                const barWidth = model.encodedPIXIProperty('width', d, { tileUnitWidth });

                const xs = model.encodedPIXIProperty('x-start', d, { markWidth: barWidth });
                const xe = xs + barWidth;

                const alphaTransition = model.markVisibility(d, { width: barWidth, zoomLevel });
                const actualOpacity = Math.min(alphaTransition, opacity);

                if (actualOpacity === 0 || barWidth <= 0 || y <= 0) {
                    // do not draw invisible marks
                    return;
                }

                g.lineStyle(
                    strokeWidth,
                    colorToHex(stroke),
                    actualOpacity,
                    0 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
                );

                let polygonForMouseEvents: number[] = [];

                if (circular) {
                    const farR = trackOuterRadius - ((rowHeight - prevYEnd) / trackHeight) * trackRingSize;
                    const nearR = trackOuterRadius - ((rowHeight - y - prevYEnd) / trackHeight) * trackRingSize;

                    const sPos = cartesianToPolar(xs, trackWidth, nearR, cx, cy, startAngle, endAngle);
                    const startRad = valueToRadian(xs, trackWidth, startAngle, endAngle);
                    const endRad = valueToRadian(xs + barWidth, trackWidth, startAngle, endAngle);

                    g.beginFill(colorToHex(color), color === 'none' ? 0 : actualOpacity);
                    g.moveTo(sPos.x, sPos.y);
                    g.arc(cx, cy, nearR, startRad, endRad, true);
                    g.arc(cx, cy, farR, endRad, startRad, false);
                    polygonForMouseEvents = Array.from(g.currentPath.points);
                    g.closePath();
                } else {
                    g.beginFill(colorToHex(color), color === 'none' ? 0 : actualOpacity);
                    g.drawRect(xs, rowHeight - y - prevYEnd, barWidth, y);
                    const ys = rowHeight - y - prevYEnd;
                    const ye = ys + y;
                    polygonForMouseEvents = [xs, ys, xs, ye, xe, ye, xe, ys];
                }

                /* Mouse Events */
                model.getMouseEventModel().addPolygonBasedEvent(d, polygonForMouseEvents);

                prevYEnd += y;
            });
        });
    } else {
        rowCategories.forEach(rowCategory => {
            const rowPosition = model.encodedValue('row', rowCategory);

            data.filter(d => {
                const rowValue = getValueUsingChannel(d, spec.row as Channel);
                return !rowValue || rowValue === rowCategory;
            }).forEach(d => {
                const color = model.encodedPIXIProperty('color', d);
                const stroke = model.encodedPIXIProperty('stroke', d);
                const strokeWidth = model.encodedPIXIProperty('strokeWidth', d);
                const opacity = model.encodedPIXIProperty('opacity');
                let y = model.encodedPIXIProperty('y', d);
                let ye = model.encodedPIXIProperty('ye', d);

                if (typeof ye !== 'undefined' && y > ye) {
                    // ensure `ye` is larger
                    [y, ye] = [ye, y];
                }

                const barWidth = model.encodedPIXIProperty('width', d, { tileUnitWidth });
                const xs = model.encodedPIXIProperty('x-start', d, { markWidth: barWidth });
                const xe = xs + barWidth;

                let ys: number;
                if (typeof ye === 'undefined') {
                    ys = rowPosition + rowHeight - staticBaseY - y;
                    ye = rowPosition + rowHeight - staticBaseY;

                    // Flip the bar along y-axis
                    if ((IsChannelDeep(spec.y) && spec.y.flip) || spec.flipY) {
                        ye = ys;
                        ys = rowPosition;
                    }
                } else {
                    ys = rowPosition + rowHeight - ye;
                    ye = rowPosition + rowHeight - y;
                }

                // If the position exceeds the given scale, clip it!
                if (clipRow) {
                    ys = Math.max(rowPosition, ys);
                    ys = Math.min(ys, rowPosition + rowHeight);
                    ye = Math.max(rowPosition, ye);
                    ye = Math.min(ye, rowPosition + rowHeight);
                }

                const alphaTransition = model.markVisibility(d, { width: barWidth, zoomLevel });
                const actualOpacity = Math.min(alphaTransition, opacity);

                if (actualOpacity === 0 || barWidth === 0 || ye - ys === 0) {
                    // do not draw invisible marks
                    return;
                }

                g.lineStyle(
                    strokeWidth,
                    colorToHex(stroke),
                    actualOpacity,
                    0 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
                );

                let polygonForMouseEvents: number[] = [];

                if (circular) {
                    const farR = trackOuterRadius - (ys / trackHeight) * trackRingSize;
                    const nearR = trackOuterRadius - (ye / trackHeight) * trackRingSize;

                    const sPos = cartesianToPolar(xs, trackWidth, nearR, cx, cy, startAngle, endAngle);
                    const startRad = valueToRadian(xs, trackWidth, startAngle, endAngle);
                    const endRad = valueToRadian(xs + barWidth, trackWidth, startAngle, endAngle);

                    g.beginFill(colorToHex(color), color === 'none' ? 0 : actualOpacity);
                    g.moveTo(sPos.x, sPos.y);
                    g.arc(cx, cy, nearR, startRad, endRad, true);
                    g.arc(cx, cy, farR, endRad, startRad, false);
                    polygonForMouseEvents = Array.from(g.currentPath.points);
                    g.closePath();
                } else {
                    g.beginFill(colorToHex(color), color === 'none' ? 0 : actualOpacity);
                    g.drawRect(xs, ys, barWidth, ye - ys);
                    polygonForMouseEvents = [xs, ys, xs, ye, xe, ye, xe, ys];
                }

                /* Mouse Events */
                model.getMouseEventModel().addPolygonBasedEvent(d, polygonForMouseEvents);
            });
        });
    }
}

export function barProperty(
    gm: GoslingTrackModel,
    propertyKey: PIXIVisualProperty,
    datum?: { [k: string]: string | number },
    additionalInfo?: {
        tileUnitWidth?: number;
        markWidth?: number;
    }
) {
    const x = gm.visualPropertyByChannel('x', datum);
    const xe = gm.visualPropertyByChannel('xe', datum);
    const size = gm.visualPropertyByChannel('size', datum);
    switch (propertyKey) {
        case 'width':
            return size ?? (xe ? xe - x : additionalInfo?.tileUnitWidth);
        case 'x-start':
            if (!additionalInfo?.markWidth) {
                // `markWidth` is required
                return undefined;
            }
            return xe ? (x + xe - additionalInfo?.markWidth) / 2.0 : x - additionalInfo?.markWidth / 2.0;
        default:
            return undefined;
    }
}
