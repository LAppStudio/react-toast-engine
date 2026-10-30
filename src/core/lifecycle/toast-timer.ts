export type ToastTimer = {
  resume: () => void;
  pause: () => void;
  clear: () => void;
  remaining: () => number;
};

/** Countdown that keeps the remaining time across pauses. Non-finite durations never elapse. */
export const createToastTimer = (
  durationInMs: number,
  onElapse: () => void,
): ToastTimer => {
  let remaining = durationInMs;
  let startedAt = 0;
  let handle: ReturnType<typeof setTimeout> | undefined;
  let elapsed = false;

  const pause = () => {
    if (handle === undefined) return;
    clearTimeout(handle);
    handle = undefined;
    remaining -= Date.now() - startedAt;
  };

  const resume = () => {
    if (handle !== undefined || elapsed || !Number.isFinite(remaining)) return;
    startedAt = Date.now();
    handle = setTimeout(
      () => {
        handle = undefined;
        elapsed = true;
        remaining = 0;
        onElapse();
      },
      Math.max(0, remaining),
    );
  };

  return {
    resume,
    pause,
    clear: () => {
      pause();
      elapsed = true;
    },
    remaining: () =>
      handle === undefined ? remaining : remaining - (Date.now() - startedAt),
  };
};
