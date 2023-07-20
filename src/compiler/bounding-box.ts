import type { MultipleViews, CommonViewDef, GoslingSpec, Track, SingleView } from '@gosling.schema';
import { Is2DTrack, IsOverlaidTrack, IsXAxis, IsYAxis } from '../gosling.schema.guards';
import { HIGLASS_AXIS_SIZE } from '../higlass-model';
import {
    DEFAULT_CIRCULAR_VIEW_PADDING,
    DEFAULT_INNER_RADIUS_PROP,
    DEFAULT_VIEW_SPACING,
    DEWFAULT_TITLE_PADDING_ON_TOP_AND_BOTTOM
} from '../defaults';
import { resolveSuperposedTracks } from './overlay';
import { traverseTracksAndViews, traverseViewArrangements } from '../../compiler/spec-preprocess';
import type { CompleteThemeDeep } from './theme';

export interface Size {
    width: number;
    height: number;
}

/**
 * Position information of each track.
 */
export interface BoundingBox extends Size {
    x: number;
    y: number;
}

/**
 * Relative positioning of views, used in HiGlass view configs as `layout`.
 */
export interface RelativePosition {
    w: number;
    h: number;
    x: number;
    y: number;
}

/**
 * Track information for its arrangement.
 */
export interface TrackInfo {
    track: Track;
    boundingBox: BoundingBox;
    layout: RelativePosition;
}

/**
 * Return the size of entire visualization.
 * @param trackInfos
 */
export function getBoundingBox(trackInfos: TrackInfo[]) {
    let width = 0;
    let height = 0;

    trackInfos.forEach(_ => {
        const w = _.boundingBox.x + _.boundingBox.width;
        const h = _.boundingBox.y + _.boundingBox.height;
        if (height < h) {
            height = h;
        }
        if (width < w) {
            width = w;
        }
    });

    return { width, height };
}

/**
 * Collect information of individual tracks including their size/position and specs
 * @param spec
 */
export function getRelativeTrackInfo(
    spec: GoslingSpec,
    theme: CompleteThemeDeep
): {
    trackInfos: TrackInfo[];
    size: { width: number; height: number };
} {
    let trackInfos: TrackInfo[] = [] as TrackInfo[];

    // Collect track information including spec, bounding boxes, and RGL' `layout`.
    traverseAndCollectTrackInfo(spec, trackInfos); // RGL parameter (`layout`) is not deteremined yet since we do not know the entire size of vis yet.

    // Get the size of entire visualization.
    const size = getBoundingBox(trackInfos);

    // Titles
    if (spec.title || spec.subtitle) {
        // If title and/or subtitle presents, offset the y position by title/subtitle size
        const titleHeight =
            (spec.title ? (theme.root.titleFontSize ?? 18) + DEWFAULT_TITLE_PADDING_ON_TOP_AND_BOTTOM : 0) +
            (spec.subtitle ? (theme.root.subtitleFontSize ?? 14) + DEWFAULT_TITLE_PADDING_ON_TOP_AND_BOTTOM : 0);
        const marginBottom = 4;

        size.height += titleHeight + marginBottom;

        // !! The total height should be multiples of 8. Refer to `getBoundingBox()`
        size.height = size.height + (8 - (size.height % 8));

        // Offset all non-title tracks.
        trackInfos.forEach(_ => {
            _.boundingBox.y += titleHeight + marginBottom;
        });

        // Add a title track.
        trackInfos = [
            {
                track: getTextTrack({ width: size.width, height: titleHeight }, spec.title, spec.subtitle),
                boundingBox: { x: 0, y: 0, width: size.width, height: titleHeight },
                layout: { x: 0, y: 0, w: 12, h: (titleHeight / size.height) * 12.0 }
            },
            ...trackInfos
        ];
    } else {
        // !! The total height should be multiples of 8. Refer to `getBoundingBox()`
        size.height = size.height + (8 - (size.height % 8));
    }

    const pixelPreciseMarginPadding = !(typeof spec.responsiveSize !== 'object'
        ? spec.responsiveSize
        : spec.responsiveSize.height);

    // Calculate `layout`s for React Grid Layout (RGL).
    trackInfos.forEach(_ => {
        _.layout.x = (_.boundingBox.x / size.width) * 12;
        _.layout.w = (_.boundingBox.width / size.width) * 12;
        // If we set `pixelPreciseMarginPadding` `true`, we need to use actual values for `y` and `height`
        _.layout.y = pixelPreciseMarginPadding ? _.boundingBox.y : (_.boundingBox.y / size.height) * 12;
        _.layout.h = pixelPreciseMarginPadding ? _.boundingBox.height : (_.boundingBox.height / size.height) * 12;
    });

    // console.log(trackInfos);

    return { trackInfos, size };
}

/**
 * Visit all tracks and views in the Gosling spec to collect information of individual tracks, including their size, position, and spec.
 * @param spec
 * @param output
 * @param dx
 * @param dy
 * @param forceWidth
 * @param forceHeight
 * @param circularRootNotFound
 */
