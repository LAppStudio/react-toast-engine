import "./styles.css";

import { StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";

import { JotaiScenario } from "./scenarios/jotai";
import { MotionScenario } from "./scenarios/motion";
import { NestedProvidersScenario } from "./scenarios/nested-providers";
import { ReduxScenario } from "./scenarios/redux";
import { VanillaScenario } from "./scenarios/vanilla";
import { ZustandScenario } from "./scenarios/zustand";

const scenarios = [
  { id: "vanilla", label: "Vanilla driver", Component: VanillaScenario },
  { id: "motion", label: "Motion driver", Component: MotionScenario },
  { id: "zustand", label: "Zustand state", Component: ZustandScenario },
  { id: "jotai", label: "Jotai state", Component: JotaiScenario },
  { id: "redux", label: "Redux state", Component: ReduxScenario },
  { id: "nested", label: "Nested providers", Component: NestedProvidersScenario },
];

const subscribe = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};

const getHash = () => window.location.hash.slice(1);

const App = () => {
  const hash = useSyncExternalStore(subscribe, getHash);
  const current = scenarios.find((scenario) => scenario.id === hash) ?? scenarios[0];

  return (
    <div className="app">
      <header>
        <h1>React Toast Engine</h1>
        <nav>
          {scenarios.map((scenario) => (
            <a
              key={scenario.id}
              href={`#${scenario.id}`}
              aria-current={scenario === current ? "page" : undefined}
            >
              {scenario.label}
            </a>
          ))}
        </nav>
      </header>
      <main>
        <current.Component key={current.id} />
      </main>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
