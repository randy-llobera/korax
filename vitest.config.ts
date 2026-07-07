import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": srcPath,
    },
  },
  test: {
    coverage: {
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.ts",
        "src/components/**",
      ],
      include: ["src/lib/**/*.ts", "src/actions/**/*.ts"],
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    environment: "node",
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    globals: true,
    include: [
      "src/lib/**/*.test.ts",
      "src/actions/**/*.test.ts",
      "src/app/api/**/*.test.ts",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});
