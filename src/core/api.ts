import * as PIXI from 'pixi.js';
import { Datum } from './gosling.schema';
import { HiGlassApi } from './higlass-component-wrapper';
import { HiGlassSpec } from './higlass.schema';
import { GET_CHROM_SIZES } from './utils/assembly';
import { CompleteThemeDeep } from './utils/theme';
import { traverseViewsInViewConfig } from './utils/view-config';

export type EVENT_TYPE = 'mouseover';

export type CommonEventData = {
    data: Datum;
    genomicPosition: string;
};

export type MouseHoverCallback = (data: CommonEventData) => any;

export interface UserDefinedEvents {
    mouseover?: MouseHoverCallback;
}

export interface Api {
    on: (type: EVENT_TYPE, callback: MouseHoverCallback) => void;
    zoomTo: (viewId: string, position: string, duration?: number) => void;
    zoomToExtent: (viewId: string, duration?: number) => void;
    zoomToGene: (viewId: string, gene: string, duration?: number) => void;
    getViewIds: () => string[];
    exportPNG: (transparentBackground?: boolean) => void;
    exportPDF: (transparentBackground?: boolean) => void;
    getCanvas: (options?: {
        resolution?: number;
        transparentBackground?: boolean;
    }) => {
        canvas: HTMLCanvasElement;
        canvasWidth: number;
        canvasHeight: number;
        resolution: number;
    };
}

export function createApi(
    hgRef: React.RefObject<HiGlassApi | undefined> | HiGlassApi,
    hgSpec: HiGlassSpec | undefined,
    theme: Required<CompleteThemeDeep>
): Api {
    const getHg = () => {
        // Safely get higlass API
        if ('api' in hgRef) return hgRef;
        if (hgRef.current) return hgRef.current;
        throw new Error('Higlass ref not initalized');
    };
    const getCanvas: Api['getCanvas'] = options => {
        const hg = getHg();
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
        on: (type, callback) => {
            switch (type) {
                case 'mouseover':
                    return PubSub.subscribe(type, callback);
                default: {
                    console.warn('Subsriber not recognized.');
                }
            }
        },
        // TODO: Support assemblies (we can infer this from the spec)
        zoomTo: (viewId, position, duration = 1000) => {
            // Accepted input: 'chr1' or 'chr1:1-1000'
            if (!position.includes('chr')) {
                console.warn('Genomic interval you entered is not in a correct form.');
                return;
            }

            const chr = position.split(':')[0];
            const chrStart = GET_CHROM_SIZES().interval?.[chr]?.[0];

            if (!chr || typeof chrStart === undefined) {
                console.warn('Chromosome name is not valid', chr);
                return;
            }

            const [s, e] = position.split(':')[1]?.split('-') ?? [0, GET_CHROM_SIZES().size[chr]];
            const start = +s + chrStart;
            const end = +e + chrStart;

            getHg().api.zoomTo(viewId, start, end, start, end, duration);
        },
        // TODO: Support assemblies (we can infer this from the spec)
        zoomToExtent: (viewId, duration = 1000) => {
            const [start, end] = [0, GET_CHROM_SIZES().total];
            getHg().api.zoomTo(viewId, start, end, start, end, duration);
        },
        zoomToGene: (viewId, gene, duration = 1000) => {
            getHg().api.zoomToGene(viewId, gene, duration);
        },
        getViewIds: () => {
            if (!hgSpec) return [];
            const ids: string[] = [];
            traverseViewsInViewConfig(hgSpec, view => {
                if (view.uid) ids.push(view.uid);
            });
            return ids;
        },
        getCanvas: getCanvas,
        exportPNG: transparentBackground => {
            const { canvas } = getCanvas({ resolution: 4, transparentBackground });
            canvas.toBlob(blob => {
                const a = document.createElement('a');
                document.body.append(a);
                a.download = 'gosling-visualization';
                a.href = URL.createObjectURL(blob);
                a.click();
                a.remove();
            }, 'image/png');
        },
        exportPDF: async transparentBackground => {
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
