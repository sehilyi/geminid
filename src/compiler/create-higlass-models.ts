import { getBoundingBox, type TrackInfo } from './utils/bounding-box';
import { goslingToHiGlass } from './gosling-to-higlass';
import { HiGlassModel } from './higlass-model';
import { getLinkingInfo } from './utils/linking';
import type {
    GoslingSpec,
    OverlaidTrack,
    SingleTrack,
    TrackApiData,
    VisUnitApiData,
    ViewApiData
} from '@gosling.schema';
import type { CompleteThemeDeep } from './utils/theme';
import type { CompileCallback } from './compile';
import { getViewApiData } from '../api/api-data';

export function renderHiGlass(
    spec: GoslingSpec,
    trackInfos: TrackInfo[],
    callback: CompileCallback,
    theme: CompleteThemeDeep
) {
    if (trackInfos.length === 0) {
        // no tracks to render
        return;
    }

    // HiGlass model
    const hgModel = new HiGlassModel();

    /* Update the HiGlass model by iterating tracks */
    trackInfos.forEach(tb => {
        const { track, boundingBox: bb, layout } = tb;
        goslingToHiGlass(hgModel, track, bb, layout, theme);
    });

    /* Add linking information to the HiGlass model */
    const linkingInfos = getLinkingInfo(hgModel);

    // Brushing
    // (between a view with `brush` and a view having the same linking name)
    linkingInfos
        .filter(d => d.isBrush)
        .forEach(info => {
            hgModel.addBrush(
                info.layout,
                info.viewId,
                theme,
                linkingInfos.find(d => !d.isBrush && d.linkId === info.linkId)?.viewId,
                info.style
            );
        });

    // location/zoom lock information
    // fill `locksByViewUid`
    linkingInfos
        .filter(d => !d.isBrush)
        .forEach(d => {
            hgModel.spec().zoomLocks.locksByViewUid[d.viewId] = d.linkId;
            hgModel.spec().locationLocks.locksByViewUid[d.viewId] = d.linkId;
        });

    // fill `locksDict`
    const uniqueLinkIds = Array.from(new Set(linkingInfos.map(d => d.linkId)));

    uniqueLinkIds.forEach(linkId => {
        hgModel.spec().zoomLocks.locksDict[linkId] = { uid: linkId };
        hgModel.spec().locationLocks.locksDict[linkId] = { uid: linkId };

        linkingInfos
            .filter(d => !d.isBrush)
            .filter(d => d.linkId === linkId)
            .forEach(d => {
                hgModel.spec().zoomLocks.locksDict[linkId][d.viewId] = [124625310.5, 124625310.5, 249250.621];
                hgModel.spec().locationLocks.locksDict[linkId][d.viewId] = [124625310.5, 124625310.5, 249250.621];
            });
    });

    const tracks: TrackApiData[] = trackInfos.map(d => {
        return {
            id: d.track.id!,
            spec: d.track as SingleTrack | OverlaidTrack,
            shape:
                d.track.layout === 'linear'
                    ? d.boundingBox
                    : {
                          ...d.boundingBox,
                          cx: d.boundingBox.x + d.boundingBox.width / 2.0,
                          cy: d.boundingBox.y + d.boundingBox.height / 2.0,
                          innerRadius: d.track.innerRadius!,
                          outerRadius: d.track.outerRadius!,
                          startAngle: d.track.startAngle!,
                          endAngle: d.track.endAngle!
                      }
        };
    });

    // Get the view information needed to support JS APIs (e.g., providing view bounding boxes)
    const views: ViewApiData[] = getViewApiData(spec, tracks);

    // Merge the tracks and views
    const tracksAndViews = [
        ...tracks.map(d => ({ ...d, type: 'track' } as VisUnitApiData)),
        ...views.map(d => ({ ...d, type: 'view' } as VisUnitApiData))
    ];

    callback(hgModel.spec(), getBoundingBox(trackInfos), spec, tracksAndViews);
}
