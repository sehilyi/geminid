import { BasicSingleTrack, GeminidSpec } from '../geminid.schema';
import { IsDataMetadata, IsTemplate } from '../geminid.schema.guards';
import assign from 'lodash/assign';

/**
 * Update track-level specs considering the root-level specs (e.g., arrangements).
 * @param spec
 */
export function fixSpecDownstream(spec: GeminidSpec) {
    /**
     * superposeOnPreviousTrack
     */
    if (spec.tracks[0]?.superposeOnPreviousTrack) {
        spec.tracks[0].superposeOnPreviousTrack = false;
    }

    /**
     * Zoomability
     */
    if (spec.static) {
        // Force disable zoomability when the top-level static option is enabled
        spec.tracks.forEach(t => {
            t.static = true;
        });
    }

    /**
     * Flag tracks to use circular marks
     */
    if (spec?.layout === 'circular') {
        // We need to let individual tracks know that they are rendered in a circular layout
        spec.tracks.forEach(t => {
            if (t.layout === undefined) {
                // EXPERIMENTAL: Remove if statement
                t.layout = 'circular';
            }
        });
    }
}

/**
 * Get an encoding template for the `higlass-vector` data type.
 * @param column
 * @param value
 */
export function getVectorTemplate(column: string, value: string): BasicSingleTrack {
    return {
        data: { type: 'tileset', url: 'https://localhost:8080/api/v1/tileset_info/?d=VLFaiSVjTjW6mkbjRjWREA' },
        metadata: {
            type: 'higlass-vector',
            column,
            value
        },
        mark: 'bar',
        x: { field: column, type: 'genomic', axis: 'bottom' },
        y: { field: value, type: 'quantitative' }
    };
}

export function getMultivecTemplate(
    row: string,
    column: string,
    value: string,
    categories: string[] | undefined
): BasicSingleTrack {
    return categories && categories.length < 10
        ? {
              data: { type: 'tileset', url: 'https://localhost:8080/api/v1/tileset_info/?d=VLFaiSVjTjW6mkbjRjWREA' },
              metadata: {
                  type: 'higlass-multivec',
                  row,
                  column,
                  value,
                  categories
              },
              mark: 'bar',
              x: { field: column, type: 'genomic', axis: 'bottom' },
              y: { field: value, type: 'quantitative' },
              row: { field: row, type: 'nominal', legend: true },
              color: { field: row, type: 'nominal' }
          }
        : {
              data: { type: 'tileset', url: 'https://localhost:8080/api/v1/tileset_info/?d=VLFaiSVjTjW6mkbjRjWREA' },
              metadata: {
                  type: 'higlass-multivec',
                  row,
                  column,
                  value,
                  categories
              },
              mark: 'rect',
              x: { field: column, type: 'genomic', axis: 'bottom' },
              row: { field: row, type: 'nominal', legend: true },
              color: { field: value, type: 'quantitative' }
          };
}

/**
 * Override default visual encoding in each track for given data type.
 * @param spec
 */
export function resolvePartialSpec(spec: GeminidSpec) {
    spec.tracks.forEach((t, i) => {
        if (!t.metadata || !IsDataMetadata(t.metadata)) {
            // if `metadata` is not specified, we can not provide a correct template since we do not know the exact data type.
            return;
        }

        if (!IsTemplate(t)) {
            // This is not partial specification that we need to use templates
            return;
        }

        switch (t.metadata.type) {
            case 'higlass-vector':
                spec.tracks[i] = assign(getVectorTemplate(t.metadata.column, t.metadata.value), t);
                break;
            case 'higlass-multivec':
                spec.tracks[i] = assign(
                    getMultivecTemplate(t.metadata.row, t.metadata.column, t.metadata.value, t.metadata.categories),
                    t
                );
                break;
        }
    });
}
