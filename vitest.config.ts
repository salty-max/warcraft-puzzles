import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The benchmark tests replay the whole bank on every layout, which outgrew 5 s under coverage.
    testTimeout: 30000,
    include: ["packages/**/*.test.ts", "tools/**/*.test.ts", "web/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "packages/content/src/**/*.ts",
        "packages/crossword/src/**/*.ts",
        "tools/evidence.ts",
        "tools/benchmark.ts",
        "tools/research-puzzle.ts",
        "tools/prototype-set.ts",
        "web/model.ts",
      ],
      exclude: ["packages/content/src/index.ts", "packages/crossword/src/index.ts"],
      reporter: ["text", "lcov", "json-summary"],
      thresholds: { lines: 95, functions: 95, statements: 95, branches: 90 },
    },
  },
});
