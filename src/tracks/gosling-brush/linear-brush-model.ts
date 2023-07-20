import { createNanoEvents, Emitter } from 'nanoevents';
import type * as D3Selection from 'd3-selection';
import type * as D3Drag from 'd3-drag';
import type { EventStyle } from '@gosling.schema';

const HIDDEN_BRUSH_EDGE_SIZE = 3;

interface Interval {
    start: number;
    end: number;
}

type LinearBrushData = [
    { type: 'body'; cursor: 'grab' } & Interval,
    { type: 'start'; cursor: 'ew-resize' } & Interval,
    { type: 'end'; cursor: 'ew-resize' } & Interval
];

interface LinearBrushEvents {
    brush: (range: [number, number] | null, skipApiTrigger: boolean) => void;
}

// default styles for brush
const BRUSH_STYLE_DEFAULT: Required<Omit<EventStyle, 'arrange'>> = {
    color: '#777',
    stroke: '#777',
    strokeWidth: 1,
    strokeOpacity: 0.7,
    opacity: 0.3
};

/**
 * A model to manage 1D brush graphics and its data.
 */
export class LinearBrushModel {
    /* graphical elements */
    private brushSelection: D3Selection.Selection<SVGRectElement, LinearBrushData[number], SVGGElement, any>;
    private readonly style: Required<Omit<EventStyle, 'arrange'>>;

    /* data */
    private range: [number, number] | null;
    private data: LinearBrushData;

    /* drag */
    private startEvent: D3Drag.D3DragEvent<SVGElement, LinearBrushData[number], D3Drag.SubjectPosition>['sourceEvent'];
    private prevExtent: [number, number] | null;

    /* visual parameters */
    private offset: [number, number];
    private size: number; // fixed size of one-dimension of a brush (e.g., height)

    /* External libraries that we re-use from HiGlass */
    private externals: {
        d3Selection: typeof D3Selection;
        d3Drag: typeof D3Drag;
    };

    private emitter: Emitter<LinearBrushEvents>;

    constructor(
        selection: D3Selection.Selection<SVGGElement, unknown, null, unknown>,
        hgLibraries: any,
        style: EventStyle = {}
    ) {
        this.emitter = createNanoEvents<LinearBrushEvents>();
        this.range = null;
        this.prevExtent = [0, 0];
        this.data = this.rangeToData(0, 0);

        this.offset = [0, 0];
        this.size = 0;

        this.externals = {
            d3Selection: hgLibraries.d3Selection,
            d3Drag: hgLibraries.d3Drag
        };

        this.style = Object.assign({}, BRUSH_STYLE_DEFAULT, style);

        this.brushSelection = selection
            .selectAll('.genomic-range-brush')
            .data(this.data)
            .enter()
            .append('rect')
            .attr('class', 'genomic-range-brush')
            .call(this.onDrag());
    }

    public getRange() {
        return this.range;
    }

    public setSize(size: number) {
        this.size = size;
        return this;
    }

    /**
     * Update the left and top offsets for drawing the brush.
     */
    public setOffset(offsetX: number, offsetY: number) {
        this.offset = [offsetX, offsetY];
        return this;
    }

    /**
     * Update brush data based on the positions of two edges.
     */
    public updateRange(range: [number, number] | null) {
        if (range) {
            this.range = [Math.min(...range), Math.max(...range)];
            this.data = this.rangeToData(...this.range);
        } else {
            this.range = null;
        }
        return this;
    }

    /**
     * Update the brush using the internal range value. By default,
     * This function calls a render function from gosling-track.
     */
    public drawBrush(skipApiTrigger = false) {
        const [x, y] = this.offset;
        const height = this.size;
        const getWidth = (d: LinearBrushData[number]) => Math.abs(d.end - d.start); // the start and end can be minus values
        this.brushSelection
            .data(this.data)
            .attr('transform', d => `translate(${x + d.start}, ${y + 1})`)
            .attr('width', d => `${getWidth(d)}px`)
            .attr('height', `${height - 2}px`)
            .attr('fill', this.style.color)
            .attr('stroke', this.style.stroke)
            .attr('stroke-width', `${this.style.strokeWidth}px`)
            .attr('fill-opacity', d => (d.type === 'body' ? this.style.opacity : 0))
            .attr('stroke-opacity', d => (d.type === 'body' ? this.style.strokeOpacity : 0))
            .attr('cursor', d => d.cursor);

        this.emitter.emit('brush', this.getRange(), skipApiTrigger);
        return this;
    }

    public enable() {
        this.brushSelection.attr('pointer-events', 'all');
        return this;
    }

    public disable() {
        this.brushSelection.attr('pointer-events', 'none');
        return this;
    }

    public visible() {
        this.brushSelection.attr('visibility', 'visible');
        return this;
    }

    public hidden() {
        this.brushSelection.attr('visibility', 'hidden');
        return this;
    }

    public clear() {
        this.updateRange(null).drawBrush().hidden().disable();
        return this;
    }

    public remove() {
        this.brushSelection.remove();
        return this;
    }

    /**
     * Based on the extent values, generate a JSON object for the brush.
     */
    private rangeToData(start: number, end: number): LinearBrushData {
        return [
            {
                type: 'body',
                cursor: 'grab',
                start,
                end
            },
            {
                type: 'start',
                cursor: 'ew-resize',
                start: start - HIDDEN_BRUSH_EDGE_SIZE,
                end: start
            },
            {
                type: 'end',
                cursor: 'ew-resize',
                start: end,
                end: end + HIDDEN_BRUSH_EDGE_SIZE
            }
        ];
    }

    private onDrag() {
        const started = (event: D3Drag.D3DragEvent<SVGElement, LinearBrushData[number], D3Drag.SubjectPosition>) => {
            this.startEvent = event.sourceEvent;
            this.prevExtent = this.range;
        };

        const dragged = (
            event: D3Drag.D3DragEvent<SVGElement, LinearBrushData[number], D3Drag.SubjectPosition>,
            d: LinearBrushData[number]
        ) => {
            const delta = event.sourceEvent.layerX - this.startEvent.layerX;

            // previous extent of brush
            let [s, e]: [number, number] = this.prevExtent ?? [0, 0];

            if (d.type === 'body') {
                s += delta;
                e += delta;
            } else if (d.type === 'start') {
                s += delta;
            } else if (d.type === 'end') {
                e += delta;
            }

            this.updateRange([s, e]).drawBrush();
        };

        return this.externals.d3Drag
            .drag<SVGRectElement, LinearBrushData[number]>()
            .on('start', started)
            .on('drag', dragged);
    }

    on<E extends keyof LinearBrushEvents>(event: E, callback: LinearBrushEvents[E]) {
        this.emitter.on(event, callback);
    }
}
