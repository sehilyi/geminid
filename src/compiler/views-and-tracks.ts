import { getBoundingBox, type TrackInfo } from './bounding-box';
import type {
    GoslingSpec,
    OverlaidTrack,
    SingleTrack,
    TrackApiData,
    VisUnitApiData,
    ViewApiData
} from '@gosling-lang/gosling-schema';
import type { CompleteThemeDeep } from '../core/utils/theme';
import { getViewApiData } from '../api/api-data';
import { IsDummyTrack } from '@gosling-lang/gosling-schema';
import type { ProcessedCircularTrack } from '../track-def/types';

export function collectViewsAndTracks(spec: GoslingSpec, trackInfos: TrackInfo[], theme: Required<CompleteThemeDeep>) {
    if (trackInfos.length === 0) {
        // no tracks to render
        throw new Error('No tracks to render');
    }

    const tracks: TrackApiData[] = trackInfos.map(d => {
        let isLinear = false;
        if ('layout' in d.track && d.track.layout === 'linear') {
            isLinear = true;
        } else if (IsDummyTrack(d.track)) {
            // Dummy track is always linear
            isLinear = true;
        }
        return {
            id: d.track.id!,
            spec: d.track as SingleTrack | OverlaidTrack,
            shape: isLinear
                ? d.boundingBox
                : {
                      ...d.boundingBox,
                      cx: d.boundingBox.x + d.boundingBox.width / 2.0,
                      cy: d.boundingBox.y + d.boundingBox.height / 2.0,
                      innerRadius: (d.track as ProcessedCircularTrack).innerRadius!,
                      outerRadius: (d.track as ProcessedCircularTrack).outerRadius!,
                      startAngle: (d.track as ProcessedCircularTrack).startAngle!,
                      endAngle: (d.track as ProcessedCircularTrack).endAngle!
                  }
        };
    });

    // Get the view information needed to support JS APIs (e.g., providing view bounding boxes)
    const views: ViewApiData[] = getViewApiData(spec, tracks);

    // Merge the tracks and views
    const tracksAndViews = [
        ...tracks.map(d => ({ ...d, type: 'track' }) as VisUnitApiData),
        ...views.map(d => ({ ...d, type: 'view' }) as VisUnitApiData)
    ];

    const compileResult = {
        size: getBoundingBox(trackInfos),
        gs: spec,
        tracksAndViews,
        trackInfos,
        theme
    };
    return compileResult;
}
