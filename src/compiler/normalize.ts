import {
    IsChannelDeep,
    type DisplaceTransform,
    type GoslingSpec,
    type TemplateTrackDef
} from '@gosling-lang/gosling-schema';
import { replaceTrackTemplates } from '../core/utils/template';
import { traverseTracks } from './spec-preprocess';
import { uuid } from '../core/utils/uuid';

/**
 * Normalize a Gosling spec.
 * The same visualization can be defined in several different ways using Gosling.
 * This function reduces such variations.
 */
export function normalizeSpec(spec: GoslingSpec, templates: TemplateTrackDef[]) {
    // Replace track templates with gosling specs (i.e., `TemplateTrack` => `SingleTrack | OverlaidTrack`)
    replaceTrackTemplates(spec, templates);

    // Replace short-form displacement defs with `dataTransform` defs
    replaceDisplacements(spec);
}

/**
 * The short-form definitions of mark displacements are expanded with `dataTransform` definitions.
 */
export function replaceDisplacements(spec: GoslingSpec) {
    traverseTracks(spec, track => {
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
                const newField = uuid();
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
    });
}
