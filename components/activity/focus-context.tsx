"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FocusContextValue {
  hoveredKm: number | null;
  setHoveredKm: (km: number | null) => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function ActivityFocusProvider({ children }: { children: ReactNode }) {
  const [hoveredKm, setHoveredKm] = useState<number | null>(null);
  return (
    <FocusContext.Provider value={{ hoveredKm, setHoveredKm }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useActivityFocus(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useActivityFocus must be used inside ActivityFocusProvider");
  return ctx;
}
