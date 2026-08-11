// Build config used ONLY to package the Windows desktop app (Electron).
// It swaps the Cloudflare Nitro preset for a plain Node server that Electron
// can spawn locally, so the app runs fully offline.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "node-server",
    output: { dir: ".output-electron" },
  },
});
