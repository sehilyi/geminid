import { GoslingTrack } from '@gosling-lang/gosling-track';
import { AxisTrack } from '@gosling-lang/genomic-axis';
import { BrushLinearTrack } from '@gosling-lang/brush-linear';
import { Signal } from '@preact/signals-core';
import { TextTrack } from '@gosling-lang/text-track';

import { panZoom, panZoomHeatmap } from '@gosling-lang/interactors';
import { type TrackDefs, TrackType } from '../track-def/main';
import { getDataFetcher } from './dataFetcher';
import type { LinkedEncoding } from '../linking/linkedEncoding';
import { BrushCircularTrack } from '@gosling-lang/brush-circular';
import { HeatmapTrack } from '@gosling-lang/heatmap';
import type { PixiManager } from '@pixi-manager';
import { DummyTrack } from '@gosling-lang/dummy-track';
import type { UrlToFetchOptions } from 'src/compiler/compile';
import { createSpatialTrack } from '../../src/tracks/spatial-track/spatial-track';
import type { CsvDataFetcherClass } from 'src/data-fetchers/csv/csv-data-fetcher';

/**
 * Takes a list of track definitions and linkedEncodings and renders them
 * @param trackOptions
 * @param pixiManager
 */
export function renderTrackDefs(
    trackDefs: TrackDefs[],
    linkedEncodings: LinkedEncoding[],
    pixiManager: PixiManager,
    urlToFetchOptions?: UrlToFetchOptions
) {
    trackDefs.forEach(trackDef => {
        const { boundingBox, type, options } = trackDef;

        if (type === TrackType.Text) {
            new TextTrack(options, pixiManager.makeContainer(boundingBox));
        }
        if (type === TrackType.Gosling) {
            const xDomain = getEncodingSignal(trackDef.trackId, 'x', linkedEncodings);
            const yDomain = getEncodingSignal(trackDef.trackId, 'y', linkedEncodings);
            if (!xDomain) return;

            const datafetcher = getDataFetcher(options.spec, urlToFetchOptions);
            const gosPlot = new GoslingTrack(
                options,
                datafetcher,
                pixiManager.makeContainer(boundingBox),
                xDomain,
                yDomain,
                options.spec.orientation
            );
            const isOverlayedOnPrevious =
                'overlayOnPreviousTrack' in options.spec && options.spec.overlayOnPreviousTrack;
            if (!options.spec.static && !isOverlayedOnPrevious) {
                gosPlot.addInteractor(plot => panZoom(plot, xDomain, yDomain));
            }
        }
        if (type === TrackType.Heatmap) {
            const xDomain = getEncodingSignal(trackDef.trackId, 'x', linkedEncodings);
            const yDomain = getEncodingSignal(trackDef.trackId, 'y', linkedEncodings);
            if (!xDomain || !yDomain) return;

            const datafetcher = getDataFetcher(options.spec, urlToFetchOptions);
            new HeatmapTrack(options, datafetcher, pixiManager.makeContainer(boundingBox)).addInteractor(plot =>
                panZoomHeatmap(plot, xDomain, yDomain)
            );
        }
        if (type === TrackType.Axis) {
            const domain = getEncodingSignal(trackDef.trackId, options.encoding, linkedEncodings);
            if (!domain) {
                console.warn(`No domain found for axis ${trackDef.trackId}. Skipping...`);
                return;
            }

            const axisTrack = new AxisTrack(
                options,
                domain,
                pixiManager.makeContainer(boundingBox),
                options.orientation
            );
            if (!options.static) {
                axisTrack.addInteractor(plot => panZoom(plot, domain));
            }
        }
        if (type === TrackType.BrushLinear) {
            const domain = getEncodingSignal(trackDef.trackId, 'x', linkedEncodings);
            const brushDomain = getEncodingSignal(trackDef.trackId, 'brush', linkedEncodings);
            if (!domain || !brushDomain || !hasLinkedTracks(trackDef.trackId, linkedEncodings)) return;
            // We only want to add the brush track if it is linked to another track
            const brush = new BrushLinearTrack(
                options,
                brushDomain,
                pixiManager.makeContainer(boundingBox).overlayDiv,
                domain
            );
            if (!options.static) brush.addInteractor(plot => panZoom(plot, domain));
        }
        if (type === TrackType.BrushCircular) {
            const domain = getEncodingSignal(trackDef.trackId, 'x', linkedEncodings);
            const brushDomain = getEncodingSignal(trackDef.trackId, 'brush', linkedEncodings);
            if (!domain || !brushDomain || !hasLinkedTracks(trackDef.trackId, linkedEncodings)) return;
            // We only want to add the brush track if it is linked to another track
            const brush = new BrushCircularTrack(
                options,
                brushDomain,
                pixiManager.makeContainer(boundingBox).overlayDiv,
                domain
            );
            if (!options.static) {
                brush.addInteractor(plot => panZoom(plot, domain));
            }
        }
        if (type === TrackType.Dummy) {
            new DummyTrack(options, pixiManager.makeContainer(boundingBox).overlayDiv);
        }
        // Add a new track type for Chromospace
        if (type === TrackType.Spatial) {
            // Even though Chromospace doesn't use PixiJS, we can use the PixiManager to create a div container that the canvas can be placed into.
            // In the final version, we would probably want Chromospace to use an existing canvas element (to limit the creation of new elements).
            // But for now this gets the job done.
            const container = pixiManager.makeContainer(boundingBox).overlayDiv;
            console.log("!@$!#%@#");
            console.log(options.spec);
            options.spec.data.sampleLength = 30000;
            const datafetcher = getDataFetcher(options.spec, urlToFetchOptions);
            createSpatialTrack(options, datafetcher as CsvDataFetcherClass, container);
        }
    });
}

/**
 * Returns true if the brush track is linked to non-brush tracks
 * We don't want to render a brush track if it is not linked to another track
 */
function hasLinkedTracks(brushId: string, linkedEncodings: LinkedEncoding[]): boolean {
    const linkedEncoding = linkedEncodings.find(link =>
        link.tracks.find(t => t.id === brushId && t.encoding === 'brush')
    );
    if (!linkedEncoding) return false;
    const nonBrushTracks = linkedEncoding.tracks.filter(t => t.encoding !== 'brush');
    return nonBrushTracks.length > 0;
}

function getEncodingSignal(
    trackDefId: string,
    encodingType: string,
    linkedEncodings: LinkedEncoding[]
): Signal | undefined {
    const linkedEncoding = linkedEncodings.find(link =>
        link.tracks.find(t => t.id === trackDefId && t.encoding === encodingType)
    );
    if (!linkedEncoding) {
        return undefined;
    }
    if (!linkedEncoding.signal) {
        console.warn(`No signal found for linked encoding ${linkedEncoding.linkingId}`);
        return undefined;
    }
    return linkedEncoding!.signal;
}
