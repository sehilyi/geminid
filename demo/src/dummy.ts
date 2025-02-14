import type { DummyTrackOptions } from '@gosling-lang/dummy-track';
import { type TrackDef, TrackType } from './main';
import { type ProcessedDummyTrack } from './types';

export function processDummyTrack(
    track: ProcessedDummyTrack,
    boundingBox: { x: number; y: number; width: number; height: number }
): TrackDef<DummyTrackOptions>[] {
    const trackDef: TrackDef<DummyTrackOptions> = {
        type: TrackType.Dummy,
        trackId: track.id,
        boundingBox,
        options: {
            width: boundingBox.width,
            height: boundingBox.height,
            ...track.style,
            title: track.title ?? ''
        }
    };
    return [trackDef];
}
