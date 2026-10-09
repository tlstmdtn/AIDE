import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const defaults = JSON.parse(
    readFileSync(
      new URL("./config/admissions.public.json", import.meta.url),
      "utf8",
    ),
  );
  const envUrl = env.VITE_SUPABASE_URL?.trim();
  const envKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (Boolean(envUrl) !== Boolean(envKey)) {
    throw new Error(
      "Set both public Supabase configuration values, or leave both unset.",
    );
  }
  const url = envUrl || defaults.url;
  const publicKey = envKey || defaults.publishableKey;
  if (url) {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(
        "Use an HTTPS Supabase project URL without embedded credentials.",
      );
    }
  }
  if (Boolean(url) !== Boolean(publicKey))
    throw new Error("Public Supabase URL and key must be configured together.");
  if (publicKey && !publicKey.startsWith("sb_publishable_")) {
    let role;
    try {
      role = JSON.parse(
        Buffer.from(publicKey.split(".")[1], "base64url").toString(),
      ).role;
    } catch {}
    if (role !== "anon")
      throw new Error(
        "Only a public publishable/anon key may be bundled. Never use a secret or service-role key.",
      );
  }
  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(url || ""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        publicKey || "",
      ),
    },
    base: process.env.VITE_BASE_PATH || "/",
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          home: fileURLToPath(new URL("./index.html", import.meta.url)),
          application: fileURLToPath(
            new URL("./apply/index.html", import.meta.url),
          ),
          admin: fileURLToPath(new URL("./admin/index.html", import.meta.url)),
        },
      },
    },
  };
});
