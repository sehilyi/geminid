import type { CommonTrackDef, CommonViewDef, GoslingSpec, PartialTrack, View } from '@gosling.schema';
import { traverseTracksAndViews } from './utils/spec-preprocess';

/**
 * Find all unique IDs of 'views' in a Gosling spec and return them as an array.
 * @param spec
 * @returns
 */
export function getViewIds(spec: GoslingSpec | View | PartialTrack) {
    const viewIds = new Set<string>();
    if (spec.id) {
        // root view
        viewIds.add(spec.id);
    }
    traverseTracksAndViews(spec, subSpec => {
        if ('views' in subSpec || 'tracks' in subSpec) {
            // encountered a view
            if (subSpec.id) {
                // found a valid view id
                viewIds.add(subSpec.id);
            }
        }
    });
    return Array.from(viewIds);
}

/**
 * Find all unique IDs of 'tracks' in a Gosling spec and return them as an array.
 * @param spec
 * @returns
 */
export function getTrackIds(spec: GoslingSpec | View | PartialTrack) {
    const trackIds = new Set<string>();
    traverseTracksAndViews(spec, subSpec => {
        if (!('views' in subSpec) && !('tracks' in subSpec)) {
            // encountered a track
            if (subSpec.id) {
                // found a valid track id
                trackIds.add(subSpec.id);
            }
        }
    });
    return Array.from(trackIds);
}

/**
 * Get an internal spec using an ID of a track or a view. `undefined` if unfound.
 * @param spec
 * @returns
 */
export function getInternalSpecById(spec: GoslingSpec | View | PartialTrack, id: string) {
    let internalSpec: CommonViewDef | CommonTrackDef | undefined;
    if (spec.id === id) {
        // root view
        internalSpec = spec;
    }
    traverseTracksAndViews(spec, subSpec => {
        if (subSpec.id === id) {
            internalSpec = subSpec;
        }
    });
    return internalSpec;
}
