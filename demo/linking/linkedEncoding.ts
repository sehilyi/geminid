import {
    IsDummyTrack,
    IsMultipleViews,
    IsSingleView,
    type Assembly,
    type SingleView
} from '@gosling-lang/gosling-schema';
import { GenomicPositionHelper, computeChromSizes } from '../../src/core/utils/assembly';
import { signal, type Signal } from '@preact/signals-core';
import type { GoslingSpec } from 'gosling.js';
import { TrackType } from '../../src/track-def';
import { isHeatmapTrack } from '../../src/track-def/heatmap';

/**
 * This is the information needed to link tracks together
 */
export interface LinkedEncoding {
    linkingId: string;
    signal: Signal;
    tracks: {
        id: string;
        encoding: 'x' | 'y' | 'brush';
    }[];
}

/**
 * This is information extracted from the Gosling spec.
 * Is is the linking that is defined at the view level.
 */
interface ViewLink {
    linkingId?: string;
    encoding: 'x' | 'y';
    trackIds: string[];
    signal: Signal;
}

/**
 * This is information extracted from the Gosling spec.
 * It is the x-linking defined at the track level (opposed to the view level)
 */
interface TrackLink {
    encoding: 'x' | 'brush' | 'y';
    linkingId: string;
    trackId: string;
    trackType: TrackType;
    signal?: Signal; // Some encodings have a "domain" property that can be used to create a signal
}

/**
 * Info collected from the GoslingSpec that is needed to link tracks together
 * The brushIds are added after the fact
 */
interface LinkInfo {
    trackLinks: TrackLink[];
    viewLinks: ViewLink[];
}

/**
 * Extracts the linked encodings from a GoslingSpec
 */
export function getLinkedEncodings(gs: GoslingSpec) {
    // First, we traverse the gosling spec to find all the linked tracks and brushes
    const { trackLinks, viewLinks } = getLinkedFeaturesRecursive(gs);
    // We associate tracks the other tracks they are linked with
    const linkedEncodings = viewLinks.map(viewLink => {
        const linkedTracks = getLinkedTracks(viewLink.linkingId, trackLinks).map(track => ({
            id: track.trackId,
            encoding: track.encoding
        }));
        const viewTracks = viewLink.trackIds.map(trackId => ({ id: trackId, encoding: viewLink.encoding }));
        return {
            linkingId: viewLink.linkingId,
            signal: viewLink.signal,
            tracks: [...linkedTracks, ...viewTracks]
        } as LinkedEncoding;
    });
    // Combine trackLinks that do not belong to any viewLink
    const unlinkedTracks = trackLinks.filter(
        trackLink =>
            !linkedEncodings.some(link => link.linkingId !== undefined && trackLink.linkingId === link.linkingId)
    );
    linkedEncodings.push(...combineUnlinkedTracks(unlinkedTracks));

    return linkedEncodings.filter(link => link.tracks.length > 0);
}

/**
 * This function takes a list of unlinked tracks and combines them into linked encodings
 * This can happen when a track uses the "domain" property
 */
function combineUnlinkedTracks(unlinkedTracks: TrackLink[]): LinkedEncoding[] {
    const linkedEncodings: LinkedEncoding[] = [];
    unlinkedTracks.forEach(trackLink => {
        const existingLink = linkedEncodings.find(link => link.linkingId && link.linkingId === trackLink.linkingId);
        if (existingLink) {
            existingLink.tracks.push({ id: trackLink.trackId, encoding: trackLink.encoding });
            if (trackLink.signal) {
                existingLink.signal = trackLink.signal;
            }
        } else {
            // TODO: handle default domain better.
            // We might just want to remove this link all together if it doesn't have a domain
            const DEFAULT_DOMAIN = [0, 3088269832];
            const newLink = {
                linkingId: trackLink.linkingId,
                tracks: [],
                signal: signal(DEFAULT_DOMAIN) // this signal will get replaced if the track has a domain
            } as LinkedEncoding;
            newLink.tracks.push({ id: trackLink.trackId, encoding: trackLink.encoding });
            if (trackLink.signal) {
                newLink.signal = trackLink.signal;
            }
            linkedEncodings.push(newLink);
        }
    });
    return linkedEncodings;
}

/**
 * Helper function to get linked tracks by linkingId
 */
function getLinkedTracks(linkingId: string | undefined, trackLinks: TrackLink[]) {
    if (!linkingId) return [];
    return trackLinks.filter(trackLink => trackLink.linkingId === linkingId);
}

/**
 * Traverses the gosling spec to find all the linked tracks and brushes
 */
