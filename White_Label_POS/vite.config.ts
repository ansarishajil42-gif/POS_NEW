// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
    nitro: { 
        preset: "vercel",
        externals: {
            // Force Nitro/Vercel to treat these as external Node modules 
            // and include them in the final deployment bundle
            external: ["@node-rs/argon2"]

        }
    },
    tanstackStart: {
        server: { entry: "server" },
    },
});
