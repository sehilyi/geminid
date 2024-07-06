import React, { useState, useEffect, useMemo } from 'react';
import { PixiManager } from '@pixi-manager';

import { compile } from '../src/compiler/compile';
import { getTheme } from '../src/core/utils/theme';

import { createTrackDefs } from './track-def/main';
import { renderTrackDefs } from './renderer/main';
import type { TrackInfo } from 'src/compiler/bounding-box';
import type { GoslingSpec } from 'gosling.js';
import { getLinkedEncodings } from './linking/linkedEncoding';

interface GoslingComponentProps {
    spec: GoslingSpec | undefined;
    width: number;
    height: number;
}
export function GoslingComponent({ spec, width, height }: GoslingComponentProps) {
    const [fps, setFps] = useState(120);
    const [pixiManager, setPixiManager] = useState<PixiManager | null>(null);

    useEffect(() => {
        if (!spec) return;
        const plotElement = document.getElementById('plot') as HTMLDivElement;
        // Initialize the PixiManager. This will be used to get containers and overlay divs for the plots
        const canvasWidth = 1000,
            canvasHeight = 1000; // These initial sizes don't matter because the size will be updated
        if (!pixiManager) {
            const pixiManager = new PixiManager(canvasWidth, canvasHeight, plotElement, () => {});
            renderGosling(spec, plotElement, pixiManager);
            setPixiManager(pixiManager);
        } else {
            console.warn('pixi manager found');
            pixiManager.clearAll();
            renderGosling(spec, plotElement, pixiManager);
        }
    }, [spec]);

    return <div id="plot" style={{ height: '100%' }}></div>;
}
/**
 * This is the main function. It takes a Gosling spec and renders it to the container.
 * @param gs
 * @param container
 * @param width
 * @param height
 */
function renderGosling(gs: GoslingSpec, container: HTMLDivElement, pixiManager: PixiManager) {
    // Compile the spec
    const compileResult = compile(gs, [], getTheme('light'), { containerSize: { width: 0, height: 0 } });
    const { trackInfos, gs: processedSpec, theme } = compileResult;

    // Extract all of the linking information from the spec
    const linkedEncodings = getLinkedEncodings(processedSpec);

    // If the spec is responsive, we need to add a resize observer to the container
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
                const trackDefs = createTrackDefs(rescaledTracks, theme);
                renderTrackDefs(trackDefs, linkedEncodings, pixiManager);
                // Resize the canvas to make sure it fits the tracks
                const { width, height } = calculateWidthHeight(rescaledTracks);
                pixiManager.resize(width, height);
            }, 300)
        );
        resizeObserver.observe(container);
    } else {
        // If the spec is not responsive, we can just render the tracks
        const trackDefs = createTrackDefs(trackInfos, theme);
        console.warn('Rendering tracks');
        renderTrackDefs(trackDefs, linkedEncodings, pixiManager);
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
