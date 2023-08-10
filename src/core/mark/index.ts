import type { Tile } from '@gosling-lang/gosling-track';
import type { GoslingTrackModel } from '../../tracks/gosling-track/gosling-track-model';
import { drawPoint } from './point';
import { drawLine } from './line';
import { drawBar } from './bar';
import { drawArea } from './area';
import { drawRect } from './rect';
import type { ChannelTypes } from '../../schema/gosling.schema';
import { drawTriangle } from './triangle';
import { drawText } from './text';
import { drawRule } from './rule';
import { drawWithinLink } from './withinLink';
import { drawGrid } from './grid';
import { drawCircularTitle } from './title';
import { drawChartOutlines } from './outline';
import { drawColorLegend, drawRowLegend } from './legend';
import { drawCircularYAxis, drawLinearYAxis } from './axis';
import { drawCircularOutlines } from './outline-circular';
import { drawBackground } from './background';
import type { CompleteThemeDeep } from '../utils/theme';
import { Is2DTrack, IsVerticalRule } from '../../schema/gosling.schema.guards';
import { drawBetweenLink } from './betweenLink';

/**
 * Visual channels currently supported for visual encoding.
 */
export const SUPPORTED_CHANNELS: (keyof typeof ChannelTypes)[] = [
    'x',
    'xe',
    'x1',
    'x1e',

    'y',
    'ye',
    'y1',
    'y1e',

    'color',
    'size',
    'row',
    'stroke',
    'strokeWidth',
    'opacity',
    'text'
    // ...
];

export const RESOLUTION = 4;

/**
 * Draw a track based on the track specification in a Gosling grammar.
 */
export function drawMark(HGC: import('@higlass/types').HGC, trackInfo: any, tile: Tile, model: GoslingTrackModel) {
    if (!HGC || !trackInfo || !tile) {
        // We did not receive parameters correctly.
        return;
    }

    if (model.spec().mark === 'brush') {
        // Interactive brushes are rendered by our another plugin track, called `gosling-brush`
        return;
    }

    // Replace the scale of a genomic axis with the one that is generated by the HiGlass data fetcher.
    (['x', 'x1', 'x1e', 'xe'] as const).forEach(d => {
        model.setChannelScale(d, trackInfo._xScale);
    });

    if (Is2DTrack(model.spec()) || IsVerticalRule(model.spec())) {
        // Since small numbers are positioned on the top in the y axis, we reverse the domain, making it consistent to regular y scale.
        const yScale = trackInfo._yScale.copy();
        yScale.range([yScale.range()[1], yScale.range()[0]]);

        ['y', 'y1', 'y1e', 'ye'].forEach((d: any) => {
            model.setChannelScale(d, yScale);
        });
    }

    // Size of a track
    const [trackWidth, trackHeight] = trackInfo.dimensions;

    /* spec */
    switch (model.spec().mark) {
        case 'point':
            drawPoint(trackInfo, tile.graphics, model);
            break;
        case 'bar':
            drawBar(trackInfo, tile, model);
            break;
        case 'line':
            drawLine(tile.graphics, model, trackWidth, trackHeight);
            break;
        case 'area':
            drawArea(HGC, trackInfo, tile, model);
            break;
        case 'rect':
            drawRect(HGC, trackInfo, tile, model);
            break;
        case 'triangleLeft':
        case 'triangleRight':
        case 'triangleBottom':
            drawTriangle(tile.graphics, model, trackWidth, trackHeight);
            break;
        case 'text':
            drawText(HGC, trackInfo, tile, model);
            break;
        case 'rule':
            drawRule(HGC, trackInfo, tile, model);
            break;
        case 'betweenLink':
            drawBetweenLink(tile.graphics, trackInfo, model);
            break;
        case 'withinLink':
            drawWithinLink(tile.graphics, trackInfo, model);
            break;
        default:
            console.warn('Unsupported mark type');
            break;
    }
}

/**
 * Draw chart embellishments before rendering marks.
 */
export function drawPreEmbellishment(
    HGC: import('@higlass/types').HGC,
    trackInfo: any,
    tile: Tile,
    model: GoslingTrackModel,
    theme: Required<CompleteThemeDeep>
) {
    if (!HGC || !trackInfo || !tile) {
        // We did not receive parameters correctly.
        return;
    }

    if (model.spec().mark === 'brush') {
        // We do not draw brush. Instead, higlass do.
        return;
    }
    // Replace the scale of a genomic axis with the one that is generated by the HiGlass data fetcher.
    (['x', 'x1', 'x1e', 'xe'] as const).forEach(d => {
        model.setChannelScale(d, trackInfo._xScale);
    });

    const isCircular = model.spec().layout === 'circular';

    if (isCircular) {
        drawCircularOutlines(trackInfo, model, theme);
    } else {
        drawBackground(trackInfo, model, theme);
        drawChartOutlines(trackInfo, model, theme);
    }
    drawGrid(trackInfo, model, theme);
}

/**
 * Draw chart embellishments after rendering marks.
 */
export function drawPostEmbellishment(
    HGC: import('@higlass/types').HGC,
    trackInfo: any,
    tile: Tile,
    model: GoslingTrackModel,
    theme: Required<CompleteThemeDeep>
) {
    if (!HGC || !trackInfo || !tile) {
        // We did not receive parameters correctly.
        return;
    }

    if (model.spec().mark === 'brush') {
        // We do not draw brush. Instead, higlass do.
        return;
    }
    // Replace the scale of a genomic axis with the one that is generated by the HiGlass data fetcher.
    (['x', 'x1', 'x1e', 'xe'] as const).forEach(d => {
        model.setChannelScale(d, trackInfo._xScale);
    });

    const isCircular = model.spec().layout === 'circular';

    if (isCircular) {
        drawCircularYAxis(HGC, trackInfo, tile, model, theme);
        drawCircularTitle(HGC, trackInfo, tile, model, theme);
    } else {
        drawLinearYAxis(HGC, trackInfo, tile, model, theme);
        drawRowLegend(HGC, trackInfo, tile, model, theme);
    }
    drawColorLegend(HGC, trackInfo, tile, model, theme);
}
