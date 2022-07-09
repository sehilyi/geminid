import type * as HiGlass from '@higlass/types';

export function definePluginTrack<Options extends HiGlass.TrackOptions>(
    config: Omit<HiGlass.TrackConfig<Options>, 'availableOptions'>,
    factory: HiGlass.PluginTrackFactory<Options>
) {
    function Track(...args: Parameters<typeof factory>) {
        if (!new.target) {
            throw new Error('Uncaught TypeError: Class constructor cannot be invoked without "new"');
        }
        return factory(...args);
    }
    Track.config = {
        ...config,
        availableOptions: Object.keys(config.defaultOptions ?? {})
    };
    return Track as unknown as HiGlass.PluginTrack<Options> & {
        config: {
            // code above ensures this field is always defined when using the plugin.
            availableOptions: (keyof Options)[];
        };
    };
}
