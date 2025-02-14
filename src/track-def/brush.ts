import type { BrushLinearTrackOptions } from '@gosling-lang/brush-linear';
import type { BrushCircularTrackOptions } from '@gosling-lang/brush-circular';
import { type TrackDef, TrackType } from './index';
import { type ProcessedTrack, type OverlayTrack, type ProcessedCircularTrack } from './types';

export function getBrushTrackDefs(
    spec: ProcessedTrack,
    boundingBox: { x: number; y: number; width: number; height: number }
): TrackDef<BrushLinearTrackOptions>[] | TrackDef<BrushCircularTrackOptions>[] {
    const trackDefs: TrackDef<BrushLinearTrackOptions>[] = [];
    // We always expect brushes to be overlayed on top of another track
    if (!spec._overlay) return [];

    spec._overlay.forEach((overlay: OverlayTrack) => {
        // Skip if the overlay is not a brush
        if (overlay.mark !== 'brush') return;

        if (spec.layout === 'linear') {
            const options = getBrushLinearOptions(spec, overlay);
            trackDefs.push({
                type: TrackType.BrushLinear,
                trackId: overlay.id,
                boundingBox: { ...boundingBox },
                options
            });
        } else if (spec.layout === 'circular') {
            // If we have a circular layout, we use the BrushCircularTrack
            const options = getBrushCircularOptions(spec, overlay);
            trackDefs.push({
                type: TrackType.BrushCircular,
                trackId: overlay.id,
                boundingBox: { ...boundingBox },
                options
            });
        }
    });
    return trackDefs;
}

/**
 * Get the options for a BrushLinearTrack
 */
function getBrushLinearOptions(spec: ProcessedTrack, overlay: OverlayTrack): BrushLinearTrackOptions {
    const options = {
        projectionFillColor: overlay.color?.value ?? 'gray',
        projectionStrokeColor: spec.stroke?.value ?? 'black',
        projectionFillOpacity: spec.opacity?.value ?? 0.3,
        projectionStrokeOpacity: spec.opacity?.value ?? 0.3,
        strokeWidth: spec.strokeWidth?.value ?? 1
    };
    return options;
}

/**
 * Get the options for a BrushCircularTrack
 */
function getBrushCircularOptions(spec: ProcessedCircularTrack, overlay: OverlayTrack): BrushCircularTrackOptions {
    const options = {
        projectionFillColor: overlay.color?.value ?? 'gray',
        projectionStrokeColor: overlay.stroke?.value ?? 'black',
        projectionFillOpacity: 0.3,
        projectionStrokeOpacity: 0.3,
        strokeWidth: spec.strokeWidth?.value ?? 0.3,
        startAngle: spec.startAngle ?? 7.2,
        endAngle: spec.endAngle ?? 352.8,
        innerRadius: spec.innerRadius ?? 151.08695652173913,
        outerRadius: spec.outerRadius ?? 250,
        axisPositionHorizontal: 'left' as 'left' | 'right'
    };
    return options;
}
