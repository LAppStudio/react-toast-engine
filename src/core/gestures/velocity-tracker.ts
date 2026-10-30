const DEFAULT_WINDOW_MS = 100;
const MOVEMENT_THRESHOLD = 0.5;

type Sample = {
  position: number;
  time: number;
};

export type VelocityTracker = {
  add: (position: number, time: number) => void;
  /**
   * Velocity of the latest movement, in px/s.
   * @param now When given, samples older than the window at that moment are ignored, so a held pointer reads as zero.
   */
  velocity: (now?: number) => number;
  /** Time since the last real movement, in ms. */
  idleMs: (now: number) => number;
  reset: () => void;
};

/**
 * Measures velocity over a sliding window that restarts whenever the direction reverses,
 * so heading back or stopping before release reads as such.
 * @see docs/adr/0003-swipe-release-intent.md
 */
export const createVelocityTracker = (
  windowMs = DEFAULT_WINDOW_MS,
): VelocityTracker => {
  let samples: Sample[] = [];
  let direction = 0;
  let lastMoveTime: number | undefined;

  return {
    add: (position, time) => {
      const previous = samples.at(-1);
      const delta = previous ? position - previous.position : 0;
      if (!previous || Math.abs(delta) > MOVEMENT_THRESHOLD) lastMoveTime = time;
      if (previous && Math.abs(delta) > MOVEMENT_THRESHOLD) {
        const nextDirection = Math.sign(delta);
        if (direction !== 0 && nextDirection !== direction) samples = [previous];
        direction = nextDirection;
      }
      samples = [...samples, { position, time }].filter(
        (sample) => time - sample.time <= windowMs,
      );
    },
    velocity: (now) => {
      const recent =
        now === undefined
          ? samples
          : samples.filter((sample) => now - sample.time <= windowMs);
      const first = recent.at(0);
      const last = recent.at(-1);
      if (!first || !last || last.time === first.time) return 0;
      return ((last.position - first.position) / (last.time - first.time)) * 1000;
    },
    idleMs: (now) => (lastMoveTime === undefined ? 0 : now - lastMoveTime),
    reset: () => {
      samples = [];
      direction = 0;
      lastMoveTime = undefined;
    },
  };
};
