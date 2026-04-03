'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Map, { NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapMarker } from './map-marker';
import { MapPopup } from './map-popup';
import { useMapBounds } from './use-map-bounds';
import type { MapItem } from './types';

import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/littletonconnor/cmnj990w1004z01sla3326exf';

type SonomaMapProps = {
  items: MapItem[];
  className?: string;
  showLegend?: boolean;
};

export default function SonomaMap({
  items,
  className,
  showLegend = false,
}: SonomaMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const boundsData = useMapBounds(items);

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleLegendSelect = useCallback(
    (id: string) => {
      setSelectedId((prev) => (prev === id ? null : id));
      const item = items.find((i) => i.id === id);
      if (item && mapRef.current) {
        mapRef.current.flyTo({
          center: [item.longitude, item.latitude],
          zoom: 10.5,
          duration: 800,
        });
      }
    },
    [items],
  );

  const handleMapClick = useCallback(() => {
    setSelectedId(null);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={cn('overflow-hidden rounded-2xl ring-1 ring-black/5', className)}>
        <MapSkeleton message="Mapbox token not configured" />
        {showLegend && <MapLegend items={items} selectedId={null} onSelect={() => {}} />}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden rounded-2xl ring-1 ring-black/5', className)}
    >
      <div className="relative aspect-[4/3]">
        {isVisible ? (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={MAP_STYLE}
            initialViewState={
              boundsData
                ? { bounds: boundsData.bounds, fitBoundsOptions: { padding: 60 } }
                : { latitude: 38.5, longitude: -122.8, zoom: 9 }
            }
            reuseMaps
            onClick={handleMapClick}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" showCompass={false} />
            {items.map((item) => (
              <MapMarker
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onClick={handleMarkerClick}
              />
            ))}
            {selectedItem && (
              <MapPopup item={selectedItem} onClose={() => setSelectedId(null)} />
            )}
          </Map>
        ) : (
          <MapSkeleton />
        )}
      </div>

      {showLegend && (
        <MapLegend items={items} selectedId={selectedId} onSelect={handleLegendSelect} />
      )}
    </div>
  );
}

function MapSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex aspect-[4/3] items-center justify-center bg-linear-to-br from-sage/10 via-linen to-gold/10">
      <div className="text-center">
        <MapPin className="mx-auto size-8 animate-pulse text-stone/20" />
        <p className="mt-2 text-sm font-medium text-stone/40">{message ?? 'Loading map…'}</p>
      </div>
    </div>
  );
}

function MapLegend({
  items,
  selectedId,
  onSelect,
}: {
  items: MapItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-5">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            'flex items-center gap-2.5 text-left text-sm transition-colors',
            selectedId === item.id ? 'text-bark' : 'text-stone hover:text-bark',
          )}
        >
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
              selectedId === item.id
                ? 'bg-wine text-primary-foreground'
                : 'bg-wine/10 text-wine',
            )}
          >
            {item.rank ?? '·'}
          </span>
          <span className="truncate font-medium">{item.label}</span>
          <span className="ml-auto shrink-0 text-xs text-stone">{item.region}</span>
        </button>
      ))}
    </div>
  );
}
