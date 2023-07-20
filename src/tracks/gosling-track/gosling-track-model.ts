import * as uuid from 'uuid';
import type {
    ChannelDeep,
    PredefinedColors,
    ChannelTypes,
    ChannelValue,
    SingleTrack,
    Channel,
    Color,
    Stroke
} from './gosling.schema';
import { validateTrack, getGenomicChannelFromTrack, getGenomicChannelKeyFromTrack } from './utils/validate';
import {
    type ScaleLinear,
    scaleLinear,
    type ScaleOrdinal,
    scaleOrdinal,
    type ScaleBand,
    scaleBand,
    type ScaleSequential,
    scaleSequential
} from 'd3-scale';
import { interpolateViridis } from 'd3-scale-chromatic';
import { min as d3min, max as d3max, sum as d3sum, group } from 'd3-array';
import { HIGLASS_AXIS_SIZE } from '../../compiler/higlass-model';
import { SUPPORTED_CHANNELS } from './mark';
import type { PIXIVisualProperty } from './visual-property.schema';
import { rectProperty } from './mark/rect';
import { pointProperty } from './mark/point';
import { barProperty } from './mark/bar';
import { getNumericDomain } from './utils/scales';
import { logicalComparison } from './utils/semantic-zoom';
import { aggregateData } from './utils/data-transform';
import {
    IsChannelDeep,
    IsChannelValue,
    getValueUsingChannel,
    IsStackedChannel,
    IsDomainArray,
    PREDEFINED_COLOR_STR_MAP,
    IsRangeArray
} from './gosling.schema.guards';
import { CHANNEL_DEFAULTS } from './channel';
import { type CompleteThemeDeep, getTheme } from './utils/theme';
import { MouseEventModel } from 'src/tracks/gosling-track/gosling-mouse-event';

export type ScaleType =
    | ScaleLinear<any, any>
    | ScaleOrdinal<any, any>
    | ScaleBand<any>
    | ScaleSequential<any>
    | (() => string | number); // constant value

export class GoslingTrackModel {
    private id: string;

    private theme: Required<CompleteThemeDeep>;

    /* spec */
    private specOriginal: SingleTrack; // original spec of users
    private specComplete: SingleTrack; // processed spec, being used in visualizations

    /* data */
    private dataOriginal: { [k: string]: number | string }[];
    private dataAggregated: { [k: string]: number | string }[];

    /* channel scales */
    private channelScales: {
        [channel: string]: ScaleType;
    };

    /* mouse events */
    private mouseEventModel: MouseEventModel;

    constructor(spec: SingleTrack, data: { [k: string]: number | string }[], theme: Required<CompleteThemeDeep>) {
        this.id = uuid.v1();

        this.theme = theme ?? getTheme();

        this.dataOriginal = JSON.parse(JSON.stringify(data));
        this.dataAggregated = JSON.parse(JSON.stringify(data));

        this.specOriginal = JSON.parse(JSON.stringify(spec));
        this.specComplete = JSON.parse(JSON.stringify(spec));

        this.channelScales = {};

        this.mouseEventModel = new MouseEventModel();

        const validity = this.validateSpec();
        if (!validity.valid) {
            console.warn('Gosling specification is not valid!', validity.errorMessages);
            return;
        }

        // fill missing options
        this.generateCompleteSpec(this.specComplete);

        this.flipRanges(this.specComplete);

        // generate scales based on domains and ranges
        this.generateScales();

        // EXPERIMENTAL: aggregate data when `aggregate` option is used
        this.dataAggregated = aggregateData(this.spec(), this.dataAggregated);

        // Add default specs.
        // ...

        // DEBUG
        // console.log('corrected track', this.spec());
    }

    public getId(): string {
        return this.id;
    }

    public getRenderingId(): string {
        return this.spec()._renderingId ?? this.getId();
    }

    public originalSpec(): SingleTrack {
        return this.specOriginal;
    }

    public spec(): SingleTrack {
        return this.specComplete;
    }

    public data(): { [k: string]: number | string }[] {
        return this.dataAggregated;
    }

    public getMouseEventModel(): MouseEventModel {
        return this.mouseEventModel;
    }

