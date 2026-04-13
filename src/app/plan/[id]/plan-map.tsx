'use client';

import { MapSection } from '@/components/map/map-section';
import { usePlanHover } from './plan-hover-context';
import type { MapItem } from '@/components/map/types';

export function PlanMap({ items }: { items: MapItem[] }) {
  const { hoveredId, setHoveredId } = usePlanHover();

  return <MapSection items={items} hoveredId={hoveredId} onMarkerHover={setHoveredId} />;
}
