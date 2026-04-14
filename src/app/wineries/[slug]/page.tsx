import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  Clock,
  Users,
  Dog,
  Baby,
  Accessibility,
  UtensilsCrossed,
  TreePine,
  Eye,
  Car,
  Volume2,
  ExternalLink,
  ChevronRight,
  Wine,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';
import { getWineryBySlug, getAllWinerySlugs, getAllWineriesForBrowse } from '@/lib/data/wineries';
import type { Flight } from '@/lib/types';
import { env } from '@/lib/env';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllWinerySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const winery = await getWineryBySlug(slug);
  if (!winery) return {};

  const title = `${winery.name} — ${winery.region} Winery`;
  const description = `${winery.tagline} Visit ${winery.name} in ${winery.city}, ${winery.region}. Flights from $${winery.minFlightPrice}–$${winery.maxFlightPrice}. ${winery.varietals.slice(0, 3).join(', ')}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${env.NEXT_PUBLIC_SITE_URL}/wineries/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/wineries/${slug}`,
    },
  };
}

export default async function WineryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const winery = await getWineryBySlug(slug);
  if (!winery) notFound();

  const allWineries = await getAllWineriesForBrowse();
  const relatedWineries = allWineries
    .filter((w) => w.id !== winery.id && w.region === winery.region)
    .slice(0, 3);

  const dayNames = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;

  const openingHours = dayNames
    .filter((day) => winery.hours[day])
    .map((day) => {
      const h = winery.hours[day]!;
      const dayAbbr = {
        monday: 'Mo',
        tuesday: 'Tu',
        wednesday: 'We',
        thursday: 'Th',
        friday: 'Fr',
        saturday: 'Sa',
        sunday: 'Su',
      }[day];
      return `${dayAbbr} ${h.open}-${h.close}`;
    });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Winery',
    name: winery.name,
    description: winery.tagline,
    url: `${env.NEXT_PUBLIC_SITE_URL}/wineries/${slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: winery.city,
      addressRegion: 'CA',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: winery.latitude,
      longitude: winery.longitude,
    },
    openingHoursSpecification: openingHours.length > 0 ? openingHours : undefined,
    priceRange: `$${winery.minFlightPrice}–$${winery.maxFlightPrice}`,
    ...(winery.averageRating &&
      winery.ratingsCount && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: winery.averageRating,
          ratingCount: winery.ratingsCount,
          bestRating: 5,
          worstRating: 1,
        },
      }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Tasting Flights',
      itemListElement: winery.flights.map((flight) => ({
        '@type': 'Offer',
        name: flight.name,
        description: flight.description,
        price: flight.price,
        priceCurrency: 'USD',
      })),
    },
    amenityFeature: [
      ...(winery.isDogFriendly
        ? [{ '@type': 'LocationFeatureSpecification', name: 'Dog-friendly', value: true }]
        : []),
      ...(winery.isKidFriendly
        ? [{ '@type': 'LocationFeatureSpecification', name: 'Kid-friendly', value: true }]
        : []),
      ...(winery.isWheelchairAccessible
        ? [{ '@type': 'LocationFeatureSpecification', name: 'Wheelchair accessible', value: true }]
        : []),
      ...(winery.hasFoodPairing
        ? [{ '@type': 'LocationFeatureSpecification', name: 'Food pairing', value: true }]
        : []),
      ...(winery.hasOutdoorSeating
        ? [{ '@type': 'LocationFeatureSpecification', name: 'Outdoor seating', value: true }]
        : []),
      ...(winery.hasViews
        ? [{ '@type': 'LocationFeatureSpecification', name: 'Scenic views', value: true }]
        : []),
    ],
  };

  const featureItems = [
    { icon: Car, label: 'Parking', value: winery.parking },
    {
      icon: Users,
      label: 'Group size',
      value: winery.groupSizeMax ? `Up to ${winery.groupSizeMax}` : 'No limit',
    },
    {
      icon: Volume2,
      label: 'Noise level',
      value: winery.noiseLevel.charAt(0).toUpperCase() + winery.noiseLevel.slice(1),
    },
    {
      icon: Calendar,
      label: 'Reservations',
      value:
        winery.reservationType === 'walk_ins_welcome'
          ? 'Walk-ins welcome'
          : winery.reservationType === 'reservations_recommended'
            ? 'Reservations recommended'
            : 'Appointment required',
    },
  ];

  const amenities = [
    { icon: Dog, label: 'Dog-friendly', active: winery.isDogFriendly },
    { icon: Baby, label: 'Kid-friendly', active: winery.isKidFriendly },
    { icon: Accessibility, label: 'Wheelchair accessible', active: winery.isWheelchairAccessible },
    { icon: UtensilsCrossed, label: 'Food pairing', active: winery.hasFoodPairing },
    { icon: TreePine, label: 'Outdoor seating', active: winery.hasOutdoorSeating },
    { icon: Eye, label: 'Scenic views', active: winery.hasViews },
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: env.NEXT_PUBLIC_SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Wineries',
        item: `${env.NEXT_PUBLIC_SITE_URL}/wineries`,
      },
      { '@type': 'ListItem', position: 3, name: winery.name },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <nav className="text-stone flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-bark">
              Home
            </Link>
            <ChevronRight className="size-3.5" />
            <Link href="/wineries" className="hover:text-bark">
              Wineries
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-bark font-medium">{winery.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="gap-12 lg:grid lg:grid-cols-[2fr_3fr]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <AnimatedSection>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-wine/10 text-wine ring-wine/20 rounded-full px-3 py-1 text-xs font-medium ring-1">
                  {winery.region}
                </span>
                <span className="text-stone text-sm">{winery.city}</span>
              </div>

              <h1 className="font-heading text-bark mt-4 text-3xl font-medium tracking-tight text-balance md:text-4xl">
                {winery.name}
              </h1>
              <p className="text-stone mt-2 text-pretty">{winery.tagline}</p>

              {winery.averageRating && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-4 ${i < Math.round(winery.averageRating!) ? 'fill-gold text-gold' : 'text-fog'}`}
                      />
                    ))}
                  </div>
                  <span className="text-stone text-sm tabular-nums">
                    {winery.averageRating} ({winery.ratingsCount})
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <Button size="lg" className="w-full gap-2 rounded-full" asChild>
                  <a href={winery.bookingUrl} target="_blank" rel="noopener noreferrer">
                    Book a Tasting
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <p className="text-stone text-sm tabular-nums">
                  ${winery.minFlightPrice}&ndash;{winery.maxFlightPrice} per flight
                </p>
                <p className="text-stone/50 mt-1 text-xs text-pretty">
                  Sonoma Sip is not affiliated with {winery.name}. Hours, prices, and availability
                  may change &mdash; verify directly with the winery before visiting.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {featureItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <item.icon className="text-stone size-4 shrink-0" />
                    <span className="text-stone">{item.label}</span>
                    <span className="text-bark ml-auto font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {amenities
                  .filter((a) => a.active)
                  .map((a) => (
                    <span
                      key={a.label}
                      className="bg-wine/5 text-wine ring-wine/10 flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1.5 text-xs font-medium ring-1"
                    >
                      <a.icon className="size-3.5" />
                      {a.label}
                    </span>
                  ))}
              </div>
            </AnimatedSection>
          </div>

          <div className="max-lg:mt-10">
            <AnimatedSection>
              <h2 className="font-heading text-bark text-2xl font-medium tracking-tight">About</h2>
              <p className="text-stone mt-4 max-w-[65ch] text-pretty">{winery.story}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {winery.varietals.map((v) => (
                  <span
                    key={v}
                    className="bg-linen text-oak rounded-full px-3 py-1 text-sm font-medium ring-1 ring-black/5"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="mt-12 border-t border-black/5 pt-12">
                <h2 className="font-heading text-bark text-2xl font-medium tracking-tight">
                  Tasting Experiences
                </h2>
                <div className="mt-6 flex flex-col gap-4">
                  {winery.flights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="mt-12 border-t border-black/5 pt-12">
                <h2 className="font-heading text-bark text-2xl font-medium tracking-tight">
                  Hours
                </h2>
                <div className="mt-6 flex flex-col gap-2">
                  {dayNames.map((day) => {
                    const hours = winery.hours[day];
                    return (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span className="text-stone capitalize">{day}</span>
                        {hours ? (
                          <span className="text-bark font-medium tabular-nums">
                            {hours.open} &ndash; {hours.close}
                          </span>
                        ) : (
                          <span className="text-stone/50">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {relatedWineries.length > 0 && (
        <div className="bg-card border-t border-black/5 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <AnimatedSection>
              <h2 className="font-heading text-bark text-2xl font-medium tracking-tight">
                Nearby Wineries
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {relatedWineries.map((w) => (
                  <Link
                    key={w.slug}
                    href={`/wineries/${w.slug}`}
                    className="group hover:shadow-warm rounded-xl p-5 ring-1 ring-black/5 transition-shadow"
                  >
                    <p className="font-heading text-bark group-hover:text-wine text-lg font-medium">
                      {w.name}
                    </p>
                    <p className="text-stone mt-1 text-sm">{w.tagline}</p>
                    <div className="text-stone mt-3 flex items-center gap-3 text-sm">
                      <span>{w.region}</span>
                      <span className="tabular-nums">
                        ${w.minFlightPrice}&ndash;{w.maxFlightPrice}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      )}
    </div>
  );
}

function FlightCard({ flight }: { flight: Flight }) {
  return (
    <div className="bg-linen/60 flex items-start justify-between gap-6 rounded-xl p-5 ring-1 ring-black/5 sm:p-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-bark text-lg font-medium">{flight.name}</h3>
          {flight.hasFoodPairing && (
            <span className="bg-sage/15 text-sage flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 text-xs font-medium">
              <UtensilsCrossed className="size-3" />
              Paired
            </span>
          )}
        </div>
        <p className="text-stone mt-1 text-sm text-pretty">{flight.description}</p>
        <div className="text-stone mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <Wine className="size-3.5" />
            {flight.winesIncluded} wines
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {flight.durationMinutes} min
          </span>
          <span className="capitalize">{flight.format}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-heading text-bark text-2xl font-medium tabular-nums">${flight.price}</p>
        <p className="text-stone text-xs">per person</p>
      </div>
    </div>
  );
}