    /**
     * Fill the missing options with default values or with the values calculated based on the data.
     */
    private generateCompleteSpec(spec: SingleTrack) {
        if (!spec.width || !spec.height) {
            // This shouldn't be reached.
            console.warn('Size of track is not determined yet.');
            return;
        }

        // If this is vertical track, switch them.
        if (spec.orientation === 'vertical') {
            const width = spec.width;
            spec.width = spec.height;
            spec.height = width;
        }

        // If axis presents, reserve a space to show axis
        const xOrY = this.getGenomicChannelKey();
        let isAxisShown = false;
        if (xOrY === 'x') {
            isAxisShown = IsChannelDeep(spec.x) && spec.x.axis !== undefined && spec.x.axis !== 'none';
        }
        if (xOrY === 'y') {
            isAxisShown = IsChannelDeep(spec.y) && spec.y.axis !== undefined && spec.y.axis !== 'none';
        }
        if (spec.layout !== 'circular') {
            if (IsChannelDeep(spec.x) && spec.x.axis !== undefined && spec.x.axis !== 'none') {
                // for linear layouts, prepare a horizontal or vertical space for the axis
                // we already switched the width and height in vertical tracks, so use `height`
                spec.height -= HIGLASS_AXIS_SIZE;
            }
            // TODO: consider 2D
        } else {
            // for circular layouts, prepare a space in radius for the axis
            if (xOrY === 'x' && isAxisShown && IsChannelDeep(spec.x) && spec.x.axis === 'top') {
                spec['outerRadius'] = ((spec['outerRadius'] as number) - HIGLASS_AXIS_SIZE) as number;
            } else if (xOrY === 'x' && isAxisShown && IsChannelDeep(spec.x) && spec.x.axis === 'bottom') {
                spec['innerRadius'] = ((spec['innerRadius'] as number) + HIGLASS_AXIS_SIZE) as number;
            }
        }

        // zero baseline
        SUPPORTED_CHANNELS.forEach(channelKey => {
            const channel = spec[channelKey];
            if (IsChannelDeep(channel) && !('zeroBaseline' in channel) && channel.type === 'quantitative') {
                (channel as any).zeroBaseline = true;
            }
        });

        this.addScaleMaterials(spec);
    }

    /**
     * TODO: This is experimental. For bar charts, for example, additional care should be taken to correctly flip the visual marks.
     * Flip the y scales when `flip` options is used.
     */
    private flipRanges(spec: SingleTrack) {
        if (IsChannelDeep(spec.y) && spec.y.flip && Array.isArray(spec.y.range)) {
            spec.y.range = spec.y.range.reverse();
        }
    }

    /**
     * Find an axis channel that is encoded with genomic coordinate and return the key (e.g., 'x').
     * `undefined` if not found.
     */
    public getGenomicChannelKey(): 'x' | 'xe' | 'y' | 'ye' | 'x1' | 'x1e' | 'y1' | 'y1e' | undefined {
        return getGenomicChannelKeyFromTrack(this.spec());
    }
    /**
     * Find a genomic field from the track specification.
     * `undefined` if not found.
     */
    public getGenomicChannel(): ChannelDeep | undefined {
        return getGenomicChannelFromTrack(this.spec());
    }

    /**
     * Replace a domain with a new one in the complete spec(s) if the original spec does not define the domain.
     * A domain is replaced only when the channel is bound with data (i.e., `ChannelDeep`).
     */
    public setChannelDomain(channelKey: keyof typeof ChannelTypes, domain: string[] | number[], force?: boolean) {
        const channelRaw = this.originalSpec()[channelKey];
        if (!force && IsChannelDeep(channelRaw) && channelRaw.domain !== undefined) {
            // if domain is provided in the original spec, we do not replace the domain in the complete spec(s)
            return;
        }
        const channel = this.specComplete[channelKey];
        if (IsChannelDeep(channel)) {
            channel.domain = domain;
        }
    }

    /**
     * Replace a domain with a new one in the complete spec(s).
     * A domain is replaced only when the channel is bound with data (i.e., `ChannelDeep`).
     */
    public setChannelRange(channelKey: keyof typeof ChannelTypes, range: string[] | number[]) {
        const channel = this.specComplete[channelKey];
        if (IsChannelDeep(channel)) {
            channel.range = range;
        }
    }

