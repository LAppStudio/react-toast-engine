import type { DefaultToastType } from "../core/types/toast";
import type { ToastsPool, ToastsPoolState } from "../core/types/toasts-state";

export const SET_TOASTS_POOL = "react-toast-engine/setPool";

export type SetToastsPoolAction = {
  type: typeof SET_TOASTS_POOL;
  payload: ToastsPool<string, unknown>;
};

export type ReduxStoreLike<TState> = {
  getState: () => TState;
  dispatch: (action: SetToastsPoolAction) => unknown;
  subscribe: (listener: () => void) => () => void;
};

const isSetPool = (action: { type: string }): action is SetToastsPoolAction =>
  action.type === SET_TOASTS_POOL;

/** Reducer that holds the pool. Mount it in your root reducer, e.g. under `toasts`. */
export const toastsReducer = <
  TType extends string = DefaultToastType,
  TData = unknown,
>(
  state: ToastsPool<TType, TData> = [],
  action: { type: string },
): ToastsPool<TType, TData> =>
  isSetPool(action) ? (action.payload as ToastsPool<TType, TData>) : state;

/**
 * Keeps the pool in a Redux store, through `toastsReducer` and `SET_TOASTS_POOL`.
 * @param select Reads the pool from the root state, e.g. `(state) => state.toasts`.
 */
export const createReduxState = <
  TState,
  TType extends string = DefaultToastType,
  TData = unknown,
>(
  store: ReduxStoreLike<TState>,
  select: (state: TState) => ToastsPool<TType, TData>,
): ToastsPoolState<TType, TData> => ({
  getState: () => select(store.getState()),
  setState: (next) =>
    store.dispatch({
      type: SET_TOASTS_POOL,
      payload: next as ToastsPool<string, unknown>,
    }),
  subscribe: (listener) => store.subscribe(listener),
});
