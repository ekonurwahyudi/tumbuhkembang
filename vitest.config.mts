import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    // Test integrasi memakai database yang sama — jalankan berurutan.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": resolve("./src"),
      // Penanda "server-only" melempar di luar runtime React; di test ia tak berarti.
      "server-only": resolve("./test/server-only-stub.ts"),
    },
  },
});
