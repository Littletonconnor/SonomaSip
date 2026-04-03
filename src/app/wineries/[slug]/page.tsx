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
import { mockWineries } from '@/lib/mock-data';
import type { Winery, Flight } from '@/lib/types';

export function generateStaticParams() {
  return mockWineries.map((w) => ({ slug: w.slug }));
}

async function getWinery(slug: string): Promise<Winery | undefined> {
  return mockWineries.find((w) => w.slug === slug);
}

export default async function WineryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const winery = await getWinery(slug);
  if (!winery) notFound();

  const relatedWineries = mockWineries
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
        winery.reservationType === 'walk-in'
          ? 'Walk-in welcome'
          : winery.reservationType === 'appointment'
            ? 'Appointment required'
            : 'Members only',
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

  return (
    <div>
      <div className="border-b border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-stone" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-bark">
              Home
            </Link>
            <ChevronRight className="size-3.5" />
            <Link href="/wineries" className="hover:text-bark">
              Wineries
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-bark">{winery.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="gap-12 lg:grid lg:grid-cols-[2fr_3fr]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <AnimatedSection>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-wine/10 px-3 py-1 text-xs font-medium text-wine ring-1 ring-wine/20">
                  {winery.region}
                </span>
                <span className="text-sm text-stone">{winery.city}</span>
              </div>

              <h1 className="mt-4 font-heading text-3xl font-medium tracking-tight text-balance text-bark md:text-4xl">
                {winery.name}
              </h1>
              <p className="mt-2 text-pretty text-stone">{winery.tagline}</p>

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
                  <span className="text-sm tabular-nums text-stone">
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
                <p className="text-center text-sm tabular-nums text-stone">
                  ${winery.minFlightPrice}&ndash;{winery.maxFlightPrice} per flight
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {featureItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <item.icon className="size-4 shrink-0 text-stone" />
                    <span className="text-stone">{item.label}</span>
                    <span className="ml-auto font-medium text-bark">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {amenities
                  .filter((a) => a.active)
                  .map((a) => (
                    <span
                      key={a.label}
                      className="flex items-center gap-1.5 rounded-full bg-wine/5 py-1 pr-2.5 pl-1.5 text-xs font-medium text-wine ring-1 ring-wine/10"
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
              <h2 className="font-heading text-2xl font-medium tracking-tight text-bark">About</h2>
              <p className="mt-4 max-w-[65ch] text-pretty text-stone">{winery.story}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {winery.varietals.map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-linen px-3 py-1 text-sm font-medium text-oak ring-1 ring-black/5"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="mt-12 border-t border-black/5 pt-12">
                <h2 className="font-heading text-2xl font-medium tracking-tight text-bark">
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
                <h2 className="font-heading text-2xl font-medium tracking-tight text-bark">Hours</h2>
                <div className="mt-6 flex flex-col gap-2">
                  {dayNames.map((day) => {
                    const hours = winery.hours[day];
                    return (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-stone">{day}</span>
                        {hours ? (
                          <span className="font-medium tabular-nums text-bark">
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
        <div className="border-t border-black/5 bg-card py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <AnimatedSection>
              <h2 className="font-heading text-2xl font-medium tracking-tight text-bark">
                Nearby Wineries
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {relatedWineries.map((w) => (
                  <Link
                    key={w.slug}
                    href={`/wineries/${w.slug}`}
                    className="group rounded-xl p-5 ring-1 ring-black/5 transition-shadow hover:shadow-warm"
                  >
                    <p className="font-heading text-lg font-medium text-bark group-hover:text-wine">
                      {w.name}
                    </p>
                    <p className="mt-1 text-sm text-stone">{w.tagline}</p>
                    <div className="mt-3 flex items-center gap-3 text-sm text-stone">
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
    <div className="flex items-start justify-between gap-6 rounded-xl bg-linen/60 p-5 ring-1 ring-black/5 sm:p-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-heading text-lg font-medium text-bark">{flight.name}</h3>
          {flight.hasFoodPairing && (
            <span className="flex items-center gap-1 rounded-full bg-sage/15 py-0.5 pr-2 pl-1.5 text-xs font-medium text-sage">
              <UtensilsCrossed className="size-3" />
              Paired
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-pretty text-stone">{flight.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone">
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
        <p className="font-heading text-2xl font-medium tabular-nums text-bark">${flight.price}</p>
        <p className="text-xs text-stone">per person</p>
      </div>
    </div>
  );
}
