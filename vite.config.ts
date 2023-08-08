import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    base: "./",
    define: {
      "process.env": {
        NODE_ENV: mode,
      },
    }
  };
});
