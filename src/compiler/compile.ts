import type { GoslingSpec, TemplateTrackDef, VisUnitApiData } from '@gosling-lang/gosling-schema';
import { traverseToFixSpecDownstream } from './spec-preprocess';
import { replaceTrackTemplates } from '../core/utils/template';
import { getRelativeTrackInfo, type Size, type TrackInfo } from './bounding-box';
import type { CompleteThemeDeep } from '../core/utils/theme';
import { collectViewsAndTracks } from './views-and-tracks';
import { manageResponsiveSpecs } from './responsive';
import { normalizeSpec } from './normalize';

interface CompileResult {
    size: Size;
    gs: GoslingSpec;
    tracksAndViews: VisUnitApiData[];
    trackInfos: TrackInfo[];
    theme: Required<CompleteThemeDeep>;
}

/** Matches URLs to specific fetch options so that datafetchers have access URL specific fetch options */
export interface UrlToFetchOptions {
    [url: string]: RequestInit;
}

export function compile(
    spec: GoslingSpec,
    templates: TemplateTrackDef[],
    theme: Required<CompleteThemeDeep>,
    containerStatus: {
        containerSize?: { width: number; height: number };
        containerParentSize?: { width: number; height: number };
    }
): CompileResult {
    // Make sure to keep the original spec as-is
    const specCopy = JSON.parse(JSON.stringify(spec));

    // Normalize
    normalizeSpec(specCopy, templates);

    // Fix track specs by looking into the root-level spec
    traverseToFixSpecDownstream(specCopy);

    // Generate arrangement data
    const trackInfosAndSize = getRelativeTrackInfo(specCopy, theme);
    let { trackInfos } = trackInfosAndSize;
    const { size } = trackInfosAndSize;

    // Handle responsive specs, either remove them or replace original specs w/ them
    const isResponsiveWidth =
        (typeof spec.responsiveSize === 'object' && spec.responsiveSize?.width) || spec.responsiveSize;
    const isResponsiveHeight =
        (typeof spec.responsiveSize === 'object' && spec.responsiveSize?.height) || spec.responsiveSize;
    const wFactor =
        isResponsiveWidth && containerStatus.containerSize ? containerStatus.containerSize.width / size.width : 1;
    const hFactor =
        isResponsiveHeight && containerStatus.containerSize ? containerStatus.containerSize.height / size.height : 1;
    const pWidth = containerStatus.containerParentSize
        ? containerStatus.containerParentSize.width
        : Number.MAX_SAFE_INTEGER;
    const pHeight = containerStatus.containerParentSize
        ? containerStatus.containerParentSize.height
        : Number.MAX_SAFE_INTEGER;
    const replaced = manageResponsiveSpecs(specCopy, wFactor, hFactor, pWidth, pHeight);

    // Do the downstream-fix and track arrangement again using the updated spec
    if (replaced) {
        traverseToFixSpecDownstream(specCopy);
        trackInfos = getRelativeTrackInfo(specCopy, theme).trackInfos;
    }

    // Make HiGlass models for individual tracks
    const compileResult = collectViewsAndTracks(specCopy, trackInfos, theme);
    return compileResult;
}
