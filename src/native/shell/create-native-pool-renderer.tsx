import { StyleSheet, View } from "react-native";

import { ToastPoolItems } from "../../core/components/toast-pool-items";
import type { SwipeDismissConfig } from "../../core/gestures/swipe-config";
import type {
  StackLayoutConfig,
  ToastPosition,
} from "../../core/lifecycle/stack-layout";
import { useRendererContext } from "../../core/providers/renderer-context";
import type { ToastItemDriver } from "../../core/types/toast-item-driver";
import type { ToastsPoolRendererProps } from "../../core/types/toasts-renderer";
import { useReducedMotion } from "./use-reduced-motion";

export type EdgeInsets = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export type NativePoolRendererOptions = {
  /** @default "top" */
  position?: ToastPosition;
  /**
   * Distance from the screen edge, in px, added to the inset.
   * @default 8
   */
  offset?: number;
  /**
   * Horizontal distance from the screen sides, in px.
   * @default 12
   */
  horizontalInset?: number;
  /**
   * Hook returning the safe-area insets, such as `useSafeAreaInsets` from `react-native-safe-area-context`.
   * @default () => ({})
   */
  useInsets?: () => EdgeInsets;
  swipe?: SwipeDismissConfig;
  stack?: StackLayoutConfig;
};

const NO_INSETS: EdgeInsets = {};
const useNoInsets = () => NO_INSETS;

export const createNativePoolRenderer = (
  Item: ToastItemDriver,
  {
    position = "top",
    offset = 8,
    horizontalInset = 12,
    useInsets = useNoInsets,
    swipe,
    stack,
  }: NativePoolRendererOptions = {},
) => {
  const ToastsLayer = () => {
    const insets = useInsets();
    const reducedMotion = useReducedMotion();
    const { store } = useRendererContext();
    const hasToasts = store((state) => state.pool.length > 0);

    if (!hasToasts) return null;

    const placement = {
      [position]: offset + (insets[position] ?? 0),
      left: horizontalInset + (insets.left ?? 0),
      right: horizontalInset + (insets.right ?? 0),
    };

    return (
      <View pointerEvents="box-none" style={styles.layer}>
        <ToastPoolItems
          Item={Item}
          position={position}
          placement={placement}
          reducedMotion={reducedMotion}
          swipe={swipe}
          stack={stack}
        />
      </View>
    );
  };

  const PoolRenderer = ({ children, active }: ToastsPoolRendererProps) => (
    <View style={styles.container}>
      {children}
      {active && <ToastsLayer />}
    </View>
  );

  return PoolRenderer;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
});
