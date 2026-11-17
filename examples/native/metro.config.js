const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, "../..");
const librarySource = path.join(libraryRoot, "src");

const entries = {
  "@lapp-studio/react-toast-engine": "src/core/index.ts",
  "@lapp-studio/react-toast-engine/core": "src/core/index.ts",
  "@lapp-studio/react-toast-engine/native": "src/native/index.ts",
  "@lapp-studio/react-toast-engine/native/reanimated": "src/native/reanimated.ts",
  "@lapp-studio/react-toast-engine/zustand": "src/state/zustand.ts",
  "@lapp-studio/react-toast-engine/jotai": "src/state/jotai.ts",
  "@lapp-studio/react-toast-engine/redux": "src/state/redux.ts",
};

const isBareSpecifier = (moduleName) =>
  !moduleName.startsWith(".") && !path.isAbsolute(moduleName);

const config = getDefaultConfig(projectRoot);

config.watchFolders = [librarySource];
config.resolver.nodeModulesPaths = [path.join(projectRoot, "node_modules")];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (entries[moduleName]) {
    return { type: "sourceFile", filePath: path.join(libraryRoot, entries[moduleName]) };
  }
  if (isBareSpecifier(moduleName) && context.originModulePath.startsWith(librarySource)) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, "index.ts") },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