function traverseAndCollectTrackInfo(
    spec: GoslingSpec | SingleView,
    output: TrackInfo[],
    dx = 0,
    dy = 0,
    circularRootNotFound = true // A flag variable to find a root level of circular tracks/views
) {
    let cumWidth = 0;
    let cumHeight = 0;

    /* Parameters to determine if we need to combine all the children to show as a single circular visualization */
    let allChildCircularLayout = true;
    let traversedAtLeastOnce = false;
    traverseTracksAndViews(spec, (tv: CommonViewDef) => {
        traversedAtLeastOnce = true;
        if (tv.layout !== 'circular') {
            allChildCircularLayout = false;
        }
    });

    let noChildConcatArrangement = true; // if v/hconcat is being used by children, circular visualizations should be adjacently placed.
    traverseViewArrangements(spec, (a: MultipleViews) => {
        if (a.arrangement === 'vertical' || a.arrangement === 'horizontal') {
            noChildConcatArrangement = false;
        }
    });

    const isThisCircularRoot =
        circularRootNotFound &&
        allChildCircularLayout &&
        traversedAtLeastOnce &&
        noChildConcatArrangement &&
        (('views' in spec && (spec.arrangement === 'parallel' || spec.arrangement === 'serial')) || 'tracks' in spec);

    const numTracksBeforeInsert = output.length;

    if ('tracks' in spec) {
        // following `traverseToFixSpecDownstream`, the width and height of each track are gaurenteed to be defined
        const tracks = spec.tracks as (Track & { width: number; height: number })[];

        if (spec.orientation === 'vertical') {
            // This is a vertical view, so use the largest `height` of the tracks for this view.
            cumHeight = Math.max(...tracks.map(d => d.height));
            tracks.forEach((track, i, array) => {
                if (getNumOfXAxes([track]) === 1) {
                    track.width += HIGLASS_AXIS_SIZE;
                }

                track.height = cumHeight;

                output.push({
                    track,
                    boundingBox: {
                        x: dx + cumWidth,
                        y: dy,
                        width: track.width,
                        height: cumHeight
                    },
                    layout: { x: 0, y: 0, w: 0, h: 0 } // Just put a dummy info here, this should be added after entire bounding box has been determined
                });

                if (array[i + 1] && array[i + 1].overlayOnPreviousTrack) {
                    // do not add a height
                } else {
                    cumWidth += track.width;
                    if (i !== array.length - 1) {
                        cumWidth += spec.spacing !== undefined ? spec.spacing : 0;
                    }
                }
            });
        } else {
            // This is a horizontal view, so use the largest `width` for this view.
            cumWidth = Math.max(...tracks.map(d => d.width)); //forceWidth ? forceWidth : spec.tracks[0]?.width;
            tracks.forEach((track, i, array) => {
                // let scaledHeight = track.height;

                if (getNumOfXAxes([track]) === 1) {
                    track.height += HIGLASS_AXIS_SIZE;
                }

                if (Is2DTrack(resolveSuperposedTracks(track)[0]) && getNumOfYAxes([track]) === 1) {
                    // If this is a 2D track (e.g., matrix), we need to reserve a space for the y-axis track
                    cumWidth += HIGLASS_AXIS_SIZE;
                }

                track.width = cumWidth;

                output.push({
                    track,
                    boundingBox: {
                        x: dx,
                        y: dy + cumHeight,
                        width: cumWidth,
                        height: track.height
                    },
                    layout: { x: 0, y: 0, w: 0, h: 0 } // Just put a dummy info here, this should be added after entire bounding box has been determined
                });

                if (array[i + 1] && array[i + 1].overlayOnPreviousTrack) {
                    // do not add a height
                } else {
                    cumHeight += track.height;
                    if (i !== array.length - 1) {
                        cumHeight += spec.spacing !== undefined ? spec.spacing : 0;
                    }
                }
            });
        }
    } else {
        // We did not reach a track definition, so continue traversing.

        // We first calculate position and size of each view and track by considering it as if it uses a linear layout
        if (spec.arrangement === 'parallel' || spec.arrangement === 'vertical') {
            const spacing = spec.spacing !== undefined ? spec.spacing : DEFAULT_VIEW_SPACING;

            spec.views.forEach((v, i, array) => {
                const viewBB = traverseAndCollectTrackInfo(
                    v,
                    output,
                    dx + (v.xOffset ?? 0),
                    dy + (v.yOffset ?? 0) + cumHeight,
                    !isThisCircularRoot && circularRootNotFound
                );

                if (cumWidth < (v.xOffset ?? 0) + viewBB.width) {
                    cumWidth = (v.xOffset ?? 0) + viewBB.width;
                }
                if (i !== array.length - 1) {
                    cumHeight += spacing;
                }
                cumHeight += (v.yOffset ?? 0) + viewBB.height;
            });
        } else if (spec.arrangement === 'serial' || spec.arrangement === 'horizontal') {
            spec.views.forEach((v, i, array) => {
                const spacing = spec.spacing !== undefined ? spec.spacing : DEFAULT_VIEW_SPACING;

                // If so, we do not want to put large between-gap.
                // spacing *= (spec.arrangement === 'serial' && spec.layout === 'circular' ? 0.2 : 1);

                const viewBB = traverseAndCollectTrackInfo(
                    v,
                    output,
                    dx + (v.xOffset ?? 0) + cumWidth,
                    dy + (v.yOffset ?? 0),
                    !isThisCircularRoot && circularRootNotFound
                );

                if (cumHeight < (v.xOffset ?? 0) + viewBB.height) {
                    cumHeight = (v.xOffset ?? 0) + viewBB.height;
                }
                if (i !== array.length - 1) {
                    cumWidth += spacing;
                }
                cumWidth += (v.xOffset ?? 0) + viewBB.width;
            });
        }
    }

    // If this is a root view that uses a circular layout, use the posiiton and size of views/tracks to calculate circular-specific parameters, such as outer/inner radius and start/end angle
    if (isThisCircularRoot) {
        const cTracks = output.slice(numTracksBeforeInsert);
        const ifMultipleViews =
            'views' in spec &&
            (spec.arrangement === 'parallel' || spec.arrangement === 'serial') &&
            spec.views.length > 1;

        const SPACING = spec.spacing !== undefined ? spec.spacing : DEFAULT_VIEW_SPACING;
        const PADDING = DEFAULT_CIRCULAR_VIEW_PADDING;
        const INNER_RADIUS = spec.centerRadius !== undefined ? spec.centerRadius : DEFAULT_INNER_RADIUS_PROP;
        const TOTAL_RADIUS = cumWidth / 2.0 + PADDING; // (cumWidth + cumHeight) / 2.0 / 2.0;
        const TOTAL_RING_SIZE = TOTAL_RADIUS * (1 - INNER_RADIUS);

        // const numXAxes = getNumOfXAxes(cTracks.map(info => info.track));

        cTracks.forEach((t, i) => {
            t.track.layout = 'circular';

            t.track.outerRadius = TOTAL_RADIUS - PADDING - ((t.boundingBox.y - dy) / cumHeight) * TOTAL_RING_SIZE;
            t.track.innerRadius =
                TOTAL_RADIUS - PADDING - ((t.boundingBox.y + t.boundingBox.height - dy) / cumHeight) * TOTAL_RING_SIZE;

            // in circular layouts, we place spacing in the origin as well
            const spacingAngle = (SPACING / cumWidth) * 360;

            // !!! Multiplying by (cumWidth - SPACING) / cumWidth) to rescale to exclude SPACING
            t.track.startAngle =
                spacingAngle + ((((t.boundingBox.x - dx) / cumWidth) * (cumWidth - SPACING)) / cumWidth) * 360;
            t.track.endAngle =
                ((((t.boundingBox.x + t.boundingBox.width - dx) / cumWidth) * (cumWidth - SPACING)) / cumWidth) * 360;
            // t.track.startAngle = ((t.boundingBox.x - dx) / cumWidth) * 360;
            // t.track.endAngle = ((t.boundingBox.x + t.boundingBox.width - dx) / cumWidth) * 360;

            t.boundingBox.x = dx + (t.track.xOffset ?? 0);
            t.boundingBox.y = dy + (t.track.yOffset ?? 0);

            // Circular tracks share the same size and position since technically these tracks are being overlaid on top of the others
            t.boundingBox.height = t.track.height = t.boundingBox.width = t.track.width = TOTAL_RADIUS * 2;

            if (i !== 0) {
                t.track.overlayOnPreviousTrack = true;
            }

            // !!! As circular tracks are not well supported now when parallelized or serialized, we do not support brush for now.
            if (ifMultipleViews) {
                if (IsOverlaidTrack(t.track)) {
                    t.track.overlay = t.track.overlay.filter(o => o.mark !== 'brush');
                }
            }
        });

        cumHeight = TOTAL_RADIUS * 2;
    }

    // DEBUG
    // console.log(output);

    // Record assigned sizes of this view so that we can determine whether to use alternative responsive spec
    spec._assignedWidth = cumWidth;
    spec._assignedHeight = cumHeight;

    return { x: dx, y: dy, width: cumWidth, height: cumHeight };
}

export function getNumOfXAxes(tracks: Track[]): number {
    return tracks.filter(t => IsXAxis(t)).length;
}

export function getNumOfYAxes(tracks: Track[]): number {
    return tracks.filter(t => IsYAxis(t)).length;
}

/**
 * Get a spec for a title track.
 * @param size
 * @param title
 * @param subtitle
 */
const getTextTrack = (size: Size, title?: string, subtitle?: string) => {
    return JSON.parse(
        JSON.stringify({
            mark: 'header',
            width: size.width,
            height: size.height,
            title,
            subtitle
        })
    ) as Track;
};
