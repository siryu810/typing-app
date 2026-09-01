import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: ["mockups/**", "docs/**"],
  },
  lint: {
    ignorePatterns: ["dist/**", "node_modules/**", ".wrangler/**", "mockups/**"],
    plugins: ["react", "typescript", "oxc"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  plugins: lazyPlugins(async () => {
    const plugins = [react()];
    if (!process.env.VITEST) {
      const { cloudflare } = await import("@cloudflare/vite-plugin");
      plugins.push(cloudflare());
    }
    return plugins;
  }),
});
