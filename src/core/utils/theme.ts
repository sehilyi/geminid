// @ts-ignore
import * as gt from 'gosling-theme';
import { assign } from 'lodash';
import { CHANNEL_DEFAULTS } from '../channel';

/* ----------------------------- THEME ----------------------------- */
export type Theme = ThemeType | ThemeDeep;
export type ThemeType = 'light' | 'dark' | string;
export enum Themes {
    light = 'light',
    dark = 'dark'
}

export interface ThemeDeep {
    base: ThemeType;

    root?: RootStyle;
    track?: TrackStyle;
    legend?: LegendStyle;
    axis?: AxisStyle;

    // Mark-Specific Styles
    markCommon?: MarkStyle;
    point?: MarkStyle;
    rect?: MarkStyle;
    triangle?: MarkStyle;
    area?: MarkStyle;
    line?: MarkStyle;
    bar?: MarkStyle;
    rule?: MarkStyle;
    link?: MarkStyle;
    brush?: MarkStyle;
    text?: MarkStyle & {
        textFontWeight?: 'bold' | 'normal';
        textAnchor?: 'start' | 'middle' | 'end';
    };
}

// TODO: Better way to implement deep `Required` type instead of having two separate interfaces, i.e., CompleteThemeDeep and ThemeDeep
export interface CompleteThemeDeep {
    base: Required<ThemeType>;

    root: Required<RootStyle>;
    track: Required<TrackStyle>;
    legend: Required<LegendStyle>;
    axis: Required<AxisStyle>;

    // Mark-Specific
    markCommon: Required<MarkStyle>;
    point: Required<MarkStyle>;
    rect: Required<MarkStyle>;
    triangle: Required<MarkStyle>;
    area: Required<MarkStyle>;
    line: Required<MarkStyle>;
    bar: Required<MarkStyle>;
    rule: Required<MarkStyle>;
    link: Required<MarkStyle>;
    brush: Required<MarkStyle>;
    text: Required<MarkStyle> &
        Required<{
            textFontWeight?: 'bold' | 'normal';
            textAnchor?: 'start' | 'middle' | 'end';
        }>;
}

export interface RootStyle {
    background?: string;
    titleColor?: string;
    titleFontSize?: number;
    titleFontFamily?: string;
    titleAlign?: 'left' | 'middle' | 'right';
    titleFontWeight?: 'bold' | 'normal' | 'light';
    titleBackgroundColor?: string;
    subtitleColor?: string;
    subtitleFontSize?: number;
    subtitleFontFamily?: string;
    subtitleAlign?: 'left' | 'middle' | 'right';
    subtitleFontWeight?: 'bold' | 'normal' | 'light';
    subtitleBackgroundColor?: string;
    showMousePosition?: boolean;
    mousePositionColor?: string;
}

export interface TrackStyle {
    background?: string;
    alternatingBackground?: string; // used to fill all even rows
    titleColor?: string;
    titleBackground?: string;
    titleFontSize?: number;
    titleAlign?: 'left' | 'middle' | 'right';
    outline?: string;
    outlineWidth?: number;
    // ...
}

export interface LegendStyle {
    position?: 'top' | 'right'; // TODO: support bottom and left, and even all corners (e.g., top-left, bottom-right, etc)
    tickColor?: string;
    labelColor?: string;
    labelFontSize?: number;
    labelFontWeight?: 'bold' | 'normal' | 'light';
    labelFontFamily?: string;
    background?: string;
    backgroundOpacity?: number;
    backgroundStroke?: string;
    // ...
}

export interface AxisStyle {
    tickColor?: string;
    labelColor?: string;
    labelFontSize?: number;
    labelFontWeight?: 'bold' | 'normal' | 'light';
    labelFontFamily?: string;
    baselineColor?: string;
    gridColor?: string;
    gridStrokeWidth?: number;
    gridStrokeType?: 'solid' | 'dashed';
    gridStrokeDash?: [number, number];
    // ...
}

export interface MarkStyle {
    color?: string;
    size?: number;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;

    nominalColorRange?: string[];
    quantitativeSizeRange?: [number, number];
    // ...
}

// TODO: Instead of calling this function everytime, create a JSON object and use it throughout the project.
export function getTheme(theme: Theme = 'light'): Required<CompleteThemeDeep> {
    if (typeof theme === 'string') {
        if (gt.isThereTheme(theme)) {
            return JSON.parse(JSON.stringify(gt.getTheme(theme)));
        } else if (theme === 'dark' || theme === 'light') {
            return THEMES[theme];
        } else {
            return THEMES['light'];
        }
    } else {
        // Iterate all keys to override from base
        let baseSpec = JSON.parse(JSON.stringify(THEMES['light']));
        if (gt.isThereTheme(theme.base)) {
            baseSpec = JSON.parse(JSON.stringify(gt.getTheme(theme.base)));
        } else if (theme.base === 'light' || theme.base === 'dark') {
            baseSpec = JSON.parse(JSON.stringify(THEMES[theme.base]));
        }
        // Override defaults from `base`
        Object.keys(baseSpec).forEach(k => {
            if ((theme as any)[k] && k !== 'base') {
                baseSpec[k] = assign(
                    JSON.parse(JSON.stringify(baseSpec[k])),
                    JSON.parse(JSON.stringify((theme as any)[k]))
                );
            }
        });
        return baseSpec;
    }
}

const LightThemeMarkCommonStyle: Required<MarkStyle> = {
    color: CHANNEL_DEFAULTS.NOMINAL_COLOR[0],
    size: 1,
    stroke: 'black',
    strokeWidth: 0,
    opacity: 1,
    nominalColorRange: CHANNEL_DEFAULTS.NOMINAL_COLOR,
    quantitativeSizeRange: [2, 6]
};

