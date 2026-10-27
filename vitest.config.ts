import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirrors tsconfig `@/*` so tests can import Next.js route modules.
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["tests/**/*.test.{ts,tsx}"] },
});
