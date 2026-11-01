import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "tools/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/content/src/**/*.ts", "tools/evidence.ts"],
      exclude: ["packages/content/src/index.ts"],
      reporter: ["text", "lcov", "json-summary"],
      thresholds: { lines: 95, functions: 95, statements: 95, branches: 90 },
    },
  },
});
