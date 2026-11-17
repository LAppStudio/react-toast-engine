import type { ToastComponentProps } from "@lapp-studio/react-toast-engine";

export const Toast = ({ toast, actions }: ToastComponentProps) => (
  <div className={`toast toast--${toast.infoType}`}>
    <div className="toast__content">
      <strong>{toast.title}</strong>
      {toast.description && <p>{toast.description}</p>}
    </div>
    <button
      type="button"
      className="toast__close"
      aria-label="Close"
      onClick={actions.dismiss}
    >
      ×
    </button>
  </div>
);

export const components = { success: Toast, error: Toast, info: Toast };
