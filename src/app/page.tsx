import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <>
      <section className="lg:min-h-[calc(100dvh-4rem)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pt-12 pb-16 md:pt-16 md:pb-24 lg:grid-cols-[1fr_1.2fr] lg:gap-12 lg:pt-0 lg:pb-0">
          <div className="lg:py-28">
            <h1 className="font-heading text-bark max-w-[20ch] text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Perfect Day at Sonoma County Vineyards
            </h1>
            <p className="text-stone mt-6 max-w-[48ch] text-lg text-pretty">
              Experience the best Sonoma County wineries, matched to your taste. Take a short quiz
              and we&apos;ll rank 68 curated wineries by how well they fit your wines, budget, and
              group.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button size="lg" className="rounded-full px-8 tracking-wide" asChild>
                <Link href="/quiz">Plan Your Visit</Link>
              </Button>
              <Link
                href="/wineries"
                className="text-stone decoration-oak/40 hover:text-bark hover:decoration-oak text-sm font-medium underline underline-offset-4 transition-colors"
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
              <div className="shadow-warm-lg rounded-xl bg-white/92 p-5 ring-1 ring-black/5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <p className="text-stone text-sm font-medium">Top Match</p>
                  <span className="bg-wine text-cream rounded-full px-2.5 py-0.5 text-xs font-medium">
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

      <section id="how-it-works" className="border-border/60 bg-card border-t py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-wine font-mono text-sm tracking-wide">How it works</p>
          <h2 className="text-bark mt-3 max-w-[35ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Three questions. One perfect day.
          </h2>
          <div className="mt-16 space-y-16 md:space-y-20">
            {[
              {
                number: '01',
                title: 'Share your preferences',
                body: 'A short, thoughtful quiz. We ask about the wines you love, the atmosphere you want, your budget, and anything your group needs.',
              },
              {
                number: '02',
                title: 'We find your matches',
                body: 'Every winery in our curated set is scored against what you told us. You get a ranked list with honest reasons why each one fits.',
              },
              {
                number: '03',
                title: 'Take it with you',
                body: 'Your plan shows up on a map. Check hours and policies, then share the link or email it to your group. No account required.',
              },
            ].map((step) => (
              <div key={step.number} className="flex gap-6 md:gap-10">
                <span className="font-heading text-gold/60 shrink-0 text-4xl font-semibold md:text-5xl">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-bark text-xl font-semibold md:text-2xl">{step.title}</h3>
                  <p className="text-stone mt-3 max-w-xl text-pretty">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-wine font-mono text-sm tracking-wide">Why Sonoma Sip</p>
          <h2 className="text-bark mt-3 max-w-[35ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            We built the guide we wished existed.
          </h2>
          <p className="text-stone mt-4 max-w-[48ch] text-lg text-pretty">
            Most wine country sites are ad-driven directories or booking platforms. We recommend
            based on fit, not who pays us.
          </p>
          <div className="border-border bg-border mt-14 grid gap-px overflow-hidden rounded-xl border md:grid-cols-2">
            {[
              {
                label: '68 wineries',
                detail: 'Hand-curated with detailed tasting, pricing, and policy information.',
              },
              {
                label: 'Honest matching',
                detail: 'Deterministic scoring you can trust. No black box, no paid placement.',
              },
              {
                label: 'Real logistics',
                detail:
                  'Parking, group limits, wheelchair access, dog policies. The stuff that matters.',
              },
              {
                label: 'Independent voice',
                detail: 'No winery partnerships. Recommendations are editorial, not commercial.',
              },
            ].map((item) => (
              <div key={item.label} className="bg-background p-8 md:p-10">
                <h3 className="font-heading text-bark text-lg font-semibold">{item.label}</h3>
                <p className="text-stone mt-2 text-sm text-pretty">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border/60 border-t">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-bark max-w-[24ch] text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Ready to plan your day?
              </h2>
              <p className="text-stone mt-3 max-w-[40ch] text-lg text-pretty">
                Takes about two minutes. No account, no email required.
              </p>
            </div>
            <Button size="lg" className="shrink-0 rounded-full px-10 tracking-wide" asChild>
              <Link href="/quiz">Start Planning</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
