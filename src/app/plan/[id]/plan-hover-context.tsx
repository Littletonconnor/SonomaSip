'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type HoverContextValue = {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
};

const HoverContext = createContext<HoverContextValue>({
  hoveredId: null,
  setHoveredId: () => {},
});

export function PlanHoverProvider({ children }: { children: ReactNode }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return <HoverContext value={{ hoveredId, setHoveredId }}>{children}</HoverContext>;
}

export function usePlanHover() {
  return useContext(HoverContext);
}
