import { VanillaToastItem } from "./drivers/vanilla/vanilla-toast-item";
import {
  createWebPoolRenderer,
  type WebPoolRendererOptions,
} from "./shell/create-web-pool-renderer";

export { VanillaToastItem };
export { useWheelSwipe, type WheelSwipeOptions } from "./shared/use-wheel-swipe";
export type { WebPoolRendererOptions } from "./shell/create-web-pool-renderer";
export { createWebPoolRenderer };

export const createPoolRenderer = (options?: WebPoolRendererOptions) =>
  createWebPoolRenderer(VanillaToastItem, options);

export const PoolRenderer = createPoolRenderer();
