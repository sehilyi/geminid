import * as gosling from 'gosling.js';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import PubSub from 'pubsub-js';
import fetchJsonp from 'fetch-jsonp';
import EditorPanel from './editor-panel';
import { drag as d3Drag } from 'd3-drag';
import { event as d3Event } from 'd3-selection';
import { select as d3Select } from 'd3-selection';
import stringify from 'json-stringify-pretty-compact';
import SplitPane from 'react-split-pane';
import ErrorBoundary from './error-boundary';
import { debounce, isEqual } from 'lodash-es';
import { ExampleGroups, examples } from './example';
import { traverseTracksAndViews } from '../src/core/utils/spec-preprocess';
import stripJsonComments from 'strip-json-comments';
import * as qs from 'qs';
import JSONCrush from 'jsoncrush';
import './editor.css';
import { ICONS, ICON_INFO } from './icon';
import type { HiGlassSpec } from '@higlass.schema';
import type { Datum } from '@gosling.schema';
import * as ts from 'typescript';
// @ts-ignore
import { Themes } from 'gosling-theme';

function json2js(jsonCode: string) {
    return `var spec=${jsonCode}`;
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

const emptySpec = (message?: string) => (message !== undefined ? `{\n\t// ${message}\n}` : '{}');

const stringifySpec = (spec: string | gosling.GoslingSpec): string => {
    if (typeof spec === 'string') return spec;
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
    const whenCode = fetch(specUrl.href).then(async response =>
        response.status === 200 ? resolveRelativeCsvUrls(await response.text(), specUrl) : null
    );

    const whenText = fetch(`https://gist.githubusercontent.com/${gist}/raw/${textFile}`).then(response =>
        response.status === 200 ? response.text() : null
    );

    return Promise.all([whenCode, whenText]).then(([code, description]) => ({
        code,
        description,
        title: metadata.description
    }));
};

interface PreviewData {
    id: string;
    dataConfig: string;
    data: Datum[];
}

/**
 * React component for editing Gosling specs
 */
function Editor(props: any) {
    // Determines whether the screen is too small (e.g., mobile)
    const IS_SMALL_SCREEN = window.innerWidth <= 500;

    // custom spec contained in the URL
    const urlParams = qs.parse(props.location.search, { ignoreQueryPrefix: true });
    const urlSpec = urlParams?.spec ? JSONCrush.uncrush(urlParams.spec as string) : null;
    const urlGist = urlParams?.gist ?? null;
    const urlExampleId = (urlParams?.example ?? '') as string;

    const defaultCode = urlGist ? emptySpec() : stringify(urlSpec ?? (INIT_DEMO.spec as gosling.GoslingSpec));

    const defaultJsCode = INIT_DEMO.specJs ?? json2js(defaultCode);

    const previewData = useRef<PreviewData[]>([]);
    const [refreshData, setRefreshData] = useState<boolean>(false);
    const [language, changeLanguage] = useState<string>('json');

    const [demo, setDemo] = useState(
        examples[urlExampleId] ? { id: urlExampleId, ...examples[urlExampleId] } : INIT_DEMO
    );
    const [theme, setTheme] = useState<gosling.Theme>('light');
    const [hg, setHg] = useState<HiGlassSpec>();
    const [code, setCode] = useState(defaultCode);
    const [jsCode, setJsCode] = useState(defaultJsCode); //[TO-DO: more js format examples]
    const [goslingSpec, setGoslingSpec] = useState<gosling.GoslingSpec>();
    const [log, setLog] = useState<ReturnType<typeof gosling.validateGoslingSpec>>({ message: '', state: 'success' });
    const [showExamples, setShowExamples] = useState(false);
    const [autoRun, setAutoRun] = useState(true);
    const [selectedPreviewData, setSelectedPreviewData] = useState<number>(0);
    const [gistTitle, setGistTitle] = useState<string>();
    const [description, setDescription] = useState<string | null>();
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
    const [isHideCode, setIsHideCode] = useState<boolean>(
        IS_SMALL_SCREEN || (urlParams?.full as string) === 'true' || false
    );

    // whether to show widgets for responsive window
    const [isResponsive, setIsResponsive] = useState<boolean>(true);
    const [screenSize, setScreenSize] = useState<undefined | { width: number; height: number }>();
    const [visibleScreenSize, setVisibleScreenSize] = useState<undefined | { width: number; height: number }>();

    // whether to show data preview on the right-bottom
    const [isShowDataPreview, setIsShowDataPreview] = useState<boolean>(false);

    // whether to show a find box
    const [isFindCode, setIsFindCode] = useState<boolean | undefined>(undefined);

    // whether to use larger or smaller font
    const [isFontZoomIn, setIsfontZoomIn] = useState<boolean | undefined>(undefined);
    const [isFontZoomOut, setIsfontZoomOut] = useState<boolean | undefined>(undefined);

    // whether description panel is being dragged
    const [isDescResizing, setIsDescResizing] = useState(false);

    // whether to show "about" information
    const [isShowAbout, setIsShowAbout] = useState(false);

    // Resizer `div`
    const descResizerRef = useRef<any>();

    // Drag event for resizing description panel
    const dragX = useRef<any>();

    // for using HiGlass JS API
    // const hgRef = useRef<any>();
    const gosRef = useRef<any>();

    const debounceCodeEdit = useRef(
        debounce((code: string, language) => {
            if (language == 'json') {
                setCode(code);
            } else {
                setJsCode(code);
            }
        }, 1500)
    );

    // publish event listeners to Gosling.js
    useEffect(() => {
        // if (gosRef.current) {
        //    gosRef.current.api.subscribe('rawdata', (type: string, data: RawDataEventData) => {
        //        console.log('rawdata', data);
        //    });
        //     gosRef.current.api.subscribe('click', (type: string, data: CommonEventData) => {
        //         gosRef.current.api.zoomTo('bam-1', `chr${data.data.chr1}:${data.data.start1}-${data.data.end1}`, 2000);
        //         gosRef.current.api.zoomTo('bam-2', `chr${data.data.chr2}:${data.data.start2}-${data.data.end2}`, 2000);
        //         console.log('click', data.data);
        //     });
        // }
        // return () => {
        //     gosRef.current.api.unsubscribe('rawdata');
        // }
    }, [gosRef.current]);

    /**
     * Editor mode
     */
    useEffect(() => {
        previewData.current = [];
        setSelectedPreviewData(0);
        if (urlExampleId && !validateExampleId(urlExampleId)) {
            // invalida url example id
            setCode(emptySpec(`Example id "${urlExampleId}" does not exist.`));
            setJsCode(emptySpec(`Example id "${urlExampleId}" does not exist.`));
        } else if (urlSpec) {
            setCode(urlSpec);
            setJsCode(json2js(urlSpec));
        } else if (urlGist) {
            setCode(emptySpec());
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
                        {[...Object.keys(deviceToResolution)].map(d =>
                            d !== '-' ? (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ) : (
                                // separator (https://stackoverflow.com/questions/899148/html-select-option-separator)
                                <optgroup label="──────────"></optgroup>
                            )
                        )}
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
                    <span
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
                    </span>
                </span>
            </div>
        );
    }, [screenSize]);

    useEffect(() => {
        let active = true;

        if (!urlGist || typeof urlGist !== 'string') return undefined;

        fetchSpecFromGist(urlGist)
            .then(({ code, description, title }) => {
                if (active && !!code) {
                    setReadOnly(false);
                    setCode(code);
                    setCode(json2js(code));
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
            if (isEqual(emptySpec(), code)) {
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
            } else if (language === 'javascript') {
                try {
                    const transplieCode = ts.transpile(jsCode);
                    editedGos = window.Function(`${transplieCode}\n return spec`)();
                    valid = gosling.validateGoslingSpec(editedGos);
                    setLog(valid);
                } catch (e) {
                    const message = '✘ Cannnot parse the code.';
                    console.warn(message);
                    setLog({ message, state: 'error' });
                }
            } else {
                setLog({ message: `${language} is not supported`, state: 'error' });
            }

            if (!editedGos || valid?.state !== 'success' || (!autoRun && !run)) return;

            setGoslingSpec(editedGos);
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
    }, [code, jsCode, autoRun, theme]);

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
    const started = useCallback(() => {
        if (!hideDescription) {
            // Drag is enabled only when the description panel is visible
            dragX.current = d3Event.sourceEvent.clientX;
            setIsDescResizing(true);
        }
    }, [dragX, descPanelWidth]);

    const dragged = useCallback(() => {
        if (dragX.current) {
            const diff = d3Event.sourceEvent.clientX - dragX.current;
            setDescPanelWidth(descPanelWidth - diff);
        }
    }, [dragX, descPanelWidth]);

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

    // console.log('editor.render()');
    return (
        <>
            <div
                className={`demo-navbar ${theme === 'dark' ? 'dark' : ''}`}
                onClick={() => {
                    if (!gosRef.current) return;

                    // To test APIs, uncomment the following code.
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
                }}
            >
                <span
                    style={{ cursor: 'pointer', lineHeight: '40px' }}
                    onClick={() => window.open('https://gosling.js.org', '_blank')}
                >
                    <span className="logo">{GoslingLogoSVG(20, 20)}</span>
                    Gosling.js Editor
                </span>
                {urlSpec && <small> Displaying a custom spec contained in URL</small>}
                {gistTitle && !IS_SMALL_SCREEN && (
                    <>
                        <span className="gist-title">{gistTitle}</span>
                        <span
                            title="Open GitHub Gist"
                            style={{ marginLeft: 10 }}
                            className="description-github-button"
                            onClick={() => window.open(`https://gist.github.com/${urlGist}`, '_blank')}
                        >
                            {getIconSVG(ICONS.UP_RIGHT, 14, 14)}
                        </span>
                    </>
                )}
                <span className="demo-label" onClick={() => setShowExamples(true)}>
                    <b>{demo.group}</b>: {demo.name}
                </span>
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
                                {d}
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
                {description ? (
                    <span title="Open Textual Description" className="description-button" onClick={openDescription}>
                        {getIconSVG(ICONS.INFO_CIRCLE, 23, 23)}
                    </span>
                ) : null}
            </div>
            {/* ------------------------ Main View ------------------------ */}
            <div className={`editor ${theme === 'dark' ? 'dark' : ''}`}>
                <SplitPane className="side-panel-spliter" split="vertical" defaultSize="50px" allowResize={false}>
                    <div className={`side-panel ${theme === 'dark' ? 'dark' : ''}`}>
                        <span
                            title="Example Gallery"
                            className="side-panel-button"
                            onClick={() => setShowExamples(!showExamples)}
                        >
                            {showExamples ? getIconSVG(ICONS.GRID, 20, 20, '#E18343') : getIconSVG(ICONS.GRID)}
                            <br />
                            EXAMPLE
                        </span>
                        <span
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
                        </span>
                        <span title="Run Code" className="side-panel-button" onClick={() => runSpecUpdateVis(true)}>
                            {getIconSVG(ICONS.PLAY, 23, 23)}
                            <br />
                            RUN
                        </span>
                        <span
                            title="Find"
                            className="side-panel-button"
                            onClick={() => {
                                setIsFindCode(!isFindCode);
                            }}
                        >
                            {getIconSVG(ICONS.FIND, 23, 23)}
                            <br />
                            FIND
                        </span>
                        <span
                            title="Use Larger Font"
                            className="side-panel-button"
                            onClick={() => {
                                setIsfontZoomIn(!isFontZoomIn);
                            }}
                        >
                            {getIconSVG(ICONS.TEXT, 23, 23)}
                            +
                            <br />
                            LARGER
                        </span>
                        <span
                            title="Use Larger Font"
                            className="side-panel-button"
                            onClick={() => {
                                setIsfontZoomOut(!isFontZoomOut);
                            }}
                        >
                            {getIconSVG(ICONS.TEXT, 15, 15)}
                            -
                            <br />
                            SMALLER
                        </span>
                        <span
                            title="Show or hide a code panel"
                            className="side-panel-button"
                            onClick={() => setIsHideCode(!isHideCode)}
                        >
                            {getIconSVG(ICONS.SPLIT, 23, 23)}
                            <br />
                            LAYOUT
                        </span>
                        <span
                            title="Show or hide a data preview"
                            className="side-panel-button"
                            onClick={() => setIsShowDataPreview(!isShowDataPreview)}
                        >
                            {getIconSVG(ICONS.TABLE, 23, 23)}
                            <br />
                            DATA
                            <br />
                            PREVIEW
                        </span>
                        <span
                            title="Save PNG file"
                            className="side-panel-button"
                            onClick={() => {
                                gosRef.current.api.exportPng();
                            }}
                        >
                            {getIconSVG(ICONS.IMAGE, 23, 23)}
                            <br />
                            PNG
                        </span>
                        <span
                            title="Save PDF file"
                            className="side-panel-button"
                            onClick={() => {
                                gosRef.current.api.exportPdf();
                            }}
                        >
                            {getIconSVG(ICONS.PDF, 23, 23)}
                            <br />
                            PDF
                        </span>
                        <span
                            title={
                                code.length <= LIMIT_CLIPBOARD_LEN
                                    ? `Copy unique URL of current view to clipboard (limit: ${LIMIT_CLIPBOARD_LEN} characters)`
                                    : `The current code contains characters more than ${LIMIT_CLIPBOARD_LEN}`
                            }
                            className={
                                code.length <= LIMIT_CLIPBOARD_LEN
                                    ? 'side-panel-button'
                                    : 'side-panel-button side-panel-button-not-active'
                            }
                            onClick={() => {
                                if (code.length <= LIMIT_CLIPBOARD_LEN) {
                                    // copy the unique url to clipboard using `<input/>`
                                    const crushedSpec = encodeURIComponent(JSONCrush.crush(code));
                                    const url = `https://gosling-lang.github.io/gosling.js/?full=${isHideCode}&spec=${crushedSpec}`;
                                    const element = document.getElementById('spec-url-exporter');
                                    (element as any).type = 'text';
                                    (element as any).value = url;
                                    (element as any).select();
                                    document.execCommand('copy');
                                    (element as any).type = 'hidden';
                                }
                            }}
                        >
                            {getIconSVG(ICONS.LINK, 23, 23)}
                            <br />
                            SAVE
                            <br />
                            URL
                        </span>
                        <span
                            title="Expert mode that turns on additional features, such as theme selection"
                            className="side-panel-button"
                            onClick={() => setExpertMode(!expertMode)}
                        >
                            {expertMode ? getIconSVG(ICONS.TOGGLE_ON, 23, 23, '#E18343') : getIconSVG(ICONS.TOGGLE_OFF)}
                            <br />
                            EXPERT
                            <br />
                            MODE
                        </span>
                        <span
                            title="Open GitHub repository"
                            className="side-panel-button"
                            onClick={() => window.open('https://github.com/gosling-lang/gosling.js', '_blank')}
                        >
                            {getIconSVG(ICONS.GITHUB, 23, 23)}
                            <br />
                            GITHUB
                        </span>
                        <span
                            title="Open Docs"
                            className="side-panel-button"
                            onClick={() => window.open('http://gosling-lang.org/docs/', '_blank')}
                        >
                            {getIconSVG(ICONS.DOCS, 23, 23)}
                            <br />
                            DOCS
                        </span>
                        <span title="About" className="side-panel-button" onClick={() => setIsShowAbout(!isShowAbout)}>
                            {getIconSVG(ICONS.INFO_RECT_FILLED, 23, 23)}
                            <br />
                            ABOUT
                        </span>
                    </div>
                    <SplitPane
                        split="vertical"
                        defaultSize={'calc(40%)'}
                        size={isHideCode ? '0px' : 'calc(40%)'}
                        minSize="0px"
                    >
                        <SplitPane
                            split="horizontal"
                            defaultSize={`calc(100% - ${BOTTOM_PANEL_HEADER_HEIGHT}px)`}
                            maxSize={window.innerHeight - EDITOR_HEADER_HEIGHT - BOTTOM_PANEL_HEADER_HEIGHT}
                            onChange={(size: number) => {
                                const secondSize = window.innerHeight - EDITOR_HEADER_HEIGHT - size;
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
                                            JSON
                                        </button>
                                        <button
                                            className={`tablinks ${language == 'javascript' && 'active'}`}
                                            onClick={() => {
                                                changeLanguage('javascript');
                                                setLog({ message: '', state: 'success' });
                                            }}
                                        >
                                            Javascript
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
                                    <div className={`tabContent ${language == 'javascript' ? 'show' : 'hide'}`}>
                                        <EditorPanel
                                            code={jsCode}
                                            readOnly={readOnly}
                                            openFindBox={isFindCode}
                                            fontZoomIn={isFontZoomIn}
                                            fontZoomOut={isFontZoomOut}
                                            onChange={debounceCodeEdit.current}
                                            isDarkTheme={theme === 'dark'}
                                            // language="javascript"
                                            language="typescript"
                                        />
                                    </div>
                                </div>
                                <div className={`compile-message compile-message-${log.state}`}>{log.message}</div>
                            </>
                            {/* HiGlass View Config */}
                            <SplitPane split="vertical" defaultSize="100%">
                                <>
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
                                </>
                                {/**
                                 * TODO: This is only for showing a scroll view for the higlass view config editor
                                 * Remove the below line and the nearest SplitPane after figuring out a better way
                                 * of showing the scroll view.
                                 */}
                                <></>
                            </SplitPane>
                        </SplitPane>
                        <ErrorBoundary>
                            <SplitPane
                                split="horizontal"
                                defaultSize={`calc(100% - ${BOTTOM_PANEL_HEADER_HEIGHT}px)`}
                                size={isShowDataPreview ? '40%' : `calc(100% - ${BOTTOM_PANEL_HEADER_HEIGHT}px)`}
                                maxSize={window.innerHeight - EDITOR_HEADER_HEIGHT - BOTTOM_PANEL_HEADER_HEIGHT}
                            >
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
                                            compiled={(g, h) => {
                                                setHg(h);
                                            }}
                                        />
                                    </div>
                                </div>
                                <SplitPane split="vertical" defaultSize="100%">
                                    <>
                                        <div
                                            className={`editor-header ${theme === 'dark' ? 'dark' : ''}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setIsShowDataPreview(!isShowDataPreview)}
                                        >
                                            Data Preview (~100 Rows, Data Before Transformation)
                                        </div>
                                        <div className="editor-data-preview-panel">
                                            <div
                                                title="Refresh preview data"
                                                className="data-preview-refresh-button"
                                                onClick={() => setRefreshData(!refreshData)}
                                            >
                                                {getIconSVG(ICONS.REFRESH, 23, 23)}
                                                <br />
                                                {'REFRESH DATA'}
                                            </div>
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
                                    </>
                                    {/**
                                     * TODO: This is only for showing a scroll view for the higlass view config editor
                                     * Remove the below line and the nearest SplitPane after figuring out a better way
                                     * of showing the scroll view.
                                     */}
                                    <></>
                                </SplitPane>
                            </SplitPane>
                        </ErrorBoundary>
                    </SplitPane>
                </SplitPane>
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
                            <span
                                title="Open GitHub Gist"
                                className="description-github-button"
                                onClick={() => window.open(`https://gist.github.com/${urlGist}`, '_blank')}
                            >
                                {getIconSVG(ICONS.UP_RIGHT, 14, 14)} Open GitHub Gist to see raw files.
                            </span>
                        </header>
                        {description && <ReactMarkdown plugins={[gfm]} source={description} />}
                    </div>
                </div>
                {/* About Modal View */}
                <div
                    className={isShowAbout ? 'about-modal-container' : 'about-modal-container-hidden'}
                    onClick={() => setIsShowAbout(false)}
                ></div>
                <div className={isShowAbout ? 'about-modal' : 'about-modal-hidden'}>
                    <span
                        className="about-model-close-button"
                        onClick={() => {
                            setIsShowAbout(false);
                        }}
                    >
                        {getIconSVG(ICONS.CLOSE, 30, 30)}
                    </span>
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
            <div
                className={showExamples ? 'about-modal-container' : 'about-modal-container-hidden'}
                onClick={() => setShowExamples(false)}
            />
            <div
                className="example-gallery-container"
                style={{
                    visibility: showExamples ? 'visible' : 'collapse'
                }}
            >
                <div
                    className="example-gallery-sidebar"
                    style={{
                        opacity: showExamples ? 1 : 0
                    }}
                >
                    {ExampleGroups.filter(_ => _.name !== 'Doc' && _.name !== 'Unassigned').map(group => {
                        return (
                            <>
                                <a className="siderbar-group" key={group.name} href={`#${group.name}`}>
                                    {group.name}
                                </a>
                                {Object.entries(examples)
                                    .filter(d => !d[1].hidden)
                                    .filter(d => d[1].group === group.name)
                                    .map(d => (
                                        <a key={d[1].name} href={`#${d[1].group}_${d[1].name}`}>
                                            {d[1].name}
                                        </a>
                                    ))}
                            </>
                        );
                    })}
                </div>
                <div
                    className="example-gallery"
                    style={{
                        opacity: showExamples ? 1 : 0
                    }}
                >
                    <h1>Gosling.js Examples</h1>
                    {ExampleGroups.filter(_ => _.name !== 'Doc' && _.name !== 'Unassigned').map(group => {
                        return (
                            <>
                                <h2 id={`${group.name}`}>{group.name}</h2>
                                <h5>{group.description}</h5>
                                <div className="example-group" key={group.name}>
                                    {Object.entries(examples)
                                        .filter(d => !d[1].hidden)
                                        .filter(d => d[1].group === group.name)
                                        .map(d => {
                                            return (
                                                <div
                                                    id={`${d[1].group}_${d[1].name}`}
                                                    title={d[1].name}
                                                    key={d[0]}
                                                    className="example-card"
                                                    onClick={() => {
                                                        setShowExamples(false);
                                                        setDemo({ id: d[0], ...examples[d[0]] } as any);
                                                    }}
                                                >
                                                    <div
                                                        className="example-card-bg"
                                                        style={{
                                                            backgroundImage: d[1].image ? `url(${d[1].image})` : 'none'
                                                        }}
                                                    />
                                                    <div className="example-card-name">{d[1].name}</div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </>
                        );
                    })}
                    {/* Just an margin on the bottom */}
                    <div style={{ height: '40px' }}></div>
                </div>
            </div>
        </>
    );
}
export default Editor;
