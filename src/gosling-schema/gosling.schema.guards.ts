import type {
    ChannelDeep,
    ChannelValue,
    DataDeep,
    Datum,
    DomainChr,
    DomainInterval,
    DomainChrInterval,
    Style,
    Track,
    SingleTrack,
    OverlaidTrack,
    ChannelTypes,
    Channel,
    FieldType,
    Domain,
    FilterTransform,
    OneOfFilter,
    RangeFilter,
    IncludeFilter,
    BeddbData,
    MultivecData,
    MatrixData,
    VectorData,
    BigWigData,
    SingleView,
    FlatTracks,
    OverlaidTracks,
    StackedTracks,
    BamData,
    Range,
    TemplateTrack,
    MouseEventsDeep,
    DataTransform,
    DummyTrack,
    MultipleViews
} from './gosling.schema';
import { SUPPORTED_CHANNELS } from '../core/mark';
import {
    interpolateGreys,
    interpolateWarm,
    interpolateSpectral,
    interpolateCividis,
    interpolateBuPu,
    interpolateRdBu,
    interpolateViridis,
    interpolateYlOrBr,
    interpolateRdPu
} from 'd3-scale-chromatic';
import { resolveSuperposedTracks } from '../core/utils/overlay';
import type { TabularDataFetcher } from '@data-fetchers';
import type { ProcessedDummyTrack, ProcessedTrack } from '../track-def/types';

export const PREDEFINED_COLOR_STR_MAP: { [k: string]: (t: number) => string } = {
    viridis: interpolateViridis,
    grey: interpolateGreys,
    warm: interpolateWarm,
    spectral: interpolateSpectral,
    cividis: interpolateCividis,
    bupu: interpolateBuPu,
    rdbu: interpolateRdBu,
    hot: interpolateYlOrBr,
    pink: interpolateRdPu
};

export function isObject(x: unknown): x is Record<PropertyKey, unknown> {
    return typeof x === 'object' && x !== null;
}

export function isTabularDataFetcher(dataFetcher: unknown): dataFetcher is TabularDataFetcher<unknown> {
    return isObject(dataFetcher) && 'getTabularData' in dataFetcher;
}

export function hasDataTransform(spec: SingleTrack | OverlaidTrack, type: DataTransform['type']) {
    return (spec.dataTransform ?? []).some(d => d.type === type);
}

/**
 * This returns an array of color strings that can be assigned to HiGlass' option, `colorRange`
 */
export function getHiGlassColorRange(colorStr = 'viridis', step = 100) {
    const interpolate = PREDEFINED_COLOR_STR_MAP[colorStr] ?? PREDEFINED_COLOR_STR_MAP['viridis'];
    return [...Array(step)].map((_, i) => interpolate((1 / step) * i));
}

export function IsFlatTracks(_: SingleView): _ is FlatTracks {
    return !('alignment' in _) && !_.tracks.find(d => (d as any).alignment === 'overlay' || 'tracks' in d);
}
export function IsOverlaidTracks(_: SingleView): _ is OverlaidTracks {
    return 'alignment' in _ && _.alignment === 'overlay';
}
export function IsStackedTracks(_: SingleView): _ is StackedTracks {
    return !IsFlatTracks(_) && !IsOverlaidTracks(_);
}

export function IsDummyTrack(_: Track | ProcessedTrack): _ is DummyTrack | ProcessedDummyTrack {
    return 'type' in _ && _.type == 'dummy-track';
}

export function IsDataDeep(data: DataDeep | Datum[]): data is DataDeep {
    return typeof data === 'object';
}

export function IsDomainFlat(domain: Domain): domain is string[] | number[] {
    return Array.isArray(domain);
}

export function IsDomainChr(domain: Domain): domain is DomainChr {
    return 'chromosome' in domain && !('interval' in domain);
}

export function IsDomainInterval(domain: Domain): domain is DomainInterval {
    return !('chromosome' in domain) && 'interval' in domain;
}

export function IsDomainChrInterval(domain: Domain): domain is DomainChrInterval {
    return 'chromosome' in domain && 'interval' in domain;
}

export function IsTrackStyle(track: Style | undefined): track is Style {
    return track !== undefined;
}

export function IsSingleTrack(track: Track): track is SingleTrack {
    return !('_overlay' in track);
}

export function IsOverlaidTrack(track: Partial<Track>): track is OverlaidTrack {
    return '_overlay' in track;
}

export function IsTemplateTrack(track: Partial<Track>): track is TemplateTrack {
    return 'template' in track;
}

export function IsSingleView(view: unknown): view is SingleView {
    return isObject(view) && 'tracks' in view;
}

export function IsMultipleViews(view: unknown): view is MultipleViews {
    return isObject(view) && 'views' in view;
}

/**
 * Is this a vertical rule, i.e., y genomic axis?
 */
export function IsVerticalRule(track: Track) {
    return IsSingleTrack(track) && !IsChannelDeep(track.x) && IsChannelDeep(track.y) && track.y.type === 'genomic';
}

/**
 * Is this 2D track, i.e., two genomic axes?
 */
export function Is2DTrack(track: Track) {
    // If this is an overlaid tracks (e.g., matrix w/ rules),
    // we use the first `SingleTrack` to check the type of two axes.
    const t = IsSingleTrack(track) ? track : resolveSuperposedTracks(track)[0];
    return IsChannelDeep(t.x) && t.x.type === 'genomic' && IsChannelDeep(t.y) && t.y.type === 'genomic';
}

