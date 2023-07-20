import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { RouteComponentProps } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import * as gosling from 'gosling.js';
import gfm from 'remark-gfm';
import PubSub from 'pubsub-js';
import fetchJsonp from 'fetch-jsonp';
import { drag as d3Drag } from 'd3-drag';
import type * as D3Drag from 'd3-drag';
import { select as d3Select } from 'd3-selection';
import stringify from 'json-stringify-pretty-compact';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { debounce, isEqual } from 'lodash-es';
import stripJsonComments from 'strip-json-comments';
import JSONCrush from 'jsoncrush';
import type { HiGlassSpec } from '@higlass.schema';
import type { Datum } from '@gosling.schema';
import { Themes } from 'gosling-theme';

import { ICONS, type ICON_INFO } from './icon';
import { getHtmlTemplate } from './html-template';
import ErrorBoundary from './error-boundary';
import { traverseTracksAndViews } from '../src/compiler/spec-preprocess';
import { examples, type Example } from './example';
import EditorPanel, { type EditorLangauge } from './EditorPanel';
import EditorExamples from './EditorExamples';

import './Editor.css';
import { v4 } from 'uuid';

function json2js(jsonCode: string) {
    return `var spec = ${jsonCode} \nexport { spec }; \n`;
}

function isJSON(str: string | null) {
    if (!str) return false;
    try {
        return JSON.parse(str);
    } catch (e) {
        return false;
    }
}

async function transpile(typescriptCode: string) {
    const { transpile, ScriptTarget } = await import('typescript');
    return transpile(typescriptCode, { target: ScriptTarget.ES2018 });
}

function toJavaScriptDataURI(jsCode: string) {
    return `data:text/javascript;base64, ${btoa(jsCode)}`;
}

const SHOWN_EXAMPLE_LIST = Object.entries(examples)
    .map(([k, v]) => {
        return { id: k, ...v };
    })
    .filter(d => !d.hidden);
const INIT_DEMO = SHOWN_EXAMPLE_LIST.find(d => d.forceShow) ?? SHOWN_EXAMPLE_LIST[0];

// Limit of the character length to allow copy to clipboard
const LIMIT_CLIPBOARD_LEN = 4096;

// ! these should be updated upon change in css files
const EDITOR_HEADER_HEIGHT = 40;
const BOTTOM_PANEL_HEADER_HEIGHT = 30;

// A key to store and get a Gosling spec via sessionStorage
const SESSION_KEY_SPEC = 'session-gosling-spec';

export const GoslingLogoSVG = (width: number, height: number) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width={width} height={height}>
        <rect style={{ fill: 'none' }} width="400" height="400" />
        <circle cx="110.62" cy="129.64" r="41.69" />
        <circle style={{ fill: '#fff' }} cx="124.14" cy="114.12" r="10.76" />
        <circle cx="288.56" cy="129.64" r="41.69" />
        <circle style={{ fill: '#fff' }} cx="302.07" cy="114.12" r="10.76" />
        <path
            style={{ fill: '#e18241' }}
            d="M313.1,241.64l8.61-22.09a430.11,430.11,0,0,0-88-15.87L224,225.63A384.54,384.54,0,0,1,313.1,241.64Z"
        />
        <path
            style={{ fill: '#e18241' }}
            d="M208.63,260.53a299.77,299.77,0,0,1,90.56,16.79L308,254.79a371.68,371.68,0,0,0-90-15.47Z"
        />
        <path
            style={{ fill: '#e18241' }}
            d="M174.4,225.56l-9-22a431.34,431.34,0,0,0-88,15.43l8.9,22A385.08,385.08,0,0,1,174.4,225.56Z"
        />
        <path
            style={{ fill: '#e18241' }}
            d="M100.71,276.35a300.51,300.51,0,0,1,87.91-15.82L180,239.29a372.51,372.51,0,0,0-88.3,14.76Z"
        />
        <path
            style={{ fill: '#e18241' }}
            d="M106.52,290.71c27.53,13.92,59.05,21.34,92.05,21.34h0c33.68,0,65.83-7.72,93.75-22.2a291.31,291.31,0,0,0-186.33-.4Z"
        />
    </svg>
);

const getIconSVG = (d: ICON_INFO, w?: number, h?: number, f?: string) => (
    <svg
        key={stringify(d)}
        xmlns="http://www.w3.org/2000/svg"
        width={w ?? d.width}
        height={h ?? d.height}
        viewBox={d.viewBox}
        strokeWidth="2"
        stroke={d.stroke}
        fill={f ?? d.fill}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {d.path.map(path => (
            <path key={path} d={path} />
        ))}
    </svg>
);

const emptySpec = (message?: string) => (message !== undefined ? `\n\t// ${message}\n` : '//empty spec');

const stringifySpec = (spec: string | gosling.GoslingSpec | undefined): string => {
    if (!spec) return '';
    else if (typeof spec === 'string') return spec;
    else return stringify(spec);
};

const validateExampleId = (id: string): boolean => {
    return examples[id] ? true : false;
};

const getDescPanelDefultWidth = () => Math.min(500, window.innerWidth);

/**
 * Convert relative CSV data URLs to absolute URLs.
 * (e.g., './example.csv' => 'https://gist.githubusercontent.com/{urlGist}/raw/example.csv')
 */
function resolveRelativeCsvUrls(spec: string, importMeta: URL) {
    const newSpec = JSON.parse(spec);
    // https://regex101.com/r/l87Q5q/1
    // eslint-disable-next-line
    const relativePathRegex = /^[.\/]|^\.[.\/]|^\.\.[^\/]/;
    traverseTracksAndViews(newSpec as gosling.GoslingSpec, (tv: any) => {
        if (tv.data && tv.data.type === 'csv' && relativePathRegex.test(tv.data.url)) {
            tv.data.url = new URL(tv.data.url, importMeta).href;
        }
    });
    return stringify(newSpec);
}

