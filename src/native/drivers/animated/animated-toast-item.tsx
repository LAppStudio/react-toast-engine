import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  PanResponder,
  type PanResponderGestureState,
  Pressable,
  StyleSheet,
} from "react-native";

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
  getSwipeInterpolation,
} from "../../../core/gestures/swipe-style";
import { createVelocityTracker } from "../../../core/gestures/velocity-tracker";
import {
  getStackInterpolation,
  getStackZIndex,
} from "../../../core/lifecycle/stack-layout";
import type { ToastItemDriverProps } from "../../../core/types/toast-item-driver";
import { useLatest } from "../../../core/utils/use-latest";

const ACTIVATION_DISTANCE = 10;

type Animation = (finished: boolean) => void;

const useAnimatedValue = (initial: number) =>
  useState(() => new Animated.Value(initial))[0];

export const AnimatedToastItem = (props: ToastItemDriverProps) => {
  const { toast, index, position, placement, stack, swipe, reducedMotion } =
    props;
  const latest = useLatest(props);
  const x = useAnimatedValue(0);
  const depth = useAnimatedValue(reducedMotion ? index : -1);
  const fade = useAnimatedValue(reducedMotion ? 0 : 1);
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const offset = useRef(0);
  const lastDx = useRef(0);
  const tracker = useState(() => createVelocityTracker())[0];
  const swiped = useRef(false);
  const interactive = toast.status === "open" && index === 0;

  const settle = (velocity: number) => {
    Animated.spring(x, {
      toValue: 0,
      velocity,
      ...SWIPE_SPRING,
      useNativeDriver: true,
    }).start(() => latest.current.onInteractionEnd());
  };

  const leave = (from: number, velocity: number) => {
    const done: Animation = (finished) => {
      if (finished) latest.current.onExited();
    };
    if (latest.current.reducedMotion) {
      Animated.timing(fade, {
        toValue: 0,
        duration: EXIT_DURATION_MS,
        useNativeDriver: true,
      }).start(({ finished }) => done(finished));
      return;
    }
    Animated.spring(x, {
      toValue: getSwipeExitTarget(from, velocity, widthRef.current),
      velocity,
      ...SWIPE_SPRING,
      overshootClamping: true,
      useNativeDriver: true,
    }).start(({ finished }) => done(finished));
  };

  const release = (
    event: GestureResponderEvent,
    gesture: PanResponderGestureState,
  ) => {
    x.flattenOffset();
    const { swipe } = latest.current;
    const now = event.nativeEvent.timestamp;
    const value = offset.current + gesture.dx;
    const idleMs = tracker.idleMs(now);
    const velocityX = getReleaseVelocity(tracker.velocity(now), idleMs, swipe);
    const result = resolveSwipeRelease(
      { x: value, velocityX, idleMs, width: widthRef.current },
      swipe,
    );
    if (result === "cancel") {
      settle(velocityX);
      return;
    }
    swiped.current = true;
    latest.current.onDismiss();
    latest.current.onInteractionEnd();
    leave(value, velocityX);
  };

  const responder = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        latest.current.toast.status === "open" &&
        latest.current.index === 0 &&
        Math.abs(gesture.dx) > ACTIVATION_DISTANCE &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        latest.current.onInteractionStart();
        lastDx.current = 0;
        tracker.reset();
        x.stopAnimation((value) => {
          offset.current = value;
          x.setOffset(value);
          x.setValue(lastDx.current);
        });
      },
      onPanResponderMove: (event, gesture) => {
        tracker.add(gesture.dx, event.nativeEvent.timestamp);
        lastDx.current = gesture.dx;
        x.setValue(gesture.dx);
      },
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
    }),
  )[0];

  useEffect(() => {
    if (reducedMotion) {
      Animated.timing(fade, {
        toValue: 1,
        duration: EXIT_DURATION_MS,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  useEffect(() => {
    if (toast.status !== "open") return;
    Animated.spring(depth, {
      toValue: index,
      ...STACK_SPRING,
      useNativeDriver: true,
    }).start();
  }, [depth, index, toast.status]);

  useEffect(() => {
    if (toast.status !== "closing" || swiped.current) return;
    const animation = reducedMotion
      ? Animated.timing(fade, {
          toValue: 0,
          duration: EXIT_DURATION_MS,
          useNativeDriver: true,
        })
      : Animated.timing(depth, {
          toValue: -1,
          duration: EXIT_DURATION_MS,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        });
    animation.start(({ finished }) => {
      if (finished) latest.current.onExited();
    });
  }, [toast.status]);

  const swipeStyle = useMemo(() => {
    const ranges = getSwipeInterpolation(width, swipe.direction);
    return {
      opacity: x.interpolate({ ...ranges.opacity, extrapolate: "clamp" }),
      transform: [{ translateX: x.interpolate(ranges.translateX) }],
    };
  }, [x, width, swipe.direction]);

  const stackStyle = useMemo(() => {
    const ranges = getStackInterpolation(position, stack);
    return {
      opacity: Animated.multiply(
        depth.interpolate({ ...ranges.opacity, extrapolate: "clamp" }),
        fade,
      ),
      transform: [
        { translateY: depth.interpolate(ranges.translateY) },
        { scale: depth.interpolate({ ...ranges.scale, extrapolate: "clamp" }) },
      ],
    };
  }, [depth, fade, position, stack]);

  const onLayout = (event: LayoutChangeEvent) => {
    widthRef.current = event.nativeEvent.layout.width;
    setWidth(widthRef.current);
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
      <Animated.View
        onLayout={onLayout}
        style={swipeStyle}
        {...responder.panHandlers}
      >
        <Pressable onPress={() => latest.current.onPress()}>
          {props.children}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  item: {
    position: "absolute",
  },
});
