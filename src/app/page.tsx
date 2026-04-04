import Image from 'next/image';
import Link from 'next/link';
import { Grape, MapPin, DollarSign, Users, Map, Info, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection, StaggerChildren, StaggerItem } from '@/components/ui/animated-section';
import { mockWineries } from '@/lib/mock-data';

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="gradient-hero noise-overlay lg:min-h-[calc(100dvh-3.5rem)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pt-12 pb-16 md:pt-16 md:pb-24 lg:grid-cols-[1fr_1.2fr] lg:gap-12 lg:pt-0 lg:pb-0">
          <div className="lg:py-28">
            <span className="bg-wine/10 text-wine ring-wine/20 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ring-1">
              Free & independent wine guide
            </span>

            <h1 className="font-heading text-bark mt-5 max-w-[20ch] text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Plan Your Sonoma Wine Tasting Day in Minutes
            </h1>
            <p className="text-stone mt-6 max-w-[48ch] text-lg text-pretty">
              Tell us your favorite wines, your vibe, your budget, and where you want to go. Our
              matching engine scores every winery in our curated collection and builds a
              personalized itinerary you can share, print, or email.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button size="lg" className="rounded-full px-8 tracking-wide" asChild>
                <Link href="/quiz">Start the Quiz</Link>
              </Button>
              <Link
                href="/wineries"
                className="text-stone decoration-oak/40 hover:text-bark hover:decoration-oak text-sm font-medium underline underline-offset-4"
              >
                Browse all wineries
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
                    quality={75}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl outline-1 -outline-offset-1 outline-black/5">
                  <Image
                    src="/hero/vineyard-rows.jpg"
                    alt=""
                    width={1600}
                    height={1200}
                    className="aspect-square w-full object-cover"
                    quality={75}
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
                    quality={75}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl outline-1 -outline-offset-1 outline-black/5">
                  <Image
                    src="/hero/vineyard-rolling.jpg"
                    alt=""
                    width={1600}
                    height={1200}
                    className="aspect-[5/4] w-full object-cover"
                    quality={75}
                  />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-6 z-10 w-64 sm:w-72 lg:-left-10">
              <div className="shadow-warm-lg bg-background/92 rounded-xl p-5 ring-1 ring-black/5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <p className="text-stone text-sm font-medium">Top Match</p>
                  <span className="bg-wine text-cream rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums">
                    96%
                  </span>
                </div>
                <p className="font-heading text-bark mt-2 text-lg font-medium">
                  Dry Creek Vineyard
                </p>
                <p className="text-oak mt-0.5 text-sm">Dry Creek Valley &middot; Zinfandel</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['Picnic grounds', 'Walk-in', '$25\u201335'].map((tag) => (
                    <span
                      key={tag}
                      className="bg-linen text-oak rounded-full px-2.5 py-0.5 text-xs ring-1 ring-black/5"
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
      <section className="border-gold/20 border-y py-5">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <p className="text-stone text-center font-mono text-xs tracking-widest">
              Curated wineries &middot; Every Sonoma AVA region &middot; Personalized matching
              &middot; Always free
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-card py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <p className="text-wine font-mono text-sm tracking-wide">How it works</p>
            <h2 className="text-bark mt-3 max-w-[35ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Four quick steps to your ideal wine tasting itinerary.
            </h2>
          </AnimatedSection>

          <StaggerChildren className="mt-16 space-y-16 md:space-y-20" staggerDelay={0.15}>
            {[
              {
                number: '01',
                title: 'Pick your wines',
                body: 'Choose from nine varietals — Pinot Noir, Chardonnay, Zinfandel, Sparkling, and more. Skip this step to keep things wide open.',
                icon: Grape,
              },
              {
                number: '02',
                title: 'Set the mood and budget',
                body: 'Tell us the vibe you want — relaxed, adventurous, celebratory — and how much you want to spend per tasting flight.',
                icon: DollarSign,
              },
              {
                number: '03',
                title: 'Add your must-haves',
                body: 'Dog-friendly? Wheelchair accessible? Food pairing? Toggle the features that matter, set your group size, and we filter accordingly.',
                icon: Users,
              },
              {
                number: '04',
                title: 'Get your itinerary',
                body: 'Choose your Sonoma regions and number of stops. Our matching engine scores every winery and builds a ranked plan you can share, print, or email.',
                icon: MapPin,
              },
            ].map((step) => (
              <StaggerItem key={step.number} className="flex gap-6 md:gap-10">
                <div className="flex shrink-0 flex-col items-center gap-3">
                  <span className="font-heading text-gold/60 text-4xl font-semibold md:text-5xl">
                    {step.number}
                  </span>
                  <step.icon className="stroke-wine/50 size-6 shrink-0" />
                </div>
                <div>
                  <h3 className="text-bark text-xl font-semibold md:text-2xl">{step.title}</h3>
                  <p className="text-stone mt-3 max-w-xl text-pretty">{step.body}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="border-gold/20 border-t py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <p className="text-wine font-mono text-sm tracking-wide">Why Sonoma Sip</p>
            <h2 className="text-bark mt-3 max-w-[35ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              An independent guide built for how you actually plan.
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <dl className="border-border bg-border mt-14 grid gap-px overflow-hidden rounded-xl border md:grid-cols-2">
              {[
                {
                  icon: Grape,
                  term: 'Varietal matching',
                  detail:
                    'Select from nine varietals and we score wineries on how well their pours align with your palate.',
                },
                {
                  icon: DollarSign,
                  term: 'Budget-aware',
                  detail:
                    'Set a price range for tasting flights. We surface wineries that fit, from $25 walk-ins to $100+ seated experiences.',
                },
                {
                  icon: Users,
                  term: 'Group-friendly',
                  detail:
                    'Filters for group size limits, kid and dog policies, and wheelchair accessibility so nobody gets left out.',
                },
                {
                  icon: Map,
                  term: 'Map your day',
                  detail:
                    'See your matched wineries plotted across Sonoma County and plan a route that makes geographic sense.',
                },
                {
                  icon: Info,
                  term: 'Honest details',
                  detail:
                    'Hours, reservation type, parking, noise level, and tasting formats — sourced from editorial research, not marketing copy.',
                },
                {
                  icon: Share2,
                  term: 'Share your plan',
                  detail:
                    'Send your itinerary as a link, print it for the car, or email it to your group. No account needed.',
                },
              ].map((item) => (
                <div key={item.term} className="bg-background p-8 md:p-10">
                  <dt className="flex items-start gap-3">
                    <item.icon className="stroke-wine/60 size-6 shrink-0" />
                    <span className="font-heading text-bark text-lg font-semibold">
                      {item.term}
                    </span>
                  </dt>
                  <dd className="text-stone mt-2 pl-9 text-sm text-pretty">{item.detail}</dd>
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
            <p className="text-wine font-mono text-sm tracking-wide">
              Explore Sonoma County wineries
            </p>
            <h2 className="text-bark mt-3 max-w-[35ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              A sample from our curated collection.
            </h2>
          </AnimatedSection>

          <StaggerChildren className="divide-border mt-14 divide-y" staggerDelay={0.1}>
            {mockWineries.slice(0, 4).map((winery) => (
              <StaggerItem key={winery.slug}>
                <Link
                  href={`/wineries/${winery.slug}`}
                  className="group flex items-center justify-between gap-6 py-5"
                >
                  <div>
                    <p className="font-heading text-bark group-hover:text-wine text-lg font-semibold">
                      {winery.name}
                    </p>
                    <p className="text-stone mt-1 text-sm">{winery.tagline}</p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-3 sm:flex">
                    <span className="bg-linen text-oak rounded-full px-3 py-1 text-xs font-medium ring-1 ring-black/5">
                      {winery.region}
                    </span>
                    <span className="text-stone text-sm tabular-nums">
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
                className="text-wine decoration-wine/30 hover:decoration-wine text-sm font-medium underline underline-offset-4"
              >
                View all wineries &rarr;
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
                <h2 className="text-cream max-w-[24ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                  Ready to find your Sonoma wineries?
                </h2>
                <p className="text-cream/70 mt-3 max-w-[40ch] text-lg text-pretty">
                  Four quick steps. No account, no email, completely free.
                </p>
              </div>
              <Link
                href="/quiz"
                className="bg-cream text-bark inline-flex h-9 shrink-0 items-center justify-center rounded-full px-10 text-sm font-medium tracking-wide shadow-lg hover:bg-white"
              >
                Start the Quiz
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
