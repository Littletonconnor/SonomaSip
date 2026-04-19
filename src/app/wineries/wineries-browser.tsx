'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Star, Dog, Baby, UtensilsCrossed, Eye, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/ui/animated-section';
import type { WineryForDisplay, Region } from '@/lib/types';
import { formatScaleAndRegion } from '@/lib/types';

const ALL_REGIONS: Region[] = [
  'Russian River Valley',
  'Dry Creek Valley',
  'Sonoma Valley',
  'Alexander Valley',
  'Carneros',
];

type SortOption = 'name' | 'price-low' | 'price-high' | 'rating';

const SORT_LABELS: Record<SortOption, string> = {
  name: 'Name A\u2013Z',
  'price-low': 'Price: Low to High',
  'price-high': 'Price: High to Low',
  rating: 'Highest Rated',
};

type Filters = {
  regions: Region[];
  features: {
    dogFriendly: boolean;
    kidFriendly: boolean;
    foodPairing: boolean;
    views: boolean;
    walkIn: boolean;
  };
};

const defaultFilters: Filters = {
  regions: [],
  features: {
    dogFriendly: false,
    kidFriendly: false,
    foodPairing: false,
    views: false,
    walkIn: false,
  },
};

const FEATURE_OPTIONS: { key: keyof Filters['features']; label: string; Icon: typeof Dog }[] = [
  { key: 'walkIn', label: 'Walk-in', Icon: Eye },
  { key: 'dogFriendly', label: 'Dog Friendly', Icon: Dog },
  { key: 'kidFriendly', label: 'Kid Friendly', Icon: Baby },
  { key: 'foodPairing', label: 'Food Pairing', Icon: UtensilsCrossed },
  { key: 'views', label: 'Views', Icon: Eye },
];

