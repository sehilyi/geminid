/* eslint-disable react/prop-types */
import { type HiGlassApi, HiGlassComponentWrapper } from './higlass-component-wrapper';
import type { TemplateTrackDef, VisUnitApiData } from '@gosling-lang/gosling-schema';
import type { RequestInit } from '@gosling-lang/higlass-schema';
import React, { useState, useEffect, useMemo, useRef, forwardRef, useCallback, useImperativeHandle } from 'react';
import { ResizeSensor } from 'css-element-queries';
import * as gosling from '..';
import { getTheme, type Theme } from './utils/theme';
import { createApi, type GoslingApi } from '../api/api';
import { GoslingTemplates } from '..';
import { omitDeep } from './utils/omit-deep';
import { isEqual } from 'lodash-es';
import { publish } from '../api/pubsub';
import type { IdTable } from '../api/track-and-view-ids';
import { preverseZoomStatus } from './utils/higlass-zoom-config';
import { uuid } from '../core/utils/uuid';

// Before rerendering, wait for a few time so that HiGlass container is resized already.
// If HiGlass is rendered and then the container resizes, the viewport position changes, unmatching `xDomain` specified by users.
const DELAY_FOR_CONTAINER_RESIZE_BEFORE_RERENDER = 300;

/** Matches URLs to specific fetch options so that datafetchers have access URL specific fetch options */
export interface UrlToFetchOptions {
    [url: string]: RequestInit;
}
interface GoslingCompProps {
    spec?: gosling.GoslingSpec;
    compiled?: (goslingSpec: gosling.GoslingSpec, higlassSpec: gosling.HiGlassSpec) => void;
    padding?: number;
    margin?: number;
    border?: string;
    id?: string;
    className?: string;
    theme?: Theme;
    templates?: TemplateTrackDef[];
    urlToFetchOptions?: UrlToFetchOptions;
    experimental?: {
        reactive?: boolean;
    };
}

export type GoslingRef = {
    api: GoslingApi;
    hgApi: HiGlassApi;
};

