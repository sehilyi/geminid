import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as esbuild from 'esbuild';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from './package.json' assert { type: 'json' }; // must do the assert to solve https://nodejs.org/api/errors.html#err_import_assertion_type_missing

const __dirname = fileURLToPath(dirname(import.meta.url));

/**
 * Bundles vite worker modules during development into single scripts.
 * Also injects node globals for gmod libraries.
 * see: https://github.com/hms-dbmi/viv/pull/469#issuecomment-877276110
 * @returns {import('vite').Plugin}
 */
const bundleWebWorker = {
    name: 'bundle-web-worker',
    apply: 'serve', // plugin only applied with dev-server
    async transform(_, id) {
        if (/\?worker_file$/.test(id)) {
            // just use esbuild to bundle the worker dependencies
            const bundle = await esbuild.build({
                entryPoints: [id],
                inject: ['./src/alias/buffer-shim.js'],
                format: 'iife',
                bundle: true,
                write: false
            });
            if (bundle.outputFiles.length !== 1) {
                throw new Error('Worker must be a single module.');
            }
            return bundle.outputFiles[0].text;
        }
    }
};

// audit libraries to see if they use `Buffer` in a way that needs to be shimmed

// We can't inject a global `Buffer` polyfill for the worker entrypoint using vite alone,
// so we reuse the `bundle-web-worker` plugin to inject the buffer shim during production.
const manualInlineWorker = {
    apply: 'build',
    async transform(code, id) {
        if (
            id.endsWith('bam-worker.ts?worker&inline') ||
            id.endsWith('vcf-worker.ts?worker&inline') ||
            id.endsWith('gff-worker.ts?worker&inline') ||
            id.endsWith('bed-worker.ts?worker&inline')
        ) {
            const bundle = await bundleWebWorker.transform(code, id + '?worker_file');
            const base64 = Buffer.from(bundle).toString('base64');
            // https://github.com/vitejs/vite/blob/72cb33e947e7aa72d27ed0c5eacb2457d523dfbf/packages/vite/src/node/plugins/worker.ts#L78-L87
            return `const encodedJs = "${base64}";
const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
export default function() {
  const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
  try {
    return objURL ? new Worker(objURL) : new Worker("data:application/javascript;base64," + encodedJs, {type: "module"});
  } finally {
    objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
  }
}`;
        }
    }
};

const alias = {
    'gosling.js': path.resolve(__dirname, './src/index.ts'),
    '@gosling-lang/gosling-schema': path.resolve(__dirname, './src/gosling-schema/index.ts'),
    '@gosling-lang/higlass-schema': path.resolve(__dirname, './src/higlass-schema/index.ts'),
    '@gosling-lang/gosling-track': path.resolve(__dirname, './src/tracks/gosling-track/index.ts'),
    '@gosling-lang/gosling-genomic-axis': path.resolve(__dirname, './src/tracks/gosling-genomic-axis/index.ts'),
    '@gosling-lang/gosling-brush': path.resolve(__dirname, './src/tracks/gosling-brush/index.ts'),
    '@gosling-lang/dummy-track': path.resolve(__dirname, './src/tracks/dummy-track/index.ts'),
    '@data-fetchers': path.resolve(__dirname, './src/data-fetchers/index.ts'),
    '@gosling-lang/core-utils': path.resolve(__dirname, './src/core/index.ts'),
    zlib: path.resolve(__dirname, './src/alias/zlib.ts'),
    stream: path.resolve(__dirname, './node_modules/stream-browserify') //  gmod/gff uses stream-browserify
};

const skipExt = new Set(['@gmod/bbi']);
const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)].filter(
    dep => !skipExt.has(dep)
);

const esm = defineConfig({
    build: {
        emptyOutDir: false,
        outDir: 'dist',
        minify: false,
        target: 'es2018',
        sourcemap: true,
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: 'gosling'
        },
        rollupOptions: { external }
    },
    resolve: { alias },
    plugins: [manualInlineWorker]
});

const dev = defineConfig({
    build: { outDir: 'build' },
    resolve: { alias },
    define: {
        'process.platform': 'undefined', // because of the threads library relies on process global
        'process.env.THREADS_WORKER_INIT_TIMEOUT': 'undefined'
    },
    plugins: [bundleWebWorker, manualInlineWorker]
});

const testing = defineConfig({
    resolve: { alias },
    test: {
        globals: true,
        setupFiles: [path.resolve(__dirname, './scripts/setup-vitest.js')],
        environment: 'jsdom',
        optimizer: {
            web: {
                include: ['vitest-canvas-mock']
            }
        },
        threads: false, // see https://github.com/vitest-dev/vitest/issues/740
        environmentOptions: {
            jsdom: {
                resources: 'usable'
            }
        },
        coverage: {
            reportsDirectory: './coverage',
            reporter: ['lcov', 'text'],
            include: ['src', 'editor']
        }
    }
});

export default ({ command, mode }) => {
    if (command === 'build' && mode === 'lib') return esm;
    if (mode == 'test') return testing;
    if (mode === 'editor') {
        dev.plugins.push(react());
    }
    return dev;
};