/**
 * Do we want to use HiGlass matrix track (i.e., 'heatmap') to rendering the given visualization?
 */
export function IsHiGlassMatrix(track: SingleTrack) {
    return (
        Is2DTrack(track) &&
        track.data.type === 'matrix' &&
        (track.mark === 'bar' || track.mark === 'rect') &&
        track.xe &&
        track.ye
    );
}

export function IsChannelValue(channel: ChannelDeep | ChannelValue | undefined | 'none'): channel is ChannelValue {
    return channel !== null && typeof channel === 'object' && 'value' in channel;
}

export function IsDataDeepTileset(
    _: DataDeep | undefined
): _ is BeddbData | VectorData | MultivecData | BigWigData | BamData | MatrixData {
    return (
        _ !== undefined &&
        (_.type === 'vector' ||
            _.type === 'beddb' ||
            _.type === 'multivec' ||
            _.type === 'bigwig' ||
            _.type === 'matrix' ||
            _.type === 'bam' ||
            _.type === 'vcf' ||
            _.type === 'gff' ||
            _.type === 'bed')
    );
}

/**
 * Checks if a channel is of type ChannelDeep
 */
export function IsChannelDeep(channel: ChannelDeep | ChannelValue | undefined): channel is ChannelDeep {
    return isObject(channel) && !('value' in channel);
}

export function IsOneOfFilter(_: FilterTransform): _ is OneOfFilter {
    return 'oneOf' in _;
}

export function IsRangeFilter(_: FilterTransform): _ is RangeFilter {
    return 'inRange' in _;
}

export function IsIncludeFilter(_: FilterTransform): _ is IncludeFilter {
    return 'include' in _;
}

/**
 * Check whether domain is in array shape.
 */
export function IsDomainArray(domain?: Domain): domain is string[] | number[] {
    return Array.isArray(domain);
}

/**
 * Check whether range is in array shape.
 */
export function IsRangeArray(range?: Range): range is string[] | number[] {
    return Array.isArray(range);
}

// TODO: perhaps, combine this with `isStackedChannel`
/**
 * Check whether visual marks can be stacked on top of each other.
 */
export function IsStackedMark(track: SingleTrack): boolean {
    return (
        (track.mark === 'bar' || track.mark === 'area' || track.mark === 'text') &&
        IsChannelDeep(track.color) &&
        track.color.type === 'nominal' &&
        (!track.row || IsChannelValue(track.row)) &&
        // TODO: determine whether to use stacked bar for nominal fields or not
        IsChannelDeep(track.y) &&
        track.y.type === 'quantitative' &&
        !IsChannelDeep(track.ye)
    );
}

/**
 * Check whether visual marks in this channel are stacked on top of each other.
 * For example, `area` marks with a `quantitative` `y` channel are being stacked.
 */
export function IsStackedChannel(track: SingleTrack, channelKey: keyof typeof ChannelTypes): boolean {
    const channel = track[channelKey];
    return (
        IsStackedMark(track) &&
        // only x or y channel can be stacked
        (channelKey === 'x' || channelKey === 'y') &&
        // only quantitative channel can be stacked
        IsChannelDeep(channel) &&
        channel.type === 'quantitative'
    );
}

/**
 * Retreive value using a `channel`.
 * `undefined` if unable to retreive the value.
 */
export function getValueUsingChannel(datum: { [k: string]: string | number }, channel: Channel) {
    if (IsChannelDeep(channel) && channel.field) {
        return datum[channel?.field];
    }
    return undefined;
}

export function getChannelKeysByAggregateFnc(spec: SingleTrack) {
    const keys: (keyof typeof ChannelTypes)[] = [];
    SUPPORTED_CHANNELS.forEach(k => {
        const c = spec[k];
        if (IsChannelDeep(c) && 'aggregate' in c) {
            keys.push(k);
        }
    });
    return keys;
}

/**
 * Get channel keys by a field type.
 */
export function getChannelKeysByType(spec: SingleTrack, t: FieldType) {
    const keys: (keyof typeof ChannelTypes)[] = [];
    SUPPORTED_CHANNELS.forEach(k => {
        const c = spec[k];
        if (IsChannelDeep(c) && c.type === t) {
            keys.push(k);
        }
    });
    return keys;
}

export function IsXAxis(_: Track) {
    if ((IsSingleTrack(_) || IsOverlaidTrack(_)) && IsChannelDeep(_.x) && _.x.axis && _.x.axis !== 'none') {
        return true;
    } else if (IsOverlaidTrack(_)) {
        let isFound = false;
        _._overlay.forEach(t => {
            if (isFound) return;

            if (IsChannelDeep(t.x) && t.x.axis && t.x.axis !== 'none') {
                isFound = true;
            }
        });
        return isFound;
    }
    return false;
}

export function IsYAxis(_: Track) {
    if ((IsSingleTrack(_) || IsOverlaidTrack(_)) && IsChannelDeep(_.y) && _.y.axis && _.y.axis !== 'none') {
        return true;
    } else if (IsOverlaidTrack(_)) {
        let isFound = false;
        _._overlay.forEach(t => {
            if (isFound) return;

            if (IsChannelDeep(t.y) && t.y.axis && t.y.axis !== 'none') {
                isFound = true;
            }
        });
        return isFound;
    }
    return false;
}

/* ----------------------------- MOUSE EVENT ----------------------------- */

export function IsMouseEventsDeep(_?: boolean | MouseEventsDeep): _ is MouseEventsDeep {
    return typeof _ === 'object';
}
