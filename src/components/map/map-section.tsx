'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Map as MapIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';
import { useIsMobile } from '@/hooks/use-mobile';
import type { MapItem } from './types';

const SonomaMap = dynamic(() => import('./sonoma-map'), { ssr: false });

type MapSectionProps = {
  items: MapItem[];
  hoveredId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  activeId?: string | null;
};

export function MapSection({ items, hoveredId, onMarkerHover, activeId }: MapSectionProps) {
  const isMobile = useIsMobile();
  const [showMap, setShowMap] = useState(false);

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
              className="overflow-hidden rounded-2xl"
            >
              <SonomaMap
                items={items}
                showLegend
                hoveredId={hoveredId}
                onMarkerHover={onMarkerHover}
                activeId={activeId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <AnimatedSection delay={0.3} direction="right">
      <SonomaMap
        items={items}
        showLegend
        hoveredId={hoveredId}
        onMarkerHover={onMarkerHover}
        activeId={activeId}
      />
    </AnimatedSection>
  );
}
