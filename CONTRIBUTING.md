# Contributing to React Toast Engine

Thanks for helping out! This guide covers setting up the repository, running the example apps, testing your changes and releasing.

## Setup

You need [Node.js](https://nodejs.org) 24 and Yarn 1 (`corepack enable` provides it).

```bash
git clone https://github.com/LAppStudio/react-toast-engine
cd react-toast-engine
yarn install
yarn examples:install
```

`yarn install` sets up the library and its [lefthook](https://lefthook.dev) git hooks. `yarn examples:install` installs the example apps, which have their own dependencies. You only need it once, and again whenever their `package.json` changes.

## Project layout

| Path | Contents |
|---|---|
| `src/core` | Client, store, timers, gesture rules and the hooks shared by every platform. |
| `src/web` | Web shell and the vanilla and Motion drivers. |
| `src/native` | React Native shell and the `Animated` and Reanimated drivers. |
| `src/state` | Zustand, Jotai and Redux adapters. |
| `examples/web` | Vite app with one scenario per driver and state adapter. |
| `examples/native` | Expo app with the native drivers. |
| `docs/adr` | Architecture decision records. |

Each file in `tsdown.config.ts` `entry` becomes one public entry point (`/web`, `/native/reanimated`, `/zustand`…).

## Watch mode

```bash
yarn dev
```

Rebuilds `dist/` (ESM, CJS and types) as you edit. The example apps don't need it, because they read `src/` directly. Use it when testing the built package, for example in another project.

## Running the examples

The examples import the library by its public entry points (`@lapp-studio/react-toast-engine/web`, `/zustand`…), exactly as an app would. Their bundlers resolve those imports to `src/`, so a change to the library shows up through HMR or Fast Refresh, with no build step.

### Web

```bash
yarn dev:web
```

Opens a Vite app at <http://localhost:5173> with one scenario per tab: vanilla and Motion drivers, Zustand, Jotai and Redux state, and nested providers.

### Mobile

The native example uses Expo SDK 58. It runs as a development build, compiled on your machine, so it uses exactly the native module versions in its `package.json` rather than the ones bundled with Expo Go.

Requirements:

- **iOS:** macOS with Xcode and an iOS simulator.
- **Android:** Android Studio with an emulator, or a device with USB debugging.

```bash
yarn dev:mobile:ios       # build, install and open on the iOS simulator
yarn dev:mobile:android   # build, install and open on Android
yarn dev:mobile           # start Metro only, once the app is installed
```

The first run of `dev:mobile:<platform>` generates `examples/native/ios` or `android` and compiles the app, which takes a few minutes. Both folders are generated and gitignored.

Later runs reuse those folders and don't regenerate them, even when `package.json` changes. After upgrading the Expo SDK or a native dependency, regenerate them and build again:

```bash
yarn dev:mobile:reset     # expo prebuild --clean
yarn dev:mobile:ios
```

Skipping the reset leaves the app with native code from the previous versions. It fails at startup with errors such as `Cannot find native module 'ExpoAsset'` or `"main" has not been registered`.

The tabs at the top switch between the `Animated` driver, the Reanimated driver and Zustand state.

### How the examples resolve the library

| App | Where |
|---|---|
| Web | `resolve.alias` in `examples/web/vite.config.ts` |
| Mobile | `resolver.resolveRequest` in `examples/native/metro.config.js` |
| Types | `paths` in each example's `tsconfig.json`, which also points `react` at the example's own typings |

The `tsconfig.json` `paths` are for TypeScript only. Neither bundler reads them: Vite doesn't by default, and the native example sets `experiments.tsconfigPaths: false` in `app.json`. Otherwise Metro would resolve `react` to `@types/react` at runtime.

Every package, including the ones imported by `src/`, such as `react`, `zustand` or `react-native-reanimated`, resolves from the example's own `node_modules`. This avoids loading two copies of React.

This also means the examples run the library against their own versions, while `yarn type-check` uses the root `devDependencies`. Keep both on the same versions. The native example follows the Expo SDK: when upgrading it, bump `react`, `react-native`, Reanimated, Worklets and Gesture Handler in the root `devDependencies` to the SDK's versions as well, and widen `peerDependencies` if a new major comes in.

When you add a public entry point, add it to those three places as well.

### Adding a scenario

- **Web:** add a component to `examples/web/src/scenarios/` and list it in `scenarios` in `src/main.tsx`. It renders its own `renderer.Provider`.
- **Mobile:** add a `Scenario` to `examples/native/src/scenarios/` and list it in `scenarios` in `src/app.tsx`.

Create the client at module level, as an app would, and reuse `Playground` for the common actions.

## Testing in your own project

To check the package an app would install, build it and install the tarball:

```bash
yarn build
yarn pack --filename /tmp/react-toast-engine.tgz
cd ~/path/to/your-app
yarn add /tmp/react-toast-engine.tgz
```

Repeat after each change. Avoid `yarn link` or `npm link`: they make the app load React from this repository's `node_modules` as well as its own, which breaks hooks.

## Tests and checks

```bash
yarn test                 # unit tests and the web driver conformance suite (Vitest + jsdom)
yarn test:watch
yarn lint                 # ESLint, including the examples
yarn lint:fix
yarn type-check           # the library
yarn examples:type-check  # the example apps, against src/
yarn build
yarn check:pkg            # publint + are-the-types-wrong
yarn audit:bundle         # yarn audit limited to packages that ship with the bundle
```

CI runs `lint`, `type-check`, `test`, `build`, `check:pkg` and `audit:bundle` on every pull request. Lefthook runs ESLint on staged files before each commit, and `yarn audit` and `yarn test` before each push.

### Web drivers

Both web drivers run the same conformance suite, `src/web/__tests__/conformance.test.tsx`. A behaviour change in one driver must keep passing for both. New behaviour gets a test there.

### Native drivers

The native shell has unit tests in `src/native/__tests__`. They mock `react-native` with only the APIs the library relies on, matching the latest supported version, so a removed API, such as `StyleSheet.absoluteFillObject` in React Native 0.88, fails the suite. When `src/native` starts using another React Native API, add it to that mock.

The drivers' animations and gestures have no automated tests yet. Before opening a pull request that touches `src/native` or `src/core`, check both native drivers on a device or simulator with `yarn dev:mobile:<platform>`:

- toasts stack, time out and pause while touched;
- a fast swipe dismisses, a slow or stopped one springs back;
- `Loading → done` updates the toast in place;
- reduced motion (system settings) disables the animations.

### Bundle audit

`yarn audit` reports every package in the lockfile, including build and test tooling that never reaches users. `yarn audit:bundle` builds the library and keeps only the advisories for packages that ship with it:

- packages imported by `dist/`, which the consuming app installs and bundles (today, the peer dependencies);
- packages inlined into `dist/`, detected through the sourcemaps;
- `dependencies` from `package.json`.

| Option | Description |
|---|---|
| `--level <severity>` | Fail only at or above `info`, `low` (default), `moderate`, `high` or `critical`. |
| `--deep` | Also include the production dependencies of those packages, such as React Native's own dependency tree. |
| `--input <file>` | Read a saved `yarn audit --json` output instead of running the audit. |

It exits with `1` when an advisory at or above the level affects the bundle, and with `2` on usage errors.

## Pull requests

- Branch from `main` and open the pull request against it.
- Write commit messages and pull request titles in [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `build:`, `ci:`, `chore:`. Mark breaking changes with `!` (`feat!: …`) and describe the migration.
- Add user-facing changes to the `## Unreleased` section at the top of `CHANGELOG.md`, creating it if needed.
- Record decisions that shape the design (a new contract, a trade-off, a rejected alternative) as an ADR in `docs/adr`, following the existing numbering, and link it from the README.
- Keep code free of inline comments. Use JSDoc for public APIs when the name and types don't say enough, and put longer rationale in an ADR.

## Releasing

Publishing to npm is driven by GitHub Releases (`.github/workflows/release.yml`). It authenticates with npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), so no npm token is stored in GitHub.

One-time setup:

- **npmjs.com:** in the package **Settings**, add a **Trusted Publisher** for GitHub Actions:

  | Field | Value |
  |---|---|
  | Organization | `LAppStudio` |
  | Repository | `react-toast-engine` |
  | Workflow | `release.yml` |
  | Environment | `npm` |

- **GitHub:** under **Settings → Environments**, create `npm` and allow deployments from tags matching `v*`.

To release:

1. Bump `version` in `package.json`, rename `## Unreleased` in `CHANGELOG.md` to `## <version>`, and merge both into `main`.
2. Create a GitHub Release from `main` with the tag `v<version>`, for example `v0.2.0`.
   - Stable versions (`0.1.0`) are published as `latest`.
   - Pre-release versions (`0.1.0-next.1`) must have **Set as a pre-release** checked, and are published as `next`.
3. The workflow runs the full CI and publishes with npm provenance. It also attaches the package tarball to the release.

When creating the release, **Generate release notes** groups the merged pull requests by label, as configured in `.github/release.yml`:

| Label | Section |
|---|---|
| `breaking` | 💥 Breaking Changes |
| `enhancement` | ✨ Features |
| `bug` | 🐛 Bug Fixes |
| `documentation` | 📚 Documentation |
| `dependencies` | 📦 Dependencies |
| `ignore-for-release` | left out |
| anything else | 🔧 Other Changes |

`enhancement`, `bug` and `documentation` are GitHub defaults. Create `breaking`, `dependencies` and `ignore-for-release` once under **Issues → Labels**. Label each pull request before merging it, and paste the matching `CHANGELOG.md` section at the top of the notes.

The release fails, without publishing anything, when:

- the tag is not on `main`;
- the tag does not match `package.json`;
- the pre-release checkbox does not match the version;
- the version is already on npm.

The example apps are not part of the package: `files` in `package.json` limits it to `dist/`. Check with `npm pack --dry-run`.
