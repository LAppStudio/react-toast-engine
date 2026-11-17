import type {
  createToastsClient,
  DefaultToastType,
  ToastsPool,
} from "@lapp-studio/react-toast-engine";

type Utilities = ReturnType<typeof createToastsClient<DefaultToastType>>["utilities"];

export const Playground = ({ utilities }: { utilities: Utilities }) => {
  const { stack, update, pop, clear } = utilities.helpers;

  const upload = () => {
    const id = stack({ infoType: "info", title: "Uploading…", durationInMs: Infinity });
    setTimeout(() => {
      update(id, {
        infoType: "success",
        title: "Uploaded",
        description: "report.pdf is ready.",
        durationInMs: 3000,
      });
    }, 2000);
  };

  return (
    <div className="playground">
      <button
        type="button"
        onClick={() =>
          stack({ infoType: "success", title: "Saved!", description: "Profile updated." })
        }
      >
        Success
      </button>
      <button
        type="button"
        onClick={() =>
          stack({
            infoType: "error",
            title: "Connection error",
            description: "Check your network and try again.",
          })
        }
      >
        Error
      </button>
      <button
        type="button"
        onClick={() =>
          stack({
            infoType: "info",
            title: "New message",
            actions: { onPress: () => stack({ infoType: "info", title: "Opening inbox…" }) },
          })
        }
      >
        Info (pressable)
      </button>
      <button
        type="button"
        onClick={() =>
          stack({ infoType: "info", title: "Stays until dismissed", durationInMs: Infinity })
        }
      >
        Persistent
      </button>
      <button type="button" onClick={upload}>
        Loading → done
      </button>
      <button type="button" onClick={pop}>
        Close oldest
      </button>
      <button type="button" onClick={clear}>
        Clear all
      </button>
    </div>
  );
};

export const PoolInspector = ({ label, pool }: { label: string; pool: ToastsPool }) => (
  <section className="inspector">
    <h2>{label}</h2>
    {pool.length === 0 ? (
      <p>Empty.</p>
    ) : (
      <ul>
        {pool.map((toast) => (
          <li key={toast.id}>
            <code>{toast.infoType}</code> {toast.title} <em>({toast.status})</em>
          </li>
        ))}
      </ul>
    )}
  </section>
);
