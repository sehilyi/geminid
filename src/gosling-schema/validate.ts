import Ajv from 'ajv';
import type { SingleTrack, ChannelDeep, ChannelTypes, OverlaidTrack, Track } from './gosling.schema';
import { IsChannelDeep } from './gosling.schema.guards';
import { resolveSuperposedTracks } from '../core/utils/overlay';
import GoslingSchema from './gosling.schema.json';
import type { ProcessedTrack } from 'src/track-def/types';

export interface Validity {
    message: string;
    state: 'success' | 'warn' | 'error';
    details?: string;
}

export function validateGoslingSpec(spec: any): Validity {
    return validateSpec(GoslingSchema, spec);
}

/**
 *
 */
export function validateSpec(schema: any, spec: any, silence = false): Validity {
    const validate = new Ajv({ extendRefs: true }).compile(schema);
    const valid = validate(spec);

    let message = '';
    let details = '';

    if (validate.errors) {
        details = JSON.stringify(validate.errors, null, 2);

        if (!silence) {
            console.warn(details);
        }

        message = '⚠️ Some properties are incorrectly used.';
    }

    return { state: valid ? 'success' : 'warn', message, details };
}

export function validateProcessedTrack(track: ProcessedTrack) {
    let valid = true;
    const errorMessages: string[] = [];

    // @ts-expect-error This function should be re-written
    const resolvedTrack = resolveSuperposedTracks(track);

    resolvedTrack.forEach(spec => {
        // Validate with json schema
        // ...

        // Additionally, validate the schema with the aspects that cannot be validated by the json schema
        if (!getGenomicChannelFromTrack(spec) && spec.mark !== 'brush' && spec.mark !== 'rule') {
            // as an exception, brush and rule can encode no genomic data
            errorMessages.push('genomic type is not encoded to either a x- or y- axis');
            // EXPERIMENTAL: we are removing this rule in our spec.
            valid = false;
        }

        // combination of visual mark and channel
        const color = spec.color;
        if (spec.mark === 'line' && IsChannelDeep(color) && color.type === 'quantitative') {
            errorMessages.push('`line` mark cannot be used with `quantitative` value');
            valid = false;
        }

        /**
         * Linking
         */
        // are the linking used for same visual channels (do not work betwee `x` and `size`)
    });

    return { valid, errorMessages };
}

/**
 * Find an axis channel that is encoded with genomic coordinate.
 * `undefined` if not found.
 */
export function getGenomicChannelFromTrack(track: SingleTrack | OverlaidTrack): ChannelDeep | undefined {
    // we do not support using two genomic coordinates yet
    let genomicChannel: ChannelDeep | undefined = undefined;
    ['x', 'y', 'xe', 'ye', 'x1', 'y1', 'x1e', 'y1e'].reverse().forEach(channelType => {
        const channel = track[channelType as keyof typeof ChannelTypes];
        if (IsChannelDeep(channel) && channel.type === 'genomic') {
            genomicChannel = channel;
        }
    });
    return genomicChannel;
}

/**
 * Find an axis channel that is encoded with genomic coordinate and return 'x' or 'y'.
 * `undefined` if not found.
 */
export function getGenomicChannelKeyFromTrack(
    track: SingleTrack | OverlaidTrack
): 'x' | 'xe' | 'y' | 'ye' | 'x1' | 'y1' | 'x1e' | 'y1e' | undefined {
    // we do not support using two genomic coordinates yet
    let genomicChannelKey: string | undefined = undefined;
    ['x', 'xe', 'y', 'ye', 'x1', 'y1', 'x1e', 'y1e'].reverse().forEach(channelKey => {
        const channel = track[channelKey as keyof typeof ChannelTypes];
        if (IsChannelDeep(channel) && channel.type === 'genomic') {
            genomicChannelKey = channelKey;
        }
    });
    return genomicChannelKey;
}
