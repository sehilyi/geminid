import * as gosling from '../';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import PubSub from 'pubsub-js';
import fetchJsonp from 'fetch-jsonp';
import EditorPanel from './editor-panel';
import stringify from 'json-stringify-pretty-compact';
import SplitPane from 'react-split-pane';
import ErrorBoundary from './errorBoundary';
import { Datum, GoslingSpec } from '../core/gosling.schema';
import { debounce } from 'lodash';
import { examples } from './example';
import { HiGlassSpec } from '../core/higlass.schema';
import GoslingSchema from '../../schema/gosling.schema.json';
import { validateSpec, Validity } from '../core/utils/validate';
import stripJsonComments from 'strip-json-comments';
import * as qs from 'qs';
import { JSONCrush, JSONUncrush } from '../core/utils/json-crush';
import './editor.css';
import { ICONS, ICON_INFO } from './icon';

const INIT_DEMO_INDEX = examples.findIndex(d => d.forceShow) !== -1 ? examples.findIndex(d => d.forceShow) : 0;

// Limit of the character length to allow copy to clipboard
const LIMIT_CLIPBOARD_LEN = 4096;

// ! these should be updated upon change in css files
const EDITOR_HEADER_HEIGHT = 40;
const BOTTOM_PANEL_HEADER_HEIGHT = 30;

const LogoSVG = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width={20} height={20}>
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

const emptySpec = message =>
    message
        ? `{
    // ${message}
}`
        : '{}';