export const GoslingComponent = forwardRef<GoslingRef, GoslingCompProps>((props, ref) => {
    const [viewConfig, setViewConfig] = useState<gosling.HiGlassSpec>();
    const [size, setSize] = useState({ width: 200, height: 200 });
    const wrapperSize = useRef<undefined | { width: number; height: number }>();
    const wrapperParentSize = useRef<undefined | { width: number; height: number }>();
    const prevSpec = useRef<undefined | gosling.GoslingSpec>();
    const tracksAndViews = useRef<VisUnitApiData[]>([]);
    /** A mapping table that connects between Gosling track IDs to corresponding HiGlas view IDs */
    const idTable = useRef<IdTable>({});

    // HiGlass API
    // https://dev.to/wojciechmatuszewski/mutable-and-immutable-useref-semantics-with-react-typescript-30c9
    const hgRef = useRef<HiGlassApi>(null);

    const theme = getTheme(props.theme || 'light');
    const wrapperDivId = props.id ?? uuid();

    /**
     * Publishes event if there is a new view added
     * @param currentTracksAndViews newly retrieved tracks and views from compile() callback
     */
    const publishOnNewView = (currentTracksAndViews: VisUnitApiData[]) => {
        // Compare the previous and current views to figure out the difference
        const prevViews = tracksAndViews.current.filter(data => data.type == 'view');
        const currentViews = currentTracksAndViews.filter(data => data.type == 'view');
        const prevViewIds = new Set(prevViews.map(data => data.id));
        const newViews = currentViews.filter(view => !prevViewIds.has(view.id));
        // Publish if there are any new changes
        newViews.forEach(view => {
            publish('onNewView', { id: view.id });
        });
    };

    // used for alt-gosling
    const publishSpecProcessed = (props: GoslingCompProps) => {
        if (props.spec && props.spec.id) {
            publish('specProcessed', { id: props.spec.id, spec: props.spec });
        }
    }
    
    // Gosling APIs
    useImperativeHandle(
        ref,
        () => {
            const hgApi = refAsReadonlyProxy(hgRef);
            const visUnits = refAsReadonlyProxy(tracksAndViews);
            const api = createApi(hgApi, viewConfig, visUnits, theme, idTable.current);
            return { api, hgApi };
        },
        [viewConfig, theme]
    );

    // TODO: add a `force` parameter since changing `linkingId` might not update vis
    const compile = useCallback(() => {
        if (props.spec) {
            const valid = gosling.validateGoslingSpec(props.spec);

            if (valid.state === 'error') {
                console.warn('Gosling spec is not valid. Please refer to the console message.');
                return;
            }

            gosling.compile(
                props.spec,
                (newHiGlassSpec, newSize, newGoslingSpec, newTracksAndViews, newIdTable) => {
                    // TODO: `linkingId` should be updated
                    // We may not want to re-render this
                    if (
                        prevSpec.current &&
                        isEqual(omitDeep(prevSpec.current, ['linkingId']), omitDeep(newGoslingSpec, ['linkingId']))
                    ) {
                        return;
                    }

                    // If a callback function is provided, return compiled information.
                    props.compiled?.(props.spec!, newHiGlassSpec);

                    // Change the size of wrapper `<div/>` elements
                    setSize(newSize);

                    // Update the compiled view config
                    const isMountedOnce = typeof viewConfig !== 'undefined';
                    if (props.experimental?.reactive && isMountedOnce) {
                        // Use API to update visualization.
                        setTimeout(() => {
                            preverseZoomStatus(
                                newHiGlassSpec,
                                hgRef.current?.api.getViewConfig() as gosling.HiGlassSpec
                            );
                            hgRef.current?.api.setViewConfig(newHiGlassSpec);
                        }, DELAY_FOR_CONTAINER_RESIZE_BEFORE_RERENDER);
                    } else {
                        // Mount `HiGlassComponent` using this view config.
                        setViewConfig(newHiGlassSpec);
                    }
                    publishSpecProcessed(props);
                    publishOnNewView(newTracksAndViews);
                    prevSpec.current = newGoslingSpec;
                    tracksAndViews.current = newTracksAndViews;
                    idTable.current = newIdTable;
                },
                [...GoslingTemplates], // TODO: allow user definitions
                theme,
                {
                    containerSize: wrapperSize.current,
                    containerParentSize: wrapperParentSize.current
                },
                props.urlToFetchOptions
            );
        }
    }, [props.spec, theme]);

    // TODO: If not necessary, do not update `wrapperSize` (i.e., when responsiveSize is not set)
    useEffect(() => {
        if (!props.spec?.responsiveSize) return;

        const containerElement = document.getElementById(wrapperDivId);
        if (!containerElement) return;

        const resizer = new ResizeSensor(containerElement, newSize => {
            if (
                !wrapperSize.current ||
                wrapperSize.current.height !== newSize.height ||
                wrapperSize.current.width !== newSize.width
            ) {
                wrapperSize.current = newSize;
                compile();
            }
        });

        const parentElement = containerElement.parentElement;
        if (!parentElement) return;

        const parentResizer = new ResizeSensor(parentElement, newSize => {
            if (
                !wrapperParentSize.current ||
                wrapperParentSize.current.height !== newSize.height ||
                wrapperParentSize.current.width !== newSize.width
            ) {
                wrapperParentSize.current = newSize;
                compile();
            }
        });

        return () => {
            resizer.detach();
            parentResizer.detach();
        };
    });

    useEffect(() => {
        compile();
    }, [props.spec, theme]);

    const responsiveHeight =
        typeof props.spec?.responsiveSize !== 'object' ? props.spec?.responsiveSize : props.spec.responsiveSize.height;

    // HiGlass component should be mounted only once
    const higlassComponent = useMemo(
        () => (
            <HiGlassComponentWrapper
                ref={hgRef}
                viewConfig={viewConfig}
                size={size}
                id={wrapperDivId}
                className={props.className}
                options={{
                    padding: props.padding,
                    border: props.border,
                    margin: props.margin,
                    responsiveWidth:
                        typeof props.spec?.responsiveSize !== 'object'
                            ? props.spec?.responsiveSize
                            : props.spec.responsiveSize.width,
                    responsiveHeight,
                    background: theme.root.background,
                    alt: props.spec?.description
                }}
            />
        ),
        [viewConfig, size, theme, responsiveHeight]
    );

    return higlassComponent;
});

GoslingComponent.displayName = 'GoslingComponent';

/** Wraps the `.current` property of a React.RefObject as a readonly object. */
function refAsReadonlyProxy<T extends object>(ref: React.RefObject<T>): Readonly<T> {
    // Readonly because because we only implement `get`.
    return new Proxy({} as Readonly<T>, {
        get(_target, prop, reciever) {
            if (!ref.current) throw Error('ref is not set!');
            return Reflect.get(ref.current, prop, reciever);
        }
    });
}
