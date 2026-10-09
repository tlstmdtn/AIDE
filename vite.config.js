import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const publicKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (Boolean(env.VITE_SUPABASE_URL?.trim()) !== Boolean(publicKey)) {
    throw new Error(
      "Set both public Supabase configuration values, or leave both unset.",
    );
  }
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
