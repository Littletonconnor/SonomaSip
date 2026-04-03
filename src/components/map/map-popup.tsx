'use client';

import Link from 'next/link';
import { Popup } from 'react-map-gl/mapbox';
import { X } from 'lucide-react';
import type { MapItem } from './types';

type MapPopupProps = {
  item: MapItem;
  onClose: () => void;
};

export function MapPopup({ item, onClose }: MapPopupProps) {
  return (
    <Popup
      latitude={item.latitude}
      longitude={item.longitude}
      anchor="bottom"
      offset={20}
      closeButton={false}
      closeOnClick={false}
      onClose={onClose}
      className="sonoma-map-popup"
      maxWidth="300px"
    >
      <div className="flex items-start gap-3 p-4 pr-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/wineries/${item.slug}`}
            className="font-heading text-sm font-medium tracking-tight text-balance text-bark hover:text-wine"
          >
            {item.label}
          </Link>
          <p className="mt-0.5 text-xs text-stone">{item.region}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-stone hover:bg-fog hover:text-bark"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </Popup>
  );
}
