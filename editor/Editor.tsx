import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import * as gosling from 'gosling.js';
import stringify from 'json-stringify-pretty-compact';
import stripJsonComments from 'strip-json-comments';
import type { HiGlassSpec } from '@gosling-lang/higlass-schema';
import type { Datum } from '@gosling-lang/gosling-schema';
import { examples, type Example } from './example';
import './Editor.css';

// import { EX_SPEC_VISUAL_ENCODING } from './example/json-spec/visual-encoding';


function json2js(jsonCode: string) {
    return `var spec = ${jsonCode} \nexport { spec }; \n`;
}

const SHOWN_EXAMPLE_LIST = Object.entries(examples)
    .map(([k, v]) => {
        return { id: k, ...v };
    })
    .filter(d => !d.hidden);
const INIT_DEMO = SHOWN_EXAMPLE_LIST.find(d => d.forceShow) ?? SHOWN_EXAMPLE_LIST[0];

// const INIT_DEMO = {
//     group: 'Visual Encoding',
//     name: 'Visual Encoding',
//     spec: EX_SPEC_VISUAL_ENCODING,
//     id: '1'
// } as Example;


// A key to store and get a Gosling spec via sessionStorage
const SESSION_KEY_SPEC = 'session-gosling-spec';

const stringifySpec = (spec: string | gosling.GoslingSpec | undefined): string => {
    if (!spec) return '';
    else if (typeof spec === 'string') return spec;
    else return stringify(spec);
};


/**
 * React component for editing Gosling specs
 */
function Editor() {

    // Spec stored in the tab session
    const sessionSpec = useMemo(() => {
        const sessionSpecStr = sessionStorage.getItem(SESSION_KEY_SPEC);
        return sessionSpecStr ? JSON.parse(sessionSpecStr) : null;
    }, []);

    const defaultCode = stringify(INIT_DEMO.spec as gosling.GoslingSpec);
    const defaultJsCode = INIT_DEMO.specJs;

    const demo = INIT_DEMO;
    const [theme, setTheme] = useState<gosling.Theme>('light');
    const [hg, setHg] = useState<HiGlassSpec>();
    const [code, setCode] = useState(defaultCode);
    const [jsCode, setJsCode] = useState(defaultJsCode); //[TO-DO: more js format examples]
    const [goslingSpec, setGoslingSpec] = useState<gosling.GoslingSpec>();
    const [log, setLog] = useState<ReturnType<typeof gosling.validateGoslingSpec>>({ message: '', state: 'success' });

    const gosRef = useRef<gosling.GoslingRef>(null);

    // publish event listeners to Gosling.js
    useEffect(() => {
        if (gosRef.current) {
            gosRef.current.api.subscribe('rawData', (type, data) => {
                console.log('rawData', data);
            });
            gosRef.current.api.subscribe('specProcessed', (type, data) => {
                console.log('specProcessed', data);
            });
        }
        return () => {
            gosRef.current?.api.unsubscribe('rawData');
            gosRef.current?.api.unsubscribe('specProcessed');
           
        };
    }, [gosRef.current]);

    /**
     * Editor mode
     * 
     * THIS DOES SPECPROCESSED SOMETHING
     */
    useEffect(() => {
        if (sessionSpec) {
            console.log('setsessionspec')
            setCode(stringify(sessionSpec));
            setJsCode(json2js(stringify(sessionSpec)));
        } else {
            console.log('setdemospec')
            const jsonCode = stringifySpec(demo.spec as gosling.GoslingSpec);
            setCode(jsonCode);
            setJsCode(demo.specJs ?? json2js(jsonCode));
        }
        setHg(undefined);
    }, []);



    const runSpecUpdateVis = useCallback(
        () => {
            let editedGos;
            let valid;

            try {
                editedGos = JSON.parse(stripJsonComments(code));
                valid = gosling.validateGoslingSpec(editedGos);
                setLog(valid);
            } catch (e) {
                const message = '✘ Cannnot parse the code.';
                console.warn(message);
                setLog({ message, state: 'error' });
            }
            if (!editedGos || valid?.state !== 'success') return;

            setGoslingSpec(editedGos);
            sessionStorage.setItem(SESSION_KEY_SPEC, stringify(editedGos));
            
        },
        [code, jsCode]
    );


    /**
     * Render visualization when edited
     */
    useEffect(() => {
        runSpecUpdateVis();
    }, [code, jsCode, theme]);



    // console.log('editor.render()');
    return (
        <>
            {/* ------------------------ Main View ------------------------ */}
            <div className={`editor ${theme === 'dark' ? 'dark' : ''}`}>
                <div
                    id="preview-container"
                    className={`preview-container ${theme === 'dark' ? 'dark' : ''}`}
                >
                    <div>
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
                    </div>
                </div>
            </div>
            
        </>
    );
}
export default Editor;
