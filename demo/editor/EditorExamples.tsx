import React from 'react';
import { ExampleGroups, examples } from './example';
import type { Example } from './example';
import './EditorExamples.css';

interface EditorExamplesProps {
    setShowExamples: (value: boolean) => void;
    closeDescription: () => void;
    setIsImportDemo: (value: boolean) => void;
    setDemo: (value: Example) => void;
}

export default function EditorExamples({
    setShowExamples,
    closeDescription,
    setIsImportDemo,
    setDemo
}: EditorExamplesProps) {
    return (
        <div className="example-gallery-container">
            <div className="example-gallery-sidebar">
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
            <div className="example-gallery">
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
                                            <button
                                                id={`${d[1].group}_${d[1].name}`}
                                                title={d[1].name}
                                                key={d[0]}
                                                className="example-card"
                                                onClick={() => {
                                                    setShowExamples(false);
                                                    closeDescription();
                                                    setIsImportDemo(true);
                                                    setDemo({ id: d[0], ...examples[d[0]] } as any);
                                                }}
                                            >
                                                <div className="card-img-wrap">
                                                    <img src={`${d[1].image}`} alt={d[1].name} loading="lazy" />
                                                </div>
                                                <div className="example-card-name">{d[1].name}</div>
                                            </button>
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
    );
}
