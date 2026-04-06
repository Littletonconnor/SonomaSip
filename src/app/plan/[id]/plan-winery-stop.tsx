'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePlanHover } from './plan-hover-context';

export function PlanWineryStop({ wineryId, children }: { wineryId: string; children: ReactNode }) {
  const { hoveredId, setHoveredId } = usePlanHover();

  return (
    <div
      className={cn('rounded-xl', hoveredId === wineryId && 'bg-linen/50')}
      onMouseEnter={() => setHoveredId(wineryId)}
      onMouseLeave={() => setHoveredId(null)}
    >
      {children}
    </div>
  );
}
