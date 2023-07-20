import type { DisplayedLegend } from 'src/tracks/gosling-track';
import type { GoslingTrackModel } from '../gosling-track-model';
import { IsChannelDeep } from '../gosling.schema.guards';
import colorToHex from '../utils/color-to-hex';
import type { CompleteThemeDeep } from '../utils/theme';
import type { Dimension } from '../utils/position';
import { scaleLinear, type ScaleLinear } from 'd3-scale';
import { getTextStyle } from '../utils/text-style';
import type { SubjectPosition, D3DragEvent } from 'd3-drag';

// Just the libraries necesssary fro this module
type Libraries = Pick<typeof import('@higlass/libraries'), 'PIXI' | 'd3Selection' | 'd3Drag'>;

type LegendOffset = { offsetRight: number };

export function drawColorLegend(
    HGC: { libraries: Libraries },
    trackInfo: any,
    _tile: unknown,
    model: GoslingTrackModel,
    theme: Required<CompleteThemeDeep>
) {
    if (!trackInfo.gLegend) {
        // We do not have enough components to draw legends
        return;
    }

    trackInfo.gLegend.selectAll('.brush').remove();

    const spec = model.spec();
    const offset: LegendOffset = { offsetRight: 0 };

    if (IsChannelDeep(spec.color) && spec.color.legend) {
        switch (spec.color.type) {
            case 'nominal':
                drawColorLegendCategories(HGC, trackInfo, _tile, model, theme);
                break;
            case 'quantitative':
                drawColorLegendQuantitative(HGC, trackInfo, _tile, model, theme, 'color', offset);
                break;
        }
    }

    if (IsChannelDeep(spec.stroke) && spec.stroke.legend) {
        switch (spec.stroke.type) {
            case 'quantitative':
                drawColorLegendQuantitative(HGC, trackInfo, _tile, model, theme, 'stroke', offset);
                break;
        }
    }
}

