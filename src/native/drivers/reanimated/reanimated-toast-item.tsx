import { useEffect, useMemo } from "react";
import { type LayoutChangeEvent, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  EXIT_DURATION_MS,
  STACK_SPRING,
  SWIPE_SPRING,
} from "../../../core/gestures/spring";
import {
  getReleaseVelocity,
  resolveSwipeRelease,
} from "../../../core/gestures/swipe-release";
import {
  getSwipeExitTarget,
  getSwipeStyle,
} from "../../../core/gestures/swipe-style";
import {
  getStackLayout,
  getStackZIndex,
} from "../../../core/lifecycle/stack-layout";
import type { ToastItemDriverProps } from "../../../core/types/toast-item-driver";

const ACTIVATION_DISTANCE = 10;

export const ReanimatedToastItem = ({
  toast,
  index,
  position,
  placement,
  stack,
  swipe,
  reducedMotion,
  onInteractionStart,
  onInteractionEnd,
  onDismiss,
  onPress,
  onExited,
  children,
}: ToastItemDriverProps) => {
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const width = useSharedValue(0);
  const lastMoveAt = useSharedValue(0);
  const activated = useSharedValue(false);
  const swiped = useSharedValue(false);
  const depth = useSharedValue(reducedMotion ? index : -1);
  const fade = useSharedValue(reducedMotion ? 0 : 1);
  const interactive = toast.status === "open" && index === 0;

  useEffect(() => {
    if (reducedMotion) fade.value = withTiming(1, { duration: EXIT_DURATION_MS });
  }, []);

  useEffect(() => {
    if (toast.status !== "open") return;
    depth.value = withSpring(index, STACK_SPRING);
  }, [index, toast.status]);

  useEffect(() => {
    if (toast.status !== "closing" || swiped.value) return;
    const finish = (finished?: boolean) => {
      "worklet";
      if (finished) scheduleOnRN(onExited);
    };
    if (reducedMotion) {
      fade.value = withTiming(0, { duration: EXIT_DURATION_MS }, finish);
      return;
    }
    depth.value = withTiming(
      -1,
      { duration: EXIT_DURATION_MS, easing: Easing.in(Easing.ease) },
      finish,
    );
  }, [toast.status]);

  const gesture = useMemo(() => {
    const settle = (velocity: number) => {
      "worklet";
      x.value = withSpring(0, { ...SWIPE_SPRING, velocity }, () => {
        scheduleOnRN(onInteractionEnd);
      });
    };

    const leave = (velocity: number) => {
      "worklet";
      const finish = (finished?: boolean) => {
        "worklet";
        if (finished) scheduleOnRN(onExited);
      };
      if (reducedMotion) {
        fade.value = withTiming(0, { duration: EXIT_DURATION_MS }, finish);
        return;
      }
      x.value = withSpring(
        getSwipeExitTarget(x.value, velocity, width.value),
        { ...SWIPE_SPRING, velocity, overshootClamping: true },
        finish,
      );
    };

    const pan = Gesture.Pan()
      .enabled(interactive)
      .activeOffsetX([-ACTIVATION_DISTANCE, ACTIVATION_DISTANCE])
      .failOffsetY([-ACTIVATION_DISTANCE, ACTIVATION_DISTANCE])
      .onBegin(() => {
        cancelAnimation(x);
        start.value = x.value;
        lastMoveAt.value = Date.now();
        scheduleOnRN(onInteractionStart);
      })
      .onStart(() => {
        activated.value = true;
      })
      .onChange((event) => {
        if (Math.abs(event.changeX) > 0.5) lastMoveAt.value = Date.now();
        x.value = start.value + event.translationX;
      })
      .onFinalize((event) => {
        if (!activated.value) {
          settle(0);
          return;
        }
        activated.value = false;
        const idleMs = Date.now() - lastMoveAt.value;
        const velocityX = getReleaseVelocity(event.velocityX, idleMs, swipe);
        const result = resolveSwipeRelease(
          { x: x.value, velocityX, idleMs, width: width.value },
          swipe,
        );
        if (result === "cancel") {
          settle(velocityX);
          return;
        }
        swiped.value = true;
        scheduleOnRN(onDismiss);
        scheduleOnRN(onInteractionEnd);
        leave(velocityX);
      });

    const tap = Gesture.Tap()
      .enabled(interactive)
      .onEnd((_, success) => {
        if (success) scheduleOnRN(onPress);
      });

    return Gesture.Exclusive(pan, tap);
  }, [interactive, swipe, reducedMotion, onInteractionStart, onInteractionEnd, onDismiss, onPress, onExited]);

  const stackStyle = useAnimatedStyle(() => {
    const layout = getStackLayout(depth.value, position, stack);
    return {
      opacity: layout.opacity * fade.value,
      transform: [{ translateY: layout.translateY }, { scale: layout.scale }],
    };
  });

  const swipeStyle = useAnimatedStyle(() => {
    const style = getSwipeStyle(x.value, width.value, swipe.direction);
    return {
      opacity: style.opacity,
      transform: [{ translateX: style.translateX }],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    width.value = event.nativeEvent.layout.width;
  };

  return (
    <Animated.View
      pointerEvents={interactive ? "auto" : "none"}
      style={[
        styles.item,
        placement,
        { zIndex: getStackZIndex(index, toast.status === "closing") },
        stackStyle,
      ]}
    >
      <GestureDetector gesture={gesture}>
        <Animated.View onLayout={onLayout} style={swipeStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  item: {
    position: "absolute",
  },
});
