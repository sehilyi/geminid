import React, { useState, useEffect } from 'react';
import { PixiManager } from '@pixi-manager';
import { compile, type UrlToFetchOptions } from '../src/compiler/compile';
import { getTheme } from '../src/core/utils/theme';
import { createTrackDefs } from '../src/track-def';
import { renderTrackDefs } from './renderer/main';
import type { TrackInfo } from 'src/compiler/bounding-box';
import type { GoslingSpec } from 'gosling.js';
import { getLinkedEncodings } from './linking/linkedEncoding';

interface GoslingComponentProps {
    spec: GoslingSpec | undefined;
    width: number;
    height: number;
    urlToFetchOptions?: UrlToFetchOptions;
}
export function GoslingComponent({ spec, width, height, urlToFetchOptions }: GoslingComponentProps) {
    const [fps, setFps] = useState(120);
    // Pixi manager should persist between render calls. Otherwise performance degrades greatly.
    const [pixiManager, setPixiManager] = useState<PixiManager | null>(null);

    useEffect(() => {
        if (!spec) return;
        const plotElement = document.getElementById('plot') as HTMLDivElement;
        // If the pixiManager doesn't exist, create a new one
        if (!pixiManager) {
            const canvasWidth = 1000,
                canvasHeight = 1000; // These initial sizes don't matter because the size will be updated
            const pixiManager = new PixiManager(canvasWidth, canvasHeight, plotElement, () => {});
            renderGosling(spec, plotElement, pixiManager, urlToFetchOptions);
            setPixiManager(pixiManager);
        } else {
            pixiManager.clearAll();
            renderGosling(spec, plotElement, pixiManager, urlToFetchOptions);
        }
    }, [spec]);

    return <div id="plot" style={{ height: '100%' }}></div>;
}
/**
 * This is the main function. It takes a Gosling spec and renders it using the PixiManager
 */
function renderGosling(
    gs: GoslingSpec,
    container: HTMLDivElement,
    pixiManager: PixiManager,
    urlToFetchOptions?: UrlToFetchOptions
) {
    // 1. Compile the spec
    const compileResult = compile(gs, [], getTheme('light'), { containerSize: { width: 0, height: 0 } });
    const { trackInfos, gs: processedSpec, theme } = compileResult;
    console.warn('Spec', processedSpec);
    // 2. Extract all of the linking information from the spec
    const linkedEncodings = getLinkedEncodings(processedSpec);
    console.warn('Linked encodings', linkedEncodings);

    // 3. If the spec is responsive, we need to add a resize observer to the container
    const { isResponsiveWidth, isResponsiveHeight } = checkResponsiveSpec(processedSpec);
    if (isResponsiveWidth || isResponsiveHeight) {
        const resizeObserver = new ResizeObserver(
            debounce(entries => {
                const { width: containerWidth, height: containerHeight } = entries[0].contentRect;
                console.warn('Resizing to', containerWidth, containerHeight);
                // Remove all of the previously drawn overlay divs and tracks
                pixiManager.clearAll();
                const rescaledTracks = rescaleTrackInfos(
                    trackInfos,
                    containerWidth - 100, // minus 100 to account for the padding
                    containerHeight - 100,
                    isResponsiveWidth,
                    isResponsiveHeight
                );
                // 4. Render the tracks
                const trackDefs = createTrackDefs(rescaledTracks, theme);
                renderTrackDefs(trackDefs, linkedEncodings, pixiManager, urlToFetchOptions);
                // Resize the canvas to make sure it fits the tracks
                const { width, height } = calculateWidthHeight(rescaledTracks);
                pixiManager.resize(width, height);
            }, 300)
        );
        resizeObserver.observe(container);
    } else {
        // 4. If the spec is not responsive, we can just render the tracks
        const trackDefs = createTrackDefs(trackInfos, theme);
        console.warn('Rendering tracks');
        renderTrackDefs(trackDefs, linkedEncodings, pixiManager, urlToFetchOptions);
        // Resize the canvas to make sure it fits the tracks
        const { width, height } = calculateWidthHeight(trackInfos);
        pixiManager.resize(width, height);
    }
}

/** Debounces the resize observer */
function debounce(f: (arg0: unknown) => unknown, delay: number) {
    let timer = 0;
    return function (...args: [arg0: unknown]) {
        clearTimeout(timer);
        timer = setTimeout(() => f.apply(this, args), delay);
    };
}

/** Checks whether the input spec has responsive width or height */
function checkResponsiveSpec(spec: GoslingSpec) {
    const isResponsiveWidth =
        (spec.responsiveSize && typeof spec.responsiveSize === 'object' && spec.responsiveSize.width) || false;

    const isResponsiveHeight =
        (spec.responsiveSize && typeof spec.responsiveSize === 'object' && spec.responsiveSize.height) || false;

    return {
        isResponsiveWidth,
        isResponsiveHeight
    };
}

/** Helper function which calculates the maximum width and height of the bounding boxes of the trackInfos */
function calculateWidthHeight(trackInfos: TrackInfo[]) {
    const width = Math.max(...trackInfos.map(ti => ti.boundingBox.x + ti.boundingBox.width));
    const height = Math.max(...trackInfos.map(ti => ti.boundingBox.y + ti.boundingBox.height));
    return { width, height };
}

/**
 * This function rescales the bounding boxes of the trackInfos so that they fit within the width and height
 */
function rescaleTrackInfos(
    trackInfos: TrackInfo[],
    width: number,
    height: number,
    isResponsiveWidth: boolean,
    isResponsiveHeight: boolean
): TrackInfo[] {
    const { width: origWidth, height: origHeight } = calculateWidthHeight(trackInfos);
    if (isResponsiveWidth) {
        const scalingFactor = width / origWidth;
        trackInfos = trackInfos.map(ti => {
            return {
                ...ti,
                boundingBox: {
                    x: ti.boundingBox.x * scalingFactor,
                    y: ti.boundingBox.y,
                    width: ti.boundingBox.width * scalingFactor,
                    height: ti.boundingBox.height
                }
            };
        });
    }
    if (isResponsiveHeight) {
        const scalingFactor = height / origHeight;
        trackInfos = trackInfos.map(ti => {
            return {
                ...ti,
                boundingBox: {
                    x: ti.boundingBox.x,
                    y: ti.boundingBox.y * scalingFactor,
                    width: ti.boundingBox.width,
                    height: ti.boundingBox.height * scalingFactor
                }
            };
        });
    }
    return trackInfos;
}
