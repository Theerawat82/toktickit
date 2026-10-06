import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false, // Force serial execution to prevent migration-integrity.test.ts from dropping the DB mid-flight
  },
});
