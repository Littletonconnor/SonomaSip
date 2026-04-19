import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Dog,
  Baby,
  UtensilsCrossed,
  TreePine,
  Eye,
  ExternalLink,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';
import { getWineryBySlug, getAllWinerySlugs } from '@/lib/data/wineries';
import { formatScaleAndRegion } from '@/lib/types';
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
  const ogImage = `/wineries/${slug}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${env.NEXT_PUBLIC_SITE_URL}/wineries/${slug}`,
      siteName: 'Sonoma Sip',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
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
    amenityFeature: [
      ...(winery.isDogFriendly
        ? [{ '@type': 'LocationFeatureSpecification', name: 'Dog-friendly', value: true }]
        : []),
      ...(winery.kidWelcome
        ? [{ '@type': 'LocationFeatureSpecification', name: 'Kid-friendly', value: true }]
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
    {
      icon: Users,
      label: 'Group size',
      value: winery.groupCapacity ? `Up to ${winery.groupCapacity}` : 'No limit',
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
    { icon: Baby, label: 'Kid-friendly', active: winery.kidWelcome },
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
                  {formatScaleAndRegion(winery.wineryScale, winery.region)}
                </span>
                <span className="text-stone text-sm">{winery.city}</span>
              </div>

              <h1 className="font-heading text-bark mt-4 text-3xl font-medium tracking-tight text-balance md:text-4xl">
                {winery.name}
              </h1>
              <p className="text-stone mt-2 text-pretty">{winery.tagline}</p>

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
    </div>
  );
}
