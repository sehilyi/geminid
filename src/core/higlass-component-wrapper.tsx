/* eslint-disable react/prop-types */
import * as PIXI from 'pixi.js';
import React, { useEffect, useState, forwardRef, useMemo } from 'react';
import uuid from 'uuid';

import * as gosling from '..';
// @ts-ignore
import { HiGlassComponent } from 'higlass';
import { HiGlassSpec } from './higlass.schema';

/**
 * Register plugin tracks and data fetchers to HiGlass. This is necessary for the first time before using Gosling.
 */
gosling.init();

// TODO: Complete the API
export type HiGlassApi = {
    api: Record<string, any>;
    pixiRenderer: PIXI.Renderer;
    pixiStage: PIXI.IRenderableObject;
};

export interface HiGlassComponentWrapperProps {
    size: { width: number; height: number };
    viewConfig?: HiGlassSpec;
    options: {
        padding?: number;
        margin?: number | string;
        border?: string;
        background?: string;
    };
    id?: string;
    className?: string;
}

export const HiGlassComponentWrapper = forwardRef<HiGlassApi | undefined, HiGlassComponentWrapperProps>(
    (props, ref) => {
        // div `id` and `className` for detailed customization
        const [wrapperDivId, setWrapperDivId] = useState(props.id ?? uuid.v4());
        useEffect(() => {
            setWrapperDivId(props.id ?? uuid.v4());
        }, [props.id]);

        const viewConfig = props.viewConfig || {};
        const higlassComponent = useMemo(
            () => (
                <HiGlassComponent
                    ref={ref}
                    options={{
                        pixelPreciseMarginPadding: true, // this uses `rowHeight: 1` in react-grid-layout
                        containerPaddingX: 0,
                        containerPaddingY: 0,
                        viewMarginTop: 0,
                        viewMarginBottom: 0,
                        viewMarginLeft: 0,
                        viewMarginRight: 0,
                        viewPaddingTop: 0,
                        viewPaddingBottom: 0,
                        viewPaddingLeft: 0,
                        viewPaddingRight: 0,
                        sizeMode: 'overflow',
                        bounded: false, // deprecated option
                        rangeSelectionOnAlt: true // this allows switching between `selection` and `zoom&pan` mode
                    }}
                    viewConfig={viewConfig}
                />
            ),
            [viewConfig]
        );

        // Styling
        const { padding = 60, margin = 0, border = 'none', background } = props.options || {};
        return (
            <>
                <div
                    id={wrapperDivId}
                    className={`gosling-component ${props.className || ''}`}
                    style={{
                        position: 'relative',
                        padding: padding,
                        margin: margin,
                        border: border,
                        background: background,
                        width: props.size.width + padding * 2,
                        height: props.size.height + padding * 2,
                        textAlign: 'left'
                    }}
                >
                    <div
                        key={JSON.stringify(viewConfig)}
                        id="higlass-wrapper"
                        className="higlass-wrapper"
                        style={{
                            position: 'relative',
                            display: 'block',
                            background: background,
                            margin: 0,
                            padding: 0, // non-zero padding acts unexpectedly w/ HiGlassComponent
                            width: props.size.width,
                            height: props.size.height
                        }}
                        // onClick={(e) => {
                        //     PubSub.publish('gosling.click', {
                        //         mouseX: e.pageX - (document.getElementById('higlass-wrapper')?.offsetLeft ?? 0),
                        //         mouseY: e.pageY - (document.getElementById('higlass-wrapper')?.offsetTop ?? 0)
                        //     });
                        // }}
                    >
                        {higlassComponent}
                    </div>
                </div>
            </>
        );
    }
);

HiGlassComponentWrapper.displayName = 'HiGlassComponentWrapper';
