export type SwipeDirection = "both" | "left" | "right";

export type SwipeDismissConfig = {
  /**
   * Minimum outward velocity, in px/s, for a release to dismiss.
   * @default 500
   */
  minVelocity?: number;
  /**
   * Minimum travel, as a fraction of the toast width, for a release to dismiss.
   * @default 0.1
   */
  minDistanceRatio?: number;
  /**
   * Time without movement, in ms, after which the gesture counts as stopped.
   * @default 80
   */
  stopMs?: number;
  /**
   * Directions that can dismiss. The other one moves with resistance.
   * @default "both"
   */
  direction?: SwipeDirection;
  /**
   * Travel, as a fraction of the toast width, at which an outward wheel gesture dismisses.
   * @default 0.4
   */
  wheelDistanceRatio?: number;
  /**
   * Time without wheel events, in ms, after which the toast springs back.
   * @default 120
   */
  wheelIdleMs?: number;
};

export type ResolvedSwipeDismissConfig = Required<SwipeDismissConfig>;

export const DEFAULT_SWIPE_CONFIG: ResolvedSwipeDismissConfig = {
  minVelocity: 500,
  minDistanceRatio: 0.1,
  stopMs: 80,
  direction: "both",
  wheelDistanceRatio: 0.4,
  wheelIdleMs: 120,
};

export const resolveSwipeConfig = (
  config: SwipeDismissConfig = {},
): ResolvedSwipeDismissConfig => ({ ...DEFAULT_SWIPE_CONFIG, ...config });

export const isDirectionAllowed = (x: number, direction: SwipeDirection) => {
  "worklet";
  if (direction === "both") return true;
  return direction === "left" ? x < 0 : x > 0;
};
