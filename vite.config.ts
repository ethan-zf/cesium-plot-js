import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  let config = {};
  if (mode === 'dev') {
    config = {
      base: './',
      define: {
        'process.env': {
          NODE_ENV: mode,
        },
      },
      server: {
        port: 3001,
        open: true,
      },
    };
  } else if (mode === 'prod') {
    config = {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'CesiumPlot',
          fileName: 'CesiumPlot',
        },
      },
    };
  }
  return config;
});