export function drawColorLegendQuantitative(
    HGC: { libraries: Libraries },
    trackInfo: any,
    _tile: unknown,
    model: GoslingTrackModel,
    theme: Required<CompleteThemeDeep>,
    channelKey: 'color' | 'stroke',
    offset: LegendOffset
) {
    const spec = model.spec();

    const channel = spec[channelKey];
    if (!IsChannelDeep(channel) || channel.type !== 'quantitative' || !channel.legend) {
        // This means we do not need to draw legend
        return;
    }

    /* track size */
    const [trackX, trackY] = trackInfo.position;
    const [trackWidth, trackHeight] = trackInfo.dimensions;

    /* Visual Parameters */
    const legendWidth = 80;
    const legendHeight = trackHeight - 2 > 110 ? 110 : Math.max(trackHeight - 2, 40 - 2);
    const colorBarDim: Dimension = {
        top: 10,
        left: 55,
        width: 20,
        height: legendHeight - 20
    };
    const legendX = trackX + trackWidth - legendWidth - 1 - offset.offsetRight;
    const legendY = trackY + 1;

    /* Legend Components */
    const colorScale = model.getChannelScale(channelKey);
    // TODO: Use overloads to remove type-casting (via `as`)
    const colorDomain = model.getChannelDomainArray(channelKey) as [number, number] | undefined;

    if (!colorScale || !colorDomain) {
        // We do not have enough information for creating a color legend
        return;
    }

    /* render */
    const graphics = trackInfo.pBorder; // use pBorder not to be affected by zoomming

    // Background
    graphics.beginFill(colorToHex(theme.legend.background), theme.legend.backgroundOpacity);
    graphics.lineStyle(
        1,
        colorToHex(theme.legend.backgroundStroke),
        theme.legend.backgroundOpacity, // alpha
        0 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
    );
    graphics.drawRect(legendX, legendY, legendWidth, legendHeight);

    /* Lgend title */
    if (channel.title) {
        const titleStr = channel.title;

        // label text style
        const labelTextStyle = getTextStyle({
            color: theme.legend.labelColor,
            size: theme.legend.labelFontSize,
            fontWeight: theme.legend.labelFontWeight,
            fontFamily: theme.legend.labelFontFamily
        });

        const textGraphic = new HGC.libraries.PIXI.Text(titleStr, {
            ...labelTextStyle,
            fontWeight: 'bold'
        });
        textGraphic.anchor.x = 0;
        textGraphic.anchor.y = 0;
        textGraphic.position.x = legendX + 10;
        textGraphic.position.y = legendY + 10;

        const textStyleObj = new HGC.libraries.PIXI.TextStyle({ ...labelTextStyle, fontWeight: 'bold' });
        const textMetrics = HGC.libraries.PIXI.TextMetrics.measureText(titleStr, textStyleObj);

        graphics.addChild(textGraphic);

        // Adjust the color bar
        colorBarDim.top += textMetrics.height + 4;
        colorBarDim.height -= textMetrics.height + 4;
    }

    // Color bar
    const [startValue, endValue] = colorDomain as [number, number];
    const extent = endValue - startValue;
    const scaleOffset = IsChannelDeep(channel) && channel.scaleOffset ? channel.scaleOffset : [0, 1];

    [...Array(colorBarDim.height).keys()].forEach(y => {
        // For each pixel, draw a small rectangle with different color
        let value;
        const scaleOffsetSorted = Array.from(scaleOffset).sort();
        if (y / colorBarDim.height >= scaleOffsetSorted[1]) {
            value = endValue;
        } else if (y / colorBarDim.height <= scaleOffsetSorted[0]) {
            value = startValue;
        } else {
            const s1 = scaleLinear()
                .domain([colorBarDim.height * scaleOffsetSorted[0], colorBarDim.height * scaleOffsetSorted[1]])
                .range([0, colorBarDim.height]);
            const s2 = scaleLinear().domain([0, colorBarDim.height]).range([startValue, endValue]);
            value = s2(s1(y));
        }

        graphics.beginFill(
            colorToHex(colorScale(value)),
            1 // alpha
        );
        graphics.lineStyle(
            1,
            colorToHex(theme.legend.backgroundStroke),
            0, // alpha
            0.5 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
        );
        graphics.drawRect(
            legendX + colorBarDim.left,
            legendY + colorBarDim.top + colorBarDim.height - y,
            colorBarDim.width,
            1
        );
    });

    // Brush
    // Refer to https://github.com/higlass/higlass/blob/0b2cac5a770db6d55370a61d5dbbe09c4f577c68/app/scripts/HeatmapTiledPixiTrack.js#L580
    const BRUSH_HEIGHT = 4;
    type Datum = { y: number; id: number };
    trackInfo.colorBrushes = trackInfo.gLegend
        .append('g')
        .attr('class', channelKey)
        .selectAll(`.brush`)
        // We could consider using `_renderingId` to support multiple color legends in overlaid tracks.
        .data(
            scaleOffset.map((d, i) => {
                return { y: d, id: i };
            })
        )
        .enter()
        .append('rect')
        .attr('class', `brush`)
        .attr('pointer-events', 'all')
        .attr('cursor', 'ns-resize')
        .attr(
            'transform',
            (d: Datum) =>
                `translate(${legendX + colorBarDim.left}, ${
                    legendY + colorBarDim.top - BRUSH_HEIGHT / 2.0 + colorBarDim.height - colorBarDim.height * d.y
                })`
        )
        .attr('width', `${colorBarDim.width}px`)
        .attr('height', `${BRUSH_HEIGHT}px`)
        .attr('fill', 'lightgrey')
        .attr('stroke', 'black')
        .attr('stroke-width', '0.5px')
        .call(
            HGC.libraries.d3Drag
                .drag<Element, Datum>()
                .on('start', (event: D3DragEvent<SVGElement, Datum, SubjectPosition>) => {
                    trackInfo.startEvent = event.sourceEvent;
                })
                .on('drag', (event: D3DragEvent<SVGElement, Datum, SubjectPosition>, d: Datum) => {
                    if (channel && channel.scaleOffset) {
                        const endEvent = event.sourceEvent;
                        const diffY = trackInfo.startEvent.clientY - endEvent.clientY;
                        const newScaleOffset = [channel.scaleOffset[0], channel.scaleOffset[1]];
                        if (d.id === 0) {
                            newScaleOffset[0] += diffY / colorBarDim.height;
                        } else {
                            newScaleOffset[1] += diffY / colorBarDim.height;
                        }
                        newScaleOffset[0] = Math.min(1, Math.max(0, newScaleOffset[0]));
                        newScaleOffset[1] = Math.min(1, Math.max(0, newScaleOffset[1]));
                        trackInfo.updateScaleOffsetFromOriginalSpec(spec._renderingId, newScaleOffset, channelKey);
                        trackInfo.shareScaleOffsetAcrossTracksAndTiles(newScaleOffset, channelKey);
                        trackInfo.draw();
                        trackInfo.startEvent = event.sourceEvent;
                    }
                })
        );

    // Ticks & labels
    const tickCount = Math.max(Math.ceil(colorBarDim.height / 30), 2);
    let ticks = (colorScale as ScaleLinear<any, any>)
        .ticks(tickCount)
        .filter(v => colorDomain[0] <= v && v <= colorDomain[1]);

    if (ticks.length === 1) {
        // Sometimes, ticks() gives a single value, so use a larger tickCount.
        ticks = (colorScale as ScaleLinear<any, any>)
            .ticks(tickCount + 1)
            .filter(v => colorDomain[0] <= v && v <= colorDomain[1]);
    }
    const TICK_STROKE_SIZE = 1;
    graphics.lineStyle(
        TICK_STROKE_SIZE,
        colorToHex(theme.legend.tickColor),
        1, // alpha
        0.5 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
    );

    // label text style
    const labelTextStyle = getTextStyle({
        color: theme.legend.labelColor,
        size: theme.legend.labelFontSize,
        fontWeight: theme.legend.labelFontWeight,
        fontFamily: theme.legend.labelFontFamily
    });

    const tickEnd = legendX + colorBarDim.left;
    ticks.forEach(value => {
        let y = legendY + colorBarDim.top + colorBarDim.height - ((value - startValue) / extent) * colorBarDim.height;

        // Prevent ticks from exceeding outside of a color bar by the stroke size of ticks
        if (y === legendY + colorBarDim.top) {
            y += TICK_STROKE_SIZE / 2.0;
        } else if (y === legendY + colorBarDim.top + colorBarDim.height) {
            y -= TICK_STROKE_SIZE / 2.0;
        }

        // ticks
        graphics.moveTo(tickEnd - 3, y);
        graphics.lineTo(tickEnd, y);

        // labels
        const textGraphic = new HGC.libraries.PIXI.Text(value, labelTextStyle);
        textGraphic.anchor.x = 1;
        textGraphic.anchor.y = 0.5;
        textGraphic.position.x = tickEnd - 6;
        textGraphic.position.y = y;

        graphics.addChild(textGraphic);
    });

    // Record this info so that additional legends can be displayed on the side
    offset.offsetRight = trackWidth - legendX;
}

