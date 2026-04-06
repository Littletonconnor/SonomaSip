'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Map as MapIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlanHover } from './plan-hover-context';
import type { MapItem } from '@/components/map/types';

const SonomaMap = dynamic(() => import('@/components/map/sonoma-map'), { ssr: false });

export function PlanMap({ items }: { items: MapItem[] }) {
  const isMobile = useIsMobile();
  const [showMap, setShowMap] = useState(false);
  const { hoveredId, setHoveredId } = usePlanHover();

  if (isMobile) {
    return (
      <div>
        <Button
          variant="outline"
          size="sm"
          className="mb-4 w-full gap-1.5"
          onClick={() => setShowMap((v) => !v)}
        >
          <MapIcon className="size-3.5" />
          {showMap ? 'Hide Map' : 'Show Map'}
        </Button>
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <SonomaMap items={items} showLegend hoveredId={hoveredId} onMarkerHover={setHoveredId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return <SonomaMap items={items} showLegend hoveredId={hoveredId} onMarkerHover={setHoveredId} />;
}
