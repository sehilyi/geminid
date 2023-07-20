import * as uuid from 'uuid';
import type { HiGlassSpec, Track } from './higlass.schema';
import HiGlassSchema from '../../schema/higlass.schema.json';
import type { Assembly, AxisPosition, Domain, Orientation, ZoomLimits } from './gosling.schema';
import { getNumericDomain } from './utils/scales';
import type { RelativePosition } from './utils/bounding-box';
import { validateSpec } from './utils/validate';
import { getAutoCompleteId, computeChromSizes } from './utils/assembly';
import type { CompleteThemeDeep } from './utils/theme';
import exampleHg from './example/hg-view-config-1';
import { insertItemToArray } from './utils/array';

export const HIGLASS_AXIS_SIZE = 30;

const getViewTemplate = (assembly?: Assembly) => {
    return {
        genomePositionSearchBoxVisible: false,
        genomePositionSearchBox: {
            autocompleteServer: 'https://higlass.io/api/v1',
            autocompleteId: getAutoCompleteId(assembly),
            chromInfoServer: 'https://higlass.io/api/v1',
            chromInfoId: assembly ?? 'hg38'
        },
        layout: { w: 12, h: 12, x: 0, y: 0 },
        tracks: {
            top: [],
            left: [],
            center: [],
            right: [],
            bottom: [],
            gallery: [],
            whole: []
        },
        initialXDomain: [0, computeChromSizes(assembly).total],
        initialYDomain: [0, computeChromSizes(assembly).total],
        zoomFixed: false
    };
};

/**
 * Model for managing the HiGlass view config.
 * We are currently only using a center track with additional tracks for axes in a single view.
 */
export class HiGlassModel {
    private assembly?: Assembly;
    private orientation?: Orientation;
    private hg: HiGlassSpec;
    constructor() {
        this.assembly = 'hg38';
        this.hg = {
            compactLayout: false,
            trackSourceServers: [],
            views: [],
            zoomLocks: {
                locksByViewUid: {},
                locksDict: {}
            },
            locationLocks: {
                locksByViewUid: {},
                locksDict: {}
            }
        };

        // Add default specs.
        this.setEditable(false);
    }

    public spec(): Readonly<HiGlassSpec> {
        return this.hg;
    }

    public setViewOrientation(orientation?: Orientation) {
        this.orientation = orientation;
        return this;
    }

    public addDefaultView(uid: string, assembly?: Assembly) {
        this.hg.views.push(JSON.parse(JSON.stringify({ ...getViewTemplate(assembly), uid })));
        return this;
    }

    public setAssembly(assembly?: Assembly) {
        this.assembly = assembly;
        this.setChromInfoPath(computeChromSizes(this.assembly).path);
        return this;
    }

    public getAssembly() {
        return this.assembly;
    }

    public setTextTrack(
        width: number,
        height: number,
        text: string,
        textColor = 'black',
        fontSize = 14,
        fontWeight = 'normal',
        align = 'left',
        backgroundColor = 'transparent',
        fontFamily = 'Arial'
    ) {
        if (this.getLastView()) {
            this.getLastView().tracks.top?.push({
                type: 'text',
                width,
                height,
                options: {
                    backgroundColor,
                    textColor,
                    fontSize,
                    fontWeight,
                    fontFamily,
                    offsetY: 0, // offset from the top of the track
                    align,
                    text
                }
            });
        }
        return this;
    }

    public addBrush(
        layout: 'circular' | 'linear',
        viewId: string,
        theme: Required<CompleteThemeDeep>,
        fromViewUid?: string,
        style?: {
            color?: string;
            stroke?: string;
            opacity?: string;
            strokeWidth?: number;
            startAngle?: number;
            endAngle?: number;
            innerRadius?: number;
            outerRadius?: number;
        }
    ) {
        if (!fromViewUid) return;

        // we could do this to either a `whole` track or a `center` track with `combined`
        (this.getView(viewId) as any)?.tracks.whole.push({
            // type: 'viewport-projection-center',
            type: layout === 'circular' ? 'brush-track' : 'viewport-projection-horizontal',
            uid: uuid.v4(),
            fromViewUid,
            options: {
                projectionFillColor: style?.color ?? theme.brush.color,
                projectionStrokeColor: style?.stroke ?? theme.brush.stroke,
                projectionFillOpacity: style?.opacity ?? theme.brush.opacity,
                projectionStrokeOpacity: style?.opacity ?? theme.brush.opacity,
                strokeWidth: style?.strokeWidth ?? theme.brush.strokeWidth,
                startAngle: style?.startAngle,
                endAngle: style?.endAngle,
                innerRadius: style?.innerRadius,
                outerRadius: style?.outerRadius
            }
        });
        return this;
    }

    public getLastView() {
        return this.hg.views[this.hg.views.length - 1];
    }

    public getMainTrackPosition() {
        return this.orientation === 'vertical' ? 'left' : 'center';
    }

    /**
     * Get the last view that renders any visualization, so skiping empty tracks.
     */
    public getLastVisView() {
        const vs = this.hg.views.filter(v => (v.tracks as any)[this.getMainTrackPosition()]?.[0]?.type === 'combined');
        return vs[vs.length - 1];
    }

    public getView(viewId: string) {
        return this.hg.views.find(d => d.uid === viewId);
    }

    public validateSpec(silence = false) {
        return validateSpec(HiGlassSchema, this.spec(), silence).state === 'success';
    }

    public setDomain(xDomain: Domain | undefined, yDomain: Domain | undefined) {
        if (xDomain) {
            this.getLastView().initialXDomain = getNumericDomain(xDomain, this.getAssembly());
        }
        if (yDomain) {
            this.getLastView().initialYDomain = getNumericDomain(yDomain, this.getAssembly());
        }
        return this;
    }

