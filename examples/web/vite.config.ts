import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const libraryRoot = fileURLToPath(new URL("../..", import.meta.url));

const entries: Record<string, string> = {
  "@lapp-studio/react-toast-engine": "src/core/index.ts",
  "@lapp-studio/react-toast-engine/core": "src/core/index.ts",
  "@lapp-studio/react-toast-engine/web": "src/web/index.ts",
  "@lapp-studio/react-toast-engine/web/motion": "src/web/motion.ts",
  "@lapp-studio/react-toast-engine/zustand": "src/state/zustand.ts",
  "@lapp-studio/react-toast-engine/jotai": "src/state/jotai.ts",
  "@lapp-studio/react-toast-engine/redux": "src/state/redux.ts",
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: Object.entries(entries).map(([specifier, file]) => ({
      find: new RegExp(`^${specifier}$`),
      replacement: path.join(libraryRoot, file),
    })),
    dedupe: ["react", "react-dom", "motion", "zustand", "jotai"],
  },
  server: {
    fs: { allow: [libraryRoot] },
  },
});
