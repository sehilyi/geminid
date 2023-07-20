import React from 'react';
import ReactDOM from 'react-dom';

import type { GoslingSpec } from './gosling.schema';
import type { HiGlassSpec } from './higlass.schema';

import { validateGoslingSpec } from './utils/validate';
import { compile } from '../compiler/compile';
import { getTheme, type Theme } from './utils/theme';
import { GoslingTemplates } from './utils/template';
import { type GoslingApi, createApi } from './api';

import {
    type HiGlassApi,
    HiGlassComponentWrapper,
    type HiGlassComponentWrapperProps
} from './higlass-component-wrapper';

export type GoslingEmbedOptions = Omit<HiGlassComponentWrapperProps['options'], 'background'> & {
    id?: string;
    className?: string;
    theme?: Theme;
};

const MAX_TRIES = 20;
const INTERVAL = 200; // ms

// https://github.com/higlass/higlass/blob/0299ae1229fb57e0ca8da31dff58003c3e5bf1cf/app/scripts/hglib.js#L37A
const launchHiglass = (
    element: HTMLElement,
    viewConfig: HiGlassSpec,
    size: { width: number; height: number },
    opts: GoslingEmbedOptions & { background: string }
): Promise<HiGlassApi> => {
    const ref = React.createRef<HiGlassApi>();
    const component = React.createElement(HiGlassComponentWrapper, {
        ref,
        viewConfig,
        size,
        id: opts.id,
        className: opts.className,
        options: opts
    });
    ReactDOM.render(component, element);

    // For some reason our wrapper component fails to initialize the provided `ref`
    // immediately like `hglib.launch()`. This is a work-around to poll `ref`
    // until it is initialized by our wrapper. We return a promise for the API once
    // it is defined or raise an error.
    // https://github.com/gosling-lang/gosling.js/pull/456#discussion_r687861694
    return new Promise((resolve, reject) => {
        let tries = 0;
        const poll = setInterval(() => {
            if (ref && ref.current) {
                clearInterval(poll);
                resolve(ref.current);
            }
            if (tries >= MAX_TRIES) {
                reject(new Error('Failed to initialize HiGlassApi.'));
            }
            tries++;
        }, INTERVAL);
    });
};

/**
 * Embed a Gosling component to a given HTMLElement.
 * @param element
 * @param spec
 */
export function embed(element: HTMLElement, spec: GoslingSpec, opts: GoslingEmbedOptions = {}) {
    return new Promise<GoslingApi>((resolve, reject) => {
        const valid = validateGoslingSpec(spec);

        if (valid.state === 'error') {
            reject(new Error('Gosling spec is not valid. Please refer to the console message.'));
        }

        const theme = getTheme(opts.theme || 'light');
        const options = {
            ...opts,
            background: theme.root.background,
            alt: opts.alt ?? spec.description ?? 'Gosling visualization'
        };

        compile(
            spec,
            async (hsSpec, size, _, trackInfos) => {
                const hg = await launchHiglass(element, hsSpec, size, options);
                const api = createApi(hg, hsSpec, trackInfos, theme);
                resolve(api);
            },
            [...GoslingTemplates],
            theme,
            {} // TODO: properly specify this
        );
    });
}