    /**
     * This is a hacky function that adjust x domain to properly show vertical tracks.
     *
     * In HiGlass, the range of vertical tracks is affected by a center track. For example, if a center track is small, the vertical tracks become small as well.
     * Currently, the actual size of center track for vertical gosling tracks is `1px`. So, we re-scale the x domain so that gosling's vertical tracks properly use the entire height of a view.
     * @param orientation
     * @param width
     * @returns
     */
    public adjustDomain(orientation: Orientation = 'horizontal', width: number, height: number) {
        if (orientation !== 'vertical') {
            return this;
        }

        const domain = this.getLastView().initialXDomain;
        if (!domain) {
            return this;
        }

        const [start, end] = domain;
        const size = end - start;
        const center = (start + end) / 2.0;
        this.getLastView().initialXDomain = [
            center - (size / width / 2 / height) * width,
            center + (size / width / 2 / height) * width
        ];
        return this;
    }

    /**
     * Allow a zoom interaction?
     */
    public setZoomFixed(zoomFixed: boolean) {
        this.getLastView().zoomFixed = zoomFixed;
        return this;
    }

    /**
     * Set limits of zoom levels in base pairs.
     */
    public setZoomLimits(zoomLimits: ZoomLimits) {
        this.getLastView().zoomLimits = zoomLimits;
        return this;
    }

    public setLayout(layout: RelativePosition) {
        this.getLastView().layout = layout;
        return this;
    }

    private setEditable(editable: boolean | undefined) {
        this.hg.editable = editable;
        return this;
    }

    private setChromInfoPath(chromInfoPath: string | undefined) {
        if (this.getLastView()) {
            this.getLastView().chromInfoPath = chromInfoPath;
        }
        this.hg.chromInfoPath = chromInfoPath;
        return this;
    }

    public addTrackSourceServers(trackSourceServers: string | undefined) {
        if (trackSourceServers && this.hg.trackSourceServers?.indexOf(trackSourceServers) === -1)
            this.hg.trackSourceServers?.push(trackSourceServers);
        return this;
    }

    public setMainTrack(track: Track) {
        if (!this.getLastView()) return this;
        this.getLastView().tracks[this.getMainTrackPosition()] = [
            {
                type: 'combined',
                uid: `${track.uid ?? uuid.v4()}-${this.getMainTrackPosition()}-combined`,
                // !! Hacky, but it is important to subtract 1px. Currently, HiGlass does not well handle a case where a center track is zero width (e.g., linking between views that contain zero-width center tracks).
                // https://github.com/higlass/higlass/pull/1041
                width: (track as any).width - 1,
                height: (track as any).height,
                contents: [track]
            }
        ];
        return this;
    }

    public addTrackToCombined(track: Track) {
        if (!this.getLastVisView()) return this;
        (this.getLastVisView() as any).tracks[this.getMainTrackPosition()][0]?.contents.push(track);
        return this;
    }

    public setAxisTrack(
        position: Exclude<AxisPosition, 'none'>,
        type: 'regular' | 'narrow' | 'narrower' = 'regular',
        options: {
            id?: string;
            layout?: 'circular' | 'linear';
            innerRadius?: number;
            outerRadius?: number;
            width?: number;
            height?: number;
            startAngle?: number;
            endAngle?: number;
            theme: Required<CompleteThemeDeep>;
        }
    ) {
        if (!this.hg.views) return this;

        const widthOrHeight = position === 'left' || position === 'right' ? 'width' : 'height';
        const axisTrackTemplate: Track = {
            // uid: options.id ?? uuid.v1(), // TODO: turning this on makes some tick labels hidden
            type: 'axis-track',
            chromInfoPath: this.hg.chromInfoPath,
            options: {
                ...options,
                assembly: this.getAssembly(),
                stroke: 'transparent', // text outline
                color: options.theme.axis.labelColor,
                fontSize: options.theme.axis.labelFontSize,
                fontFamily: options.theme.axis.labelFontFamily,
                fontWeight: options.theme.axis.labelFontWeight,
                tickColor: options.theme.axis.tickColor,
                tickFormat: type === 'narrower' ? 'si' : 'plain',
                tickPositions: type === 'regular' ? 'even' : 'ends',
                reverseOrientation: position === 'bottom' || position === 'right' ? true : false
            }
        };
        if (options.layout === 'circular') {
            // circular axis: superpose an axis track on top of the `center` track
            this.addTrackToCombined({
                ...axisTrackTemplate,
                options: { ...axisTrackTemplate.options, layout: 'circular' }
            });
        } else {
            // linear axis: place an axis track on the top, left, bottom, or right
            const axisTrack = { ...axisTrackTemplate, [widthOrHeight]: HIGLASS_AXIS_SIZE };

            if (position === 'left') {
                // In vertical tracks, the main track has been already inserted into `left`, so put axis on the first index to show it on the left.
                if (this.getLastView().tracks.left.filter(d => d.type === 'axis-track').length !== 0) {
                    // we already have an axis
                    return this;
                }
                this.getLastView().tracks.left = insertItemToArray(this.getLastView().tracks.left, 0, axisTrack);
            } else if (position === 'right') {
                if (this.getLastView().tracks.right.filter(d => d.type === 'axis-track').length !== 0) {
                    // we already have an axis
                    return this;
                }
                this.getLastView().tracks.right.push(axisTrack);
            } else {
                if (this.getLastView().tracks[position].filter(d => d.type === 'axis-track').length !== 0) {
                    // we already have an axis
                    return this;
                }
                this.getLastView().tracks[position].push(axisTrack);
            }
        }
        return this;
    }

    public setExampleHiglassViewConfig() {
        this.hg = exampleHg as any;
    }
}
