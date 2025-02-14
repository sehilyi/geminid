import type { PixiManager } from '@pixi-manager';
import { type TextTrackOptions } from '@gosling-lang/text-track';
import { type DummyTrackOptions } from '@gosling-lang/dummy-track';
import { type AxisTrackOptions } from '@gosling-lang/genomic-axis';
import { type BrushLinearTrackOptions } from '@gosling-lang/brush-linear';
import type { TrackInfo } from '../../src/compiler/bounding-box';
import type { CompleteThemeDeep } from '../../src/core/utils/theme';
import type { GoslingTrackOptions } from '../../src/tracks/gosling-track/gosling-track';

import { proccessTextHeader } from './text';
import { processHeatmapTrack, isHeatmapTrack } from './heatmap';
import { processGoslingTrack } from './gosling';
import { type BrushCircularTrackOptions } from '@gosling-lang/brush-circular';
import { type HeatmapTrackOptions } from '@gosling-lang/heatmap';
import { processDummyTrack } from './dummy';
import { IsDummyTrack } from '@gosling-lang/gosling-schema';

/**
 * All the different types of tracks that can be rendered
 */
export enum TrackType {
    Text,
    Dummy,
    Gosling,
    Axis,
    BrushLinear,
    BrushCircular,
    Heatmap
}

/**
 * Associate options to each track type
 */
interface TrackOptionsMap {
    [TrackType.Gosling]: GoslingTrackOptions;
    [TrackType.Text]: TextTrackOptions;
    [TrackType.Dummy]: DummyTrackOptions;
    [TrackType.Axis]: AxisTrackOptions;
    [TrackType.BrushLinear]: BrushLinearTrackOptions;
    [TrackType.BrushCircular]: BrushCircularTrackOptions;
    [TrackType.Heatmap]: HeatmapTrackOptions;
}

/**
 *  This interface contains all of the information needed to render each track type.
 */
export interface TrackDef<T> {
    type: TrackType;
    trackId: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    options: T;
}

/**
 * This is a union of all the different TrackDefs
 */
export type TrackDefs = {
    [K in keyof TrackOptionsMap]: TrackDef<TrackOptionsMap[K]>;
}[keyof TrackOptionsMap];

/**
 * Takes a list of TrackInfos and returns a list of TrackDefs
 * @param trackInfos
 * @param pixiManager
 * @param theme
 * @returns
 */
export function createTrackDefs(trackInfos: TrackInfo[], theme: Required<CompleteThemeDeep>): TrackDefs[] {
    const trackDefs: TrackDefs[] = [];
    console.warn('trackinfos', trackInfos);
    trackInfos.forEach(trackInfo => {
        const { track, boundingBox } = trackInfo;

        if (track.mark === '_header') {
            // Header marks contain both the title and subtitle
            const textTrackDefs = proccessTextHeader(track, boundingBox, theme);
            trackDefs.push(...textTrackDefs);
        } else if (isHeatmapTrack(track)) {
            // We have a heatmap track
            const heatmapTrackDefs = processHeatmapTrack(track, boundingBox, theme);
            trackDefs.push(...heatmapTrackDefs);
        } else if (IsDummyTrack(track)) {
            // We have a dummy track
            const dummyTrackDefs = processDummyTrack(track, boundingBox);
            trackDefs.push(...dummyTrackDefs);
        } else {
            // We have a gosling track
            const goslingAxisDefs = processGoslingTrack(track, boundingBox, theme);
            trackDefs.push(...goslingAxisDefs);
        }
    });
    return trackDefs;
}

/**
 * This function is for internal testing usage only. It will render a red border around each track
 */
export function showTrackInfoPositions(trackInfos: TrackInfo[], pixiManager: PixiManager) {
    trackInfos.forEach(trackInfo => {
        const { track, boundingBox } = trackInfo;
        const div = pixiManager.makeContainer(boundingBox).overlayDiv;
        div.style.border = '3px solid red';
        div.innerHTML = track.mark || 'No mark';
        div.style.textAlign = 'left';
    });
}
