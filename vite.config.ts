// @lovable.dev/vite-tanstack-config already includes TanStack Start, React, Tailwind, path aliases
// and nitro. Do NOT add those plugins manually.
// On Vercel (VERCEL=1 during build) nitro emits Vercel output; elsewhere the default edge target is used.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  ...(process.env.VERCEL ? { nitro: { preset: "vercel" } } : {}),
});