    /**
     * Update default constant values by looking up other channels' scales.
     */
    public updateChannelValue() {
        if (this.originalSpec().y === undefined) {
            const y = this.spec().y;
            const rowCategories = this.getChannelDomainArray('row');
            if (y && IsChannelValue(y) && rowCategories && this.spec().mark !== 'withinLink') {
                y.value = (this.spec().height as number) / rowCategories.length / 2.0;
            }
        }
    }

    /**
     * Get the encoded value using the scales already constructed.
     */
    public encodedValue(channelKey: keyof typeof ChannelTypes, value?: number | string) {
        if (channelKey === 'text' && value !== undefined) {
            return `${+value ? ~~value : value}`;
            // TODO: Better formatting?
            // return `${+value ? (+value - ~~value) > 0 ? (+value).toExponential(1) : ~~value : value}`;
        }

        const channel = this.spec()[channelKey];
        const channelFieldType = IsChannelDeep(channel)
            ? channel.type
            : IsChannelValue(channel)
            ? 'constant'
            : undefined;

        if (!channelFieldType) {
            // Shouldn't be reached. Channel should be either encoded with data or a constant value.
            return undefined;
        }

        if (channelFieldType === 'constant') {
            // Just return the constant value.
            return (this.channelScales[channelKey] as () => number | string)();
        }

        if (value === undefined) {
            // Value is undefined, so returning undefined.
            return undefined;
        }

        if (value === null) {
            if (channelFieldType === 'quantitative') {
                value = 0;
            } else if (channelFieldType === 'nominal') {
                value = 'null';
            }
        }

        if (typeof this.channelScales[channelKey] !== 'function') {
            // Scale is undefined, so returning undefined.
            return undefined;
        }

        // The type of a channel scale is determined by a { channel type, field type } pair
        switch (channelKey) {
            case 'x':
            case 'y':
            case 'x1':
            case 'y1':
            case 'xe':
            case 'ye':
            case 'x1e':
                if (channelFieldType === 'quantitative' || channelFieldType === 'genomic') {
                    return (this.channelScales[channelKey] as ScaleLinear<any, any>)(value as number);
                }
                if (channelFieldType === 'nominal') {
                    return (this.channelScales[channelKey] as ScaleBand<any>)(value as string);
                }
                break;
            case 'stroke':
            case 'color':
                if (channelFieldType === 'quantitative') {
                    const s = (this.channelScales[channelKey] as ScaleSequential<any>).copy();
                    const d = s.domain();
                    const e = d[1] - d[0];
                    const so = Array.from((channel as Color).scaleOffset ?? [0, 1]);
                    return s.domain([d[0] + e * so.sort()[0], d[0] + e * so.sort()[1]])(value as number);
                }
                if (channelFieldType === 'nominal') {
                    return (this.channelScales[channelKey] as ScaleOrdinal<any, any>)(value as string);
                }
                /* genomic is not supported */
                break;
            case 'size':
                if (channelFieldType === 'quantitative') {
                    return (this.channelScales[channelKey] as ScaleLinear<any, any>)(value as number);
                }
                if (channelFieldType === 'nominal') {
                    return (this.channelScales[channelKey] as ScaleOrdinal<any, any>)(value as string);
                }
                /* genomic is not supported */
                break;
            case 'row':
                /* quantitative is not supported */
                if (channelFieldType === 'nominal') {
                    return (this.channelScales[channelKey] as ScaleBand<any>)(value as string);
                }
                /* genomic is not supported */
                break;
            case 'strokeWidth':
            case 'opacity':
                if (channelFieldType === 'quantitative') {
                    return (this.channelScales[channelKey] as ScaleLinear<any, any>)(value as number);
                }
                /* nominal is not supported */
                /* genomic is not supported */
                break;
            default:
                console.warn(`${channelKey} is not supported for encoding values, so returning a undefined value`);
                return undefined;
        }
    }

    public trackVisibility(currentStage: { zoomLevel?: number }): boolean {
        const spec = this.spec();
        if (
            !spec.visibility ||
            spec.visibility.length === 0 ||
            spec.visibility.filter(d => d.target === 'track').length === 0
        ) {
            // if condition is not defined, just show them.
            return true;
        }

        // We are using a logical operation AND, so if unless all options are `true`, we hide this track.
        let visibility = true;
        spec.visibility
            .filter(d => d.target === 'track')
            .forEach(d => {
                const { operation, measure, threshold } = d;

                let compareValue: number | undefined;

                if (measure === 'zoomLevel') {
                    compareValue = currentStage[measure];
                } else {
                    compareValue = spec[measure];
                }

                if (compareValue !== undefined) {
                    // compare only when the measure is suggested
                    visibility = visibility && logicalComparison(compareValue, operation, threshold as number) === 1;
                }
            });
        return visibility;
    }

