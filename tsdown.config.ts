import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    core: "src/core/index.ts",
    native: "src/native/index.ts",
    "native-reanimated": "src/native/reanimated.ts",
    web: "src/web/index.ts",
    "web-motion": "src/web/motion.ts",
  },
  format: ["esm", "cjs"],
  clean: true,
  dts: true,
  treeshake: true,
  outDir: "dist",
  platform: "neutral",
});
