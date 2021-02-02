import { GoslingSpec, Track } from '../gosling.schema';
import {
    DEFAULT_SUBTITLE_HEIGHT,
    DEFAULT_TITLE_HEIGHT,
    DEFAULT_TRACK_GAP,
    DEFAULT_TRACK_HEIGHT_LINEAR,
    DEFAULT_TRACK_WIDTH_CIRCULAR,
    DEFAULT_TRACK_WIDTH_LINEAR
} from '../layout/defaults';
import { resolveSuperposedTracks } from '../utils/superpose';
import { arrayRepeat, insertItemToArray } from './array';

export interface Size {
    width: number;
    height: number;
}

export interface GridInfo extends Size {
    columnSizes: number[];
    rowSizes: number[];
    columnGaps: number[];
    rowGaps: number[];
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
 *
 * @param spec
 */
export function getGridInfo(spec: GoslingSpec): GridInfo {
    // total number of cells in the tabular layout
    const numCells = spec.tracks
        .filter(t => !t.superposeOnPreviousTrack)
        .map(t => (typeof t.span === 'number' ? t.span : 1))
        .reduce((a, b) => a + b, 0);
    const wrap: number = spec.arrangement?.wrap ?? 999;

    let numColumns = 0,
        numRows = 0;
    if (spec.arrangement?.direction === 'horizontal') {
        numRows = Math.ceil(numCells / wrap);
        numColumns = Math.min(wrap, numCells);
    } else {
        // by default, vertical
        numColumns = Math.ceil(numCells / wrap);
        numRows = Math.min(wrap, numCells);
    }

    // undefined | [number, number, ...] | number
    const baseColumnSizes =
        spec.arrangement?.columnSizes === undefined
            ? spec.layout === 'circular'
                ? [DEFAULT_TRACK_WIDTH_CIRCULAR]
                : [DEFAULT_TRACK_WIDTH_LINEAR]
            : typeof spec.arrangement?.columnSizes === 'number'
            ? [spec.arrangement?.columnSizes]
            : spec.arrangement?.columnSizes;
    const baseRowSizes =
        spec.arrangement?.rowSizes === undefined
            ? spec.layout === 'circular'
                ? [DEFAULT_TRACK_WIDTH_CIRCULAR]
                : [DEFAULT_TRACK_HEIGHT_LINEAR]
            : typeof spec.arrangement?.rowSizes === 'number'
            ? [spec.arrangement?.rowSizes]
            : spec.arrangement?.rowSizes;
    const baseColumnGaps =
        spec.arrangement?.columnGaps === undefined
            ? [DEFAULT_TRACK_GAP]
            : typeof spec.arrangement?.columnGaps === 'number'
            ? [spec.arrangement?.columnGaps]
            : spec.arrangement?.columnGaps;
    const baseRowGaps =
        spec.arrangement?.rowGaps === undefined
            ? [DEFAULT_TRACK_GAP]
            : typeof spec.arrangement?.rowGaps === 'number'
            ? [spec.arrangement?.rowGaps]
            : spec.arrangement?.rowGaps;

    const columnSizes = arrayRepeat(baseColumnSizes, numColumns);
    const columnGaps = arrayRepeat(baseColumnGaps, numColumns - 1);
    let rowSizes = arrayRepeat(baseRowSizes, numRows);
    let rowGaps = arrayRepeat(baseRowGaps, numRows - 1);

    // consider title and subtitle if any
    if (spec.title || spec.subtitle) {
        const headerHeight = (spec.title ? DEFAULT_TITLE_HEIGHT : 0) + (spec.subtitle ? DEFAULT_SUBTITLE_HEIGHT : 0);
        rowSizes = insertItemToArray(rowSizes, 0, headerHeight);
        rowGaps = insertItemToArray(rowGaps, 0, 0);
    }

    const width = columnSizes.reduce((a, b) => a + b, 0) + columnGaps.reduce((a, b) => a + b, 0);
    const height = rowSizes.reduce((a, b) => a + b, 0) + rowGaps.reduce((a, b) => a + b, 0);

    return { width, height, columnSizes, rowSizes, columnGaps, rowGaps };
}

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

// TODO: handle overflow by the ill-defined spec
/**
 * Determine how to arrange multiple tracks. This also assign `width`, `height`, `innerRadius`, and `outerRadius` of a track.
 * @param spec
 */
export function getArrangement(spec: GoslingSpec): TrackInfo[] {
    const { width: totalWidth, height: totalHeight, columnSizes, rowSizes, columnGaps, rowGaps } = getGridInfo(spec);

    const numColumns = columnSizes.length;
    const numRows = rowSizes.length;

    let ci = 0;
    let ri = 0;

    const info: TrackInfo[] = [];

    // consider title and subtitle if any
    if (spec.title || spec.subtitle) {
        const height = rowSizes[ri];
        info.push({
            track: getTextTrack({ width: totalWidth, height }, spec.title, spec.subtitle),
            boundingBox: { x: 0, y: 0, width: totalWidth, height },
            layout: {
                x: 0,
                y: 0,
                w: 12.0,
                h: (height / totalHeight) * 12.0
            }
        });
        ri++;
    }

    spec.tracks.forEach((track, i) => {
        const nextTrack = spec.tracks[i + 1];
        const span = typeof track.span === 'number' ? track.span : 1;
        const trackWidth = resolveSuperposedTracks(track)[0].width;

        const x =
            columnSizes.slice(0, ci).reduce((a, b) => a + b, 0) + columnGaps.slice(0, ci).reduce((a, b) => a + b, 0);
        const y = rowSizes.slice(0, ri).reduce((a, b) => a + b, 0) + rowGaps.slice(0, ri).reduce((a, b) => a + b, 0);

        let width = columnSizes[ci];
        let height = rowSizes[ri];
        if (spec.arrangement?.direction === 'horizontal' && span !== 1) {
            width =
                columnSizes.slice(ci, ci + span).reduce((a, b) => a + b, 0) +
                columnGaps.slice(ci, ci + span).reduce((a, b) => a + b, 0);
        } else if (spec.arrangement?.direction === 'vertical' && span !== 1) {
            height =
                rowSizes.slice(ri, ri + span).reduce((a, b) => a + b, 0) +
                rowGaps.slice(ri, ri + span).reduce((a, b) => a + b, 0);
        }
        width = typeof trackWidth === 'number' ? Math.min(trackWidth, width) : width;
        // height = ... // NOTICE: using the smaller height is not supported

        // Assign actual size determined by the layout definition
        track.width = width;
        track.height = height;

        // Assign default outerRadius and innerRadius
        if (!track.outerRadius) {
            track.outerRadius = Math.min(track.width, track.height) / 2.0 - 30;
        }
        if (!track.innerRadius) {
            track.innerRadius = Math.max(track.outerRadius - 80, 0);
        }

        info.push({
            track,
            boundingBox: { x, y, width: width, height: height },
            layout: {
                x: (x / totalWidth) * 12.0,
                y: (y / totalHeight) * 12.0,
                w: (width / totalWidth) * 12.0,
                h: (height / totalHeight) * 12.0
            }
        });

        if (nextTrack?.superposeOnPreviousTrack) {
            // do not count this track to calculate cumulative sizes and positions
            return;
        }

        if (spec.arrangement?.direction === 'horizontal') {
            ci += typeof track.span === 'number' ? track.span : 1;

            if (ci >= numColumns && ri < numRows - 1) {
                ci = 0;
                ri++;
            }
        } else {
            // by default, vertical direction
            ri += typeof track.span === 'number' ? track.span : 1;

            if (ri >= numRows) {
                ri = 0;
                ci++;
            }
        }
    });

    // console.log(info);
    return info;
}
