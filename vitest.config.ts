import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = { "@": path.resolve(__dirname, "./src") };

export default defineConfig({
  test: {
    // Two projects rather than one environment for everything: the engine, db
    // and API-route suites are pure Node and run measurably faster without a
    // DOM, while component tests need jsdom. Splitting them keeps the fast
    // suites fast as the component suite grows.
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["src/test/setup-dom.ts"],
        },
      },
    ],
  },
});
