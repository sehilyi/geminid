import * as uuid from 'uuid';
import type {
    SingleTrack,
    GoslingSpec,
    View,
    SingleView,
    Track,
    PartialTrack,
    CommonTrackDef,
    CommonViewDef,
    MultipleViews,
    DisplaceTransform
} from '../gosling.schema';
import {
    IsDataTemplate,
    IsDataDeepTileset,
    IsSingleTrack,
    IsChannelDeep,
    IsOverlaidTrack,
    IsFlatTracks,
    IsStackedTracks,
    Is2DTrack
} from '../gosling.schema.guards';
import {
    DEFAULT_INNER_RADIUS_PROP,
    DEFAULT_TRACK_HEIGHT_LINEAR,
    DEFAULT_TRACK_SIZE_2D,
    DEFAULT_TRACK_WIDTH_LINEAR,
    DEFAULT_VIEW_SPACING
} from '../core/defaults';
import { spreadTracksByData } from '../core/utils/overlay';
import { getStyleOverridden } from '../core/utils/style';

/**
 * Traverse individual tracks and call the callback function to read and/or update the track definition.
 * @param spec
 * @param callback
 */
export function traverseTracks(
    spec: GoslingSpec | View | PartialTrack,
    callback: (t: Partial<Track>, i: number, ts: Partial<Track>[]) => void
) {
    if ('tracks' in spec) {
        spec.tracks.forEach((t, i, ts) => {
            callback(t, i, ts);
            traverseTracks(t, callback);
        });
    } else if ('views' in spec) {
        spec.views.forEach(view => traverseTracks(view, callback));
    }
}

/**
 * Traverse individual tracks and views and call the callback function to read and/or update the common definition of views and tracks.
 * @param spec
 * @param callback
 */
export function traverseTracksAndViews(
    spec: GoslingSpec | View | PartialTrack,
    callback: (tv: CommonViewDef | CommonTrackDef) => void
) {
    if ('tracks' in spec) {
        spec.tracks.forEach(t => {
            callback(t);
            traverseTracksAndViews(t, callback);
        });
    } else if ('views' in spec) {
        spec.views.forEach(v => {
            callback(v);
            traverseTracksAndViews(v, callback);
        });
    }
}

/**
 * Traverse individual view arrangements and call the callback function to read and/or update the arrangement information.
 * @param spec
 * @param callback
 */
export function traverseViewArrangements(spec: GoslingSpec, callback: (tv: MultipleViews) => void) {
    if ('tracks' in spec) {
        // No need to do anything
    } else {
        callback(spec);
        spec.views.forEach(v => {
            traverseViewArrangements(v, callback);
        });
    }
}

/**
 * This convert the nested track definitions into a flat array.
 * @param spec
 */
export function convertToFlatTracks(spec: SingleView): Track[] {
    if (IsFlatTracks(spec)) {
        // This is already `FlatTracks`, so just override the view definition
        const base = JSON.parse(JSON.stringify(spec));
        delete (base as any).tracks;
        return spec.tracks
            .filter(track => !track._invalidTrack)
            .map(track => Object.assign(JSON.parse(JSON.stringify(base)), track) as SingleTrack);
    }

    const newTracks: Track[] = [];
    if (IsStackedTracks(spec)) {
        spec.tracks
            .filter(track => !track._invalidTrack)
            .map(track => {
                if ('alignment' in track) {
                    // This is OverlaidTracks
                    newTracks.push({
                        ...track,
                        overlay: [...track.tracks],
                        tracks: undefined,
                        alignment: undefined
                    } as Track);
                } else {
                    // Override track definitions from views
                    const base = JSON.parse(JSON.stringify(spec));
                    delete (base as any).tracks;
                    const newSpec = Object.assign(JSON.parse(JSON.stringify(base)), track) as SingleTrack;
                    newTracks.push(newSpec);
                }
            });
    } else {
        newTracks.push({
            ...spec,
            overlay: [...spec.tracks.filter(track => !track._invalidTrack)],
            tracks: undefined,
            alignment: undefined
        } as Track);
    }

    return JSON.parse(JSON.stringify(newTracks));
}

/**
 * Traverse views and tracks to use parents's properties if missing.
 * @param spec
 * @param callback
 */
