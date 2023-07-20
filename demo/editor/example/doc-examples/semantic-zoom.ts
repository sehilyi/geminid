import type { GoslingSpec } from 'gosling.js';
import { EX_TRACK_SEMANTIC_ZOOM } from '../json-spec/semantic-zoom';

export const SEMANTIC_ZOOM_SEQUENCE: GoslingSpec = {
    title: 'Example: Semantic Zooming',
    subtitle: 'Text marks that indicate base pairs will appear when zooming in',
    tracks: [
        {
            ...EX_TRACK_SEMANTIC_ZOOM.sequence,
            width: 800
        }
    ]
};

export const SEMANTIC_ZOOM_CYTO: GoslingSpec = {
    title: 'Example: Semantic Zooming',
    subtitle: 'Text and triangle marks will show when zooming in to provide more details',
    tracks: [
        {
            ...EX_TRACK_SEMANTIC_ZOOM.cytoband,
            width: 800
        }
    ]
};
