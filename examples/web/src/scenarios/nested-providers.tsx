import { createToastsClient } from "@lapp-studio/react-toast-engine";
import { PoolRenderer } from "@lapp-studio/react-toast-engine/web";
import { useState } from "react";

import { Playground } from "../playground";
import { components } from "../toast";

const { renderer, utilities } = createToastsClient({ components, PoolRenderer });

export const NestedProvidersScenario = () => {
  const [open, setOpen] = useState(false);

  return (
    <renderer.Provider>
      <p>
        Toasts stacked while the modal is open render through its Provider, then return to
        the root one when it closes.
      </p>
      <Playground utilities={utilities} />
      <button type="button" onClick={() => setOpen(true)}>
        Open modal
      </button>
      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Modal">
          <div className="modal__panel">
            <renderer.Provider>
              <h2>Modal</h2>
              <Playground utilities={utilities} />
              <button type="button" onClick={() => setOpen(false)}>
                Close modal
              </button>
            </renderer.Provider>
          </div>
        </div>
      )}
    </renderer.Provider>
  );
};