export function traverseToFixSpecDownstream(spec: GoslingSpec | SingleView, parentDef?: CommonViewDef | MultipleViews) {
    // TODO: Instead of overriding props individually, use Object.assign()
    if (parentDef) {
        // For assembly and layout, we use the ones defiend by the parents if missing
        if (spec.assembly === undefined) spec.assembly = parentDef.assembly;
        if (spec.layout === undefined) spec.layout = parentDef.layout;
        if (spec.orientation === undefined) spec.orientation = parentDef.orientation;
        if (spec.static === undefined) spec.static = parentDef.static !== undefined ? parentDef.static : false;
        if (spec.zoomLimits === undefined) spec.zoomLimits = parentDef.zoomLimits;
        if (spec.xDomain === undefined) spec.xDomain = parentDef.xDomain;
        if (spec.yDomain === undefined) spec.yDomain = parentDef.yDomain;
        if (spec.linkingId === undefined) spec.linkingId = parentDef.linkingId;
        if (spec.centerRadius === undefined) spec.centerRadius = parentDef.centerRadius;
        if (spec.spacing === undefined && !('tracks' in spec)) spec.spacing = parentDef.spacing;
        if (spec.xOffset === undefined) spec.xOffset = parentDef.xOffset;
        if (spec.yOffset === undefined) spec.yOffset = parentDef.yOffset;
        if ('views' in spec && 'arrangement' in parentDef && spec.arrangement === undefined)
            spec.arrangement = parentDef.arrangement;
        spec.style = getStyleOverridden(parentDef.style, spec.style); // override styles deeply
    } else {
        // This means we are at the rool level, so assign default values if missing
        if (spec.assembly === undefined) spec.assembly = 'hg38';
        if (spec.layout === undefined) spec.layout = 'linear';
        if (spec.orientation === undefined) spec.orientation = 'horizontal';
        if (spec.static === undefined) spec.static = false;
        if (spec.zoomLimits === undefined) spec.zoomLimits = [1, null];
        if (spec.centerRadius === undefined) spec.centerRadius = DEFAULT_INNER_RADIUS_PROP;
        if (spec.spacing === undefined) spec.spacing = DEFAULT_VIEW_SPACING;
        if ('views' in spec && spec.arrangement === undefined) spec.arrangement = 'vertical';
        if (spec.xOffset === undefined) spec.xOffset = 0;
        if (spec.yOffset === undefined) spec.yOffset = 0;
        // Nothing to do when `xDomain` not suggested
        // Nothing to do when `xLinkID` not suggested
    }

    // ID should be assigned to each view and track for an API usage
    if (!spec.id) {
        spec.id = uuid.v4();
    }

    if ('tracks' in spec) {
        let tracks: Track[] = convertToFlatTracks(spec);

        // !!! Be aware that this should be taken before fixing `overlayOnPreviousTrack` options.
        /**
         * Spread superposed tracks if they are assigned to different data spec.
         * This process is necessary since we are passing over each track to HiGlass, and if a track contain multiple datastes, HiGlass cannot handle that.
         */
        tracks = spreadTracksByData(tracks);

        const linkID = uuid.v4();
        tracks.forEach((track, i, array) => {
            // ID should be assigned to each view and track for an API usage
            if (!track.id) {
                track.id = uuid.v4();
            }

            // If size not defined, set default ones
            if (!track.width) {
                track.width = Is2DTrack(track) ? DEFAULT_TRACK_SIZE_2D : DEFAULT_TRACK_WIDTH_LINEAR;
            }
            if (!track.height) {
                track.height = Is2DTrack(track) ? DEFAULT_TRACK_SIZE_2D : DEFAULT_TRACK_HEIGHT_LINEAR;
            }

            /**
             * Process a stack option.
             */
            if ('displacement' in track) {
                if (
                    track.displacement?.type === 'pile' &&
                    track.row === undefined &&
                    IsChannelDeep(track.x) &&
                    track.x.field &&
                    IsChannelDeep(track.xe) &&
                    track.xe.field
                    // Question: Should we consider mark types? (e.g., link might not be supported?)
                ) {
                    const newField = uuid.v4();
                    const startField = track.x.field;
                    const endField = track.xe.field;
                    const padding = track.displacement.padding;
                    const displaceTransform: DisplaceTransform = {
                        type: 'displace',
                        newField,
                        boundingBox: { startField, endField, padding },
                        method: 'pile'
                    };

                    // Add a data transform for stacking
                    if (!track.dataTransform) {
                        track.dataTransform = [];
                    }
                    track.dataTransform = [...track.dataTransform, displaceTransform];
                    track.row = { field: newField, type: 'nominal' };
                } else if (track.displacement?.type === 'spread') {
                    // ...
                }
            }

            /*
             * Properties that shouldn't be suggested
             */
            if (track.layout) track.layout = undefined;
            if (track.zoomLimits) track.zoomLimits = undefined;

            /**
             * Override options received from the parent
             */
            if (!track.assembly) track.assembly = spec.assembly;
            if (!track.layout) track.layout = spec.layout;
            if (!track.orientation) track.orientation = spec.orientation;
            if (track.static === undefined) track.static = spec.static !== undefined ? spec.static : false;
            if (!track.zoomLimits) track.zoomLimits = spec.zoomLimits;

            // Override styles
            track.style = getStyleOverridden(spec.style, track.style);
            if (IsOverlaidTrack(track)) {
                track.overlay.forEach(o => {
                    o.style = getStyleOverridden(track.style, o.style);
                });
            }

            /**
             * Orientation is only supported in 1D linear layouts
             */
            if ((track.layout === 'circular' || Is2DTrack(track)) && track.orientation === 'vertical') {
                track.orientation = 'horizontal';
            }

            /**
             * A track with 2D genomic coordinates is forced to use a linear layout
             */
            if (Is2DTrack(track)) {
                // TODO: Add a test for this.
                track.layout = 'linear';

                /**
                 * Add y-axis domain
                 */
                if ((IsSingleTrack(track) || IsOverlaidTrack(track)) && IsChannelDeep(track.y) && !track.y.domain) {
                    track.y.domain = spec.yDomain;
                } else if (IsOverlaidTrack(track)) {
                    track.overlay.forEach(o => {
                        if (IsChannelDeep(o.y) && !o.y.domain) {
                            o.y.domain = spec.yDomain;
                        }
                    });
                }
            }

            /**
             * Add x-axis domain
             */
            if ((IsSingleTrack(track) || IsOverlaidTrack(track)) && IsChannelDeep(track.x) && !track.x.domain) {
                track.x.domain = spec.xDomain;
            } else if (IsOverlaidTrack(track)) {
                track.overlay.forEach(o => {
                    if (IsChannelDeep(o.x) && !o.x.domain) {
                        o.x.domain = spec.xDomain;
                    }
                });
            }

            /**
             * Link tracks in a single view
             */
            if ((IsSingleTrack(track) || IsOverlaidTrack(track)) && IsChannelDeep(track.x) && !track.x.linkingId) {
                track.x.linkingId = spec.linkingId ?? linkID;
            } else if (IsOverlaidTrack(track)) {
                let isAdded = false;
                track.overlay.forEach(o => {
                    if (isAdded) return; // We want to add only once

                    if (IsChannelDeep(o.x) && !o.x.linkingId) {
                        // TODO: Is this safe?
                        o.x.linkingId = spec.linkingId ?? linkID;
                        isAdded = true;
                    }
                });
            }

            if (i === 0) {
                // There is no track to overlay on
                track.overlayOnPreviousTrack = false;
            }

            // This means this track is positioned on the top of a view
            if (
                i === 0 ||
                (i !== 0 &&
                    tracks.slice(0, i).filter(d => !d.overlayOnPreviousTrack).length === 1 &&
                    track.overlayOnPreviousTrack === true)
            ) {
                /**
                 * Add axis to the first track, i.e., the track on the top, if undefined
                 */
                if ((IsSingleTrack(track) || IsOverlaidTrack(track)) && IsChannelDeep(track.x) && !track.x.axis) {
                    if (track.orientation === 'vertical') {
                        track.x.axis = 'left';
                    } else {
                        track.x.axis = 'top';
                    }
                } else if (IsOverlaidTrack(track)) {
                    // let isNone = false; // If there is at least one 'none' axis, should not render axis.
                    track.overlay.forEach(o => {
                        if (IsChannelDeep(o.x) && !o.x.axis) {
                            if (track.orientation === 'vertical') {
                                o.x.axis = 'left';
                            } else {
                                o.x.axis = 'top';
                            }
                        }
                        //  else if (IsChannelDeep(o.x) && o.x.axis === 'none') {
                        //     isNone = true;
                        // }
                    });
                }
            }

            /*
             * Change axis positions considering the orientation.
             */
            if (
                (IsSingleTrack(track) || IsOverlaidTrack(track)) &&
                IsChannelDeep(track.x) &&
                track.x.axis &&
                track.x.axis !== 'none'
            ) {
                if (track.orientation === 'vertical') {
                    if (track.x.axis === 'top') {
                        track.x.axis = 'left';
                    } else if (track.x.axis === 'bottom') {
                        track.x.axis = 'right';
                    }
                } else {
                    if (track.x.axis === 'left') {
                        track.x.axis = 'top';
                    } else if (track.x.axis === 'right') {
                        track.x.axis = 'bottom';
                    }
                }
            } else if (IsOverlaidTrack(track)) {
                // let isNone = false; // If there is at least one 'none' axis, should not render axis.
                track.overlay.forEach(o => {
                    if (IsChannelDeep(o.x) && o.x.axis && o.x.axis !== 'none') {
                        if (track.orientation === 'vertical') {
                            if (o.x.axis === 'top') {
                                o.x.axis = 'left';
                            } else if (o.x.axis === 'bottom') {
                                o.x.axis = 'right';
                            }
                        } else {
                            if (o.x.axis === 'left') {
                                o.x.axis = 'top';
                            } else if (o.x.axis === 'right') {
                                o.x.axis = 'bottom';
                            }
                        }
                    }
                    //  else if (IsChannelDeep(o.x) && o.x.axis === 'none') {
                    //     isNone = true;
                    // }
                });
            }

            /*
             * Flip y scale if the last track uses `link` marks
             */
            if (
                // first track can never flipped by default
                i !== 0 &&
                // [0, ..., i] tracks should not overlaid as a single track
                ((i === array.length - 1 && array.slice(0, i + 1).filter(d => d.overlayOnPreviousTrack).length < i) ||
                    // Are the rest of the tracks overlaid as a single track?
                    (i !== array.length - 1 &&
                        array.slice(i + 1).filter(d => d.overlayOnPreviousTrack).length === array.length - i - 1 &&
                        array.slice(0, i + 1).filter(d => d.overlayOnPreviousTrack).length < i))
            ) {
                if (IsSingleTrack(track) && track.mark === 'withinLink' && track.flipY === undefined) {
                    track.flipY = true;
                } else if (IsOverlaidTrack(track)) {
                    if (track.mark === 'withinLink' && track.flipY === undefined) {
                        track.flipY = true;
                    }
                    track.overlay.forEach(o => {
                        if (o.mark === 'withinLink' && o.flipY === undefined) {
                            o.flipY = true;
                        }
                    });
                }
            }

            if (track.overlayOnPreviousTrack && array[i - 1]) {
                // Use the same size as the previous one
                track.width = array[i - 1].width;
                track.height = array[i - 1].height;

                track.layout = array[i - 1].layout;
                track.assembly = array[i - 1].assembly;
            }
        });

        spec.tracks = tracks;
    } else {
        // we did not reach track definition, so continue traversing
        spec.views.forEach(v => {
            traverseToFixSpecDownstream(v, spec as CommonViewDef);
        });
    }
}

