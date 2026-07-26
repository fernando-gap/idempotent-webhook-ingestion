import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  test: {
    environment: "node",
    env: loadEnv("test", process.cwd(), ""),
    coverage: {
          provider: "v8",

          reporter: ["text", "html", "lcov"],

          reportsDirectory: "./coverage",

          include: ["src/**/*.ts"],

          exclude: [
            "src/**/*.test.ts",
            "src/**/*.spec.ts",
            "src/**/*.d.ts",
          ],

          reportOnFailure: true,
        },
      },
}));