const DarkThemeMarkCommonStyle: Required<MarkStyle> = { ...LightThemeMarkCommonStyle, stroke: 'white' };

/* ----------------------------- THEME PRESETS ----------------------------- */
export const THEMES: { [key in Themes]: Required<CompleteThemeDeep> } = {
    light: {
        base: 'light',

        root: {
            background: 'white',
            titleColor: 'black',
            titleBackgroundColor: 'transparent',
            titleFontSize: 18,
            titleFontFamily: 'Arial',
            titleAlign: 'left',
            titleFontWeight: 'bold',
            subtitleColor: 'gray',
            subtitleBackgroundColor: 'transparent',
            subtitleFontSize: 16,
            subtitleFontFamily: 'Arial',
            subtitleFontWeight: 'normal',
            subtitleAlign: 'left',
            showMousePosition: true,
            mousePositionColor: '#000000'
        },

        track: {
            background: 'transparent',
            alternatingBackground: 'transparent',
            titleColor: 'black',
            titleBackground: 'white',
            titleFontSize: 24,
            titleAlign: 'left',
            outline: 'black',
            outlineWidth: 1
        },

        legend: {
            position: 'top',
            background: 'white',
            backgroundOpacity: 0.7,
            labelColor: 'black',
            labelFontSize: 12,
            labelFontWeight: 'normal',
            labelFontFamily: 'Arial',
            backgroundStroke: '#DBDBDB',
            tickColor: 'black'
        },

        axis: {
            tickColor: 'black',
            labelColor: 'black',
            labelFontSize: 12,
            labelFontWeight: 'normal',
            labelFontFamily: 'Arial',
            baselineColor: 'black',
            gridColor: '#E3E3E3',
            gridStrokeWidth: 1,
            gridStrokeType: 'solid',
            gridStrokeDash: [4, 4]
        },

        markCommon: {
            ...LightThemeMarkCommonStyle
        },
        point: {
            ...LightThemeMarkCommonStyle,
            size: 3
        },
        rect: {
            ...LightThemeMarkCommonStyle
        },
        triangle: {
            ...LightThemeMarkCommonStyle
        },
        area: {
            ...LightThemeMarkCommonStyle
        },
        line: {
            ...LightThemeMarkCommonStyle
        },
        bar: {
            ...LightThemeMarkCommonStyle
        },
        rule: {
            ...LightThemeMarkCommonStyle,
            strokeWidth: 1
        },
        link: {
            ...LightThemeMarkCommonStyle,
            strokeWidth: 1
        },
        text: {
            ...LightThemeMarkCommonStyle,
            textAnchor: 'middle',
            textFontWeight: 'normal'
        },
        brush: {
            ...LightThemeMarkCommonStyle,
            color: 'gray',
            opacity: 0.3,
            stroke: 'black',
            strokeWidth: 1
        }
    },
    dark: {
        base: 'dark',

        root: {
            background: 'black',
            titleColor: 'white',
            titleBackgroundColor: 'transparent',
            titleFontSize: 18,
            titleFontFamily: 'Arial',
            titleAlign: 'middle',
            titleFontWeight: 'bold',
            subtitleColor: 'lightgray',
            subtitleBackgroundColor: 'transparent',
            subtitleFontSize: 16,
            subtitleFontFamily: 'Arial',
            subtitleAlign: 'middle',
            subtitleFontWeight: 'normal',
            showMousePosition: true,
            mousePositionColor: '#FFFFFF'
        },

        track: {
            background: 'transparent',
            alternatingBackground: 'transparent',
            titleColor: 'white',
            titleBackground: 'black',
            titleFontSize: 18,
            titleAlign: 'left',
            outline: 'white',
            outlineWidth: 1
        },

        legend: {
            position: 'right',
            background: 'black',
            backgroundOpacity: 0.7,
            labelColor: 'white',
            labelFontSize: 12,
            labelFontWeight: 'normal',
            labelFontFamily: 'Arial',
            backgroundStroke: '#DBDBDB',
            tickColor: 'white'
        },

        axis: {
            tickColor: 'white',
            labelColor: 'white',
            labelFontSize: 10,
            labelFontWeight: 'normal',
            labelFontFamily: 'Arial',
            baselineColor: 'white',
            gridColor: 'gray',
            gridStrokeWidth: 1,
            gridStrokeType: 'solid',
            gridStrokeDash: [4, 4]
        },

        markCommon: {
            ...DarkThemeMarkCommonStyle
        },
        point: {
            ...DarkThemeMarkCommonStyle,
            size: 3
        },
        rect: {
            ...DarkThemeMarkCommonStyle
        },
        triangle: {
            ...DarkThemeMarkCommonStyle
        },
        area: {
            ...DarkThemeMarkCommonStyle
        },
        line: {
            ...DarkThemeMarkCommonStyle
        },
        bar: {
            ...DarkThemeMarkCommonStyle
        },
        rule: {
            ...DarkThemeMarkCommonStyle,
            strokeWidth: 1
        },
        link: {
            ...DarkThemeMarkCommonStyle,
            strokeWidth: 1
        },
        text: {
            ...DarkThemeMarkCommonStyle,
            textAnchor: 'middle',
            textFontWeight: 'normal'
        },
        brush: {
            ...DarkThemeMarkCommonStyle,
            color: 'lightgray',
            opacity: 0.3,
            stroke: 'white',
            strokeWidth: 1
        }
    }
};