export function drawColorLegendCategories(
    HGC: { libraries: Libraries },
    track: any,
    _tile: unknown,
    tm: GoslingTrackModel,
    theme: Required<CompleteThemeDeep>
) {
    /* track spec */
    const spec = tm.spec();
    if (!IsChannelDeep(spec.color) || spec.color.type !== 'nominal' || !spec.color.legend) {
        // This means we do not need to draw legend
        return;
    }

    /* color separation */
    const colorCategories: string[] = (tm.getChannelDomainArray('color') as string[]) ?? ['___SINGLE_COLOR___'];
    if (colorCategories.length === 0) {
        // We do not need to draw a legend for only one color
        return;
    }

    /* check redundancy */
    const domain = spec.color.domain!;
    const range = spec.color.range!;
    const existingLegends: DisplayedLegend[] = track.displayedLegends;
    const toStr = (_: any[] | string) => {
        return typeof _ === 'string' ? _ : _.join();
    };
    if (existingLegends.find(d => toStr(d.domain) === toStr(domain) && toStr(d.range) === toStr(range))) {
        // Identical color legend already added
        return;
    } else {
        existingLegends.push({ domain, range });
    }

    /* render */
    const graphics = track.pBorder; // use pBorder not to be affected by zoomming

    const paddingX = 10;
    const paddingY = 4;
    let cumY = paddingY;
    let maxWidth = 0;

    const recipe: { x: number; y: number; color: string }[] = [];

    // label text style
    const labelTextStyle = getTextStyle({
        color: theme.legend.labelColor,
        size: theme.legend.labelFontSize,
        fontWeight: theme.legend.labelFontWeight,
        fontFamily: theme.legend.labelFontFamily
    });

    if (spec.style?.inlineLegend) {
        // Show legend in a single horizontal line

        // !! reversed to add the last category first from the right side
        colorCategories
            .map(d => d)
            .reverse()
            .forEach(category => {
                if (maxWidth > track.dimensions[0]) {
                    // We do not draw labels overflow
                    return;
                }

                const color = tm.encodedValue('color', category);
                const textGraphic = new HGC.libraries.PIXI.Text(category, labelTextStyle);
                textGraphic.anchor.x = 1;
                textGraphic.anchor.y = 0;
                textGraphic.position.x = track.position[0] + track.dimensions[0] - maxWidth - paddingX;
                textGraphic.position.y = track.position[1] + paddingY;

                graphics.addChild(textGraphic);

                const textStyleObj = new HGC.libraries.PIXI.TextStyle(labelTextStyle);
                const textMetrics = HGC.libraries.PIXI.TextMetrics.measureText(category, textStyleObj);

                if (cumY < textMetrics.height + paddingY * 3) {
                    cumY = textMetrics.height + paddingY * 3;
                }

                recipe.push({
                    x: track.position[0] + track.dimensions[0] - textMetrics.width - maxWidth - paddingX * 2,
                    y: track.position[1] + paddingY + textMetrics.height / 2.0,
                    color
                });

                maxWidth += textMetrics.width + paddingX * 3;
            });
    } else {
        // Show legend vertically

        if (spec.style?.legendTitle) {
            const textGraphic = new HGC.libraries.PIXI.Text(spec.style?.legendTitle, {
                ...labelTextStyle,
                fontWeight: 'bold'
            });
            textGraphic.anchor.x = 1;
            textGraphic.anchor.y = 0;
            textGraphic.position.x = track.position[0] + track.dimensions[0] - paddingX;
            textGraphic.position.y = track.position[1] + cumY;

            const textStyleObj = new HGC.libraries.PIXI.TextStyle({ ...labelTextStyle, fontWeight: 'bold' });
            const textMetrics = HGC.libraries.PIXI.TextMetrics.measureText(spec.style?.legendTitle, textStyleObj);

            graphics.addChild(textGraphic);

            cumY += textMetrics.height + paddingY * 2;
        }

        colorCategories.forEach(category => {
            if (cumY > track.dimensions[1]) {
                // We do not draw labels overflow
                return;
            }

            const color = tm.encodedValue('color', category);

            const textGraphic = new HGC.libraries.PIXI.Text(category, labelTextStyle);
            textGraphic.anchor.x = 1;
            textGraphic.anchor.y = 0;
            textGraphic.position.x = track.position[0] + track.dimensions[0] - paddingX;
            textGraphic.position.y = track.position[1] + cumY;

            graphics.addChild(textGraphic);

            const textStyleObj = new HGC.libraries.PIXI.TextStyle(labelTextStyle);
            const textMetrics = HGC.libraries.PIXI.TextMetrics.measureText(category, textStyleObj);

            if (maxWidth < textMetrics.width + paddingX * 3) {
                maxWidth = textMetrics.width + paddingX * 3;
            }

            recipe.push({
                x: track.position[0] + track.dimensions[0] - textMetrics.width - paddingX * 2,
                y: track.position[1] + cumY + textMetrics.height / 2.0,
                color
            });

            cumY += textMetrics.height + paddingY * 2;
        });
    }

    graphics.beginFill(colorToHex(theme.legend.background), theme.legend.backgroundOpacity);
    graphics.lineStyle(
        1,
        colorToHex(theme.legend.backgroundStroke),
        theme.legend.backgroundOpacity, // alpha
        0 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
    );
    graphics.drawRect(
        track.position[0] + track.dimensions[0] - maxWidth - 1,
        track.position[1] + 1,
        maxWidth,
        cumY - paddingY
    );

    recipe.forEach(r => {
        graphics.lineStyle(
            1,
            colorToHex('black'),
            0, // alpha
            0 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
        );
        graphics.beginFill(colorToHex(r.color), 1);
        graphics.drawCircle(r.x, r.y, 4);
    });
}

