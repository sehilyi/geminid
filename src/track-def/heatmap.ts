import { type TrackDef, TrackType } from './index';
import { type HeatmapTrackOptions } from '@gosling-lang/heatmap';
import type { CompleteThemeDeep } from '../../src/core/utils/theme';
import { computeChromSizes } from '../../src/core/utils/assembly';
import { getAxisTrackDef } from './axis';
import { type AxisTrackOptions } from '@gosling-lang/genomic-axis';
import type { ProcessedTrack } from './types';
import { IsChannelDeep, getHiGlassColorRange } from '@gosling-lang/gosling-schema';

export function processHeatmapTrack(
    track: ProcessedTrack,
    boundingBox: { x: number; y: number; width: number; height: number },
    theme: Required<CompleteThemeDeep>
): (TrackDef<HeatmapTrackOptions> | TrackDef<AxisTrackOptions>)[] {
    const trackDefs: (TrackDef<HeatmapTrackOptions> | TrackDef<AxisTrackOptions>)[] = [];

    // Adds the axis tracks if needed
    const [newTrackBbox, axisTrackDefs] = getAxisTrackDef(track, boundingBox, theme);
    if (axisTrackDefs) {
        trackDefs.push(...axisTrackDefs);
        // modify the bounding box to exclude the axis track
        boundingBox = newTrackBbox;
    }

    const heatmapOptions = getHeatmapOptions(track); // TODO: should we consider `theme`?
    trackDefs.push({
        type: TrackType.Heatmap,
        options: heatmapOptions,
        boundingBox,
        trackId: track.id
    });
    return trackDefs;
}

export function isHeatmapTrack(track: ProcessedTrack): boolean {
    return (track.data && track.data.type === 'matrix') || false;
}

function getHeatmapOptions(track: ProcessedTrack): HeatmapTrackOptions {
    const { assembly } = track;
    // Edge case: The first track in a view with "alignment": "overlay" can
    // sometimes not have a y encoding but it has a single overlay track which contains the y encoding
    // TODO: Should be possible to fix this during when the spec is compiled
    const missingX = !('x' in track) || track.x === undefined;
    const missingY = !('y' in track) || track.y === undefined;
    const hasOverlay = '_overlay' in track && track._overlay && track._overlay.length == 1;
    if (missingX && missingY && hasOverlay) track = { ...track, ...track._overlay![0] };

    // Get color range
    const colorStr =
        IsChannelDeep(track.color) && typeof track.color.range === 'string' ? track.color.range : 'viridis';
    const colorRange = getHiGlassColorRange(colorStr);
    return {
        spec: track,
        maxDomain: computeChromSizes(assembly).total,
        showMousePosition: false,
        mousePositionColor: '#000000',
        name: track.title,
        labelPosition: 'none',
        labelShowResolution: false,
        labelColor: 'black',
        labelBackgroundColor: 'white',
        labelBackgroundOpacity: 0.5,
        labelTextOpacity: 1,
        labelLeftMargin: 1,
        labelTopMargin: 1,
        labelRightMargin: 0,
        labelBottomMargin: 0,
        backgroundColor: 'transparent',
        trackBorderWidth: 1,
        trackBorderColor: 'black',
        extent: 'full',
        colorbarPosition: 'hidden',
        labelShowAssembly: true,
        colorbarBackgroundColor: '#ffffff',
        heatmapValueScaling: 'log',
        showTooltip: false,
        zeroValueColor: undefined,
        colorRange
    };
}
