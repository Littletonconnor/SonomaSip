import { useMemo } from 'react';
import type { MapItem } from './types';

const PADDING = 0.05;

export function useMapBounds(items: MapItem[]) {
  return useMemo(() => {
    if (items.length === 0) return null;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const item of items) {
      if (item.latitude < minLat) minLat = item.latitude;
      if (item.latitude > maxLat) maxLat = item.latitude;
      if (item.longitude < minLng) minLng = item.longitude;
      if (item.longitude > maxLng) maxLng = item.longitude;
    }

    return {
      bounds: [
        [minLng - PADDING, minLat - PADDING],
        [maxLng + PADDING, maxLat + PADDING],
      ] as [[number, number], [number, number]],
      center: {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
      },
    };
  }, [items]);
}