const fetchSpecFromGist = async (gist: string) => {
    let metadata: any = null;
    try {
        // Don't ask me why but due to CORS we need to treat the JSON as JSONP
        // which is not supported by the normal `fetch()` so we need `fetchJsonp()`
        const response = await fetchJsonp(`https://gist.github.com/${gist}.json`);
        metadata = await (response.ok ? response.json() : null);
    } catch (error) {
        return Promise.reject(new Error('Gist not found'));
    }

    if (!metadata) return Promise.reject(new Error('Gist not found'));

    const dataFile = metadata.files.find((file: any) => file.toLowerCase().startsWith('gosling.js'));
    const textFile = metadata.files.find((file: any) => file.toLowerCase().startsWith('readme.md'));

    if (!dataFile) return Promise.reject(new Error('Gist does not contain a Gosling spec.'));

    const specUrl = new URL(`https://gist.githubusercontent.com/${gist}/raw/${dataFile}`);
    const whenCode = fetch(specUrl.href).then(async response => (response.status === 200 ? response.text() : null));

    const whenText = fetch(`https://gist.githubusercontent.com/${gist}/raw/${textFile}`).then(response =>
        response.status === 200 ? response.text() : null
    );

    return Promise.all([whenCode, whenText]).then(([code, description]) => {
        let jsonCode: string, jsCode: string, language: EditorLangauge;
        if (!code) {
            language = 'json';
            jsCode = emptySpec('no content from the gist');
            jsonCode = emptySpec('no content from the gist');
        } else if (isJSON(code)) {
            language = 'json';
            jsonCode = resolveRelativeCsvUrls(code, specUrl);
            jsCode = json2js(jsonCode);
        } else {
            jsCode = code;
            jsonCode = emptySpec('compiling...'); // set json code later in dynamic import
            language = 'typescript';
        }
        return {
            code: jsonCode,
            jsCode,
            language,
            description,
            title: metadata.description
        };
    });
};

interface PreviewData {
    id: string;
    dataConfig: string;
    data: Datum[];
}

/**
 * React component for editing Gosling specs
 */