    /**
     * Check whether the visual mark should be visible or not.
     * Return 0 (invisible) only when the predefined condition is correct.
     */
    public markVisibility(datum: { [k: string]: string | number }, metrics?: any): number {
        const spec = this.spec();
        if (
            !spec.visibility ||
            spec.visibility.length === 0 ||
            spec.visibility.filter(d => d.target === 'mark').length === 0
        ) {
            // if condition is not defined, just show them.
            return 1;
        }

        let visibility = 1;

        // Find the lowest visibility
        spec.visibility
            .filter(d => d.target === 'mark')
            .forEach(d => {
                const { operation, threshold, conditionPadding, transitionPadding, measure } = d;

                const padding = conditionPadding ?? 0;
                const mark = spec.mark;

                let newVisibility = 1;

                if (mark === 'text' && threshold === '|xe-x|' && measure === 'width') {
                    // compare between the actual width and the |xe-x|
                    const xe = this.encodedPIXIProperty('xe', datum);
                    const x = this.encodedPIXIProperty('x', datum);

                    if (xe !== undefined && metrics?.width) {
                        newVisibility = logicalComparison(
                            metrics.width + padding,
                            operation,
                            Math.abs(xe - x),
                            transitionPadding
                        );
                    }
                } else if (measure === 'width' && typeof threshold === 'number' && metrics?.width) {
                    // compare between the actual width and the constant width that user specified
                    newVisibility = logicalComparison(metrics.width + padding, operation, threshold, transitionPadding);
                } else if (measure === 'zoomLevel' && typeof threshold === 'number' && metrics?.zoomLevel) {
                    newVisibility = logicalComparison(metrics.zoomLevel, operation, threshold, transitionPadding);
                }

                // Update only if the upcoming one is smaller
                if (visibility > newVisibility) {
                    visibility = newVisibility;
                }
            });
        return visibility;
    }

    /**
     *
     */
    public visualPropertyByChannel(channelKey: keyof typeof ChannelTypes, datum?: { [k: string]: string | number }) {
        const value = datum !== undefined ? getValueUsingChannel(datum, this.spec()[channelKey] as Channel) : undefined; // Is this safe enough?
        return this.encodedValue(channelKey, value);
    }

    /**
     * Retrieve an encoded visual property of a visual mark.
     */
    public encodedPIXIProperty(
        propertyKey: PIXIVisualProperty,
        datum?: { [k: string]: string | number },
        additionalInfo?: any
    ) {
        const mark = this.spec().mark;

        // common visual properties, not specific to visual marks
        if (
            [
                'text',
                'color',
                'row',
                'stroke',
                'opacity',
                'strokeWidth',
                'x',
                'y',
                'xe',
                'x1',
                'x1e',
                'ye',
                'size'
            ].includes(propertyKey)
        ) {
            return this.visualPropertyByChannel(propertyKey as any, datum);
        }

        switch (mark) {
            case 'bar':
                return barProperty(this, propertyKey, datum, additionalInfo);
            case 'point':
            case 'text':
                return pointProperty(this, propertyKey, datum);
            case 'rect':
                return rectProperty(this, propertyKey, datum, additionalInfo);
            default:
                // Mark type that is not supported yet
                return undefined;
        }
    }