export function WineriesBrowser({ wineries }: { wineries: WineryForDisplay[] }) {
  const [sort, setSort] = useState<SortOption>('name');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const toggleRegion = (r: Region) => {
    setFilters((prev) => ({
      ...prev,
      regions: prev.regions.includes(r)
        ? prev.regions.filter((x) => x !== r)
        : [...prev.regions, r],
    }));
  };

  const toggleFeature = (key: keyof Filters['features']) => {
    setFilters((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
  };

  const clearFilters = () => setFilters(defaultFilters);

  const activeFilterCount = useMemo(() => {
    return filters.regions.length + Object.values(filters.features).filter(Boolean).length;
  }, [filters]);

  const filtered = useMemo(() => {
    let results = [...wineries];

    if (filters.regions.length > 0) {
      results = results.filter((w) => filters.regions.includes(w.region));
    }
    if (filters.features.dogFriendly) results = results.filter((w) => w.isDogFriendly);
    if (filters.features.kidFriendly) results = results.filter((w) => w.kidWelcome);
    if (filters.features.foodPairing) results = results.filter((w) => w.hasFoodPairing);
    if (filters.features.views) results = results.filter((w) => w.hasViews);
    if (filters.features.walkIn)
      results = results.filter(
        (w) =>
          w.reservationType === 'walk_ins_welcome' ||
          w.reservationType === 'reservations_recommended',
      );

    switch (sort) {
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        results.sort((a, b) => a.minFlightPrice - b.minFlightPrice);
        break;
      case 'price-high':
        results.sort((a, b) => b.maxFlightPrice - a.maxFlightPrice);
        break;
      case 'rating':
        results.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
        break;
    }

    return results;
  }, [wineries, filters, sort]);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      <div className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          <AnimatedSection>
            <h1 className="font-heading text-bark text-3xl font-medium tracking-tight text-balance md:text-4xl">
              All Wineries
            </h1>
            <p className="text-stone mt-2 text-pretty">
              {filtered.length} {filtered.length === 1 ? 'winery' : 'wineries'} in Sonoma County
            </p>
          </AnimatedSection>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-linen text-bark flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-black/5 lg:hidden"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-wine text-cream flex size-5 items-center justify-center rounded-full text-xs tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="inline-grid grid-cols-[1fr_--spacing(8)]">
            <select
              name="sort"
              aria-label="Sort wineries"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-linen text-bark focus-visible:outline-wine col-span-full row-start-1 appearance-none rounded-lg py-2 pr-8 pl-3 text-sm font-medium ring-1 ring-black/5 focus-visible:outline-2"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 8 5"
              width="8"
              height="5"
              fill="none"
              className="pointer-events-none col-start-2 row-start-1 place-self-center"
            >
              <path d="M.5.5 4 4 7.5.5" stroke="currentcolor" />
            </svg>
          </div>
        </div>

        {showFilters && (
          <div className="bg-card mt-6 rounded-xl p-6 ring-1 ring-black/5 lg:hidden">
            <FilterPanel
              filters={filters}
              toggleRegion={toggleRegion}
              toggleFeature={toggleFeature}
              clearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
            />
          </div>
        )}

        <div className="mt-8 gap-10 lg:grid lg:grid-cols-[220px_1fr]">
          <aside className="max-lg:hidden">
            <div className="sticky top-20">
              <FilterPanel
                filters={filters}
                toggleRegion={toggleRegion}
                toggleFeature={toggleFeature}
                clearFilters={clearFilters}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </aside>

          <div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="font-heading text-bark text-xl font-medium">
                  No wineries match your filters
                </p>
                <p className="text-stone mt-2 text-sm">
                  Try removing some filters to see more results.
                </p>
                <Button variant="outline" className="mt-6" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <StaggerChildren
                key={filtered.map((w) => w.id).join(',')}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                staggerDelay={0.04}
              >
                {filtered.map((w) => (
                  <StaggerItem key={w.id}>
                    <WineryCard winery={w} />
                  </StaggerItem>
                ))}
              </StaggerChildren>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  filters,
  toggleRegion,
  toggleFeature,
  clearFilters,
  activeFilterCount,
}: {
  filters: Filters;
  toggleRegion: (r: Region) => void;
  toggleFeature: (key: keyof Filters['features']) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-bark text-sm font-medium">Region</p>
        <div className="mt-3 flex flex-col gap-2">
          {ALL_REGIONS.map((r) => {
            const active = filters.regions.includes(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggleRegion(r)}
                className={`focus-visible:outline-wine flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all focus-visible:outline-2 ${
                  active
                    ? 'bg-wine/10 text-wine font-medium'
                    : 'text-stone hover:bg-fog hover:text-bark'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-bark text-sm font-medium">Features</p>
        <div className="mt-3 flex flex-col gap-2">
          {FEATURE_OPTIONS.map((f) => {
            const active = filters.features[f.key];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggleFeature(f.key)}
                className={`focus-visible:outline-wine flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all focus-visible:outline-2 ${
                  active
                    ? 'bg-wine/10 text-wine font-medium'
                    : 'text-stone hover:bg-fog hover:text-bark'
                }`}
              >
                <f.Icon className="size-4 shrink-0" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-wine hover:text-wine-dark flex items-center gap-1.5 text-sm font-medium"
        >
          <X className="size-3.5" />
          Clear all filters
        </button>
      )}
    </div>
  );
}

function WineryCard({ winery }: { winery: WineryForDisplay }) {
  const badges: string[] = [];
  if (winery.reservationType === 'walk_ins_welcome') badges.push('Walk-in');
  if (winery.reservationType === 'reservations_recommended')
    badges.push('Reservations Recommended');
  if (winery.reservationType === 'appointment_only') badges.push('Appointment');
  if (winery.isMembersOnly) badges.push('Members Only');
  if (winery.isDogFriendly) badges.push('Dog Friendly');
  if (winery.hasFoodPairing) badges.push('Food Pairing');
  if (winery.hasViews) badges.push('Views');

  return (
    <Link
      href={`/wineries/${winery.slug}`}
      className="group hover:shadow-warm flex flex-col rounded-xl p-5 ring-1 ring-black/5 transition-shadow sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-heading text-bark group-hover:text-wine text-lg font-medium">
          {winery.name}
        </h2>
        {winery.averageRating && (
          <span className="flex shrink-0 items-center gap-1 text-sm">
            <Star className="fill-gold text-gold size-3.5" />
            <span className="text-stone tabular-nums">{winery.averageRating}</span>
          </span>
        )}
      </div>
      <p className="text-stone mt-1 text-sm">{winery.tagline}</p>
      <div className="text-stone mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-sm">
        <span>{formatScaleAndRegion(winery.wineryScale, winery.region)}</span>
        <span className="tabular-nums">
          ${winery.minFlightPrice}&ndash;{winery.maxFlightPrice}
        </span>
      </div>
      {badges.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {badges.slice(0, 3).map((b) => (
            <span key={b} className="bg-fog/80 text-stone rounded-full px-2 py-0.5 text-xs">
              {b}
            </span>
          ))}
          {badges.length > 3 && (
            <span className="bg-fog/80 text-stone rounded-full px-2 py-0.5 text-xs">
              +{badges.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