/**
 * Get an encoding template for the `higlass-vector` data type.
 * @param column
 * @param value
 */
export function getVectorTemplate(column: string, value: string): SingleTrack {
    return {
        data: {
            type: 'vector',
            url: '',
            column,
            value
        },
        mark: 'bar',
        x: { field: column, type: 'genomic', axis: 'top' },
        y: { field: value, type: 'quantitative' },
        width: 400,
        height: 100
    };
}

export function getMultivecTemplate(
    row: string,
    column: string,
    value: string,
    categories: string[] | undefined
): SingleTrack {
    return categories && categories.length < 10
        ? {
              data: {
                  type: 'multivec',
                  url: '',
                  row,
                  column,
                  value,
                  categories
              },
              mark: 'bar',
              x: { field: column, type: 'genomic', axis: 'top' },
              y: { field: value, type: 'quantitative' },
              row: { field: row, type: 'nominal', legend: true },
              color: { field: row, type: 'nominal' },
              width: 400,
              height: 100
          }
        : {
              data: {
                  type: 'multivec',
                  url: '',
                  row,
                  column,
                  value,
                  categories
              },
              mark: 'rect',
              x: { field: column, type: 'genomic', axis: 'top' },
              row: { field: row, type: 'nominal', legend: true },
              color: { field: value, type: 'quantitative' },
              width: 400,
              height: 100
          };
}

/**
 * Override default visual encoding in each track for given data type.
 * @param spec
 */
export function overrideDataTemplates(spec: GoslingSpec) {
    traverseTracks(spec, (t, i, ts) => {
        if (!t.data || !IsDataDeepTileset(t.data)) {
            // if `data` is not specified, we can not provide a correct template.
            return;
        }

        if ('alignment' in t) {
            // This is an OverlaidTracks, so skip this.
            return;
        }

        if (!IsDataTemplate(t)) {
            // This is not partial specification that we need to use templates
            return;
        }

        switch (t.data.type) {
            case 'vector':
            case 'bigwig':
                ts[i] = Object.assign(getVectorTemplate(t.data.column ?? 'position', t.data.value ?? 'value'), t);
                break;
            case 'multivec':
                ts[i] = Object.assign(
                    getMultivecTemplate(
                        t.data.row ?? 'category',
                        t.data.column ?? 'position',
                        t.data.value ?? 'value',
                        t.data.categories
                    ),
                    t
                );
                break;
        }
    });
}
