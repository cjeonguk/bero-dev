import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import netlifyReactRouter from "@netlify/vite-plugin-react-router";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    netlifyReactRouter(),
  ],
  test: {
    environment: "node",
    include: ["app/**/*.{test,spec}.{ts,tsx}"],
  },
});