    // TODO: better organize this, perhaps, by combining several if statements
    /**
     * Set missing `range`, `domain`, and/or `value` of each channel by looking into data.
     */
    public addScaleMaterials(spec: SingleTrack) {
        const data = this.data();

        const genomicChannel = this.getGenomicChannel();
        if (!genomicChannel || !genomicChannel.field) {
            console.warn('Genomic field is not provided in the specification');
            // EXPERIMENTAL: we are removing this rule in our spec.
            return;
        }

        if (typeof spec.width === 'undefined' || typeof spec.height === 'undefined') {
            console.warn('Track size is not determined yet');
            return;
        }

        // const WARN_MSG = (c: string, t: string) =>
        //     `The channel key and type pair {${c}, ${t}} is not supported when generating channel scales`;

        SUPPORTED_CHANNELS.forEach(channelKey => {
            const channel = spec[channelKey];

            if (IsStackedChannel(spec, channelKey) && IsChannelDeep(channel)) {
                // we need to group data before calculating scales because marks are going to be stacked
                // (spec as any /* TODO: select more accurately */).x
                const pivotedData = group(data, d => d[genomicChannel.field as string]);
                const xKeys = [...pivotedData.keys()];

                if (!channel.domain) {
                    // TODO: consider data ranges in negative values
                    const min =
                        'zeroBaseline' in channel && channel.zeroBaseline
                            ? 0
                            : d3min(
                                  xKeys.map(d =>
                                      d3sum(
                                          (pivotedData.get(d) as any).map((_d: any) =>
                                              channel.field ? _d[channel.field] : undefined
                                          )
                                      )
                                  ) as number[]
                              );
                    const max = d3max(
                        xKeys.map(d =>
                            d3sum(
                                (pivotedData.get(d) as any).map((_d: any) =>
                                    channel.field ? _d[channel.field] : undefined
                                )
                            )
                        ) as number[]
                    );
                    channel.domain = [min, max] as [number, number]; // TODO: what if data ranges in negative values
                }

                if (!channel.range) {
                    const rowChannel = spec.row;
                    const rowField = IsChannelDeep(rowChannel) ? rowChannel.field : undefined;
                    const rowCategories =
                        this.getChannelDomainArray('row') ??
                        (rowField ? Array.from(new Set(data.map(d => d[rowField as string]))) : [1]);
                    const rowHeight = (spec.height as number) / rowCategories.length;

                    // `channel` here is either `x` or `y` because they only can ba stacked
                    switch (channelKey) {
                        case 'x':
                            channel.range = [0, spec.width] as [number, number]; // TODO: not considering vertical direction tracks
                            break;
                        case 'y':
                            channel.range = [0, rowHeight];
                            break;
                    }
                }
            } else {
                const rowChannel = spec.row;
                const rowField = IsChannelDeep(rowChannel) ? rowChannel.field : undefined;
                const rowCategories =
                    this.getChannelDomainArray('row') ??
                    (rowField ? Array.from(new Set(data.map(d => d[rowField as string]))) : [1]);
                const rowHeight = (spec.height as number) / rowCategories.length;

                if (!channel) {
                    // this means the channel is entirely missing in the specification, so we add a default value
                    let value;
                    switch (channelKey) {
                        case 'x':
                            value = (spec.width as number) / 2.0;
                            break;
                        case 'y':
                            if (spec.mark === 'withinLink') value = rowHeight;
                            else value = rowHeight / 2.0;
                            break;
                        case 'size':
                            if (spec.mark === 'line') value = this.theme.line.size;
                            else if (spec.mark === 'bar') value = undefined;
                            else if (spec.mark === 'rect') value = undefined;
                            else if (spec.mark === 'triangleRight') value = undefined;
                            else if (spec.mark === 'triangleLeft') value = undefined;
                            else if (spec.mark === 'triangleBottom') value = undefined;
                            // Points in this case are stretched from `x` to `xe`
                            else if (
                                spec.stretch &&
                                spec.mark === 'point' &&
                                IsChannelDeep(spec.x) &&
                                IsChannelDeep(spec.xe)
                            )
                                value = undefined;
                            else if (spec.mark === 'text') value = 12;
                            else value = this.theme.point.size;
                            break;
                        case 'color':
                            value = this.theme.markCommon.color;
                            break;
                        case 'row':
                            value = 0;
                            break;
                        case 'stroke':
                            // !! TODO: These should be based on themes
                            if (spec.mark === 'text') value = this.theme.text.stroke;
                            else value = this.theme.markCommon.stroke;
                            break;
                        case 'strokeWidth':
                            if (spec.mark === 'rule') value = this.theme.rule.strokeWidth;
                            else if (spec.mark === 'withinLink' || spec.mark === 'betweenLink')
                                value = this.theme.link.strokeWidth;
                            else if (spec.mark === 'text') value = this.theme.text.strokeWidth;
                            else value = this.theme.markCommon.strokeWidth;
                            break;
                        case 'opacity':
                            value = this.theme.markCommon.opacity;
                            break;
                        case 'text':
                            value = '';
                            break;
                        default:
                        // console.warn(WARN_MSG(channelKey, 'value'));
                    }
                    if (typeof value !== 'undefined') {
                        spec[channelKey] = { value } as ChannelValue;
                    }
                } else if (IsChannelDeep(channel) && (channel.type === 'quantitative' || channel.type === 'genomic')) {
                    if (channel.domain === undefined) {
                        const min =
                            'zeroBaseline' in channel && channel.zeroBaseline
                                ? 0
                                : (d3min(data.map(d => +d[channel.field as string]) as number[]) as number) ?? 0;
                        const max = (d3max(data.map(d => +d[channel.field as string]) as number[]) as number) ?? 0;
                        channel.domain = [min, max]; // TODO: what if data ranges in negative values
                    } else if (channel.type === 'genomic' && !IsDomainArray(channel.domain)) {
                        channel.domain = getNumericDomain(channel.domain);
                    }

                    if (
                        (channelKey === 'color' || channelKey === 'stroke') &&
                        channel.type === 'quantitative' &&
                        !(channel as Color).scaleOffset
                    ) {
                        (channel as Color | Stroke).scaleOffset = [0, 1];
                    }

                    if (!channel.range) {
                        let range;
                        switch (channelKey) {
                            case 'x':
                            case 'xe':
                            case 'x1':
                            case 'x1e':
                                range = [0, spec.width];
                                break;
                            case 'y':
                            case 'ye':
                                range = [0, rowHeight];
                                break;
                            case 'color':
                            case 'stroke':
                                range = CHANNEL_DEFAULTS.QUANTITATIVE_COLOR as PredefinedColors;
                                break;
                            case 'size':
                                range = this.theme.markCommon.quantitativeSizeRange;
                                break;
                            case 'strokeWidth':
                                range = [1, 3];
                                break;
                            case 'opacity':
                                range = [0, 1];
                                break;
                            default:
                                // console.warn(WARN_MSG(channelKey, channel.type));
                                break;
                        }
                        if (range) {
                            channel.range = range as PredefinedColors | number[];
                        }
                    }
                } else if (IsChannelDeep(channel) && channel.type === 'nominal') {
                    if (channel.domain === undefined) {
                        channel.domain = Array.from(
                            new Set(data.map(d => d[channel.field as string] ?? 'null'))
                        ) as string[];
                    }
                    if (!channel.range) {
                        let startSize = 2;
                        let range;
                        switch (channelKey) {
                            case 'x':
                            case 'xe':
                                range = [0, spec.width];
                                break;
                            case 'y':
                            case 'ye':
                                range = [rowHeight, 0]; // reversed because the origin is on the top
                                break;
                            case 'color':
                            case 'stroke':
                                range = this.theme.markCommon.nominalColorRange;
                                break;
                            case 'row':
                                range = [0, spec.height];
                                break;
                            case 'size':
                                range = (channel.domain as number[]).map(() => startSize++);
                                break;
                            default:
                                // console.warn(WARN_MSG(channelKey, channel.type));
                                break;
                        }
                        if (range) {
                            channel.range = range as number[] | string[];
                        }
                    }
                }
            }
        });

        /* Merge domains of neighbor channels (e.g., x and xe) */
        [
            ['x', 'xe'],
            ['y', 'ye']
        ].forEach(pair => {
            const [k1, k2] = pair as [keyof typeof ChannelTypes, keyof typeof ChannelTypes];
            const c1 = spec[k1],
                c2 = spec[k2];
            if (
                IsChannelDeep(c1) &&
                IsChannelDeep(c2) &&
                c1.type === c2.type &&
                c1.domain &&
                c2.domain &&
                Array.isArray(c1.domain) &&
                Array.isArray(c2.domain)
            ) {
                if (c1.type === 'genomic' || c1.type === 'quantitative') {
                    const min = d3min([c1.domain[0] as number, c2.domain[0] as number]) as number;
                    const max = d3max([c1.domain[1] as number, c2.domain[1] as number]) as number;
                    c1.domain = c2.domain = [min, max];
                } else if (c1.type === 'nominal') {
                    const range = Array.from(new Set([...c1.domain, ...c2.domain])) as string[];
                    c1.range = c2.range = range;
                }
            }
        });
    }

