const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        mode: isProduction ? 'production' : 'development',
        target: ['web'],
        entry: {
            app: path.resolve(__dirname, "..", "src", "index.tsx"),
            background: path.resolve(__dirname, "..", "src", "background.ts")
        },
        output: {
            path: path.join(__dirname, "../dist"),
            filename: "[name].js",
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx']
        },
        devtool: isProduction ? false : 'source-map',
        module: {
            rules: [
                // Rule for CSS Modules
                {
                    test: /\.module\.css$/i,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                modules: {
                                    localIdentName: '[name]__[local]___[hash:base64:5]', // Naming pattern for class names
                                },
                            },
                        },
                    ],
                },
                // Rule for regular CSS (global styles)
                {
                    test: /\.css$/i,
                    exclude: /\.module\.css$/i, // Exclude CSS Modules
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.(ts)x?$/,
                    use: 'babel-loader',
                    exclude: /node_modules|public/,
                },
            ],
        },
        plugins: [
            new CopyPlugin({
              patterns: [{ from: '.', to: '.', context: 'public' }]
            }),
            new ESLintPlugin({
              extensions: ['ts', 'js'],
              fix: true
            })
          ]
    };
};
