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
            className="font-heading text-bark hover:text-wine text-sm font-medium tracking-tight text-balance"
          >
            {item.label}
          </Link>
          <p className="text-stone mt-0.5 text-xs">{item.region}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-stone hover:bg-fog hover:text-bark flex size-6 shrink-0 items-center justify-center rounded-full"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </Popup>
  );
}
