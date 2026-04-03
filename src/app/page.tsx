import Image from 'next/image';
import Link from 'next/link';
import {
  Grape,
  BarChart3,
  MapPin,
  DollarSign,
  Users,
  Map,
  Info,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AnimatedSection,
  StaggerChildren,
  StaggerItem,
} from '@/components/ui/animated-section';
import { mockWineries } from '@/lib/mock-data';

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="gradient-hero noise-overlay lg:min-h-[calc(100dvh-3.5rem)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-12 md:pb-24 md:pt-16 lg:grid-cols-[1fr_1.2fr] lg:gap-12 lg:pb-0 lg:pt-0">
          <div className="lg:py-28">
            <span className="inline-flex items-center rounded-full bg-wine/10 px-3 py-1 text-xs font-medium tracking-wide text-wine ring-1 ring-wine/20">
              Covering 68+ Sonoma County wineries
            </span>

            <h1 className="mt-5 max-w-[20ch] font-heading text-4xl font-medium tracking-tight text-balance text-bark sm:text-5xl lg:text-6xl">
              Your Perfect Sonoma Wine Day, Planned in Minutes
            </h1>
            <p className="mt-6 max-w-[48ch] text-lg text-pretty text-stone">
              Take a short quiz about the wines you love, your budget, and your
              group. We&apos;ll rank 68 curated wineries by how well they fit —
              then hand you a shareable plan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button
                size="lg"
                className="rounded-full px-8 tracking-wide"
                asChild
              >
                <Link href="/quiz">Plan Your Visit</Link>
              </Button>
              <Link
                href="/wineries"
                className="text-sm font-medium text-stone underline decoration-oak/40 underline-offset-4 hover:text-bark hover:decoration-oak"
              >
                Browse all 68 wineries
              </Link>
            </div>
          </div>

          <div className="relative lg:py-8">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-3 pt-12">
                <div className="overflow-hidden rounded-2xl outline-1 -outline-offset-1 outline-black/5">
                  <Image
                    src="/hero/grapes-vine.jpg"
                    alt=""
                    width={1600}
                    height={1200}
                    className="aspect-[4/5] w-full object-cover"
                    priority
                    quality={90}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl outline-1 -outline-offset-1 outline-black/5">
                  <Image
                    src="/hero/vineyard-rows.jpg"
                    alt=""
                    width={1600}
                    height={1200}
                    className="aspect-square w-full object-cover"
                    quality={90}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="overflow-hidden rounded-2xl outline-1 -outline-offset-1 outline-black/5">
                  <Image
                    src="/hero/wine-tasting.jpg"
                    alt=""
                    width={1600}
                    height={2400}
                    className="aspect-[3/5] w-full object-cover object-center"
                    priority
                    quality={90}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl outline-1 -outline-offset-1 outline-black/5">
                  <Image
                    src="/hero/vineyard-rolling.jpg"
                    alt=""
                    width={1600}
                    height={1200}
                    className="aspect-[5/4] w-full object-cover"
                    quality={90}
                  />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-6 z-10 w-64 sm:w-72 lg:-left-10">
              <div className="rounded-xl bg-white/92 p-5 shadow-warm-lg ring-1 ring-black/5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone">Top Match</p>
                  <span className="rounded-full bg-wine px-2.5 py-0.5 text-xs font-medium tabular-nums text-cream">
                    96%
                  </span>
                </div>
                <p className="mt-2 font-heading text-lg font-medium text-bark">
                  Dry Creek Vineyard
                </p>
                <p className="mt-0.5 text-sm text-oak">
                  Dry Creek Valley &middot; Zinfandel
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['Picnic grounds', 'Walk-in', '$25\u201335'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-linen px-2.5 py-0.5 text-xs text-oak ring-1 ring-black/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Stats Bar ── */}
      <section className="border-y border-gold/20 py-5">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <p className="text-center font-mono text-xs tracking-widest text-stone">
              68 curated wineries &middot; personalized matches &middot; free to
              use
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-card py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <p className="font-mono text-sm tracking-wide text-wine">
              How it works
            </p>
            <h2 className="mt-3 max-w-[35ch] text-3xl font-semibold tracking-tight text-balance text-bark md:text-4xl">
              Three questions. One perfect day.
            </h2>
          </AnimatedSection>

          <StaggerChildren
            className="mt-16 space-y-16 md:space-y-20"
            staggerDelay={0.15}
          >
            {[
              {
                number: '01',
                title: 'Share your preferences',
                body: 'A short, thoughtful quiz. We ask about the wines you love, the atmosphere you want, your budget, and anything your group needs.',
                icon: Grape,
              },
              {
                number: '02',
                title: 'We find your matches',
                body: 'Every winery in our curated set is scored against what you told us. You get a ranked list with honest reasons why each one fits.',
                icon: BarChart3,
              },
              {
                number: '03',
                title: 'Take it with you',
                body: 'Your plan shows up on a map. Check hours and policies, then share the link or email it to your group. No account required.',
                icon: MapPin,
              },
            ].map((step) => (
              <StaggerItem key={step.number} className="flex gap-6 md:gap-10">
                <div className="flex shrink-0 flex-col items-center gap-3">
                  <span className="font-heading text-4xl font-semibold text-gold/60 md:text-5xl">
                    {step.number}
                  </span>
                  <step.icon className="size-6 shrink-0 stroke-wine/50" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-bark md:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-pretty text-stone">
                    {step.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="border-t border-gold/20 py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <p className="font-mono text-sm tracking-wide text-wine">
              Why Sonoma Sip
            </p>
            <h2 className="mt-3 max-w-[35ch] text-3xl font-semibold tracking-tight text-balance text-bark md:text-4xl">
              Everything you need to plan the perfect visit.
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <dl className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
              {[
                {
                  icon: Grape,
                  term: 'Matches your taste',
                  detail:
                    'Tell us which wines you love and we\u2019ll find wineries that pour them.',
                },
                {
                  icon: DollarSign,
                  term: 'Budget-aware',
                  detail:
                    'Filter by flight price so there are no surprises at the tasting bar.',
                },
                {
                  icon: Users,
                  term: 'Group-friendly',
                  detail:
                    'We check group limits, kid policies, and accessibility for your crew.',
                },
                {
                  icon: Map,
                  term: 'Map your day',
                  detail:
                    'See your picks on a map and plan a route that makes geographic sense.',
                },
                {
                  icon: Info,
                  term: 'Real details',
                  detail:
                    'Hours, reservations, parking, noise level — the stuff that actually matters.',
                },
                {
                  icon: Share2,
                  term: 'Share your plan',
                  detail:
                    'Email or link your itinerary to the group. Print it for the car.',
                },
              ].map((item) => (
                <div key={item.term} className="bg-background p-8 md:p-10">
                  <dt className="flex items-start gap-3">
                    <item.icon className="size-6 shrink-0 stroke-wine/60" />
                    <span className="font-heading text-lg font-semibold text-bark">
                      {item.term}
                    </span>
                  </dt>
                  <dd className="mt-2 pl-9 text-sm text-pretty text-stone">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Featured Wineries Teaser ── */}
      <section className="bg-card py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <p className="font-mono text-sm tracking-wide text-wine">
              Discover
            </p>
            <h2 className="mt-3 max-w-[35ch] text-3xl font-semibold tracking-tight text-balance text-bark md:text-4xl">
              A taste of what&rsquo;s waiting.
            </h2>
          </AnimatedSection>

          <StaggerChildren
            className="mt-14 divide-y divide-border"
            staggerDelay={0.1}
          >
            {mockWineries.slice(0, 4).map((winery) => (
              <StaggerItem key={winery.slug}>
                <Link
                  href={`/wineries/${winery.slug}`}
                  className="group flex items-center justify-between gap-6 py-5"
                >
                  <div>
                    <p className="font-heading text-lg font-semibold text-bark">
                      {winery.name}
                    </p>
                    <p className="mt-1 text-sm text-stone">
                      {winery.tagline}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-3 sm:flex">
                    <span className="rounded-full bg-linen px-3 py-1 text-xs font-medium text-oak ring-1 ring-black/5">
                      {winery.region}
                    </span>
                    <span className="text-sm tabular-nums text-stone">
                      ${winery.minFlightPrice}&ndash;{winery.maxFlightPrice}
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerChildren>

          <AnimatedSection delay={0.3}>
            <div className="mt-10">
              <Link
                href="/wineries"
                className="text-sm font-medium text-wine underline decoration-wine/30 underline-offset-4 hover:decoration-wine"
              >
                View all 68 wineries &rarr;
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="gradient-cta noise-overlay">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <AnimatedSection>
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="max-w-[24ch] text-3xl font-semibold tracking-tight text-balance text-cream md:text-4xl">
                  Ready to plan your day?
                </h2>
                <p className="mt-3 max-w-[40ch] text-lg text-pretty text-cream/70">
                  Takes about two minutes. No account, no email required.
                </p>
              </div>
              <Link
                href="/quiz"
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-cream px-10 text-sm font-medium tracking-wide text-bark shadow-lg hover:bg-white"
              >
                Start Planning
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
