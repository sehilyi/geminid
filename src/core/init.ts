// @ts-ignore
import higlassRegister from 'higlass-register';
// @ts-ignore
import { TextTrack } from 'higlass-text';
import { AxisTrack } from '@gosling-genomic-axis';
import { BrushTrack } from '@gosling-brush';
import { GoslingTrack } from 'src/tracks/gosling-track';
import * as dataFetchers from '@data-fetchers';

let once = false;

/**
 * Register plugin tracks and data fetchers to HiGlass. This is necessary for the first time before using Gosling.js.
 */
export function init() {
    if (once) return;

    /**
     * Register a linear Gosling.js track to HiGlassComponent
     */
    higlassRegister({
        name: 'GoslingTrack',
        track: GoslingTrack,
        config: GoslingTrack.config
    });

    /**
     * Register a 2D Gosling.js track to HiGlassComponent
     */
    higlassRegister({
        name: 'Gosling2DTrack',
        track: GoslingTrack,
        config: {
            ...GoslingTrack.config,
            type: 'gosling-2d-track',
            orientation: '2d'
        }
    });

    /**
     * Register an axis plugin track to HiGlassComponent
     */
    higlassRegister({
        name: 'AxisTrack',
        track: AxisTrack,
        config: AxisTrack.config
    });

    /**
     * Register a higlass-text plugin track to HiGlassComponent
     */
    higlassRegister({
        name: 'TextTrack',
        track: TextTrack,
        config: TextTrack.config
    });

    /**
     * Register a brush plugin track to HiGlassComponent
     */
    higlassRegister({
        name: 'BrushTrack',
        track: BrushTrack,
        config: BrushTrack.config
    });

    /**
     * Register data fetchers to HiGlassComponent
     */
    for (const dataFetcher of Object.values(dataFetchers)) {
        const { config } = dataFetcher;
        higlassRegister({ dataFetcher, config }, { pluginType: 'dataFetcher' });
    }

    once = true;
}
