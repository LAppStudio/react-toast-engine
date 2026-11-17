import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    core: "src/core/index.ts",
    native: "src/native/index.ts",
    "native-reanimated": "src/native/reanimated.ts",
    web: "src/web/index.ts",
    "web-motion": "src/web/motion.ts",
    zustand: "src/state/zustand.ts",
    jotai: "src/state/jotai.ts",
    redux: "src/state/redux.ts",
  },
  format: ["esm", "cjs"],
  clean: true,
  dts: true,
  treeshake: true,
  outDir: "dist",
  platform: "neutral",
});
