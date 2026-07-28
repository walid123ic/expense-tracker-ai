"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cloudEngine, type CloudState } from "@/lib/cloud/engine";

const EMPTY: CloudState = { connections: [], jobs: [], schedules: [] };

function subscribe(listener: () => void): () => void {
  return cloudEngine.subscribe(listener);
}

/**
 * Bridges the imperative cloud engine into React. The engine replaces its
 * state object on every change, so a plain reference read is a valid snapshot.
 */
export function useCloud(): CloudState {
  useEffect(() => {
    cloudEngine.hydrate();
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => cloudEngine.getState(),
    () => EMPTY
  );
}
