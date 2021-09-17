import * as gosling from '../';
import React, { useRef, useState, useEffect, useCallback } from 'react';
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
import { Datum, GoslingSpec } from '../core/gosling.schema';
import { debounce, isEqual } from 'lodash';
import { examples } from './example';
import { HiGlassSpec } from '../core/higlass.schema';
import GoslingSchema from '../../schema/gosling.schema.json';
import { validateSpec, Validity } from '../core/utils/validate';
import stripJsonComments from 'strip-json-comments';
import * as qs from 'qs';
import { JSONCrush, JSONUncrush } from '../core/utils/json-crush';
import './editor.css';
import { ICONS, ICON_INFO } from './icon';
// @ts-ignore
import { Themes } from 'gosling-theme';
import { Theme } from '../core/utils/theme';

const INIT_DEMO_INDEX = examples.findIndex(d => d.forceShow) !== -1 ? examples.findIndex(d => d.forceShow) : 0;

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

const getDescPanelDefultWidth = () => Math.min(500, window.innerWidth);

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

    const whenCode = fetch(`https://gist.githubusercontent.com/${gist}/raw/${dataFile}`).then(response =>
        response.status === 200 ? response.text() : null
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
    const urlSpec = urlParams?.spec ? JSONUncrush(urlParams.spec as string) : null;
    const urlGist = urlParams?.gist ?? null;
    const urlExampleIndex = urlParams?.example
        ? examples.map(d => d.id).indexOf(urlParams.example as string)
        : INIT_DEMO_INDEX;

    const defaultCode = urlGist ? emptySpec() : stringify(urlSpec ?? (examples[INIT_DEMO_INDEX].spec as GoslingSpec));

    const previewData = useRef<PreviewData[]>([]);
    const [refreshData, setRefreshData] = useState<boolean>(false);

    const [demo, setDemo] = useState(examples[urlExampleIndex === -1 ? INIT_DEMO_INDEX : urlExampleIndex]);
    const [theme, setTheme] = useState<Theme | undefined>('light');
    const [hg, setHg] = useState<HiGlassSpec>();
    const [code, setCode] = useState(defaultCode);
    const [goslingSpec, setGoslingSpec] = useState<gosling.GoslingSpec>();
    const [log, setLog] = useState<Validity>({ message: '', state: 'success' });
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
        debounce((code: string) => {
            setCode(code);
        }, 1500)
    );

    // publish event listeners to Gosling.js
    useEffect(() => {
        // if (gosRef.current) {
        //     gosRef.current.api.subscribe('mouseover', (/*_: CommonEventData*/) => {
        //         // console.log('mouseover', _);
        //     });
        //     gosRef.current.api.subscribe('click', (type: string, data: CommonEventData) => {
        //         gosRef.current.api.zoomTo('bam-1', `chr${data.data.chr1}:${data.data.start1}-${data.data.end1}`, 2000);
        //         gosRef.current.api.zoomTo('bam-2', `chr${data.data.chr2}:${data.data.start2}-${data.data.end2}`, 2000);
        //         console.log('click', data.data);
        //     });
        // }
        // return () => {
        //     gosRef.current.api.unsubscribe('click');
        // }
    }, [gosRef.current]);

    /**
     * Editor mode
     */
    useEffect(() => {
        previewData.current = [];
        setSelectedPreviewData(0);
        setCode(urlSpec ?? (urlGist ? emptySpec() : stringify(demo.spec as GoslingSpec)));
        setHg(undefined);
        setTheme(demo.theme ?? 'light');
    }, [demo]);

    useEffect(() => {
        let active = true;

        if (!urlGist || typeof urlGist !== 'string') return undefined;

        fetchSpecFromGist(urlGist)
            .then(({ code, description, title }) => {
                if (active && !!code) {
                    setReadOnly(false);
                    setCode(code);
                    setGistTitle(title);
                    setDescription(description);
                }
            })
            .catch(error => {
                if (active) {
                    setReadOnly(false);
                    setCode(emptySpec(error));
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
            try {
                editedGos = JSON.parse(stripJsonComments(code));
                valid = validateSpec(GoslingSchema, editedGos);
                setLog(valid);
            } catch (e) {
                const message = '✘ Cannnot parse the code.';
                console.warn(message);
                setLog({ message, state: 'error' });
            }
            if (!editedGos || valid?.state !== 'success' || (!autoRun && !run)) return;

            setGoslingSpec(editedGos);
        },
        [code, autoRun, readOnly]
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
    }, [code, autoRun, theme]);

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
                <span style={{ cursor: 'pointer' }} onClick={() => window.open('https://gosling.js.org', '_blank')}>
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
                <select
                    style={{ maxWidth: IS_SMALL_SCREEN ? window.innerWidth - 180 : 'none' }}
                    onChange={e => {
                        setDemo(examples.find(d => d.id === e.target.value) as any);
                    }}
                    defaultValue={demo.id}
                    hidden={urlSpec !== null || urlGist !== null}
                >
                    {examples.map(d => (
                        <option key={d.id} value={d.id}>
                            {d.name + (d.underDevelopment ? ' (under development)' : '')}
                        </option>
                    ))}
                </select>
                {expertMode ? (
                    <select
                        style={{ maxWidth: IS_SMALL_SCREEN ? window.innerWidth - 180 : 'none' }}
                        onChange={e => {
                            if (Object.keys(Themes).indexOf(e.target.value) !== -1) {
                                setTheme(e.target.value);
                            }
                        }}
                        defaultValue={'light'}
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
                            title="Automatically update visualization upon editing code"
                            className="side-panel-button"
                            onClick={() => setAutoRun(!autoRun)}
                        >
                            {autoRun ? getIconSVG(ICONS.TOGGLE_ON, 23, 23, '#E18343') : getIconSVG(ICONS.TOGGLE_OFF)}
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
                                    const url = `https://gosling-lang.github.io/gosling.js/?full=${isHideCode}&spec=${JSONCrush(
                                        code
                                    )}`;
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
                                <EditorPanel
                                    code={code}
                                    readOnly={readOnly}
                                    openFindBox={isFindCode}
                                    fontZoomIn={isFontZoomIn}
                                    fontZoomOut={isFontZoomOut}
                                    onChange={debounceCodeEdit.current}
                                    isDarkTheme={theme === 'dark'}
                                />
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
                                    <gosling.GoslingComponent
                                        ref={gosRef}
                                        spec={goslingSpec}
                                        theme={theme}
                                        padding={60}
                                        margin={0}
                                        border={'none'}
                                        id={'goslig-component-root'}
                                        className={'goslig-component'}
                                        experimental={{ reactive: false }}
                                        compiled={(g, h) => {
                                            setHg(h);
                                        }}
                                    />
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
                                                                {`${(JSON.parse(d.dataConfig).data
                                                                    .type as string).toLocaleLowerCase()} `}
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
                <div className={isShowAbout ? 'about-modal' : 'about-modal-container-hidden'}>
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
        </>
    );
}
export default Editor;
