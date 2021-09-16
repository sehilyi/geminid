const esbuild = require('esbuild');
const { resolve } = require('path');
const pkg = require('./package.json');

const skipExt = new Set(['@gmod/bam', '@gmod/bbi', 'generic-filehandle']);

/**
 * Esbuild plugin. Bundles TS/JS entrypoint as an independent module, and inlines
 * the code as a base64-encoded data URL.
 *
 * import src from 'js-asset:../path/to/module';
 * let worker = new Worker(src);
 *
 * @param {Pick<import('esbuild').BuildOptions, 'minify' | 'format' | 'plugins'>}
 * @return {import('esbuild').Plugin}
 */
const inlineJsAsset = (opt = {}) => {
    const namespace = 'js-asset';
    const prefix = `${namespace}:`;
    return {
        name: namespace,
        setup(build) {
            build.onResolve({ filter: new RegExp(`^${prefix}`) }, args => {
                return {
                    path: resolve(args.resolveDir, args.path.slice(prefix.length)),
                    namespace
                };
            });
            build.onLoad({ filter: /.*/, namespace }, async args => {
                const { outputFiles } = await esbuild.build({
                    entryPoints: [args.path],
                    bundle: true,
                    write: false,
                    format: opt.format || 'iife',
                    minify: opt.minify || true,
                    target: build.initialOptions.target,
                    plugins: [...(build.initialOptions.plugins || []), ...(opt.plugins || [])]
                });
                if (outputFiles.length !== 1) {
                    throw new Error('Too many files built for worker bundle.');
                }
                const { contents } = outputFiles[0];
                const base64 = Buffer.from(contents).toString('base64');
                return {
                    loader: 'js',
                    contents: `export default "data:application/javascript;base64,${base64}";`
                };
            });
        }
    };
};

const onRebuild = (error, result) => {
    if (error) console.error('watch build failed:', error);
    else console.log('watch build succeeded:', result);
};

/** @type {import('esbuild').BuildOptions} */
const base = {
    entryPoints: ['./src/index.ts'],
    bundle: true,
    inject: ['./src/alias/buffer-shim.js'],
    plugins: [inlineJsAsset()],
    sourcemap: true,
};

/** @type {import('esbuild').BuildOptions} */
const esm = {
    ...base,
    outfile: pkg.module,
    format: 'esm',
    target: 'es2018',
    external: [
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.peerDependencies),
    ].filter(dep => !skipExt.has(dep)),
    banner: { js: 'var global = globalThis' }
};

/** @type {import('esbuild').BuildOptions} */
const umd = {
    ...base,
    outfile: pkg.main,
    format: 'cjs',
    minify: true,
    external: ['react', 'react-dom', 'pixi.js', 'higlass'],
    // esbuild doesn't support UMD format directy. The banner/footer
    // wraps the commonjs output as a UMD module. The function signature is copied
    // from what is generated from rollup. If the external UMD dependencies change
    // (or the name of the gosling global) this needs changing.
    banner: { js: `\
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('pixi.js'), require('react'), require('higlass'), require('react-dom')) :
  typeof define === 'function' && define.amd ? define(['exports', 'pixi.js', 'react', 'higlass', 'react-dom'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.gosling = {}, global.PIXI, global.React, global.hglib, global.ReactDOM));
}(this, (function (exports, pixi_js, React, higlass, ReactDOM) { 'use strict';

var __mods = { 'pixi.js': pixi_js, 'react': React, 'react-dom': ReactDOM, 'higlass': higlass };
var require = name => __mods[name];
var global = globalThis;
`
    },
    footer: { js:  '\n})));' }
};

const build = () => {
    const format = process.argv[2];
    let config;
    if (format === '--esm') config = esm;
    if (format === '--umd') config = umd;
    if (!config) {
        console.log('node build --umd/--esm [--watch]');
        process.exit(1);
    }
    if (process.argv[3] === '--watch') config.watch = { onRebuild };
    return esbuild.build(config);
};

build();
