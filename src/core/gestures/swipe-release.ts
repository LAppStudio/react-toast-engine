import {
  isDirectionAllowed,
  type ResolvedSwipeDismissConfig,
} from "./swipe-config";

export type SwipeReleaseInput = {
  /** Horizontal offset of the toast, in px. */
  x: number;
  /** Horizontal velocity at release, in px/s. */
  velocityX: number;
  /** Time since the last real movement, in ms. */
  idleMs: number;
  /** Width of the toast, in px. */
  width: number;
};

export type SwipeReleaseResult = "dismiss" | "cancel";

/**
 * Velocity to hand over to the release animation: zero once the gesture has stopped for longer than `stopMs`.
 * @see docs/adr/0003-swipe-release-intent.md
 */
export const getReleaseVelocity = (
  velocityX: number,
  idleMs: number,
  config: ResolvedSwipeDismissConfig,
) => {
  "worklet";
  return idleMs > config.stopMs ? 0 : velocityX;
};

/**
 * Decides whether releasing a swipe dismisses the toast.
 * Stopping, moving slowly or heading back towards the origin cancels it.
 * @see docs/adr/0003-swipe-release-intent.md
 */
export const resolveSwipeRelease = (
  { x, velocityX, idleMs, width }: SwipeReleaseInput,
  config: ResolvedSwipeDismissConfig,
): SwipeReleaseResult => {
  "worklet";
  const velocity = getReleaseVelocity(velocityX, idleMs, config);
  if (x === 0 || Math.sign(velocity) !== Math.sign(x)) return "cancel";
  if (Math.abs(velocity) < config.minVelocity) return "cancel";
  if (Math.abs(x) < width * config.minDistanceRatio) return "cancel";
  if (!isDirectionAllowed(x, config.direction)) return "cancel";
  return "dismiss";
};

export type WheelSwipeInput = Omit<SwipeReleaseInput, "idleMs">;

export type WheelSwipeResult = "dismiss" | "track";

/**
 * Decides, on every wheel event, whether the gesture already dismisses the toast.
 * Wheel input has no release, so an outward, fast and long gesture dismisses mid-way.
 * @see docs/adr/0004-wheel-swipe-dismiss.md
 */
export const resolveWheelSwipe = (
  { x, velocityX, width }: WheelSwipeInput,
  config: ResolvedSwipeDismissConfig,
): WheelSwipeResult => {
  "worklet";
  if (x === 0 || Math.sign(velocityX) !== Math.sign(x)) return "track";
  if (Math.abs(velocityX) < config.minVelocity) return "track";
  if (!isDirectionAllowed(x, config.direction)) return "track";
  return Math.abs(x) >= width * config.wheelDistanceRatio ? "dismiss" : "track";
};
