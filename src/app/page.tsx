import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';

export default function Home() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Decorative background — layered organic shapes */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-wine/[0.04] blur-3xl" />
          <div className="absolute -bottom-1/3 -left-1/4 h-[600px] w-[600px] rounded-full bg-gold/[0.06] blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage/[0.04] blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 md:pb-32 md:pt-28 lg:pb-40 lg:pt-36">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            {/* Left — Copy */}
            <div>
              <AnimatedSection>
                <p className="font-heading text-sm font-medium italic tracking-wide text-wine">
                  A curated guide to Sonoma County wine country
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                <h1 className="mt-5 text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-bark sm:text-5xl lg:text-6xl">
                  Find the wineries
                  <br />
                  <span className="text-wine">made for you.</span>
                </h1>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Tell us what you love — your favorite varietals, your budget, who you&apos;re
                  with — and we&apos;ll match you to the Sonoma wineries that actually fit.
                  No guesswork, no generic lists.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button size="lg" className="px-8" asChild>
                    <Link href="/quiz">Start Planning</Link>
                  </Button>
                  <Link
                    href="/wineries"
                    className="text-sm font-medium text-muted-foreground underline decoration-oak/40 underline-offset-4 transition-colors hover:text-foreground hover:decoration-oak"
                  >
                    Or browse all 68 wineries
                  </Link>
                </div>
              </AnimatedSection>
            </div>

            {/* Right — Visual placeholder (will be replaced with real imagery) */}
            <AnimatedSection delay={0.2} direction="right">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-lg lg:max-w-none">
                {/* Abstract wine country composition */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-linen via-fog/80 to-linen" />
                <div className="absolute inset-0 rounded-2xl border border-oak/10" />

                {/* Layered abstract shapes suggesting rolling hills */}
                <div className="absolute bottom-0 left-0 right-0 h-2/3 overflow-hidden rounded-b-2xl">
                  <svg viewBox="0 0 400 200" className="absolute bottom-0 w-full" preserveAspectRatio="none">
                    <path d="M0 200 L0 120 Q100 60 200 100 Q300 140 400 80 L400 200 Z" className="fill-sage/20" />
                    <path d="M0 200 L0 150 Q80 100 180 130 Q280 160 400 110 L400 200 Z" className="fill-sage/15" />
                    <path d="M0 200 L0 170 Q120 140 220 160 Q320 180 400 150 L400 200 Z" className="fill-gold/10" />
                  </svg>
                </div>

                {/* Floating detail cards */}
                <div className="absolute top-8 left-8 rounded-lg border border-oak/10 bg-background/90 px-4 py-3 shadow-warm backdrop-blur-sm">
                  <p className="text-xs font-medium text-muted-foreground">Matched for you</p>
                  <p className="mt-0.5 font-heading text-sm font-semibold text-bark">
                    Russian River Pinot
                  </p>
                  <p className="text-xs text-wine">98% match</p>
                </div>

                <div className="absolute right-6 bottom-20 rounded-lg border border-oak/10 bg-background/90 px-4 py-3 shadow-warm backdrop-blur-sm">
                  <p className="text-xs font-medium text-muted-foreground">Budget-friendly</p>
                  <p className="mt-0.5 font-heading text-sm font-semibold text-bark">$25 – $45</p>
                  <p className="text-xs text-sage">Walk-in welcome</p>
                </div>

                <div className="absolute top-1/2 right-12 -translate-y-1/2 rounded-lg border border-oak/10 bg-background/90 px-4 py-3 shadow-warm backdrop-blur-sm">
                  <p className="text-xs font-medium text-muted-foreground">Sonoma Valley</p>
                  <p className="mt-0.5 font-heading text-sm font-semibold text-bark">
                    3 wineries nearby
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-border/60 bg-card py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <p className="font-heading text-sm font-medium italic tracking-wide text-wine">
              Simple by design
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-bark md:text-4xl">
              Three questions. One perfect day.
            </h2>
          </AnimatedSection>

          <div className="mt-16 space-y-16 md:space-y-20">
            {[
              {
                number: '01',
                title: 'Share your preferences',
                body: 'A short, thoughtful quiz — not a long form. We ask about the wines you love, the atmosphere you want, your budget, and anything your group needs (kids, dogs, accessibility).',
              },
              {
                number: '02',
                title: 'We find your matches',
                body: 'Every winery in our curated set is scored against what you told us. You get a ranked list with honest reasons — "Great Pinot selection under $40" or "Quiet patio, dog-friendly, no reservation needed."',
              },
              {
                number: '03',
                title: 'Take it with you',
                body: 'Your plan shows up on a map. Open winery details, check hours and policies, then share the link, print a PDF, or email it to your group. No account required.',
              },
            ].map((step, i) => (
              <AnimatedSection key={step.number} delay={i * 0.1}>
                <div className="flex gap-6 md:gap-10">
                  <div className="shrink-0">
                    <span className="font-heading text-4xl font-semibold text-gold/60 md:text-5xl">
                      {step.number}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-bark md:text-2xl">{step.title}</h3>
                    <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── What makes us different ──────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <AnimatedSection>
            <p className="font-heading text-sm font-medium italic tracking-wide text-wine">
              Not another directory
            </p>
            <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-tight text-bark md:text-4xl">
              We built the guide we wished existed.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Most wine country sites are either ad-driven directories or booking platforms.
              Sonoma Sip is an independent, editorial guide — we recommend based on fit,
              not who pays us.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
              {[
                {
                  label: '68 wineries',
                  detail: 'Hand-curated with detailed tasting, pricing, and policy information.',
                },
                {
                  label: 'Honest matching',
                  detail: 'Deterministic scoring you can trust — no black box, no paid placement.',
                },
                {
                  label: 'Real logistics',
                  detail: 'Parking, group limits, wheelchair access, dog policies — the stuff that matters.',
                },
                {
                  label: 'Independent voice',
                  detail: 'No winery partnerships. Recommendations are editorial, not commercial.',
                },
              ].map((item) => (
                <div key={item.label} className="bg-background p-8 md:p-10">
                  <h3 className="font-heading text-lg font-semibold text-bark">{item.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <AnimatedSection>
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-bark md:text-4xl">
                  Ready to plan your day?
                </h2>
                <p className="mt-3 max-w-md text-lg text-muted-foreground">
                  Takes about two minutes. No account, no email required to see your results.
                </p>
              </div>
              <Button size="lg" className="shrink-0 px-10" asChild>
                <Link href="/quiz">Start Planning</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
