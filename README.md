# React Toast Engine 🍞

[![npm version](https://img.shields.io/npm/v/@lapp-studio/react-toast-engine.svg?style=flat-square)](https://www.npmjs.com/package/@lapp-studio/react-toast-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**React Toast Engine** is a headless toast engine for **React** and **React Native**.

It separates state (powered by [Zustand](https://github.com/pmndrs/zustand)) from rendering, so the same notification logic runs on web and mobile. You bring the toast UI; the engine handles stacking, timing, gestures and animations through the animation library your app already uses.

## ✨ Key Features

- 🌐 **Web and mobile:** one client, four interchangeable animation drivers.
- 🎛️ **Bring your own animation library:** `Animated` or Reanimated on React Native, vanilla DOM or Motion on the web. You choose by import path, and only that driver ends up in your bundle.
- 👆 **Gestures that follow your finger:** swipe and horizontal scroll move the toast 1:1, and releasing hands the gesture's velocity to the animation.
- ✋ **You can change your mind:** stop, slow down or move back before releasing, and the toast springs back instead of being dismissed.
- 🏗️ **100% headless:** your components, your styles. The engine provides the data and `actions.dismiss()`.
- 🧭 **Smart providers:** nested providers (for example, inside a modal) take over rendering without remounting your app.
- ♿ **Accessible:** live regions on the web, Escape to dismiss, pause on hover and focus, and reduced-motion support.

---

## 📦 Installation

```bash
npm i @lapp-studio/react-toast-engine zustand
# or
yarn add @lapp-studio/react-toast-engine zustand
```

Then add the packages needed by the driver you pick:

| Import | Driver | Install |
|---|---|---|
| `@lapp-studio/react-toast-engine/native` | React Native `Animated` (default) | nothing else |
| `@lapp-studio/react-toast-engine/native/reanimated` | Reanimated 4 + Gesture Handler | `react-native-reanimated react-native-gesture-handler react-native-worklets` |
| `@lapp-studio/react-toast-engine/web` | Vanilla DOM (default) | `react-dom` |
| `@lapp-studio/react-toast-engine/web/motion` | [Motion](https://motion.dev) | `react-dom motion` |

All platform packages are optional peer dependencies, so a web app never installs React Native, and the default native driver needs nothing beyond `react-native`.

### Requirements

| Package | Version |
|---|---|
| `react` / `react-dom` | 18.2+ or 19 |
| `zustand` | 5 |
| `react-native` | 0.74+ |
| `react-native-reanimated` | 4 (with `react-native-worklets` and its Babel plugin configured) |
| `react-native-gesture-handler` | 2.20+ |
| `motion` | 11+ |

### Choosing a driver

- **`/native`**: zero extra dependencies. Gestures run on the JS thread, so they can stutter while the app is busy.
- **`/native/reanimated`**: gestures and animations run on the UI thread. Pick it if the app already uses Reanimated.
- **`/web`**: no dependencies beyond `react-dom`. Uses Pointer Events, CSS transitions and a small spring.
- **`/web/motion`**: pick it if the app already uses Motion, so animations share its frame loop.

All four behave the same: same gestures, same dismissal rules, same springs.

---

## 🚀 Quick Start

### 1. Create the client

```tsx
// src/lib/toasts.ts
import { createToastsClient } from "@lapp-studio/react-toast-engine";
import { PoolRenderer } from "@lapp-studio/react-toast-engine/web";
// React Native: "@lapp-studio/react-toast-engine/native"
// React Native + Reanimated: "@lapp-studio/react-toast-engine/native/reanimated"
// Web + Motion: "@lapp-studio/react-toast-engine/web/motion"

import { ErrorToast, InfoToast, SuccessToast } from "./components";

export const { store, utilities, renderer } = createToastsClient({
  components: {
    success: SuccessToast,
    error: ErrorToast,
    info: InfoToast,
  },
  PoolRenderer,
  storeSettings: { poolLimit: 5 },
  defaults: { durationInMs: 4000 },
});
```

### 2. Wrap your app with the Provider

```tsx
import { renderer } from "./lib/toasts";

export function App() {
  return (
    <renderer.Provider>
      <MainScreen />
    </renderer.Provider>
  );
}
```

With the Reanimated driver, the app must also be wrapped in `GestureHandlerRootView`, as Gesture Handler requires.

### 3. Show toasts

**Inside components:**

```tsx
import { utilities } from "./lib/toasts";

export const SaveButton = () => {
  const stack = utilities.hooks.useStackToast();

  return (
    <button
      onClick={() =>
        stack({
          infoType: "success",
          title: "Saved!",
          description: "Profile updated.",
        })
      }
    >
      Save
    </button>
  );
};
```

**Anywhere else, such as API interceptors:**

```ts
import { utilities } from "./lib/toasts";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    utilities.helpers.stack({
      infoType: "error",
      title: "Connection error",
      description: error.message,
      durationInMs: 5000,
    });
    return Promise.reject(error);
  },
);
```

**Updating a toast,** for example "loading → done":

```ts
const id = utilities.helpers.stack({
  infoType: "info",
  title: "Uploading…",
  durationInMs: Infinity,
});

await upload();

utilities.helpers.update(id, {
  infoType: "success",
  title: "Uploaded",
  durationInMs: 3000,
});
```

| Helper / hook | Description |
|---|---|
| `stack(toast)` / `useStackToast()` | Adds a toast and returns its `id`. |
| `update(id, patch)` / `useUpdateToast()` | Changes an open toast and restarts its timer. |
| `close(id)` / `useCloseToast()` | Closes a toast with its exit animation. |
| `remove(id)` / `useRemoveToast()` | Removes a toast immediately, without animation. |
| `pop()` | Closes the oldest open toast. |
| `clear()` | Closes every open toast. |
| `useToastsPool()` | Subscribes to the list of toasts. |

---

## 🎨 Creating Toast Components

Components receive the `toast` and an `actions` object. Tapping or clicking the toast and swiping it are handled by the engine; `actions.dismiss()` lets you add your own close button.

```tsx
import type { ToastComponentProps } from "@lapp-studio/react-toast-engine";

export const SuccessToast = ({ toast, actions }: ToastComponentProps) => (
  <div className="toast toast--success">
    <strong>{toast.title}</strong>
    {toast.description && <p>{toast.description}</p>}
    <button aria-label="Close" onClick={actions.dismiss}>
      ×
    </button>
  </div>
);
```

The same component in React Native:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ToastComponentProps } from "@lapp-studio/react-toast-engine";

export const SuccessToast = ({ toast, actions }: ToastComponentProps) => (
  <View style={styles.toast}>
    <View style={styles.content}>
      <Text style={styles.title}>{toast.title}</Text>
      {toast.description && <Text style={styles.text}>{toast.description}</Text>}
    </View>
    <Pressable accessibilityLabel="Close" onPress={actions.dismiss}>
      <Text style={styles.text}>×</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  toast: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 12, backgroundColor: "#15803d" },
  content: { flex: 1 },
  title: { color: "white", fontWeight: "600" },
  text: { color: "white" },
});
```

### Callbacks

Pass `actions` per toast, or in `defaults` for all of them:

```ts
utilities.helpers.stack({
  infoType: "info",
  title: "New message",
  actions: {
    onPress: (toast) => openInbox(),
    onDismiss: (toast) => markAsSeen(),
    onAutoClose: (toast) => track("toast_timeout"),
  },
});
```

| Callback | Fires when |
|---|---|
| `onDismiss` | The user dismisses the toast: swipe, horizontal scroll, Escape or `actions.dismiss()`. |
| `onAutoClose` | The duration elapses. |
| `onPress` | The user taps or clicks the toast without swiping. |

Closing a toast from code (`close`, `pop`, `clear`, `poolLimit`) fires none of them.

---

## 👆 Gestures

- **Native:** drag sideways.
- **Web:** drag with mouse, touch or pen, or scroll horizontally with a trackpad or Shift + wheel.

The toast follows the gesture 1:1. What happens on release depends on the intent:

| When releasing | Result |
|---|---|
| Thrown outwards, fast | Dismissed, leaving with the gesture's velocity |
| Dragged far, then stopped | Springs back |
| Dragged slowly, however far | Springs back |
| Moved out and back towards the center | Springs back |

With horizontal scrolling there is no "release": a fast outward scroll dismisses as soon as it crosses 40% of the toast width, and anything else springs back once scrolling stops. Grabbing a toast while it springs back continues from where it is. The timer pauses while the toast is touched, hovered or focused.

Tune it with `swipe` in `createPoolRenderer`:

```ts
createPoolRenderer({
  swipe: {
    minVelocity: 500,       // px/s needed to dismiss
    minDistanceRatio: 0.1,  // minimum travel, as a fraction of the width
    stopMs: 80,             // still for longer than this = stopped
    direction: "both",      // "left" | "right" | "both"
    wheelDistanceRatio: 0.4,
    wheelIdleMs: 120,
  },
});
```

---

## ⚙️ Renderer Options

Every driver entry exports `PoolRenderer` (defaults) and `createPoolRenderer(options)`.

### React Native

```ts
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createPoolRenderer } from "@lapp-studio/react-toast-engine/native";

const PoolRenderer = createPoolRenderer({
  position: "top",               // "top" | "bottom"
  offset: 8,                     // distance from the edge, added to the inset
  horizontalInset: 12,
  useInsets: useSafeAreaInsets,  // optional; any hook returning { top, bottom, left, right }
  stack: { peek: 10, scaleStep: 0.05, visible: 3 },
});
```

### Web

```ts
import { createPoolRenderer } from "@lapp-studio/react-toast-engine/web";

const PoolRenderer = createPoolRenderer({
  position: "bottom",
  offset: 16,
  width: 356,
  horizontalInset: 16,
  label: "Notifications",
  getContainer: () => document.body,
});
```

On the web, toasts are portaled into an `aria-live` region. `error` toasts use `role="alert"`, and Escape dismisses the focused toast. The renderer is SSR-safe: it mounts after hydration.

---

## 🧭 Multiple Providers

Only one provider renders the toasts: the **deepest** one and, among siblings, the **last mounted**. Put a `Provider` inside a modal and toasts will show above it while it is open, then return to the root provider, without remounting anything.

---

## 🧩 Custom Types and Data

```ts
type AppToast = "success" | "error" | "warning";
type AppData = { orderId: string };

const client = createToastsClient<AppToast, AppData>({
  components: {
    success: SuccessToast,
    error: ErrorToast,
    warning: WarningToast,
  },
  PoolRenderer,
});

client.utilities.helpers.stack({
  infoType: "warning",
  title: "Payment pending",
  data: { orderId: "42" },
});
```

---

## 🛠️ Custom Drivers

A driver is a component that receives `ToastItemDriverProps` and only animates. The core provides the timer, the dismissal rules (`resolveSwipeRelease`, `resolveWheelSwipe`), the styles (`getSwipeStyle`, `getStackLayout`) and the spring constants. Plug it in with `createNativePoolRenderer(Item, options)` or `createWebPoolRenderer(Item, options)`.

---

## 🔁 Migrating from 0.0.x

- The default `/native` driver is now `Animated`. For the previous Reanimated behaviour, import from `/native/reanimated`.
- `react-native-safe-area-context` is no longer a dependency. Pass `useInsets: useSafeAreaInsets` to `createPoolRenderer`.
- Components receive `actions.dismiss()`. `onPress` and `onDismiss` are now configured as toast `actions`, and the new `onAutoClose` is available.
- `stack` returns the toast id. `description` and `durationInMs` are optional (`durationInMs` defaults to 4000).
- `remove` still removes immediately; use `close` for an animated exit. `pop` now closes the **oldest** toast.
- The `ToastInfoType` enum was removed; types come from `createToastsClient<TType>`.
- Custom `PoolRenderer`s receive an `active` prop and must always render `children`.

---

## 📐 Architecture Decisions

- [0001 — Animation drivers chosen by entry point](docs/adr/0001-animation-drivers-by-entry-point.md)
- [0002 — Two-phase toast removal](docs/adr/0002-two-phase-toast-removal.md)
- [0003 — Swipe dismissal decided by intent at release](docs/adr/0003-swipe-release-intent.md)
- [0004 — Horizontal wheel and trackpad dismissal](docs/adr/0004-wheel-swipe-dismiss.md)
- [0005 — Which provider renders the toasts](docs/adr/0005-active-provider-selection.md)
- [0006 — Direct manipulation physics](docs/adr/0006-direct-manipulation-physics.md)

---

## 🧪 Development

```bash
yarn install
yarn dev          # build in watch mode
yarn test         # unit tests and web driver conformance suite (Vitest + jsdom)
yarn lint
yarn type-check
yarn build
yarn check:pkg    # publint + are-the-types-wrong
yarn audit:bundle # yarn audit limited to packages that ship with the bundle
```

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

### Releasing

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

1. Bump `version` in `package.json` and merge it into `main`.
2. Create a GitHub Release from `main` with the tag `v<version>`, for example `v0.1.0`.
   - Stable versions (`0.1.0`) are published as `latest`.
   - Pre-release versions (`0.1.0-next.1`) must have **Set as a pre-release** checked, and are published as `next`.
3. The workflow runs the full CI and publishes with npm provenance. It also attaches the package tarball to the release.

The release fails, without publishing anything, when:

- the tag is not on `main`;
- the tag does not match `package.json`;
- the pre-release checkbox does not match the version;
- the version is already on npm.

The web drivers share one conformance suite (`src/web/__tests__/conformance.test.tsx`). The native drivers are not covered by automated tests yet and must be checked on a device.

---

## 📄 License

MIT © L'App Studio
