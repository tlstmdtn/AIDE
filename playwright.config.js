import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:5175",
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    launchOptions: existsSync("/usr/bin/chromium")
      ? { executablePath: "/usr/bin/chromium" }
      : {},
  },
  webServer: {
    command: "npm run dev -- --port 5175 --strictPort",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://aide-test.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser_test_only",
    },
  },
});
