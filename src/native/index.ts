import { AnimatedToastItem } from "./drivers/animated/animated-toast-item";
import {
  createNativePoolRenderer,
  type NativePoolRendererOptions,
} from "./shell/create-native-pool-renderer";

export { AnimatedToastItem };
export type { EdgeInsets, NativePoolRendererOptions } from "./shell/create-native-pool-renderer";
export { createNativePoolRenderer };

export const createPoolRenderer = (options?: NativePoolRendererOptions) =>
  createNativePoolRenderer(AnimatedToastItem, options);

export const PoolRenderer = createPoolRenderer();
