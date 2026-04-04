'use client';

import { Marker } from 'react-map-gl/mapbox';
import { cn } from '@/lib/utils';
import type { MapItem } from './types';

type MapMarkerProps = {
  item: MapItem;
  isSelected: boolean;
  onClick: (id: string) => void;
};

export function MapMarker({ item, isSelected, onClick }: MapMarkerProps) {
  return (
    <Marker
      latitude={item.latitude}
      longitude={item.longitude}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(item.id);
      }}
    >
      <button
        type="button"
        aria-label={`${item.label}, #${item.rank ?? ''} match`}
        className={cn(
          'shadow-warm flex size-7 items-center justify-center rounded-full text-[0.6875rem] font-semibold tabular-nums ring-2 ring-white transition-transform',
          isSelected
            ? 'bg-wine-dark shadow-warm-lg scale-115 text-white'
            : 'bg-wine text-white hover:scale-105',
        )}
      >
        {item.rank ?? '·'}
      </button>
    </Marker>
  );
}
