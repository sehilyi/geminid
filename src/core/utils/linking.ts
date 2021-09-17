import uuid from 'uuid';
import { Orientation } from '../gosling.schema';
import { IsChannelDeep } from '../gosling.schema.guards';
import { HiGlassModel } from '../higlass-model';
import { resolveSuperposedTracks } from './overlay';

/**
 * Construct information for linking views. This is used to generate HiGlass viewConfig and render interactive brushes.
 */
export function getLinkingInfo(hgModel: HiGlassModel) {
    let linkingInfo: {
        layout: 'circular' | 'linear';
        orientation: Orientation;
        channel: 'x' | 'x1' | 'y';
        viewId: string;
        parentViewId: string;
        linkId: string;
        zoomLinkingId: string;
        isBrush: boolean;
        style: any;
    }[] = [];

    const sharedZoomIds: string[][] = [];

    // TODO: remove duplicated linkingIds before reaching this for the simplicity (e.g., x: { ..., linkingId: 'top'}, x1: {..., linkingId: 'top'}})
    hgModel.spec().views.forEach(v => {
        const viewId = v.uid;

        // TODO: Better way to get view specifications?
        // Get spec of a main track
        let spec = /* TODO: */ (v.tracks as any).center?.[0]?.contents?.[0]?.options?.spec;

        if (!spec) {
            // This means the orientation of this view is vertical, and spec might be positioned on the left
            spec = /* TODO: */ (v.tracks as any).left?.[0]?.contents?.[0]?.options?.spec;
            if (!spec) {
                // in case the first one is the axis track
                spec = /* TODO: */ (v.tracks as any).left?.[1]?.contents?.[0]?.options?.spec;
            }
        }

        if (!viewId || !spec) return;

        const resolvedTracks = resolveSuperposedTracks(spec);

        resolvedTracks.forEach(spec => {
            // TODO: support all other channels as well (`SUPPORTED_CHANNELS`)
            (['x', 'x1', 'y'] as ('x' | 'x1' | 'y')[]).forEach(cKey => {
                const channel = spec[cKey];
                const isBrush = spec.mark === 'brush';

                if (IsChannelDeep(channel) && channel.linkingId) {
                    linkingInfo.push({
                        layout: spec.layout === 'circular' ? 'circular' : 'linear',
                        orientation: spec.orientation ?? 'horizontal',
                        channel: cKey,
                        viewId,
                        parentViewId: spec._parentViewId ?? uuid.v4(),
                        linkId: channel.linkingId,
                        zoomLinkingId: '', // This will be added very soon below
                        isBrush,
                        style: {
                            color: (spec as any).color?.value,
                            stroke: (spec as any).stroke?.value,
                            strokeWidth: (spec as any).strokeWidth?.value,
                            opacity: (spec as any).opacity?.value,
                            startAngle: spec.startAngle,
                            endAngle: spec.endAngle,
                            innerRadius: spec.innerRadius,
                            outerRadius: spec.outerRadius
                        }
                    });
                }
            });

            /* Search for the shared zoom locks */
            const { x, x1, y } = spec; // TODO: support all other non-genomic channels as well

            const xLinkingId = IsChannelDeep(x) && x.type === 'genomic' && x.linkingId ? x.linkingId : undefined;
            const x1LinkingId = IsChannelDeep(x1) && x1.type === 'genomic' && x1.linkingId ? x1.linkingId : undefined;
            const yLinkingId = IsChannelDeep(y) && y.type === 'genomic' && y.linkingId ? y.linkingId : undefined;

            const uniqueLinkingIds = Array.from(new Set([xLinkingId, x1LinkingId, yLinkingId].filter(d => d)));
            if (uniqueLinkingIds.length === 2) {
                // Store these information so that zoom levels should be locked across all views that use either one of these linkingIds
                let foundOrUpdated = false;
                sharedZoomIds.forEach((d, i, arr) => {
                    const combinedUniqueIds = Array.from([...uniqueLinkingIds, ...d]);
                    if (combinedUniqueIds.length === d.length) {
                        // This means linkingIds have been already added, so no need additional action
                        foundOrUpdated = true;
                    } else if (combinedUniqueIds.length === d.length + 1) {
                        // This means linkingIds have been already added, so no need to do anything
                        arr[i] = combinedUniqueIds as string[];
                        foundOrUpdated = true;
                    } else {
                        // This means we did not find any overlap, so keep iterate
                    }
                });

                if (!foundOrUpdated) {
                    // This means we have to add an additional item to the array
                    sharedZoomIds.push(uniqueLinkingIds as string[]);
                }
            } else if (uniqueLinkingIds.length === 3) {
                // Does not make sense for all three channels to have unique linkingIds
            }
        });
    });

    // Use common `linkingId` for shared zoom levels
    linkingInfo = linkingInfo.map(d => {
        const sharedIds = sharedZoomIds.find(ids => ids.indexOf(d.linkId) !== -1);
        return {
            ...d,
            zoomLinkingId: sharedIds ? sharedIds.sort().join('-') : d.linkId
        };
    });

    return linkingInfo;
}
