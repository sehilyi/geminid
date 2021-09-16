// For GMOD/binary-parser.js
// ref: https://github.com/GMOD/binary-parser/blob/05ce6417e0285933b0d981138961087b7eb3707e/lib/binary_parser.js#L324-L327
// Polyfill: https://github.com/ionic-team/rollup-plugin-node-polyfills/blob/9b5fe1a9cafffd4871e6d65613ed224f807ea251/polyfills/vm.js#L129-L132
export function runInThisContext(code: unknown) {
    const fn = new Function('code', 'return eval(code);');
    return fn.call(globalThis, code);
}
