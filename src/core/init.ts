import { default as higlassRegister } from 'higlass-register';
// @ts-ignore
import { TextTrack } from 'higlass-text';
import { AxisTrack } from '../gosling-genomic-axis';
import { BrushTrack } from '../gosling-brush';
import { BigWigDataFetcher, CsvDataFetcher, JsonDataFetcher } from '../data-fetchers';
import { GoslingTrack } from '../gosling-track/index';

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
        // @ts-expect-error type of track
        track: GoslingTrack,
        config: GoslingTrack.config
    });

    /**
     * Register a 2D Gosling.js track to HiGlassComponent
     */
    higlassRegister({
        name: 'Gosling2DTrack',
        // @ts-expect-error type of track
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
        // @ts-expect-error type of track
        track: BrushTrack,
        config: BrushTrack.config
    });

    /**
     * Register data fetchers to HiGlassComponent
     */
    higlassRegister({ dataFetcher: CsvDataFetcher, config: CsvDataFetcher.config }, { pluginType: 'dataFetcher' });
    higlassRegister({ dataFetcher: JsonDataFetcher, config: JsonDataFetcher.config }, { pluginType: 'dataFetcher' });
    higlassRegister(
        { dataFetcher: BigWigDataFetcher, config: BigWigDataFetcher.config },
        { pluginType: 'dataFetcher' }
    );

    once = true;
}