    /**
     * Store the scale of individual visual channels based on the `complete` spec.
     */
    public generateScales() {
        const spec = this.spec();

        /// DEBUG
        // console.log(spec);
        //

        SUPPORTED_CHANNELS.forEach(channelKey => {
            const channel = spec[channelKey];

            if (IsChannelValue(channel)) {
                this.channelScales[channelKey] = () => channel.value;
            } else if (IsChannelDeep(channel)) {
                if (channelKey === 'text') {
                    // We do not generate scales for 'text' marks.
                    return;
                }

                const domain = channel.domain;
                const range = channel.range;

                if (domain === undefined || range === undefined) {
                    // we do not have sufficient info to generate scales
                    return;
                }

                if (channel.type === 'quantitative' || channel.type === 'genomic') {
                    switch (channelKey) {
                        case 'x':
                        case 'x1':
                        case 'xe':
                        case 'x1e':
                        case 'y':
                        case 'ye':
                        case 'size':
                        case 'opacity':
                        case 'strokeWidth':
                            this.channelScales[channelKey] = scaleLinear()
                                .domain(domain as [number, number])
                                .range(range as [number, number]);
                            break;
                        case 'color':
                        case 'stroke':
                            let interpolate = interpolateViridis;
                            if (Object.keys(PREDEFINED_COLOR_STR_MAP).includes(range as string)) {
                                interpolate = PREDEFINED_COLOR_STR_MAP[range as string];
                            }
                            this.channelScales[channelKey] = scaleSequential(interpolate).domain(
                                domain as [number, number]
                            );
                            break;
                        default:
                            break;
                        // console.warn('Not supported channel for calculating scales');
                    }
                } else if (channel.type === 'nominal') {
                    switch (channelKey) {
                        case 'x':
                        case 'xe':
                        case 'y':
                        case 'ye':
                        case 'row':
                            this.channelScales[channelKey] = scaleBand()
                                .domain(domain as string[])
                                .range(range as [number, number]);
                            break;
                        case 'size':
                            this.channelScales[channelKey] = scaleOrdinal()
                                .domain(domain as string[])
                                .range(range as number[]);
                            break;
                        case 'color':
                        case 'stroke':
                            this.channelScales[channelKey] = scaleOrdinal(range as string[]).domain(domain as string[]);
                            break;
                        default:
                            break;
                        // console.warn('Not supported channel for calculating scales');
                    }
                }
            }
        });
    }

