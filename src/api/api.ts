import * as PIXI from 'pixi.js';
import type { TrackApiData, VisUnitApiData, ViewApiData } from '@gosling.schema';
import type { HiGlassApi } from './higlass-component-wrapper';
import type { HiGlassSpec } from '@higlass.schema';
import { subscribe, unsubscribe } from './pubsub';
import { computeChromSizes, GenomicPositionHelper } from './utils/assembly';
import type { CompleteThemeDeep } from './utils/theme';
import { traverseViewsInViewConfig } from './utils/view-config';

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
    zoomTo(viewId: string, position: string, padding?: number, duration?: number): void;
    zoomToExtent(viewId: string, duration?: number): void;
    zoomToGene(viewId: string, gene: string, padding?: number, duration?: number): void;
    suggestGene(viewId: string, keyword: string, callback: (suggestions: GeneSuggestion[]) => void): void;
    getTracksAndViews(): VisUnitApiData[];
    getViewIds(): string[];
    getTracks(): TrackApiData[];
    getTrack(trackId: string): TrackApiData | undefined;
    getViews(): ViewApiData[];
    getView(viewId: string): ViewApiData | undefined;
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
    tracksAndViews: readonly VisUnitApiData[],
    theme: Required<CompleteThemeDeep>
): GoslingApi {
    const getTracksAndViews = () => {
        return [...tracksAndViews];
    };
    const getTracks = () => {
        return [...getTracksAndViews().filter(d => d.type === 'track')] as TrackApiData[];
    };
    const getTrack = (trackId: string) => {
        const trackInfoFound = getTracks().find(d => d.id === trackId);
        if (!trackInfoFound) {
            console.warn(`[getTrack()] Unable to find a track using the ID (${trackId})`);
        }
        return trackInfoFound;
    };
    const getViews = () => {
        return [...getTracksAndViews().filter(d => d.type === 'view')] as ViewApiData[];
    };
    const getView = (viewId: string) => {
        const view = getViews().find(d => d.id === viewId);
        if (!view) {
            console.warn(`Unable to find a view with the ID of ${viewId}`);
        }
        return view;
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
    return {
        subscribe,
        unsubscribe,
        zoomTo: (viewId, position, padding = 0, duration = 1000) => {
            // Accepted input: 'chr1' or 'chr1:1-1000'
            const assembly = getTrack(viewId)?.spec.assembly;
            const manager = GenomicPositionHelper.fromString(position);
            const absCoordinates = manager.toAbsoluteCoordinates(assembly, padding);
            hg.api.zoomTo(viewId, ...absCoordinates, ...absCoordinates, duration);
        },
        zoomToExtent: (viewId, duration = 1000) => {
            const assembly = getTrack(viewId)?.spec.assembly;
            const [start, end] = [0, computeChromSizes(assembly).total];
            hg.api.zoomTo(viewId, start, end, start, end, duration);
        },
        zoomToGene: (viewId, gene, padding = 0, duration = 1000) => {
            hg.api.zoomToGene(viewId, gene, padding, duration);
        },
        suggestGene: (viewId: string, keyword: string, callback: (suggestions: GeneSuggestion[]) => void) => {
            hg.api.suggestGene(viewId, keyword, callback);
        },
        getViewIds: () => {
            if (!hgSpec) return [];
            const ids: string[] = [];
            traverseViewsInViewConfig(hgSpec, view => {
                if (view.uid) ids.push(view.uid);
            });
            return ids;
        },
        getTracksAndViews,
        getTracks,
        getTrack,
        getView,
        getViews,
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
