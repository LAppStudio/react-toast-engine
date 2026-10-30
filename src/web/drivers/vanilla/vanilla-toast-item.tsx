import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createSpring,
  EXIT_DURATION_MS,
  type SpringAnimation,
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
import { useIsomorphicLayoutEffect } from "../../../core/utils/use-isomorphic-layout-effect";
import { useLatest } from "../../../core/utils/use-latest";
import { getItemAccessibilityProps } from "../../shared/use-item-accessibility";
import { useWheelSwipe } from "../../shared/use-wheel-swipe";

const CLICK_SLOP = 5;
const STACK_TRANSITION = "300ms cubic-bezier(0.2, 0.8, 0.2, 1)";
const EXIT_TRANSITION = `${EXIT_DURATION_MS}ms ease-in`;

type PointerSession = {
  id: number;
  startX: number;
  origin: number;
  dragging: boolean;
};

export const VanillaToastItem = (props: ToastItemDriverProps) => {
  const { toast, index, position, placement, stack, swipe, reducedMotion } =
    props;
  const latest = useLatest(props);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const spring = useRef<SpringAnimation | null>(null);
  const pointer = useRef<PointerSession | null>(null);
  const suppressClick = useRef(false);
  const swiped = useRef(false);
  const tracker = useState(() => createVelocityTracker())[0];
  const [shown, setShown] = useState(false);
  const [exiting, setExiting] = useState(false);
  const interactive = toast.status === "open" && index === 0;

  const getWidth = () => innerRef.current?.offsetWidth ?? 0;

  const apply = (value: number) => {
    x.current = value;
    const element = innerRef.current;
    if (!element) return;
    const style = getSwipeStyle(
      value,
      getWidth(),
      latest.current.swipe.direction,
    );
    element.style.transform = `translate3d(${style.translateX}px, 0, 0)`;
    element.style.opacity = String(style.opacity);
  };

  const stopSpring = () => {
    const running = spring.current;
    if (!running) return;
    spring.current = null;
    apply(running.cancel());
    latest.current.onInteractionEnd();
  };

  const settle = (velocity: number) => {
    if (x.current === 0) {
      latest.current.onInteractionEnd();
      return;
    }
    spring.current = createSpring({
      from: x.current,
      to: 0,
      velocity,
      onUpdate: apply,
      onComplete: () => {
        spring.current = null;
        latest.current.onInteractionEnd();
      },
    });
  };

  const leave = (velocity: number) => {
    const { onDismiss, onInteractionEnd, onExited } = latest.current;
    swiped.current = true;
    onDismiss();
    onInteractionEnd();
    const element = innerRef.current;
    if (latest.current.reducedMotion && element) {
      element.style.transition = `opacity ${EXIT_TRANSITION}`;
      element.style.opacity = "0";
      setTimeout(() => latest.current.onExited(), EXIT_DURATION_MS);
      return;
    }
    spring.current = createSpring({
      from: x.current,
      to: getSwipeExitTarget(x.current, velocity, getWidth()),
      velocity,
      onUpdate: apply,
      onComplete: onExited,
    });
  };

  useWheelSwipe(innerRef, {
    enabled: interactive,
    swipe,
    getWidth,
    getX: () => x.current,
    setX: apply,
    onStart: () => {
      stopSpring();
      latest.current.onInteractionStart();
    },
    onDismiss: leave,
    onRelease: settle,
  });

  useIsomorphicLayoutEffect(() => {
    outerRef.current?.getBoundingClientRect();
    setShown(true);
  }, []);

  useEffect(() => {
    if (toast.status !== "closing" || swiped.current) return;
    setExiting(true);
    const timeout = setTimeout(
      () => latest.current.onExited(),
      EXIT_DURATION_MS,
    );
    return () => clearTimeout(timeout);
  }, [toast.status, latest]);

  useEffect(() => () => void spring.current?.cancel(), []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactive || event.button !== 0 || pointer.current) return;
    suppressClick.current = false;
    stopSpring();
    latest.current.onInteractionStart();
    pointer.current = {
      id: event.pointerId,
      startX: event.clientX,
      origin: x.current,
      dragging: false,
    };
    tracker.reset();
    tracker.add(x.current, event.timeStamp);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const session = pointer.current;
    if (!session || session.id !== event.pointerId) return;
    const dx = event.clientX - session.startX;
    if (!session.dragging && Math.abs(dx) < CLICK_SLOP) return;
    session.dragging = true;
    apply(session.origin + dx);
    tracker.add(x.current, event.timeStamp);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const session = pointer.current;
    if (!session || session.id !== event.pointerId) return;
    pointer.current = null;
    if (!session.dragging) {
      settle(0);
      return;
    }
    suppressClick.current = true;
    const { swipe } = latest.current;
    const idleMs = tracker.idleMs(event.timeStamp);
    const velocityX = getReleaseVelocity(
      tracker.velocity(event.timeStamp),
      idleMs,
      swipe,
    );
    const result = resolveSwipeRelease(
      { x: x.current, velocityX, idleMs, width: getWidth() },
      swipe,
    );
    if (result === "dismiss") leave(velocityX);
    else settle(velocityX);
  };

  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    settle(0);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const hidden = !shown || exiting;
  const layout = getStackLayout(
    hidden && !reducedMotion ? -1 : index,
    position,
    stack,
  );
  const fadedOut = hidden && reducedMotion;
  const transition = exiting ? EXIT_TRANSITION : STACK_TRANSITION;

  const outerStyle: CSSProperties = {
    position: "absolute",
    ...placement,
    zIndex: getStackZIndex(index, toast.status === "closing"),
    pointerEvents: interactive ? "auto" : "none",
    transformOrigin: position === "top" ? "center bottom" : "center top",
    transform: `translateY(${layout.translateY}px) scale(${layout.scale})`,
    opacity: fadedOut ? 0 : layout.opacity,
    transition: reducedMotion
      ? `opacity ${transition}`
      : `transform ${transition}, opacity ${transition}`,
  };

  const innerStyle: CSSProperties = {
    touchAction: "pan-y",
    userSelect: "none",
  };

  return (
    <div
      ref={outerRef}
      style={outerStyle}
      {...getItemAccessibilityProps(props)}
    >
      <div
        ref={innerRef}
        style={innerStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={onClickCapture}
        onClick={() => interactive && latest.current.onPress()}
      >
        {props.children}
      </div>
    </div>
  );
};