    /**
     * Return the scale of a visual channel.
     * `undefined` if we do not have the scale.
     */
    public getChannelScale(channelKey: keyof typeof ChannelTypes) {
        return this.channelScales[channelKey];
    }

    /**
     * Set a new scale for a certain channel. Usually called to replace the scale of a genomic axis with the one that is generated by the HiGlass data fetcher.
     */
    public setChannelScale(channelKey: keyof typeof ChannelTypes, scale: ScaleType) {
        this.channelScales[channelKey] = scale;
    }

    public addDataRows(_: { [k: string]: number | string }[]) {
        this.dataAggregated = [...this.dataAggregated, ..._];
    }

    /**
     * Return whether to show y-axis.
     */
    public isShowYAxis(): boolean {
        const spec = this.spec();
        const yDomain = this.getChannelDomainArray('y');
        const yRange = this.getChannelRangeArray('y');
        return (
            IsChannelDeep(spec.y) && spec.y.axis !== 'none' && spec.y.type === 'quantitative' && !!yDomain && !!yRange
        );
    }

    /**
     * Return the domain of a visual channel.
     * `undefined` if we do not have domain in array.
     */
    public getChannelDomainArray(channelKey: keyof typeof ChannelTypes): string[] | number[] | undefined {
        const c = this.spec()[channelKey];
        return IsChannelDeep(c) && IsDomainArray(c.domain) ? c.domain : undefined;
    }

    /**
     * Return the range of a visual channel.
     * `undefined` if we do not have domain in array.
     */
    public getChannelRangeArray(channelKey: keyof typeof ChannelTypes): string[] | number[] | undefined {
        const c = this.spec()[channelKey];
        return IsChannelDeep(c) && IsRangeArray(c.range) ? c.range : undefined;
    }

    /**
     * Validate the original spec.
     */
    public validateSpec(): { valid: boolean; errorMessages: string[] } {
        return validateTrack(this.originalSpec());
    }
}
