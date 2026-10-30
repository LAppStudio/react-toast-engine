export type SpringConfig = {
  stiffness: number;
  damping: number;
  mass: number;
};

/**
 * Spring used by every driver when a swipe is released, so all platforms feel the same.
 * @see docs/adr/0006-direct-manipulation-physics.md
 */
export const SWIPE_SPRING: SpringConfig = {
  stiffness: 400,
  damping: 36,
  mass: 1,
};

/** Spring used by every driver to move toasts between stack positions. */
export const STACK_SPRING: SpringConfig = {
  stiffness: 300,
  damping: 30,
  mass: 1,
};

/** Duration of non-gesture exits and reduced-motion fades, in ms. */
export const EXIT_DURATION_MS = 200;

export type SpringState = {
  position: number;
  velocity: number;
};

const STEP_SECONDS = 0.001;
const MAX_FRAME_SECONDS = 0.064;
const REST_DELTA = 0.5;
const REST_SPEED = 10;

/** Advances a damped spring towards `target` by `seconds`, with velocity in units/s. */
export const stepSpring = (
  { position, velocity }: SpringState,
  target: number,
  seconds: number,
  { stiffness, damping, mass }: SpringConfig,
): SpringState => {
  const steps = Math.max(1, Math.ceil(seconds / STEP_SECONDS));
  const step = seconds / steps;
  let nextPosition = position;
  let nextVelocity = velocity;
  for (let index = 0; index < steps; index++) {
    const force =
      -stiffness * (nextPosition - target) - damping * nextVelocity;
    nextVelocity += (force / mass) * step;
    nextPosition += nextVelocity * step;
  }
  return { position: nextPosition, velocity: nextVelocity };
};

export const isSpringAtRest = ({ position, velocity }: SpringState, target: number) =>
  Math.abs(position - target) < REST_DELTA && Math.abs(velocity) < REST_SPEED;

export type FrameScheduler = {
  request: (callback: (time: number) => void) => number;
  cancel: (handle: number) => void;
};

const animationFrameScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
};

export type SpringAnimationOptions = {
  from: number;
  to: number;
  /** Initial velocity, in units/s. */
  velocity?: number;
  config?: SpringConfig;
  onUpdate: (position: number) => void;
  onComplete?: () => void;
  scheduler?: FrameScheduler;
};

export type SpringAnimation = {
  /** Stops the spring where it is and returns that position. `onComplete` is not called. */
  cancel: () => number;
};

/**
 * Frame-driven spring that starts with the given velocity and can be interrupted.
 * Used where the platform has no spring with initial velocity (vanilla web).
 */
export const createSpring = ({
  from,
  to,
  velocity = 0,
  config = SWIPE_SPRING,
  onUpdate,
  onComplete,
  scheduler = animationFrameScheduler,
}: SpringAnimationOptions): SpringAnimation => {
  let state: SpringState = { position: from, velocity };
  let lastTime: number | undefined;
  let handle: number | undefined;

  const tick = (time: number) => {
    const seconds =
      lastTime === undefined
        ? 1 / 60
        : Math.min((time - lastTime) / 1000, MAX_FRAME_SECONDS);
    lastTime = time;
    state = stepSpring(state, to, seconds, config);
    if (isSpringAtRest(state, to)) {
      handle = undefined;
      state = { position: to, velocity: 0 };
      onUpdate(to);
      onComplete?.();
      return;
    }
    onUpdate(state.position);
    handle = scheduler.request(tick);
  };

  handle = scheduler.request(tick);

  return {
    cancel: () => {
      if (handle !== undefined) scheduler.cancel(handle);
      handle = undefined;
      return state.position;
    },
  };
};
