import type { Tile } from 'src/tracks/gosling-track';
import type { GoslingTrackModel } from '../gosling-track-model';
import { cartesianToPolar, valueToRadian } from '../utils/polar';
import type { PIXIVisualProperty } from '../visual-property.schema';
import colorToHex from '../utils/color-to-hex';
import { IsChannelDeep } from '../gosling.schema.guards';

export function drawRect(HGC: import('@higlass/types').HGC, track: any, tile: Tile, model: GoslingTrackModel) {
    /* track spec */
    const spec = model.spec();

    /* data */
    const data = model.data();

    /* track size */
    const [trackWidth, trackHeight] = track.dimensions;

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
    const xScale = track._xScale;
    let tileUnitWidth: number;
    if (tile.tileData.tilePos) {
        const tileSize = track.tilesetInfo.tile_size;
        const { tileX, tileWidth } = track.getTilePosAndDimensions(
            tile.tileData.zoomLevel,
            tile.tileData.tilePos, // TODO: required parameter. Typing out `track` should address this issue.
            tileSize
        );
        tileUnitWidth = xScale(tileX + tileWidth / tileSize) - xScale(tileX);
    }

    /* row separation */
    const rowCategories: string[] = (model.getChannelDomainArray('row') as string[]) ?? ['___SINGLE_ROW___'];
    const rowHeight = trackHeight / rowCategories.length;
    const RPAD = IsChannelDeep(spec.row) && spec.row.padding ? spec.row.padding : 0;

    // TODO: what if quantitative Y field is used?
    const yCategories = (model.getChannelDomainArray('y') as string[]) ?? ['___SINGLE_Y_POSITION___'];
    const cellHeight = rowHeight / yCategories.length - RPAD * 2;

    /* render */
    const g = tile.graphics;
    data.forEach(d => {
        const rowPosition = model.encodedPIXIProperty('row', d) + RPAD;
        const x = model.encodedPIXIProperty('x', d);
        const color = model.encodedPIXIProperty('color', d);
        const stroke = model.encodedPIXIProperty('stroke', d);
        const strokeWidth = model.encodedPIXIProperty('strokeWidth', d);
        const opacity = model.encodedPIXIProperty('opacity', d);
        const rectWidth = model.encodedPIXIProperty('width', d, { markWidth: tileUnitWidth });
        const rectHeight = model.encodedPIXIProperty('height', d, { markHeight: cellHeight });
        const y = model.encodedPIXIProperty('y', d); // - rectHeight / 2.0; // It is top posiiton now

        const alphaTransition = model.markVisibility(d, {
            width: rectWidth,
            zoomLevel: track._xScale.invert(trackWidth) - track._xScale.invert(0)
        });
        const actualOpacity = Math.min(alphaTransition, opacity);

        if (actualOpacity === 0 || rectHeight === 0 || rectWidth <= 0.0001) {
            // No need to draw invisible objects
            return;
        }

        const [xs, xe, ys, ye] = [
            x,
            x + rectWidth,
            rowPosition + rowHeight - y - rectHeight / 2.0,
            rowPosition + rowHeight - y + rectHeight / 2.0
        ];

        const absoluteHeight = model.visualPropertyByChannel('size', d) ?? undefined; // TODO: this is making it complicated, way to simplify this?

        // stroke
        g.lineStyle(
            strokeWidth,
            colorToHex(stroke),
            actualOpacity, // alpha
            0.5 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
        );

        let polygonForMouseEvent: number[] = [];

        if (circular) {
            if (xe < 0 || trackWidth < xs) {
                // do not draw overflewed visual marks
                return;
            }

            // TODO: Does a `row` channel affect here?
            let farR = trackOuterRadius - (ys / trackHeight) * trackRingSize;
            let nearR = trackOuterRadius - (ye / trackHeight) * trackRingSize;

            if (absoluteHeight) {
                const midR = trackOuterRadius - ((rowPosition + y) / trackHeight) * trackRingSize;
                farR = midR - absoluteHeight / 2.0;
                nearR = midR + absoluteHeight / 2.0;
            }

            const sPos = cartesianToPolar(xs, trackWidth, nearR, cx, cy, startAngle, endAngle);
            const startRad = valueToRadian(xs, trackWidth, startAngle, endAngle);
            const endRad = valueToRadian(xe, trackWidth, startAngle, endAngle);

            g.beginFill(colorToHex(color === 'none' ? 'white' : color), color === 'none' ? 0 : actualOpacity);
            g.moveTo(sPos.x, sPos.y);
            g.arc(cx, cy, nearR, startRad, endRad, true);
            g.arc(cx, cy, farR, endRad, startRad, false);
            polygonForMouseEvent = Array.from(g.currentPath.points);
            g.closePath();
        } else {
            g.beginFill(colorToHex(color === 'none' ? 'white' : color), color === 'none' ? 0 : actualOpacity);
            g.drawRect(xs, ys, xe - xs, ye - ys);
            polygonForMouseEvent = [xs, ys, xs, ye, xe, ye, xe, ys];
        }

        /* Mouse Events */
        model.getMouseEventModel().addPolygonBasedEvent(d, polygonForMouseEvent);
    });
}

export function rectProperty(
    gm: GoslingTrackModel,
    propertyKey: PIXIVisualProperty,
    datum?: { [k: string]: string | number },
    additionalInfo?: {
        markHeight?: number;
        markWidth?: number;
    }
) {
    switch (propertyKey) {
        case 'width':
            const width =
                // (1) size
                gm.visualPropertyByChannel('xe', datum)
                    ? gm.visualPropertyByChannel('xe', datum) - gm.visualPropertyByChannel('x', datum)
                    : // (2) unit mark height
                      additionalInfo?.markWidth;
            return width === 0 ? 0.1 : width; // TODO: not sure if this is necessary for all cases. Perhaps, we can have an option.
        case 'height':
            return (
                // (1) size
                gm.visualPropertyByChannel('size', datum) ??
                // (2) unit mark height
                additionalInfo?.markHeight
            );
        default:
            return undefined;
    }
}