function getLinkedFeaturesRecursive(gs: GoslingSpec): LinkInfo {
    // Helper function to merge view links which have the same linkingId
    function mergeViewLinks(existing: ViewLink[], newLinks: ViewLink[]) {
        newLinks.forEach(newLink => {
            const existingLink = existing.find(
                link => link.linkingId !== undefined && link.linkingId === newLink.linkingId
            );
            if (existingLink) {
                existingLink.trackIds.push(...newLink.trackIds);
            } else {
                existing.push(newLink);
            }
        });
        return existing;
    }
    // Base case: single view
    if (IsSingleView(gs)) {
        const viewLinks = getSingleViewLinks(gs);
        const trackLinks = getSingleViewTrackLinks(gs);
        return { viewLinks: viewLinks, trackLinks };
    }
    const linked: LinkInfo = { viewLinks: [], trackLinks: [] };
    // Recursive case: multiple views
    if (IsMultipleViews(gs)) {
        gs.views.forEach(view => {
            const newLinks = getLinkedFeaturesRecursive(view);
            linked.viewLinks = mergeViewLinks(linked.viewLinks, newLinks.viewLinks);
            linked.trackLinks.push(...newLinks.trackLinks);
        });
    }
    return linked;
}

/**
 * Extracts the linkingId from tracks that have a brush overlay
 */
function getSingleViewTrackLinks(gs: SingleView): TrackLink[] {
    // Helper function to create a track link for the x encoding
    function createTrackLinkX(trackId: string, track: Track, trackType: TrackType, gs: SingleView) {
        const trackLink = {
            trackId: trackId,
            linkingId: track.x.linkingId,
            trackType,
            encoding: 'x'
        } as TrackLink;
        // If the track has a domain, we create a signal and add it to the trackLink
        if (track.x.domain !== undefined) {
            const { assembly } = gs;
            const domain = getDomain(track.x.domain, assembly);
            trackLink.signal = signal(domain);
        }
        return trackLink;
    }
    function createTrackLinkY(trackId: string, track: Track, trackType: TrackType, gs: SingleView) {
        const { assembly } = gs;
        const trackLink = {
            trackId: trackId,
            linkingId: track.y.linkingId,
            trackType,
            encoding: 'y'
        } as TrackLink;
        // If the track has a domain, we create a signal and add it to the trackLink
        if (track.y.domain !== undefined) {
            const domain = getDomain(track.y.domain, assembly);
            trackLink.signal = signal(domain);
        }
        return trackLink;
    }

    const { assembly, xDomain, yDomain, tracks } = gs;
    const viewXDomain = getDomain(xDomain, assembly);
    const trackLinks: TrackLink[] = [];
    tracks.forEach(track => {
        const trackType = isHeatmapTrack(track) ? TrackType.Heatmap : TrackType.Gosling;
        // Handle the y domain
        if (isGenomicEncoding(track, 'y') && hasDiffYDomainThanView(track)) {
            const trackLink = createTrackLinkY(track.id, track, trackType, gs);
            trackLinks.push(trackLink);
        }
        // Handle x domain
        if (hasDiffXDomainThanView(gs, track, assembly, viewXDomain)) {
            if (track.mark === 'brush') {
                console.warn('Track with brush mark should only be used as an overlay');
                return;
            }
            const trackLink = createTrackLinkX(track.id, track, trackType, gs);
            trackLinks.push(trackLink);
        }

        // Handle linking in the brushes which are defined in the overlay tracks
        if (!('_overlay' in track)) return;
        // Handle case where we have multiple overlay tracks (we only care about the brushes)
        track._overlay!.forEach(overlay => {
            if (overlay.mark === 'brush') {
                const trackType = gs.layout === 'linear' ? TrackType.BrushLinear : TrackType.BrushCircular;
                const trackLink = {
                    trackId: overlay.id,
                    linkingId: overlay.x.linkingId,
                    trackType,
                    encoding: 'brush'
                };
                if (overlay.x.domain !== undefined) {
                    const { assembly } = gs;
                    const domain = getDomain(overlay.x.domain, assembly);
                    trackLink.signal = signal(domain);
                }
                trackLinks.push(trackLink);
            }
        });
    });
    return trackLinks;
}

/**
 * Links all of the tracks in a single view together
 */
