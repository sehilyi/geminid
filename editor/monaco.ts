import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
export * from 'monaco-editor/esm/vs/editor/edcore.main';

// @ts-ignore
// https://github.com/Microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite
self.MonacoEnvironment = {
    getWorker() {
        return new jsonWorker();
    }
};