const fetchSpecFromGist = async gist => {
    let metadata = null;
    try {
        // Don't ask me why but due to CORS we need to treat the JSON as JSONP
        // which is not supported by the normal `fetch()` so we need `fetchJsonp()`
        const response = await fetchJsonp(`https://gist.github.com/${gist}.json`);
        metadata = await (response.ok ? response.json() : null);
    } catch (error) {
        return Promise.reject(new Error('Gist not found'));
    }

    if (!metadata) return Promise.reject(new Error('Gist not found'));

    const dataFile = metadata.files.find(file => file.toLowerCase().startsWith('gosling'));
    const textFile = metadata.files.find(file => file.toLowerCase().startsWith('readme'));

    if (!dataFile) return Promise.reject(new Error('Gist does not contain a Gosling spec.'));

    const whenCode = fetch(`https://gist.githubusercontent.com/${gist}/raw/${dataFile}`).then(response =>
        response.status === 200 ? response.text() : null
    );

    const whenText = fetch(`https://gist.githubusercontent.com/${gist}/raw/${textFile}`).then(response =>
        response.status === 200 ? response.text() : null
    );

    return Promise.all([whenCode, whenText]).then(([code, text]) => ({
        code,
        text,
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
    // custom spec contained in the URL
    const urlParams = qs.parse(props.location.search, { ignoreQueryPrefix: true });
    const urlSpec = urlParams?.spec ? JSONUncrush(urlParams.spec as string) : null;
    const urlGist = urlParams?.gist || null;

    const defaultCode = urlGist ? emptySpec() : stringify(urlSpec ?? (examples[INIT_DEMO_INDEX].spec as GoslingSpec));

    const previewData = useRef<PreviewData[]>([]);
    const [refreshData, setRefreshData] = useState<boolean>(false);

    const [demo, setDemo] = useState(examples[INIT_DEMO_INDEX]);
    const [hg, setHg] = useState<HiGlassSpec>();
    const [code, setCode] = useState(defaultCode);
    const [goslingSpec, setGoslingSpec] = useState<gosling.GoslingSpec>();
    const [log, setLog] = useState<Validity>({ message: '', state: 'success' });
    const [autoRun, setAutoRun] = useState(true);
    const [selectedPreviewData, setSelectedPreviewData] = useState<number>(0);
    const [gistTitle, setGistTitle] = useState(null);

    // whether to show HiGlass' viewConfig on the left-bottom
    const [showVC, setShowVC] = useState<boolean>(false);

    // whether the code editor is read-only
    const [readOnly, setReadOnly] = useState<boolean>(false);

    // whether to hide source code on the left
    const [isMaximizeVis, setIsMaximizeVis] = useState<boolean>((urlParams?.full as string) === 'true' || false);

    // whether to show data preview on the right-bottom
    const [isShowDataPreview, setIsShowDataPreview] = useState<boolean>(false);

    // whether to show a find box
    const [isFindCode, setIsFindCode] = useState<boolean | undefined>(undefined);

    // whether to use larger or smaller font
    const [isFontZoomIn, setIsfontZoomIn] = useState<boolean | undefined>(undefined);
    const [isFontZoomOut, setIsfontZoomOut] = useState<boolean | undefined>(undefined);

    // for using HiGlass JS API
    // const hgRef = useRef<any>();

    /**
     * Editor mode
     */
    useEffect(() => {
        previewData.current = [];
        setSelectedPreviewData(0);
        setCode(urlSpec ?? stringify(demo.spec as GoslingSpec));
        setHg(undefined);
    }, [demo]);

    useEffect(() => {
        let active = true;

        if (!urlGist) return undefined;

        setCode('');
        setReadOnly(true);

        fetchSpecFromGist(urlGist)
            .then(({ code, title }) => {
                if (active) {
                    setCode(code);
                    setGistTitle(title);
                    setReadOnly(false);
                }
            })
            .catch(error => {
                if (active) {
                    setCode(emptySpec(`Error: ${error}`));
                    setGistTitle('Error loading gist! See code for details.');
                    setReadOnly(false);
                }
            });

        return () => {
            setReadOnly(false);
            active = false;
        };
    }, [urlGist]);

    const runSpecUpdateVis = useCallback(
        (run?: boolean) => {
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
        [code, autoRun]
    );

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
    }, [code, autoRun]);

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

    // console.log('editor.render()');
    return (
        <>
            <div className="demo-navbar">
                <span className="logo">{LogoSVG}</span>
                Gosling.js Editor
                {urlSpec && <small> Displaying a custom spec contained in URL</small>}
                {gistTitle && (
                    <span className="gist-title">
                        : <em>{gistTitle}</em>
                    </span>
                )}
                <select
                    onChange={e => {
                        setDemo(examples.find(d => d.name === e.target.value) as any);
                    }}
                    defaultValue={demo.name}
                    hidden={urlSpec !== null || urlGist !== null}
                >
                    {examples.map(d => (
                        <option key={d.name} value={d.name}>
                            {d.name + (d.underDevelopment ? ' (under development)' : '')}
                        </option>
                    ))}
                </select>
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
                <span
                    style={{ color: 'white', cursor: 'default', userSelect: 'none' }}
                    onClick={() => {
                        // if (hgRef.current) {
                        //     console.warn('Exporting SVG', hgRef.current.api.exportAsSvg());
                        //     // TODO: save as a html file
                        // }
                    }}
                >
                    {'‌‌ ‌‌ ‌‌ ‌‌ ‌‌ ‌‌ ‌‌ ‌‌ '}
                </span>
                <input type="hidden" id="spec-url-exporter" />
            </div>
            {/* ------------------------ Main View ------------------------ */}
            <div className="editor">
                <SplitPane className="side-panel-spliter" split="vertical" defaultSize="50px" allowResize={false}>
                    <div className="side-panel">
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
                            onClick={() => setIsMaximizeVis(!isMaximizeVis)}
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
                                    const url = `https://gosling-lang.github.io/gosling.js/?full=${isMaximizeVis}&spec=${JSONCrush(
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
                            title="Open GitHub repository"
                            className="side-panel-button"
                            onClick={() => window.open('https://github.com/gosling-lang/gosling.js', '_blank')}
                        >
                            {getIconSVG(ICONS.GITHUB, 23, 23)}
                            <br />
                            GITHUB
                        </span>
                        <span
                            title="Open GitHub repository"
                            className="side-panel-button"
                            onClick={() => window.open('https://github.com/gosling-lang/gosling.js/wiki', '_blank')}
                        >
                            {getIconSVG(ICONS.DOCS, 23, 23)}
                            <br />
                            DOCS
                        </span>
                    </div>
                    <SplitPane split="vertical" defaultSize={'40%'} size={isMaximizeVis ? '0px' : '40%'} minSize="0px">
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
                                    onChange={debounce(code => {
                                        setCode(code);
                                    }, 1500)}
                                />
                                <div className={`compile-message compile-message-${log.state}`}>{log.message}</div>
                            </>
                            {/* HiGlass View Config */}
                            <SplitPane split="vertical" defaultSize="100%">
                                <>
                                    <div className="editor-header">Compiled HiGlass ViewConfig (Read Only)</div>
                                    <div style={{ height: '100%', visibility: showVC ? 'visible' : 'hidden' }}>
                                        <EditorPanel code={stringify(hg)} readOnly={true} />
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
                                <div className="preview-container">
                                    <gosling.GoslingComponent
                                        spec={goslingSpec}
                                        compiled={(g, h) => {
                                            setHg(h);
                                        }}
                                    />
                                </div>
                                <SplitPane split="vertical" defaultSize="100%">
                                    <>
                                        <div
                                            className="editor-header"
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
                                                                                        {row[field].toString()}
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
            </div>
        </>
    );
}
export default Editor;
