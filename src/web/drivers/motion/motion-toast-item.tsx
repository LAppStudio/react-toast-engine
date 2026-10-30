import {
  animate,
  type AnimationPlaybackControls,
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

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
import { createVelocityTracker } from "../../../core/gestures/velocity-tracker";
import {
  getStackLayout,
  getStackZIndex,
} from "../../../core/lifecycle/stack-layout";
import type { ToastItemDriverProps } from "../../../core/types/toast-item-driver";
import { useLatest } from "../../../core/utils/use-latest";
import { getItemAccessibilityProps } from "../../shared/use-item-accessibility";
import { useWheelSwipe } from "../../shared/use-wheel-swipe";

const toMotionLayout = (layout: ReturnType<typeof getStackLayout>) => ({
  y: layout.translateY,
  scale: layout.scale,
  opacity: layout.opacity,
});

export const MotionToastItem = (props: ToastItemDriverProps) => {
  const { toast, index, position, placement, stack, swipe, reducedMotion } =
    props;
  const latest = useLatest(props);
  const innerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const fade = useMotionValue(1);
  const settling = useRef<AnimationPlaybackControls | null>(null);
  const pressed = useRef(false);
  const panning = useRef(false);
  const origin = useRef(0);
  const tracker = useState(() => createVelocityTracker())[0];
  const swiped = useRef(false);
  const suppressClick = useRef(false);
  const interactive = toast.status === "open" && index === 0;

  const getWidth = () => innerRef.current?.offsetWidth ?? 0;

  const translateX = useTransform(
    x,
    (value) => getSwipeStyle(value, getWidth(), swipe.direction).translateX,
  );
  const opacity = useTransform(
    [x, fade],
    ([value, faded]: number[]) =>
      getSwipeStyle(value, getWidth(), swipe.direction).opacity * faded,
  );

  const stopSettle = () => {
    const running = settling.current;
    if (!running) return;
    settling.current = null;
    running.stop();
    latest.current.onInteractionEnd();
  };

  const settle = (velocity: number) => {
    if (x.get() === 0) {
      latest.current.onInteractionEnd();
      return;
    }
    const controls = animate(x, 0, {
      type: "spring",
      ...SWIPE_SPRING,
      velocity,
      onComplete: () => {
        if (settling.current !== controls) return;
        settling.current = null;
        latest.current.onInteractionEnd();
      },
    });
    settling.current = controls;
  };

  const leave = (velocity: number) => {
    const { onDismiss, onInteractionEnd, onExited } = latest.current;
    swiped.current = true;
    onDismiss();
    onInteractionEnd();
    if (latest.current.reducedMotion) {
      animate(fade, 0, {
        duration: EXIT_DURATION_MS / 1000,
        onComplete: onExited,
      });
      return;
    }
    animate(x, getSwipeExitTarget(x.get(), velocity, getWidth()), {
      type: "spring",
      ...SWIPE_SPRING,
      velocity,
      onComplete: onExited,
    });
  };

  useWheelSwipe(innerRef, {
    enabled: interactive,
    swipe,
    getWidth,
    getX: () => x.get(),
    setX: (value) => x.jump(value),
    onStart: () => {
      stopSettle();
      latest.current.onInteractionStart();
    },
    onDismiss: leave,
    onRelease: settle,
  });

  useEffect(() => () => settling.current?.stop(), []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactive || event.button !== 0 || pressed.current) return;
    suppressClick.current = false;
    stopSettle();
    latest.current.onInteractionStart();
    pressed.current = true;
    origin.current = x.get();
    tracker.reset();
    tracker.add(origin.current, event.timeStamp);
  };

  const onPointerUp = () => {
    if (!pressed.current) return;
    pressed.current = false;
    if (!panning.current) settle(0);
  };

  const onPanStart = (event: globalThis.PointerEvent, info: PanInfo) => {
    if (!pressed.current) return;
    if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) return;
    panning.current = true;
    x.set(origin.current + info.offset.x);
    tracker.add(x.get(), event.timeStamp);
  };

  const onPan = (event: globalThis.PointerEvent, info: PanInfo) => {
    if (!panning.current) return;
    x.set(origin.current + info.offset.x);
    tracker.add(x.get(), event.timeStamp);
  };

  const onPanEnd = (event: globalThis.PointerEvent) => {
    if (!panning.current) return;
    panning.current = false;
    pressed.current = false;
    suppressClick.current = true;
    const { swipe } = latest.current;
    const idleMs = tracker.idleMs(event.timeStamp);
    const velocityX = getReleaseVelocity(
      tracker.velocity(event.timeStamp),
      idleMs,
      swipe,
    );
    const result = resolveSwipeRelease(
      { x: x.get(), velocityX, idleMs, width: getWidth() },
      swipe,
    );
    if (result === "dismiss") leave(velocityX);
    else settle(velocityX);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const exiting = toast.status === "closing" && !swiped.current;
  const front = toMotionLayout(getStackLayout(index, position, stack));
  const hidden = reducedMotion
    ? { ...front, opacity: 0 }
    : toMotionLayout(getStackLayout(-1, position, stack));

  return (
    <motion.div
      initial={hidden}
      animate={exiting ? hidden : front}
      transition={
        exiting
          ? { duration: EXIT_DURATION_MS / 1000, ease: "easeIn" }
          : { type: "spring", ...STACK_SPRING }
      }
      onAnimationComplete={() => {
        if (exiting) latest.current.onExited();
      }}
      style={{
        position: "absolute",
        ...placement,
        zIndex: getStackZIndex(index, toast.status === "closing"),
        pointerEvents: interactive ? "auto" : "none",
        originY: position === "top" ? 1 : 0,
      }}
      {...getItemAccessibilityProps(props)}
    >
      <motion.div
        ref={innerRef}
        style={{
          x: translateX,
          opacity,
          touchAction: "pan-y",
          userSelect: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        onClickCapture={onClickCapture}
        onClick={() => interactive && latest.current.onPress()}
      >
        {props.children}
      </motion.div>
    </motion.div>
  );
};
