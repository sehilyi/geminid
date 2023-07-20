import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import jsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import defaultWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
export * from 'monaco-editor/esm/vs/editor/edcore.main';

// @ts-ignore
// https://github.com/Microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite
// Not sure what cause this bug though.
self.MonacoEnvironment = {
    getWorker(id: string, label: string) {
        switch (label) {
            case 'json':
                return new jsonWorker();
            case 'typescript':
            case 'javascript':
                return new jsWorker();
            default:
                return new defaultWorker();
        }
    }
};
