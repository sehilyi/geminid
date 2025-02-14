import { type AxisTrackOptions } from '@gosling-lang/genomic-axis';
import type { CompleteThemeDeep } from '../../src/core/utils/theme';
import type { GoslingTrackOptions } from '@gosling-lang/gosling-track';
import type { BrushLinearTrackOptions } from '@gosling-lang/brush-linear';
import { getAxisTrackDef } from './axis';
import { type TrackDef, TrackType } from './main';
import { getBrushTrackDefs } from './brush';
import type { ProcessedTrack } from './types';

/**
 * A Gosling track, as defined in the schema, can be composed of multiple tracks:
 * A GoslingTrack, an AxisTrack, and a BrushTrack. This function processes the spec of a single Gosling track
 * and returns the corresponding track definitions.
 */
export function processGoslingTrack(
    track: ProcessedTrack,
    boundingBox: { x: number; y: number; width: number; height: number },
    theme: Required<CompleteThemeDeep>
): (TrackDef<GoslingTrackOptions> | TrackDef<AxisTrackOptions> | TrackDef<BrushLinearTrackOptions>)[] {
    const trackDefs: (
        | TrackDef<GoslingTrackOptions>
        | TrackDef<AxisTrackOptions>
        | TrackDef<BrushLinearTrackOptions>
    )[] = [];

    // Adds the axis tracks
    const [newTrackBbox, axisTrackDefs] = getAxisTrackDef(track, boundingBox, theme);
    if (axisTrackDefs) {
        // Only add the axis track if it is not overlayed on top of the Gosling track
        if (!track.overlayOnPreviousTrack) trackDefs.push(...axisTrackDefs);
        // modify the bounding box to exclude the axis track
        // warning: there could be some weirdness around overlayOnPreviousTrack here that needs to be tested
        boundingBox = newTrackBbox;
    }

    // Add the Gosling track
    const goslingTrackOptions = getGoslingTrackOptions(track, theme);
    trackDefs.push({
        type: TrackType.Gosling,
        trackId: track.id,
        boundingBox: { ...boundingBox },
        options: goslingTrackOptions
    });

    // Add the brush after Gosling track so that it is on top
    const brushTrackDefs = getBrushTrackDefs(track, boundingBox);
    brushTrackDefs.forEach(brushTrackDef => {
        trackDefs.push(brushTrackDef);
    });

    return trackDefs;
}

function getGoslingTrackOptions(spec: ProcessedTrack, theme: Required<CompleteThemeDeep>): GoslingTrackOptions {
    return {
        spec: spec,
        id: spec.id,
        siblingIds: [],
        showMousePosition: true,
        mousePositionColor: '#000000',
        name: spec.title,
        labelPosition: spec.overlayOnPreviousTrack || spec.title === undefined ? 'none' : 'topLeft',
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
        theme: theme
    };
}