function getSingleViewLinks(gs: SingleView): ViewLink[] {
    function addLinkY(tracks: Track[], viewYDomain: [number, number]): ViewLink {
        const viewLinkY: ViewLink = {
            linkingId: undefined,
            encoding: 'y',
            signal: signal(viewYDomain),
            trackIds: []
        };
        // Add each track to the link
        tracks.forEach(track => {
            // Edge case: The first track in a view with "alignment": "overlay" can
            // sometimes not have a y encoding but it has a single overlay track which contains the y encoding
            const missingX = !('x' in track) || track.x === undefined;
            const missingY = !('y' in track) || track.y === undefined;
            const hasOverlay = '_overlay' in track && track._overlay.length == 1;
            if (missingX && missingY && hasOverlay) track = { ...track, y: track._overlay[0].y };
            // Continue as usual
            if (isGenomicEncoding(track, 'y') && !hasDiffYDomainThanView(track)) {
                viewLinkY.trackIds.push(track.id);
            }
        });
        return viewLinkY;
    }
    function addLinkX(tracks: Track[], assembly: Assembly | undefined, viewXDomain: [number, number]): ViewLink {
        const viewLinkX: ViewLink = {
            linkingId: gs.linkingId,
            encoding: 'x',
            signal: signal(viewXDomain),
            trackIds: []
        };
        // Add each track to the link
        tracks.forEach(track => {
            // If the track is already linked to something else, we don't need to add it again
            // Or if the track is a dummy track, we don't need to add it
            if (hasDiffXDomainThanView(gs, track, assembly, viewXDomain) || IsDummyTrack(track)) return;
            const hasOverlaidTracks = '_overlay' in track;
            // Add overlaid brush tracks to the link
            if (hasOverlaidTracks) {
                track._overlay?.forEach(overlay => {
                    if (overlay.mark === 'brush') {
                        viewLinkX.trackIds.push(overlay.id);
                    }
                });
            }
            viewLinkX.trackIds.push(track.id);
        });
        return viewLinkX;
    }
    const { tracks, xDomain, yDomain, assembly } = gs;
    const viewXDomain = getDomain(xDomain, assembly);
    const viewYDomain = getDomain(yDomain ?? xDomain, assembly);

    const xLink = addLinkX(tracks, assembly, viewXDomain);
    const yLink = addLinkY(tracks, viewYDomain);
    return [xLink, yLink].filter(link => link.trackIds.length > 0);
}

function hasDiffXDomainThanView(
    view: SingleView,
    track: Track,
    assembly: Assembly | undefined,
    viewXDomain: [number, number]
) {
    // If the track x has a linkingId which is different from the viewLinkingId, then it has a different domain
    const hasLinkingId = 'x' in track && track.x && 'linkingId' in track.x && track.x?.linkingId !== undefined;
    const viewLinkingId = view.linkingId;
    const trackLinkingId = track.x?.linkingId;
    if (hasLinkingId && viewLinkingId !== trackLinkingId) return true;

    // If the x encoding as a domain, we need to check whether it is different than the view
    const hasXEncodingDomain = 'x' in track && track.x && 'domain' in track.x && track.x?.domain !== undefined;

    if (hasXEncodingDomain) {
        const xEncodingDomain = getDomain(track.x?.domain, assembly);
        return !viewXDomain.every((val, index) => val === xEncodingDomain[index]);
    }
    return false;
}

function isGenomicEncoding(track: Track, encoding: 'x' | 'y') {
    const isGenomic =
        encoding in track && track[encoding] && 'type' in track[encoding] && track[encoding].type === 'genomic';
    return isGenomic;
}

function hasDiffYDomainThanView(track: Track) {
    const hasLinkingId = 'y' in track && track.y && 'linkingId' in track.y && track.y?.linkingId !== undefined;
    return hasLinkingId;
}

/**
 * For a given xDomain and Assembly, return the the absolute domain [start, end]
 */
function getDomain(xDomain: GoslingSpec['xDomain'], assembly?: Assembly): [number, number] {
    let domain = [0, 0] as [number, number];
    const hasOnlyInterval = xDomain && 'interval' in xDomain && !('chromosome' in xDomain);
    if (!xDomain) {
        domain = [0, computeChromSizes(assembly).total];
    } else if (hasOnlyInterval) {
        // If we are only given the interval, then we assume that the interval is already in absolute coordinates
        const { interval } = xDomain;
        domain = interval;
    } else {
        const position = createDomainString(xDomain);
        const manager = GenomicPositionHelper.fromString(position);
        domain = manager.toAbsoluteCoordinates(assembly, 0);
    }
    return domain;
}

/**
 * Generates a string representation of the xDomain
 */
function createDomainString(xDomain: GoslingSpec['xDomain']) {
    if (typeof xDomain === 'string') {
        return xDomain;
    }
    let position = '';
    const hasOnlyInterval = 'interval' in xDomain && !('chromosome' in xDomain);
    const hasOnlyChromosome = 'chromosome' in xDomain && !('interval' in xDomain);
    const hasBoth = 'chromosome' in xDomain && 'interval' in xDomain;

    if (typeof xDomain === 'string') {
        position = xDomain;
    } else if (hasOnlyInterval) {
        position = `chr:${xDomain.interval[0]}-${xDomain.interval[1]}`;
    } else if (hasOnlyChromosome) {
        position = xDomain.chromosome;
    } else if (hasBoth) {
        position = `${xDomain.chromosome}:${xDomain.interval[0]}-${xDomain.interval[1]}`;
    }
    return position;
}
