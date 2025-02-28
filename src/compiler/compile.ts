import type { GoslingSpec, TemplateTrackDef, VisUnitApiData } from '@gosling-lang/gosling-schema';
import type { HiGlassSpec } from '@gosling-lang/higlass-schema';
import { traverseToFixSpecDownstream } from './spec-preprocess';
import { GoslingTemplates, replaceTrackTemplates } from '../core/utils/template';
import { getRelativeTrackInfo, type Size } from './bounding-box';
import type { CompleteThemeDeep } from '../core/utils/theme';
import type { UrlToFetchOptions } from 'src/core/gosling-component';
import { renderHiGlass as createHiGlassModels } from './create-higlass-models';
import { manageResponsiveSpecs } from './responsive';
import type { IdTable } from '../api/track-and-view-ids';
import { getTheme } from '@gosling-lang/gosling-theme';

/** The callback function called everytime after the spec has been compiled */
export type CompileCallback = (
    hg: HiGlassSpec,
    size: Size,
    gs: GoslingSpec,
    tracksAndViews: VisUnitApiData[],
    idTable: IdTable
) => void;

/**
 * Process the Gosling specification, including normalization and filling in defaults.
 */
export function compile(
    spec: GoslingSpec,
    callback: CompileCallback,
    templates: TemplateTrackDef[] = GoslingTemplates,
    theme: Required<CompleteThemeDeep> = getTheme('light'),
    containerStatus: {
        containerSize?: { width: number; height: number };
        containerParentSize?: { width: number; height: number };
    } = {},
    urlToFetchOptions?: UrlToFetchOptions
) {
    // Make sure to keep the original spec as-is
    const specCopy = JSON.parse(JSON.stringify(spec));

    // Replace track templates with raw gosling specs (i.e., `TemplateTrack` => `SingleTrack | OverlaidTrack`)
    replaceTrackTemplates(specCopy, templates);

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
    createHiGlassModels(specCopy, trackInfos, callback, theme, urlToFetchOptions);
}