export function drawRowLegend(
    HGC: { libraries: Libraries },
    trackInfo: any,
    _tile: unknown,
    tm: GoslingTrackModel,
    theme: Required<CompleteThemeDeep>
) {
    /* track spec */
    const spec = tm.spec();
    if (
        !IsChannelDeep(spec.row) ||
        spec.row.type !== 'nominal' ||
        !spec.row.legend
        // || (!IsChannelDeep(spec.y) || spec.y.type !== 'nominal' || !spec.y.legend)
    ) {
        // we do not need to draw a legend
        return;
    }

    /* track size */
    // const trackHeight = trackInfo.dimensions[1];

    /* row separation */
    const rowCategories: string[] = (tm.getChannelDomainArray('row') as string[]) ?? ['___SINGLE_ROW___'];
    // const rowHeight = trackHeight / rowCategories.length;
    if (rowCategories.length === 0) {
        // We do not need to draw a legend for only one category
        return;
    }

    /* render */
    const graphics = trackInfo.pBorder; // use pBorder not to affected by zoomming

    const paddingX = 4;
    const paddingY = 2;

    // label text style
    const labelTextStyle = getTextStyle({
        color: theme.legend.labelColor,
        size: theme.legend.labelFontSize,
        fontWeight: theme.legend.labelFontWeight,
        fontFamily: theme.legend.labelFontFamily
    });

    rowCategories.forEach(category => {
        const rowPosition = tm.encodedValue('row', category);

        const textGraphic = new HGC.libraries.PIXI.Text(category, labelTextStyle);
        textGraphic.anchor.x = 0;
        textGraphic.anchor.y = 0;
        textGraphic.position.x = trackInfo.position[0] + paddingX;
        textGraphic.position.y = trackInfo.position[1] + rowPosition + paddingY;

        graphics.addChild(textGraphic);

        const textStyleObj = new HGC.libraries.PIXI.TextStyle(labelTextStyle);
        const textMetrics = HGC.libraries.PIXI.TextMetrics.measureText(category, textStyleObj);

        graphics.beginFill(colorToHex(theme.legend.background), theme.legend.backgroundOpacity);
        graphics.lineStyle(
            1,
            colorToHex(theme.legend.backgroundStroke),
            0, // alpha
            0 // alignment of the line to draw, (0 = inner, 0.5 = middle, 1 = outter)
        );
        graphics.drawRect(
            trackInfo.position[0] + 1,
            trackInfo.position[1] + rowPosition + 1,
            textMetrics.width + paddingX * 2,
            textMetrics.height + paddingY * 2
        );
    });
}
