const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
// const PeerDepsExternalsPlugin = require("peer-deps-externals-webpack-plugin");
const pkg = require("./package.json");

module.exports = (env, argv) => {
  const config = {
    entry: { main: './editor/index.tsx' },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'build'),
      pathinfo: false,
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    devtool: argv.mode === 'development' ? 'cheap-module-source-map' : 'source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.json'],
	  alias: {
	    'gosling.js': path.resolve(__dirname, pkg.module),
	  }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: "tsconfig.editor.json",
                transpileOnly: true,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {plugins: [require('autoprefixer')]},
            },
          ],
        },
        {
            test: /\.ttf$/,
            use: ['file-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: './public/index.html',
      }),
      new MonacoWebpackPlugin({
        languages: ['json'],
      }),
      new webpack.SourceMapDevToolPlugin({
        exclude: ['higlass']
      }),
      // new PeerDepsExternalsPlugin(), // this can be added later
    ],
    devServer: {
      stats: {
        colors: true,
      },
      overlay: {
        warnings: false, // threads.js complains about "No instantiations of threads.js workers found."
        errors: true,
      },
      hot: true,
      stats: 'errors-only',
      open: false,
      contentBase: path.join(__dirname, 'public'),
      watchContentBase: true,
      watchOptions: {
        ignored: /node_modules/,
      },
    },
  };
  return config;
};
