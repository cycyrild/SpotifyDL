const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        mode: isProduction ? 'production' : 'development',
        target: ['web', 'es2020'],
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
                {
                    test: /\.css$/i,
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
                patterns: [{ from: ".", to: ".", context: "public" }]
            }),
        ],
    };
};
