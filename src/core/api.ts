import * as PIXI from 'pixi.js';
import type { TrackMouseEventData } from '@gosling.schema';
import type { HiGlassApi } from './higlass-component-wrapper';
import type { HiGlassSpec } from '@higlass.schema';
import { subscribe, unsubscribe } from './pubsub';
import { computeChromSizes, GenomicPositionHelper } from './utils/assembly';
import type { CompleteThemeDeep } from './utils/theme';

/**
 * Information of suggested genes.
 */
interface GeneSuggestion {
    geneName: string; // gene symbol
    score: number; // higher score means suggested gene is more likely to match the searched keyword
    chr: string; // chromosome name
    txStart: number; // absolute genomic position assuming chromosomes are concat end-to-end
    txEnd: number; // absolute genomic position assuming chromosomes are concat end-to-end
}

export interface GoslingApi {
    subscribe: typeof subscribe;
    unsubscribe: typeof unsubscribe;
    zoomTo(trackId: string, position: string, padding?: number, duration?: number): void;
    zoomToExtent(trackId: string, duration?: number): void;
    zoomToGene(trackId: string, gene: string, padding?: number, duration?: number): void;
    suggestGene(trackId: string, keyword: string, callback: (suggestions: GeneSuggestion[]) => void): void;
    /**
     * This is for the backward compatibility and will be deprecated. Use `getTrackIds()` instead.
     */
    getViewIds(): string[];
    /**
     * Get an array of all available track IDs that are either specified by users or generated by the compiler.
     * This can be used to call other API functions, e.g., `getTrack('track-1')`.
     */
    getTrackIds(): string[];
    getTracks(): TrackMouseEventData[];
    getTrack(trackId: string): TrackMouseEventData | undefined;
    exportPng(transparentBackground?: boolean): void;
    exportPdf(transparentBackground?: boolean): void;
    getCanvas(options?: { resolution?: number; transparentBackground?: boolean }): {
        canvas: HTMLCanvasElement;
        canvasWidth: number;
        canvasHeight: number;
        resolution: number;
    };
}

export function createApi(
    hg: Readonly<HiGlassApi>,
    hgSpec: HiGlassSpec | undefined,
    trackSpecAndShapes: readonly TrackMouseEventData[],
    theme: Required<CompleteThemeDeep>,
    idTable: Readonly<Record<string, string>>
): GoslingApi {
    const idTableCopy = JSON.parse(JSON.stringify(idTable));
    const getTracks = () => {
        return [...trackSpecAndShapes];
    };
    const getTrack = (trackId: string) => {
        const trackInfoFound = trackSpecAndShapes.find(d => d.id === trackId);
        if (!trackInfoFound) {
            console.warn(`[getTrack()] Unable to find a track using the ID (${trackId})`);
        }
        return trackInfoFound;
    };
    const getCanvas: GoslingApi['getCanvas'] = options => {
        const resolution = options?.resolution ?? 4;
        const transparentBackground = options?.transparentBackground ?? false;

        const renderer = hg.pixiRenderer;
        const renderTexture = PIXI.RenderTexture.create({
            width: renderer.width / 2,
            height: renderer.height / 2,
            resolution
        });

        renderer.render(hg.pixiStage, renderTexture);

        const canvas = renderer.plugins.extract.canvas(renderTexture);

        // Set background color for the given theme in the gosling spec
        // Otherwise, it is transparent
        const canvasWithBg = document.createElement('canvas') as HTMLCanvasElement;
        canvasWithBg.width = canvas.width;
        canvasWithBg.height = canvas.height;

        const ctx = canvasWithBg.getContext('2d')!;
        if (!transparentBackground) {
            ctx.fillStyle = theme.root.background;
            ctx.fillRect(0, 0, canvasWithBg.width, canvasWithBg.height);
        }
        ctx.drawImage(canvas, 0, 0);

        return {
            canvas: canvasWithBg,
            resolution,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
        };
    };
    /**
     * Get the HiGlass view ID from the Gosling track ID.
     */
    const getHgViewId = (trackId: string) => {
        const viewId = idTableCopy[trackId];
        if (!viewId) {
            console.warn(`Unable to find the track ID, named ${trackId}.`);
        }
        return viewId ?? trackId;
    };
    const getTrackIds = () => {
        return Object.keys(idTableCopy);
    };
    return {
        subscribe,
        unsubscribe,
        zoomTo: (trackId, position, padding = 0, duration = 1000) => {
            // Accepted input: 'chr1' or 'chr1:1-1000'
            const assembly = getTrack(trackId)?.spec.assembly;
            const manager = GenomicPositionHelper.fromString(position);
            const absCoordinates = manager.toAbsoluteCoordinates(assembly, padding);
            const hgViewId = getHgViewId(trackId);
            hg.api.zoomTo(hgViewId, ...absCoordinates, ...absCoordinates, duration);
        },
        zoomToExtent: (trackId, duration = 1000) => {
            const assembly = getTrack(trackId)?.spec.assembly;
            const [start, end] = [0, computeChromSizes(assembly).total];
            const hgViewId = getHgViewId(trackId);
            hg.api.zoomTo(hgViewId, start, end, start, end, duration);
        },
        zoomToGene: (trackId, gene, padding = 0, duration = 1000) => {
            const hgViewId = getHgViewId(trackId);
            hg.api.zoomToGene(hgViewId, gene, padding, duration);
        },
        suggestGene: (trackId: string, keyword: string, callback: (suggestions: GeneSuggestion[]) => void) => {
            const hgViewId = getHgViewId(trackId);
            hg.api.suggestGene(hgViewId, keyword, callback);
        },
        getTrackIds,
        getViewIds: getTrackIds,
        getTracks,
        getTrack,
        getCanvas,
        exportPng: transparentBackground => {
            const { canvas } = getCanvas({ resolution: 4, transparentBackground });
            canvas.toBlob(blob => {
                const a = document.createElement('a');
                document.body.append(a);
                a.download = 'gosling-visualization';
                a.href = URL.createObjectURL(blob!);
                a.click();
                a.remove();
            }, 'image/png');
        },
        exportPdf: async transparentBackground => {
            const { jsPDF } = await import('jspdf');
            const { canvas } = getCanvas({ resolution: 4, transparentBackground });
            const imgData = canvas.toDataURL('image/jpeg', 1);
            const pdf = new jsPDF({
                orientation: canvas.width < canvas.height ? 'p' : 'l',
                unit: 'pt',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save('gosling-visualization.pdf');
        }
    };
}