function Editor(props: RouteComponentProps) {
    // Determines whether the screen is too small (e.g., mobile)
    const IS_SMALL_SCREEN = window.innerWidth <= 500;

    // custom spec contained in the URL
    const urlParams = new URLSearchParams(props.location.search);
    const urlSpec = urlParams.has('spec') ? JSONCrush.uncrush(urlParams.get('spec')!) : null;
    const urlGist = urlParams.get('gist');
    const urlExampleId = urlParams.get('example') ?? '';

    // Spec stored in the tab session
    const sessionSpec = useMemo(() => {
        const sessionSpecStr = sessionStorage.getItem(SESSION_KEY_SPEC);
        return sessionSpecStr ? JSON.parse(sessionSpecStr) : null;
    }, []);

    const defaultCode =
        urlGist || urlExampleId
            ? emptySpec()
            : stringify(urlSpec ?? sessionSpec ?? (INIT_DEMO.spec as gosling.GoslingSpec));
    const defaultJsCode = urlGist || urlExampleId || !INIT_DEMO.specJs ? json2js(defaultCode) : INIT_DEMO.specJs;

    const previewData = useRef<PreviewData[]>([]);
    const [refreshData, setRefreshData] = useState<boolean>(false);
    const [language, changeLanguage] = useState<EditorLangauge>('json');

    const [demo, setDemo] = useState<Example>(
        examples[urlExampleId] ? { id: urlExampleId, ...examples[urlExampleId] } : INIT_DEMO
    );
    const [isImportDemo, setIsImportDemo] = useState<boolean>(false);
    const [theme, setTheme] = useState<gosling.Theme>('light');
    const [hg, setHg] = useState<HiGlassSpec>();
    const [code, setCode] = useState(defaultCode);
    const [jsCode, setJsCode] = useState(defaultJsCode); //[TO-DO: more js format examples]
    const [goslingSpec, setGoslingSpec] = useState<gosling.GoslingSpec>();
    const [log, setLog] = useState<ReturnType<typeof gosling.validateGoslingSpec>>({ message: '', state: 'success' });
    // const [mouseEventInfo, setMouseEventInfo] =
    //     useState<{ type: 'mouseOver' | 'click'; data: Datum[]; position: string }>();
    const [showExamples, setShowExamples] = useState<boolean>(false);
    const [autoRun, setAutoRun] = useState(true);
    const [selectedPreviewData, setSelectedPreviewData] = useState<number>(0);
    const [gistTitle, setGistTitle] = useState<string>();
    const [description, setDescription] = useState<string | null>();
    const [showViews, setShowViews] = useState(false);
    const [expertMode, setExpertMode] = useState(false);

    // This parameter only matter when a markdown description was loaded from a gist but the user wants to hide it
    const [hideDescription, setHideDescription] = useState<boolean>(IS_SMALL_SCREEN || false);

    // Determine the size of description panel
    const [descPanelWidth, setDescPanelWidth] = useState(getDescPanelDefultWidth());

    // whether to show HiGlass' viewConfig on the left-bottom
    const [showVC, setShowVC] = useState<boolean>(false);

    // whether the code editor is read-only
    const [readOnly, setReadOnly] = useState<boolean>(urlGist ? true : false);

    // whether to hide source code on the left
    const [isHideCode, setIsHideCode] = useState<boolean>(IS_SMALL_SCREEN || urlParams.get('full') === 'true' || false);

    // whether to show widgets for responsive window
    const [isResponsive, setIsResponsive] = useState<boolean>(true);
    const [screenSize, setScreenSize] = useState<undefined | { width: number; height: number }>();
    const [visibleScreenSize, setVisibleScreenSize] = useState<undefined | { width: number; height: number }>();

    // whether to show a find box
    const [isFindCode, setIsFindCode] = useState<boolean | undefined>(undefined);

    // whether to use larger or smaller font
    const [isFontZoomIn, setIsfontZoomIn] = useState<boolean | undefined>(undefined);
    const [isFontZoomOut, setIsfontZoomOut] = useState<boolean | undefined>(undefined);

    // whether description panel is being dragged
    const [isDescResizing, setIsDescResizing] = useState(false);

    // whether to show "about" information
    const [isShowAbout, setIsShowAbout] = useState(false);

    // API for split pane of the right panel
    const displayPanelRef = useRef<any>();

    // Resizer `div`
    const descResizerRef = useRef<any>();

    // Drag event for resizing description panel
    const dragX = useRef<any>();

    // for using HiGlass JS API
    // const hgRef = useRef<any>();
    const gosRef = useRef<gosling.GoslingRef>(null);

    const debounceCodeEdit = useRef(
        debounce((code: string, language: EditorLangauge) => {
            if (language == 'json') {
                setCode(code);
            } else {
                setJsCode(code);
            }
        }, 1500)
    );

    // publish event listeners to Gosling.js
    useEffect(() => {
        if (gosRef.current) {
            // gosRef.current.api.subscribe('rawdata', (type, data) => {
            // console.log('rawdata', data);
            // gosRef.current.api.zoomTo('bam-1', `chr${data.data.chr1}:${data.data.start1}-${data.data.end1}`, 2000);
            // gosRef.current.api.zoomTo('bam-2', `chr${data.data.chr2}:${data.data.start2}-${data.data.end2}`, 2000);
            // console.log('click', data.data);
            // TODO: show messages on the right-bottom of the editor
            // gosRef.current.api.subscribe('mouseOver', (type, eventData) => {
            //     console.warn(type, eventData.id, eventData.genomicPosition, eventData.data);
            //     // setMouseEventInfo({ type: 'mouseOver', data: eventData.data, position: eventData.genomicPosition });
            // });
            // gosRef.current.api.subscribe('click', (type, eventData) => {
            //     console.warn(type, eventData.id, eventData.genomicPosition, eventData.data);
            //     // setMouseEventInfo({ type: 'click', data: eventData.data, position: eventData.genomicPosition });
            // });
            // Range Select API
            // gosRef.current.api.subscribe('rangeSelect', (type, eventData) => {
            //     console.warn(type, eventData.id, eventData.genomicRange, eventData.data);
            // });
            // Mouse click on a track
            // gosRef.current.api.subscribe('trackClick', (type, eventData) => {
            //     console.warn(type, eventData.id, eventData.spec, eventData.shape);
            // });
        }
        return () => {
            // gosRef.current?.api.unsubscribe('mouseOver');
            // gosRef.current?.api.unsubscribe('click');
            // gosRef.current?.api.unsubscribe('rangeSelect');
            // gosRef.current?.api.unsubscribe('trackClick');
        };
    }, [gosRef.current]);

    /**
     * Editor mode
     */
    useEffect(() => {
        previewData.current = [];
        setSelectedPreviewData(0);
        if (isImportDemo) {
            const jsonCode = stringifySpec(demo.spec as gosling.GoslingSpec);
            setCode(jsonCode);
            setJsCode(demo.specJs ?? json2js(jsonCode));
        } else if (urlExampleId && !validateExampleId(urlExampleId)) {
            // invalida url example id
            setCode(emptySpec(`Example id "${urlExampleId}" does not exist.`));
            setJsCode(emptySpec(`Example id "${urlExampleId}" does not exist.`));
        } else if (urlSpec) {
            setCode(urlSpec);
            setJsCode(json2js(urlSpec));
        } else if (urlGist) {
            setCode(emptySpec('loading....'));
        } else if (sessionSpec) {
            setCode(stringify(sessionSpec));
            setJsCode(json2js(stringify(sessionSpec)));
        } else {
            const jsonCode = stringifySpec(demo.spec as gosling.GoslingSpec);
            setCode(jsonCode);
            setJsCode(demo.specJs ?? json2js(jsonCode));
        }
        setHg(undefined);
    }, [demo]);

    const deviceToResolution = {
        Auto: undefined,
        UHD: { width: 3840, height: 2160 },
        FHD: { width: 1920, height: 1080 },
        'Google Nexus Tablet': { width: 1024, height: 768 },
        'iPhone X': { width: 375, height: 812 }
    };

    const ResponsiveWidget = useMemo(() => {
        return (
            <div
                style={{
                    width: screenSize ? screenSize.width - 20 : 'calc(100% - 20px)',
                    background: 'white',
                    marginBottom: '6px',
                    padding: '10px',
                    height: '20px',
                    lineHeight: '20px'
                }}
            >
                <span
                    style={{
                        marginRight: 10,
                        color: 'gray',
                        verticalAlign: 'middle',
                        display: 'inline-block',
                        marginTop: '2px'
                    }}
                >
                    {getIconSVG(ICONS.SCREEN, 16, 16)}
                </span>
                <span className="screen-size-dropdown">
                    <select
                        style={{ width: '80px' }}
                        onChange={e => {
                            const device = e.target.value;
                            if (Object.keys(deviceToResolution).includes(device)) {
                                setScreenSize((deviceToResolution as any)[device]);
                                setVisibleScreenSize((deviceToResolution as any)[device]);
                            }
                        }}
                    >
                        {Object.keys(deviceToResolution).map(d => {
                            // separator (https://stackoverflow.com/questions/899148/html-select-option-separator)
                            if (d === '-') return <optgroup label="──────────"></optgroup>;
                            return (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            );
                        })}
                    </select>
                </span>
                <span style={{ marginLeft: '20px', visibility: screenSize ? 'visible' : 'collapse' }}>
                    <span style={{ marginRight: 10, color: '#EEBF4D' }}>{getIconSVG(ICONS.RULER, 12, 12)}</span>
                    <input
                        type="number"
                        min="350"
                        max="3000"
                        value={visibleScreenSize?.width}
                        onChange={e => {
                            const width = +e.target.value >= 350 ? +e.target.value : 350;
                            setVisibleScreenSize({ width: +e.target.value, height: screenSize?.height ?? 1000 });
                            setScreenSize({ width, height: screenSize?.height ?? 1000 });
                        }}
                    />
                    {' x '}
                    <input
                        type="number"
                        min="100"
                        max="3000"
                        value={visibleScreenSize?.height}
                        onChange={e => {
                            const height = +e.target.value >= 100 ? +e.target.value : 100;
                            setVisibleScreenSize({ width: screenSize?.width ?? 1000, height: +e.target.value });
                            setScreenSize({ width: screenSize?.width ?? 1000, height });
                        }}
                    />
                    <button
                        style={{
                            marginLeft: 10,
                            color: 'gray',
                            verticalAlign: 'middle',
                            display: 'inline-block',
                            marginTop: '2px',
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            setVisibleScreenSize({
                                width: visibleScreenSize?.height ?? 1000,
                                height: visibleScreenSize?.width ?? 1000
                            });
                            setScreenSize({ width: screenSize?.height ?? 1000, height: screenSize?.width ?? 1000 });
                        }}
                    >
                        {getIconSVG(ICONS.REPEAT, 20, 20)}
                    </button>
                </span>
            </div>
        );
    }, [screenSize]);

    useEffect(() => {
        let active = true;

        if (!urlGist || typeof urlGist !== 'string') return undefined;

        fetchSpecFromGist(urlGist)
            .then(({ code, jsCode, language, description, title }) => {
                if (active) {
                    setReadOnly(false);
                    setJsCode(jsCode);
                    setCode(code);
                    changeLanguage(language);
                    setGistTitle(title);
                    setDescription(description);
                }
            })
            .catch(error => {
                if (active) {
                    setReadOnly(false);
                    setCode(emptySpec(error));
                    setJsCode(emptySpec(error));
                    setDescription(undefined);
                    setGistTitle('Error loading gist! See code for details.');
                }
            });

        return () => {
            setReadOnly(false);
            active = false;
        };
    }, [urlGist]);

    const runSpecUpdateVis = useCallback(
        (run?: boolean) => {
            if (isEqual(emptySpec(), code) && isEqual(emptySpec(), jsCode)) {
                // this means we do not have to compile. This is when we are in the middle of loading data from gist.
                return;
            }

            let editedGos;
            let valid;

            if (language === 'json') {
                try {
                    editedGos = JSON.parse(stripJsonComments(code));
                    valid = gosling.validateGoslingSpec(editedGos);
                    setLog(valid);
                } catch (e) {
                    const message = '✘ Cannnot parse the code.';
                    console.warn(message);
                    setLog({ message, state: 'error' });
                }
                if (!editedGos || valid?.state !== 'success' || (!autoRun && !run)) return;

                setGoslingSpec(editedGos);
                sessionStorage.setItem(SESSION_KEY_SPEC, stringify(editedGos));
            } else if (language === 'typescript') {
                transpile(jsCode)
                    .then(toJavaScriptDataURI)
                    .then(uri => import(/* @vite-ignore */ uri))
                    .then(ns => {
                        const editedGos = ns.spec;
                        if (urlGist && !isImportDemo) {
                            setCode(stringifySpec(editedGos));
                        }
                        valid = gosling.validateGoslingSpec(editedGos);
                        setLog(valid);
                        if (!editedGos || valid?.state !== 'success' || (!autoRun && !run)) return;
                        setGoslingSpec(editedGos);
                        sessionStorage.setItem(SESSION_KEY_SPEC, stringify(editedGos));
                    })
                    .catch(e => {
                        const message = '✘ Cannnot parse the code.';
                        console.warn(message, e);
                        setLog({ message, state: 'error' });
                    });
            } else {
                setLog({ message: `${language} is not supported`, state: 'error' });
            }
        },
        [code, jsCode, autoRun, language, readOnly]
    );

    /**
     * Update theme of the editor based on the theme of Gosling visualizations
     */
    // useEffect(() => {
    //     const gosTheme = getTheme(goslingSpec?.theme);
    //     if (gosTheme.base !== theme) {
    //         setTheme(gosTheme.base);
    //     }
    // }, [goslingSpec]);

    /**
     * Things to do upon spec change
     */
    useEffect(() => {
        const newIsResponsive =
            typeof goslingSpec?.responsiveSize === 'undefined'
                ? false
                : typeof goslingSpec?.responsiveSize === 'boolean'
                ? goslingSpec?.responsiveSize === true
                : typeof goslingSpec?.responsiveSize === 'object'
                ? goslingSpec?.responsiveSize.width === true || goslingSpec?.responsiveSize.height === true
                : false;
        if (newIsResponsive !== isResponsive && newIsResponsive) {
            setScreenSize(undefined); // reset the screen
            setVisibleScreenSize(undefined);
        }
        setIsResponsive(newIsResponsive);
    }, [goslingSpec]);

    /**
     * Subscribe preview data that is being processed in the Gosling tracks.
     */
    useEffect(() => {
        // We want to show data preview in the editor.
        const token = PubSub.subscribe('data-preview', (_: string, data: PreviewData) => {
            // Data with different `dataConfig` is shown separately in data preview.
            const id = `${data.dataConfig}`;
            const newPreviewData = previewData.current.filter(d => d.id !== id);
            previewData.current = [...newPreviewData, { ...data, id }];
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    });

    /**
     * Render visualization when edited
     */
    useEffect(() => {
        previewData.current = [];
        setSelectedPreviewData(0);
        runSpecUpdateVis();
    }, [code, jsCode, autoRun, language, theme]);

    // Uncommnet below to use HiGlass APIs
    // useEffect(() => {
    //     if(hgRef.current) {
    //         hgRef.current.api.activateTool('select');
    //     }
    // }, [hg, hgRef]); // TODO: should `hg` be here?

    function getDataPreviewInfo(dataConfig: string) {
        // Detailed information of data config to show in the editor
        const dataConfigObj = JSON.parse(dataConfig);
        if (!dataConfigObj.data?.type) {
            // We do not have enough information
            return '';
        }

        let info = '';
        if (dataConfigObj.data) {
            Object.keys(dataConfigObj.data).forEach(key => {
                if (typeof dataConfigObj.data[key] === 'object') {
                    info += `${JSON.stringify(dataConfigObj.data[key])} | `;
                } else {
                    info += `${dataConfigObj.data[key]} | `;
                }
            });
        }

        return info.slice(0, info.length - 2);
    }

    // Set up the d3-drag handler functions (started, ended, dragged).
    const started = useCallback(
        (event: D3Drag.D3DragEvent<SVGElement, undefined, D3Drag.SubjectPosition>) => {
            if (!hideDescription) {
                // Drag is enabled only when the description panel is visible
                dragX.current = event.sourceEvent.clientX;
                setIsDescResizing(true);
            }
        },
        [dragX, descPanelWidth]
    );

    const dragged = useCallback(
        (event: D3Drag.D3DragEvent<SVGElement, undefined, D3Drag.SubjectPosition>) => {
            if (dragX.current) {
                const diff = event.sourceEvent.clientX - dragX.current;
                setDescPanelWidth(descPanelWidth - diff);
            }
        },
        [dragX, descPanelWidth]
    );

    const ended = useCallback(() => {
        dragX.current = null;
        setIsDescResizing(false);
    }, [dragX, descPanelWidth]);

    // Detect drag events for the resize element.
    useEffect(() => {
        const resizer = descResizerRef.current;

        const drag = d3Drag().on('start', started).on('drag', dragged).on('end', ended);

        d3Select(resizer).call(drag);

        return () => {
            d3Select(resizer).on('.drag', null);
        };
    }, [descResizerRef, started, dragged, ended]);

    function openDescription() {
        setDescPanelWidth(getDescPanelDefultWidth());
        setHideDescription(false);
    }

    function closeDescription() {
        setHideDescription(true);
    }

    // Layers to be shown on top of the Gosling visualization to show the hiererchy of Gosling views and tracks
    const VisHierarchy = useMemo(() => {
        const tracksAndViews = gosRef.current?.api.getTracksAndViews();
        const maxHeight = Math.max(...(tracksAndViews?.map(d => d.shape.height) ?? []));
        return (
            <div style={{ position: 'absolute', top: '60px', left: '60px', height: maxHeight, pointerEvents: 'none' }}>
                {tracksAndViews
                    ?.sort(a => (a.type === 'track' ? 1 : -1))
                    ?.map(d => {
                        let { x: left, y: top, width, height } = d.shape;
                        let background = 'rgba(255, 50, 50, 0.3)';
                        if (d.type === 'view') {
                            const VIEW_PADDING = 3;
                            left -= VIEW_PADDING;
                            top -= VIEW_PADDING;
                            width += VIEW_PADDING * 2;
                            height += VIEW_PADDING * 2;
                            background = 'rgba(50, 50, 255, 0.1)';
                        }
                        return (
                            <div
                                key={v4()}
                                style={{
                                    position: 'absolute',
                                    border: '1px solid black',
                                    background,
                                    left,
                                    top,
                                    width,
                                    height
                                }}
                            />
                        );
                    })}
            </div>
        );
    }, [hg, demo]);

    // console.log('editor.render()');
    return (
        <>
            <div
                className={`demo-navbar ${theme === 'dark' ? 'dark' : ''}`}
                // To test APIs, uncomment the following code.
                // onClick={() => {
                //     if (!gosRef.current) return;
                // // ! Be aware that the first view is for the title/subtitle track. So navigation API does not work.
                // const id = gosRef.current.api.getViewIds()?.[1]; //'view-1';
                // if(id) {
                //     gosRef.current.api.zoomToExtent(id);
                // }
                //
                // // Static visualization rendered in canvas
                // const { canvas } = gosRef.current.api.getCanvas({
                //     resolution: 1,
                //     transparentBackground: true,
                // });
                // const testDiv = document.getElementById('preview-container');
                // if(canvas && testDiv) {
                //     testDiv.appendChild(canvas);
                // }
                // }}
            >
                <button
                    style={{ cursor: 'pointer', lineHeight: '40px' }}
                    onClick={() => window.open(`${window.location.pathname}`, '_blank')}
                >
                    <span className="logo">{GoslingLogoSVG(20, 20)}</span>
                    Gosling.js Editor
                </button>
                {urlSpec && <small> Displaying a custom spec contained in URL</small>}
                {gistTitle && !IS_SMALL_SCREEN && (
                    <>
                        <span className="gist-title">{gistTitle}</span>
                        <button
                            title="Open GitHub Gist"
                            style={{ marginLeft: 10 }}
                            className="description-github-button"
                            onClick={() => window.open(`https://gist.github.com/${urlGist}`, '_blank')}
                        >
                            {getIconSVG(ICONS.UP_RIGHT, 14, 14)}
                        </button>
                    </>
                )}
                <button className="demo-label" onClick={() => setShowExamples(true)}>
                    <b>{demo.group}</b>: {demo.name}
                </button>
                {/* <span className="demo-dropdown" hidden={urlSpec !== null || urlGist !== null || urlExampleId !== ''}>
                    <select
                        style={{ maxWidth: IS_SMALL_SCREEN ? window.innerWidth - 180 : 'none' }}
                        onChange={e => {
                            setDemo({ id: e.target.value, ...examples[e.target.value] } as any);
                        }}
                        value={demo.id}
                    >
                        {SHOWN_EXAMPLE_LIST.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.name + (d.underDevelopment ? ' (under development)' : '')}
                            </option>
                        ))}
                    </select>
                </span> */}
                {expertMode ? (
                    <select
                        style={{ maxWidth: IS_SMALL_SCREEN ? window.innerWidth - 180 : 'none' }}
                        onChange={e => {
                            if (Object.keys(Themes).indexOf(e.target.value) !== -1) {
                                setTheme(e.target.value as any);
                            }
                        }}
                        defaultValue={theme as any}
                    >
                        {Object.keys(Themes).map((d: string) => (
                            <option key={d} value={d}>
                                {`Theme: ${d}`}
                            </option>
                        ))}
                    </select>
                ) : null}
                {demo.underDevelopment ? (
                    <span
                        style={{
                            paddingLeft: 12,
                            fontStyle: 'normal',
                            fontSize: 13
                        }}
                    >
                        🚧 This example is under development 🚧
                    </span>
                ) : null}
                <input type="hidden" id="spec-url-exporter" />
                <a
                    href="http://gosling-lang.org/"
                    title="Go to the Gosling Project"
                    className="mr-1"
                    target="_blank"
                    rel="noreferrer"
                >
                    Gosling Project
                </a>
                {description ? (
                    <button title="Open Textual Description" className="description-button" onClick={openDescription}>
                        {getIconSVG(ICONS.INFO_CIRCLE, 23, 23)}
                    </button>
                ) : null}
            </div>
            {/* ------------------------ Main View ------------------------ */}
            <div className={`editor ${theme === 'dark' ? 'dark' : ''}`}>
                <Allotment vertical={false}>
                    <Allotment.Pane minSize={50} maxSize={50}>
                        <div className={`side-panel ${theme === 'dark' ? 'dark' : ''}`}>
                            <button
                                title="Example Gallery"
                                className="side-panel-button"
                                onClick={() => setShowExamples(!showExamples)}
                            >
                                {showExamples ? getIconSVG(ICONS.GRID, 20, 20, '#E18343') : getIconSVG(ICONS.GRID)}
                                <br />
                                EXAMPLE
                            </button>
                            <button
                                title="Automatically update visualization upon editing code"
                                className="side-panel-button"
                                onClick={() => setAutoRun(!autoRun)}
                            >
                                {autoRun
                                    ? getIconSVG(ICONS.TOGGLE_ON, 23, 23, '#E18343')
                                    : getIconSVG(ICONS.TOGGLE_OFF, 23, 23)}
                                <br />
                                AUTO
                                <br />
                                RUN
                            </button>
                            <button
                                title="Run Code"
                                className="side-panel-button"
                                onClick={() => runSpecUpdateVis(true)}
                            >
                                {getIconSVG(ICONS.PLAY, 23, 23)}
                                <br />
                                RUN
                            </button>
                            <button
                                title="Find"
                                className="side-panel-button"
                                onClick={() => {
                                    setIsFindCode(!isFindCode);
                                }}
                            >
                                {getIconSVG(ICONS.FIND, 23, 23)}
                                <br />
                                FIND
                            </button>
                            <span title="Change Font Size" className="side-panel-button">
                                {getIconSVG(ICONS.TEXT, 23, 23)}
                                <br />
                                FONT SIZE
                                <span className="side-subpanel">
                                    <button
                                        title="Use Larger Font"
                                        className="side-subpanel-button"
                                        onClick={() => {
                                            setIsfontZoomIn(!isFontZoomIn);
                                        }}
                                    >
                                        {getIconSVG(ICONS.TEXT, 23, 23)}
                                        +
                                        <br />
                                        LARGER
                                    </button>
                                    <button
                                        title="Use Larger Font"
                                        className="side-subpanel-button"
                                        onClick={() => {
                                            setIsfontZoomOut(!isFontZoomOut);
                                        }}
                                    >
                                        {getIconSVG(ICONS.TEXT, 15, 15)}
                                        -
                                        <br />
                                        SMALLER
                                    </button>
                                </span>
                            </span>

                            <button
                                title="Show or hide a code panel"
                                className="side-panel-button"
                                onClick={() => setIsHideCode(!isHideCode)}
                            >
                                {getIconSVG(ICONS.SPLIT, 23, 23)}
                                <br />
                                LAYOUT
                            </button>
                            <button
                                title="Show or hide a data preview"
                                className="side-panel-button"
                                onClick={() => displayPanelRef.current?.resize([1, 1])}
                            >
                                {getIconSVG(ICONS.TABLE, 23, 23)}
                                <br />
                                DATA
                                <br />
                                PREVIEW
                            </button>

                            <span title="Export" className="side-panel-button">
                                {getIconSVG(ICONS.UP_RIGHT, 23, 23)}
                                <br />
                                EXPORT
                                <span className="side-subpanel">
                                    <button
                                        title="Save PNG file"
                                        className="side-subpanel-button"
                                        onClick={() => {
                                            gosRef.current?.api.exportPng();
                                        }}
                                    >
                                        {getIconSVG(ICONS.IMAGE, 23, 23)}
                                        <br />
                                        PNG
                                    </button>
                                    <button
                                        title="Save PDF file"
                                        className="side-subpanel-button"
                                        onClick={() => {
                                            gosRef.current?.api.exportPdf();
                                        }}
                                    >
                                        {getIconSVG(ICONS.PDF, 23, 23)}
                                        <br />
                                        PDF
                                    </button>
                                    <button
                                        title="Save HTML file"
                                        className="side-subpanel-button"
                                        onClick={() => {
                                            // TODO (05-02-2022): Release a support of `responsiveSize` on `.embed()` first
                                            const spec = {
                                                ...goslingSpec,
                                                responsiveSize: false
                                            } as gosling.GoslingSpec;

                                            const a = document.createElement('a');
                                            a.setAttribute(
                                                'href',
                                                `data:text/plain;charset=utf-8,${encodeURIComponent(
                                                    getHtmlTemplate(stringifySpec(spec))
                                                )}`
                                            );
                                            a.download = 'gosling-visualization.html';
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                        }}
                                    >
                                        {getIconSVG(ICONS.HTML, 23, 23)}
                                    </button>
                                    <button
                                        title={
                                            stringifySpec(goslingSpec).length <= LIMIT_CLIPBOARD_LEN
                                                ? `Copy unique URL of current view to clipboard (limit: ${LIMIT_CLIPBOARD_LEN} characters)`
                                                : `The current code contains characters more than ${LIMIT_CLIPBOARD_LEN}`
                                        }
                                        className={
                                            stringifySpec(goslingSpec).length <= LIMIT_CLIPBOARD_LEN
                                                ? 'side-subpanel-button'
                                                : 'side-subpanel-button side-subpanel-button-not-active'
                                        }
                                        onClick={() => {
                                            if (stringifySpec(goslingSpec).length <= LIMIT_CLIPBOARD_LEN) {
                                                // copy the unique url to clipboard using `<input/>`
                                                const crushedSpec = encodeURIComponent(
                                                    JSONCrush.crush(stringifySpec(goslingSpec))
                                                );
                                                const url = `${window.location.origin}${window.location.pathname}?full=${isHideCode}&spec=${crushedSpec}`;

                                                navigator.clipboard
                                                    .writeText(url)
                                                    .then(() =>
                                                        // eslint-disable-next-line no-alert
                                                        alert(
                                                            `URL of the current visualization is copied to your clipboard! `
                                                        )
                                                    )
                                                    .catch(
                                                        // eslint-disable-next-line no-alert
                                                        e => alert(`something went wrong ${e}`)
                                                    );
                                            }
                                        }}
                                    >
                                        {getIconSVG(ICONS.LINK, 23, 23)}
                                        <br />
                                        SAVE
                                        <br />
                                        URL
                                    </button>
                                </span>
                            </span>
                            <button
                                title="Automatically update visualization upon editing code"
                                className="side-panel-button"
                                onClick={() => setShowViews(!showViews)}
                                disabled={isResponsive}
                            >
                                {showViews
                                    ? getIconSVG(ICONS.TOGGLE_ON, 23, 23, isResponsive ? 'lightgrey' : '#E18343')
                                    : getIconSVG(ICONS.TOGGLE_OFF, 23, 23, isResponsive ? 'lightgrey' : undefined)}
                                <br />
                                SHOW
                                <br />
                                VIEWS
                            </button>
                            <button
                                title="Expert mode that turns on additional features, such as theme selection"
                                className="side-panel-button"
                                onClick={() => setExpertMode(!expertMode)}
                            >
                                {expertMode
                                    ? getIconSVG(ICONS.TOGGLE_ON, 23, 23, '#E18343')
                                    : getIconSVG(ICONS.TOGGLE_OFF)}
                                <br />
                                EXPERT
                                <br />
                                MODE
                            </button>
                            <button
                                title="Open GitHub repository"
                                className="side-panel-button"
                                onClick={() => window.open('https://github.com/gosling-lang/gosling.js', '_blank')}
                            >
                                {getIconSVG(ICONS.GITHUB, 23, 23)}
                                <br />
                                GITHUB
                            </button>
                            <button
                                title="Open Docs"
                                className="side-panel-button"
                                onClick={() => window.open('http://gosling-lang.org/docs/', '_blank')}
                            >
                                {getIconSVG(ICONS.DOCS, 23, 23)}
                                <br />
                                DOCS
                            </button>
                            <button
                                title="About"
                                className="side-panel-button"
                                onClick={() => setIsShowAbout(!isShowAbout)}
                            >
                                {getIconSVG(ICONS.INFO_RECT_FILLED, 23, 23)}
                                <br />
                                ABOUT
                            </button>
                        </div>
                    </Allotment.Pane>
                    <Allotment vertical={false} defaultSizes={[4, 6]}>
                        <Allotment.Pane visible={!isHideCode}>
                            <Allotment
                                vertical={true}
                                onChange={sizes => {
                                    const secondSize = window.innerHeight - EDITOR_HEADER_HEIGHT - sizes[0];
                                    if (secondSize > BOTTOM_PANEL_HEADER_HEIGHT && !showVC) {
                                        setShowVC(true);
                                    } else if (secondSize <= BOTTOM_PANEL_HEADER_HEIGHT && showVC) {
                                        // hide the viewConfig view when no enough space assigned
                                        setShowVC(false);
                                    }
                                }}
                            >
                                {/* Gosling Editor */}
                                <>
                                    <div className="tabEditor">
                                        <div className="tab">
                                            <button
                                                className={`tablinks ${language == 'json' && 'active'}`}
                                                onClick={() => {
                                                    changeLanguage('json');
                                                    setLog({ message: '', state: 'success' });
                                                }}
                                            >
                                                JSON {` `}
                                                <span className="tooltip">
                                                    {getIconSVG(ICONS.INFO_CIRCLE, 10, 10)}
                                                    <span className="tooltiptext">
                                                        In this JSON editor, the whole JSON object will be used to
                                                        create Gosling visualizations.
                                                    </span>
                                                </span>
                                            </button>
                                            <button
                                                className={`tablinks ${language == 'typescript' && 'active'}`}
                                                onClick={() => {
                                                    changeLanguage('typescript');
                                                    setLog({ message: '', state: 'success' });
                                                }}
                                            >
                                                JavaScript{` `}
                                                <span className="tooltip">
                                                    {getIconSVG(ICONS.INFO_CIRCLE, 10, 10)}
                                                    <span className="tooltiptext">
                                                        In this JavaScript Editor, the variable{` `}
                                                        <code style={{ backgroundColor: '#e18343' }}>spec</code> will be
                                                        used to create Gosling visualizations.
                                                    </span>
                                                </span>
                                            </button>
                                        </div>

                                        <div className={`tabContent ${language == 'json' ? 'show' : 'hide'}`}>
                                            <EditorPanel
                                                code={code}
                                                readOnly={readOnly}
                                                openFindBox={isFindCode}
                                                fontZoomIn={isFontZoomIn}
                                                fontZoomOut={isFontZoomOut}
                                                onChange={debounceCodeEdit.current}
                                                isDarkTheme={theme === 'dark'}
                                                language="json"
                                            />
                                        </div>
                                        <div className={`tabContent ${language == 'typescript' ? 'show' : 'hide'}`}>
                                            <EditorPanel
                                                code={jsCode}
                                                readOnly={readOnly}
                                                openFindBox={isFindCode}
                                                fontZoomIn={isFontZoomIn}
                                                fontZoomOut={isFontZoomOut}
                                                onChange={debounceCodeEdit.current}
                                                isDarkTheme={theme === 'dark'}
                                                language="typescript"
                                            />
                                        </div>
                                    </div>
                                    <div className={`compile-message compile-message-${log.state}`}>{log.message}</div>
                                </>
                                {/* HiGlass View Config */}
                                <Allotment.Pane preferredSize={BOTTOM_PANEL_HEADER_HEIGHT}>
                                    <div className={`editor-header ${theme === 'dark' ? 'dark' : ''}`}>
                                        Compiled HiGlass ViewConfig (Read Only)
                                    </div>
                                    <div style={{ height: '100%', visibility: showVC ? 'visible' : 'hidden' }}>
                                        <EditorPanel
                                            code={stringify(hg)}
                                            readOnly={true}
                                            isDarkTheme={theme === 'dark'}
                                            language="json"
                                        />
                                    </div>
                                </Allotment.Pane>
                            </Allotment>
                        </Allotment.Pane>
                        <ErrorBoundary>
                            <Allotment ref={displayPanelRef} vertical={true}>
                                <div
                                    id="preview-container"
                                    className={`preview-container ${theme === 'dark' ? 'dark' : ''}`}
                                >
                                    {isResponsive && !IS_SMALL_SCREEN ? ResponsiveWidget : null}
                                    <div
                                        style={{
                                            width: isResponsive && screenSize?.width ? screenSize.width : '100%',
                                            height:
                                                isResponsive && screenSize?.height
                                                    ? screenSize.height
                                                    : 'calc(100% - 50px)',
                                            background: isResponsive ? 'white' : 'none'
                                        }}
                                    >
                                        <gosling.GoslingComponent
                                            ref={gosRef}
                                            spec={goslingSpec}
                                            theme={theme}
                                            padding={60}
                                            margin={0}
                                            border={'none'}
                                            id={'goslig-component-root'}
                                            className={'goslig-component'}
                                            experimental={{ reactive: true }}
                                            compiled={(_, h) => {
                                                setHg(h);
                                            }}
                                        />
                                        {showViews && !isResponsive ? VisHierarchy : null}
                                    </div>
                                    {/* {expertMode && false ? (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    right: '2px',
                                                    bottom: '2px',
                                                    padding: '20px',
                                                    background: '#FAFAFAAA',
                                                    border: '1px solid black'
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold' }}>
                                                    {`${mouseEventInfo?.data.length} Marks Selected By Mouse ${
                                                        mouseEventInfo?.type === 'click' ? 'Click' : 'Over'
                                                    }`}
                                                </div>
                                                <div style={{}}>{`The event occurs at ${mouseEventInfo?.position}`}</div>
                                                <table>
                                                    {mouseEventInfo?.data && mouseEventInfo?.data.length !== 0
                                                        ? Object.entries(mouseEventInfo?.data[0]).map(([k, v]) => (
                                                            <tr key={k}>
                                                                <td>{k}</td>
                                                                <td>{v}</td>
                                                            </tr>
                                                        ))
                                                        : null}
                                                </table>
                                            </div>
                                        ) : null} */}
                                </div>
                                <Allotment.Pane
                                    preferredSize={BOTTOM_PANEL_HEADER_HEIGHT}
                                    minSize={BOTTOM_PANEL_HEADER_HEIGHT}
                                >
                                    <button
                                        className={`editor-header ${theme === 'dark' ? 'dark' : ''}`}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Data Preview (~100 Rows, Data Before Transformation)
                                    </button>
                                    <div className="editor-data-preview-panel">
                                        <button
                                            title="Refresh preview data"
                                            className="data-preview-refresh-button"
                                            onClick={() => setRefreshData(!refreshData)}
                                        >
                                            {getIconSVG(ICONS.REFRESH, 23, 23)}
                                            <br />
                                            {'REFRESH DATA'}
                                        </button>
                                        {previewData.current.length > selectedPreviewData &&
                                        previewData.current[selectedPreviewData] &&
                                        previewData.current[selectedPreviewData].data.length > 0 ? (
                                            <>
                                                <div className="editor-data-preview-tab">
                                                    {previewData.current.map((d: PreviewData, i: number) => (
                                                        <button
                                                            className={
                                                                i === selectedPreviewData
                                                                    ? 'selected-tab'
                                                                    : 'unselected-tab'
                                                            }
                                                            key={JSON.stringify(d)}
                                                            onClick={() => setSelectedPreviewData(i)}
                                                        >
                                                            {`${(
                                                                JSON.parse(d.dataConfig).data.type as string
                                                            ).toLocaleLowerCase()} `}
                                                            <small>{i}</small>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="editor-data-preview-tab-info">
                                                    {getDataPreviewInfo(
                                                        previewData.current[selectedPreviewData].dataConfig
                                                    )}
                                                </div>
                                                <div className="editor-data-preview-table">
                                                    <table>
                                                        <tbody>
                                                            <tr>
                                                                {Object.keys(
                                                                    previewData.current[selectedPreviewData].data[0]
                                                                ).map((field: string, i: number) => (
                                                                    <th key={i}>{field}</th>
                                                                ))}
                                                            </tr>
                                                            {previewData.current[selectedPreviewData].data.map(
                                                                (row: Datum, i: number) => (
                                                                    <tr key={i}>
                                                                        {Object.keys(row).map(
                                                                            (field: string, j: number) => (
                                                                                <td key={j}>
                                                                                    {row[field]?.toString()}
                                                                                </td>
                                                                            )
                                                                        )}
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                </Allotment.Pane>
                            </Allotment>
                        </ErrorBoundary>
                    </Allotment>
                </Allotment>
                {/* Description Panel */}
                <div
                    className={`description ${hideDescription ? '' : 'description-shadow '}${
                        isDescResizing ? '' : 'description-transition'
                    } ${theme === 'dark' ? 'dark' : ''}`}
                    style={{ width: !description || hideDescription ? 0 : descPanelWidth }}
                >
                    <div
                        className={hideDescription ? 'description-resizer-disabled' : 'description-resizer'}
                        ref={descResizerRef}
                    />
                    <div className="description-wrapper">
                        <header>
                            <button className="hide-description-button" onClick={closeDescription}>
                                Close
                            </button>
                            <br />
                            <br />
                            <button
                                title="Open GitHub Gist"
                                className="description-github-button"
                                onClick={() => window.open(`https://gist.github.com/${urlGist}`, '_blank')}
                            >
                                {getIconSVG(ICONS.UP_RIGHT, 14, 14)} Open GitHub Gist to see raw files.
                            </button>
                        </header>
                        {description && <ReactMarkdown plugins={[gfm]}>{description}</ReactMarkdown>}
                    </div>
                </div>
                {/* About Modal View */}
                <button
                    className={isShowAbout ? 'about-modal-container' : 'about-modal-container-hidden'}
                    onClick={() => setIsShowAbout(false)}
                ></button>
                <div className={isShowAbout ? 'about-modal' : 'about-modal-hidden'}>
                    <button
                        className="about-model-close-button"
                        onClick={() => {
                            setIsShowAbout(false);
                        }}
                    >
                        {getIconSVG(ICONS.CLOSE, 30, 30)}
                    </button>
                    <div>
                        <span className="logo">{GoslingLogoSVG(80, 80)}</span>
                    </div>
                    <h3>Gosling.js Editor</h3>
                    {`Gosling.js v${gosling.version}`}
                    <br />
                    <br />
                    <a
                        href="https://github.com/gosling-lang/gosling.js/blob/master/CHANGELOG.md"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Change Log
                    </a>
                    <br />
                    <br />
                    <a
                        href="https://github.com/gosling-lang/gosling.js/blob/master/LICENSE.md"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        MIT License
                    </a>
                    <br />
                    <br />
                    <h4>Team</h4>
                    <span>
                        Sehi L&apos;Yi (
                        <a href="https://twitter.com/sehi_lyi" target="_blank" rel="noopener noreferrer">
                            @sehi_lyi
                        </a>
                        )
                        <br />
                        Qianwen Wang (
                        <a href="https://twitter.com/WangQianwenToo" target="_blank" rel="noopener noreferrer">
                            @WangQianwenToo
                        </a>
                        )
                        <br />
                        Fritz Lekschas (
                        <a href="https://twitter.com/flekschas" target="_blank" rel="noopener noreferrer">
                            @flekschas
                        </a>
                        )
                        <br />
                        Nils Gehlenborg (
                        <a href="https://twitter.com/gehlenborg" target="_blank" rel="noopener noreferrer">
                            @gehlenborg
                        </a>
                        )
                    </span>
                    <br />
                    <br />
                    <a href="http://gehlenborglab.org/" target="_blank" rel="noopener noreferrer">
                        Gehlenborg Lab
                    </a>
                    , Harvard Medical School
                </div>
            </div>
            {/* ---------------------- Example Gallery -------------------- */}
            <button
                className={showExamples ? 'about-modal-container' : 'about-modal-container-hidden'}
                onClick={() => setShowExamples(false)}
            />
            {showExamples && (
                <EditorExamples
                    setShowExamples={setShowExamples}
                    closeDescription={closeDescription}
                    setIsImportDemo={setIsImportDemo}
                    setDemo={setDemo}
                />
            )}
        </>
    );
}
export default Editor;
