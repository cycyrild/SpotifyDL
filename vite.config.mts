import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import eslint from 'vite-plugin-eslint';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tsconfigPaths(),
    ...(mode !== 'debug' ? [eslint()] : []),
  ],
  build: {
    sourcemap: mode === 'debug',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'popup.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
      },
      output: {
        dir: path.resolve(__dirname, 'dist'),
        entryFileNames: '[name].js',
      },
    },
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
}));
