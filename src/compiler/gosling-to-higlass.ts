import type { Track as HiGlassTrack } from './higlass.schema';
import { HiGlassModel, HIGLASS_AXIS_SIZE } from './higlass-model';
import { parseServerAndTilesetUidFromUrl } from './utils';
import type { Track, Domain } from './gosling.schema';
import type { BoundingBox, RelativePosition } from './utils/bounding-box';
import { resolveSuperposedTracks } from './utils/overlay';
import { getGenomicChannelKeyFromTrack, getGenomicChannelFromTrack } from './utils/validate';
import {
    IsDataDeep,
    IsChannelDeep,
    IsDataDeepTileset,
    Is2DTrack,
    IsXAxis,
    IsHiGlassMatrix,
    getHiGlassColorRange
} from './gosling.schema.guards';
import { DEWFAULT_TITLE_PADDING_ON_TOP_AND_BOTTOM } from './defaults';
import type { CompleteThemeDeep } from './utils/theme';
import { DEFAULT_TEXT_STYLE } from './utils/text-style';

/**
 * Convert a gosling track into a HiGlass view and add it into a higlass model.
 */
export function goslingToHiGlass(
    hgModel: HiGlassModel,
    gosTrack: Track,
    bb: BoundingBox,
    layout: RelativePosition,
    theme: Required<CompleteThemeDeep>
): HiGlassModel {
    // TODO: check whether there are multiple track.data across superposed tracks
    // ...

    // we only look into the first resolved spec to get information, such as size of the track
    const firstResolvedSpec = resolveSuperposedTracks(gosTrack)[0];

    const assembly = firstResolvedSpec.assembly;

    if (IsDataDeep(firstResolvedSpec.data)) {
        let server, tilesetUid;

        if (IsDataDeepTileset(firstResolvedSpec.data)) {
            const parsed = parseServerAndTilesetUidFromUrl(firstResolvedSpec.data.url);
            server = parsed.server;
            tilesetUid = parsed.tilesetUid;
        }

        const genomicChannel = getGenomicChannelFromTrack(firstResolvedSpec);
        const genomicChannelKey = getGenomicChannelKeyFromTrack(firstResolvedSpec);
        const isXGenomic = genomicChannelKey === 'x' || genomicChannelKey === 'xe';
        const xDomain = isXGenomic && IsChannelDeep(genomicChannel) ? (genomicChannel.domain as Domain) : undefined;
        const yDomain =
            Is2DTrack(firstResolvedSpec) && IsChannelDeep(firstResolvedSpec.y)
                ? (firstResolvedSpec.y.domain as Domain)
                : undefined;
        const width =
            bb.width -
            (firstResolvedSpec.layout !== 'circular' &&
            firstResolvedSpec.orientation === 'vertical' &&
            IsXAxis(firstResolvedSpec)
                ? HIGLASS_AXIS_SIZE
                : 0);
        const height =
            bb.height -
            (firstResolvedSpec.layout !== 'circular' &&
            firstResolvedSpec.orientation === 'horizontal' &&
            IsXAxis(firstResolvedSpec)
                ? HIGLASS_AXIS_SIZE
                : 0);
        const hgTrack: HiGlassTrack = {
            uid: `${firstResolvedSpec.id}-track`, // This is being used to cache the visualization
            type: Is2DTrack(firstResolvedSpec) ? 'gosling-2d-track' : 'gosling-track',
            server,
            tilesetUid,
            width,
            height,
            options: {
                /* Mouse hover position */
                showMousePosition: firstResolvedSpec.layout === 'circular' ? false : theme.root.showMousePosition, // show mouse position only for linear tracks // TODO: or vertical
                mousePositionColor: theme.root.mousePositionColor,
                /* Track title */
                name: firstResolvedSpec.layout === 'linear' ? firstResolvedSpec.title : ' ',
                labelPosition: firstResolvedSpec.title
                    ? theme.track.titleAlign === 'left'
                        ? 'topLeft'
                        : 'topRight'
                    : 'none',
                labelShowResolution: false,
                labelColor: theme.track.titleColor,
                labelBackgroundColor: theme.track.titleBackground,
                labelBackgroundOpacity: 0.5, // TODO: Support `theme.track.titleBackgroundOpacity`
                labelTextOpacity: 1,
                labelLeftMargin: 1,
                labelTopMargin: 1,
                labelRightMargin: 0,
                labelBottomMargin: 0,
                // TODO: Use this eventually
                // trackBorderWidth: firstResolvedSpec.style?.outlineWidth ?? 3,
                // trackBorderColor: firstResolvedSpec.style?.outline ?? '#DBDBDB',
                /* Others */
                backgroundColor: 'transparent', // in this way, we can superpose multiple tracks
                spec: { ...gosTrack },
                theme
            }
        };

        if (
            firstResolvedSpec.data &&
            IsDataDeep(firstResolvedSpec.data) &&
            (firstResolvedSpec.data.type === 'csv' ||
                firstResolvedSpec.data.type === 'json' ||
                firstResolvedSpec.data.type === 'bigwig' ||
                firstResolvedSpec.data.type === 'bam' ||
                firstResolvedSpec.data.type === 'vcf' ||
                firstResolvedSpec.data.type === 'gff' ||
                firstResolvedSpec.data.type === 'bed')
        ) {
            const getFieldName = (c: 'x' | 'xe' | 'x1' | 'x1e') => {
                const cDef = firstResolvedSpec[c];
                return cDef && IsChannelDeep(cDef) ? cDef.field : undefined;
            };
            const xFields = {
                x: getFieldName('x'),
                xe: getFieldName('xe'),
                x1: getFieldName('x1'),
                x1e: getFieldName('x1e')
            } as const;
            // use gosling's custom data fetchers
            hgTrack.data = {
                ...firstResolvedSpec.data,
                ...xFields,
                // Additionally, add assembly, otherwise, a default genome build is used
                assembly
                // TODO: should look all sub tracks' `dataTransform` and apply OR operation.
                // Add a data transformation spec so that the fetcher can properly sample datasets
                // filter: (firstResolvedSpec as any).dataTransform?.filter((f: DataTransform) => f.type === 'filter')
            };
        }

        // We use higlass 'heatmap' track instead of 'gosling-track' for rendering performance.
        // HiGlass is really well-optimized for matrix visualization, and rendering it in Gosling
        // instead makes the zooming interaction slow.
        // See https://github.com/gosling-lang/gosling.js/pull/612#discussion_r771623844
        if (IsHiGlassMatrix(firstResolvedSpec)) {
            // By changing the track type, HiGlass uses its native heatmap track
            hgTrack.type = 'heatmap';
            const colorStr =
                IsChannelDeep(firstResolvedSpec.color) && typeof firstResolvedSpec.color.range === 'string'
                    ? firstResolvedSpec.color.range
                    : 'viridis';
            hgTrack.options.colorRange = getHiGlassColorRange(colorStr);
            hgTrack.options.trackBorderWidth = firstResolvedSpec.style?.outlineWidth ?? theme.track.outlineWidth;
            hgTrack.options.trackBorderColor = firstResolvedSpec.style?.outline ?? theme.track.outline;
            hgTrack.options.extent = firstResolvedSpec.style?.matrixExtent ?? 'full';
            hgTrack.options.colorbarPosition = (firstResolvedSpec.color as any)?.legend
                ? hgTrack.options.extent === 'lower-left'
                    ? 'bottomLeft'
                    : 'topRight'
                : 'hidden';
        }

        if (firstResolvedSpec.overlayOnPreviousTrack) {
            hgModel
                .setViewOrientation(firstResolvedSpec.orientation) // TODO: Orientation should be assigned to 'individual' views
                .addTrackToCombined(hgTrack);
        } else {
            hgModel
                .setViewOrientation(firstResolvedSpec.orientation) // TODO: Orientation should be assigned to 'individual' views
                .setAssembly(assembly) // TODO: Assembly should be assigned to 'individual' views
                .addDefaultView(firstResolvedSpec.id!, assembly)
                .setDomain(xDomain, yDomain ?? xDomain)
                .adjustDomain(firstResolvedSpec.orientation, width, height)
                .setMainTrack(hgTrack)
                .addTrackSourceServers(server)
                .setZoomFixed(firstResolvedSpec.static === true)
                .setZoomLimits(firstResolvedSpec.zoomLimits ?? [1, null])
                .setLayout(layout);
        }

        // determine the compactness type of an axis considering the size of a track
        const getAxisNarrowType = (
            c: 'x' | 'y',
            orientation: 'horizontal' | 'vertical' = 'horizontal',
            width: number,
            height: number
        ) => {
            const narrowSizeThreshold = 400;
            const narrowerSizeThreshold = 200;

            if (orientation === 'horizontal') {
                if ((c === 'x' && width <= narrowerSizeThreshold) || (c === 'y' && height <= narrowerSizeThreshold)) {
                    return 'narrower';
                } else if (
                    (c === 'x' && width <= narrowSizeThreshold) ||
                    (c === 'y' && height <= narrowSizeThreshold)
                ) {
                    return 'narrow';
                } else {
                    return 'regular';
                }
            } else {
                if ((c === 'x' && height <= narrowerSizeThreshold) || (c === 'y' && width <= narrowerSizeThreshold)) {
                    return 'narrower';
                } else if (
                    (c === 'x' && height <= narrowSizeThreshold) ||
                    (c === 'y' && width <= narrowSizeThreshold)
                ) {
                    return 'narrow';
                } else {
                    return 'regular';
                }
            }
        };

        // check whether to show axis
        ['x', 'y'].forEach(c => {
            const channel = (firstResolvedSpec as any)[c];
            if (
                IsChannelDeep(channel) &&
                'axis' in channel &&
                channel.axis &&
                channel.axis !== 'none' &&
                channel.type === 'genomic'
            ) {
                const narrowType = getAxisNarrowType(c as any, gosTrack.orientation, bb.width, bb.height);
                hgModel.setAxisTrack(channel.axis, narrowType, {
                    id: `${firstResolvedSpec.id}-${channel.axis}-axis`,
                    layout: firstResolvedSpec.layout,
                    innerRadius:
                        channel.axis === 'top'
                            ? (firstResolvedSpec.outerRadius as number) - HIGLASS_AXIS_SIZE
                            : firstResolvedSpec.innerRadius,
                    outerRadius:
                        channel.axis === 'top'
                            ? firstResolvedSpec.outerRadius
                            : (firstResolvedSpec.innerRadius as number) + HIGLASS_AXIS_SIZE,
                    width: firstResolvedSpec.width,
                    height: firstResolvedSpec.height,
                    startAngle: firstResolvedSpec.startAngle,
                    endAngle: firstResolvedSpec.endAngle,
                    theme
                });
            }
        });

        hgModel.validateSpec(true);
    } else if (firstResolvedSpec.mark === 'header') {
        // `text` tracks are used to show title and subtitle of the views
        hgModel.addDefaultView(`${firstResolvedSpec.id}-title`).setLayout(layout);
        if (typeof firstResolvedSpec.title === 'string') {
            hgModel.setTextTrack(
                bb.width,
                (theme.root.titleFontSize ?? 18) + DEWFAULT_TITLE_PADDING_ON_TOP_AND_BOTTOM,
                firstResolvedSpec.title,
                theme.root.titleColor,
                theme.root.titleFontSize ?? 18,
                theme.root.titleFontWeight,
                theme.root.titleAlign,
                theme.root.titleBackgroundColor,
                theme.root.titleFontFamily ?? DEFAULT_TEXT_STYLE.fontFamily
            );
        }
        if (typeof firstResolvedSpec.subtitle === 'string') {
            hgModel.setTextTrack(
                bb.width,
                // TODO: better way to safely get the value when undefined?
                (theme.root.subtitleFontSize ?? 14) + DEWFAULT_TITLE_PADDING_ON_TOP_AND_BOTTOM,
                firstResolvedSpec.subtitle,
                theme.root.subtitleColor,
                theme.root.subtitleFontSize ?? 14,
                theme.root.subtitleFontWeight,
                theme.root.subtitleAlign,
                theme.root.subtitleBackgroundColor,
                theme.root.subtitleFontFamily ?? DEFAULT_TEXT_STYLE.fontFamily
            );
        }
    }

    // Uncomment the following code to test with specific HiGlass viewConfig
    // hgModel.setExampleHiglassViewConfig();

    return hgModel;
}
