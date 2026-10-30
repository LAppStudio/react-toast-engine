import { MotionToastItem } from "./drivers/motion/motion-toast-item";
import {
  createWebPoolRenderer,
  type WebPoolRendererOptions,
} from "./shell/create-web-pool-renderer";

export { MotionToastItem };
export type { WebPoolRendererOptions } from "./shell/create-web-pool-renderer";

export const createPoolRenderer = (options?: WebPoolRendererOptions) =>
  createWebPoolRenderer(MotionToastItem, options);

export const PoolRenderer = createPoolRenderer();
