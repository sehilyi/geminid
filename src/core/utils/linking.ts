import { IsChannelDeep, IsChannelValue } from '../gosling.schema.guards';
import { HiGlassModel } from '../higlass-model';
import { SUPPORTED_CHANNELS } from '../mark';
import { resolveSuperposedTracks } from './overlay';

/**
 *
 */
export function getLinkingInfo(hgModel: HiGlassModel) {
    const linkingInfo: {
        layout: 'circular' | 'linear';
        viewId: string;
        linkId: string;
        isBrush: boolean;
        style: any;
    }[] = [];

    hgModel.spec().views.forEach(v => {
        const viewId = v.uid;

        // TODO: Better way to get view specifications?
        // Get spec of a view
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

        const resolved = resolveSuperposedTracks(spec);

        resolved.forEach(spec => {
            SUPPORTED_CHANNELS.forEach(cKey => {
                const channel = spec.encoding[cKey];

                if (IsChannelDeep(channel) && 'linkingId' in channel && channel.linkingId) {
                    linkingInfo.push({
                        layout: spec.layout === 'circular' ? 'circular' : 'linear',
                        viewId,
                        linkId: channel.linkingId,
                        isBrush: spec.mark === 'brush',
                        style: {
                            color: IsChannelValue(spec.encoding.color) ? spec.encoding.color?.value : undefined,
                            stroke: IsChannelValue(spec.encoding.stroke) ? spec.encoding.stroke.value : undefined,
                            strokeWidth: IsChannelValue(spec.encoding.strokeWidth)
                                ? spec.encoding.strokeWidth.value
                                : undefined,
                            opacity: IsChannelValue(spec.encoding.opacity) ? spec.encoding.opacity.value : undefined,
                            startAngle: spec.startAngle,
                            endAngle: spec.endAngle,
                            innerRadius: spec.innerRadius,
                            outerRadius: spec.outerRadius
                        }
                    });
                    return;
                }
            });
        });
    });
    return linkingInfo;
}
