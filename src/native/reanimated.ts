import { ReanimatedToastItem } from "./drivers/reanimated/reanimated-toast-item";
import {
  createNativePoolRenderer,
  type NativePoolRendererOptions,
} from "./shell/create-native-pool-renderer";

export { ReanimatedToastItem };
export type { EdgeInsets, NativePoolRendererOptions } from "./shell/create-native-pool-renderer";

export const createPoolRenderer = (options?: NativePoolRendererOptions) =>
  createNativePoolRenderer(ReanimatedToastItem, options);

export const PoolRenderer = createPoolRenderer();
