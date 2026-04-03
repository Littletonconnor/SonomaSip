'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

export function HeroSplit() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      <div className="mx-auto grid min-h-[90vh] max-w-7xl lg:grid-cols-2">
        {/* Left — Copy on cream */}
        <div className="flex flex-col justify-center px-6 py-20 md:px-12 lg:py-0 lg:pr-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-wine/50" />
              <span className="font-heading text-xs font-medium italic tracking-widest text-wine uppercase">
                Sonoma County Wine Guide
              </span>
            </div>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-bark sm:text-6xl lg:text-7xl">
              Sip smarter.
              <br />
              <span className="text-wine">Plan better.</span>
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Tell us your taste, budget, and who&apos;s coming. We&apos;ll
              curate a shortlist of Sonoma wineries you&apos;ll genuinely love
              — with the honest details that help you plan.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" className="px-10" asChild>
                <Link href="/quiz">Start Planning</Link>
              </Button>
              <Link
                href="/wineries"
                className="text-sm font-medium text-muted-foreground underline decoration-oak/30 underline-offset-4 transition-colors hover:text-foreground hover:decoration-wine"
              >
                Browse all 68 wineries
              </Link>
            </div>

            {/* Inline stats */}
            <div className="mt-14 flex items-center gap-6 border-t border-border pt-6 text-sm text-muted-foreground">
              <div>
                <span className="block font-heading text-xl font-semibold text-bark">68</span>
                curated wineries
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <span className="block font-heading text-xl font-semibold text-bark">Free</span>
                no account needed
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <span className="block font-heading text-xl font-semibold text-bark">2 min</span>
                to your plan
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right — Abstract wine country art */}
        <motion.div
          className="relative hidden lg:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-bark via-wine-dark to-bark" />

          {/* Animated gradient orb */}
          <motion.div
            className="absolute top-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-wine/20 blur-[100px]"
            animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-gold/15 blur-[80px]"
            animate={{ scale: [1, 1.15, 1], x: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Abstract vine/branch SVG pattern */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.06]" viewBox="0 0 600 800">
            <circle cx="300" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cream" />
            <circle cx="300" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-cream" />
            <circle cx="300" cy="200" r="250" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-cream" />
            <circle cx="200" cy="500" r="100" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-cream" />
            <circle cx="200" cy="500" r="160" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-cream" />
            <circle cx="450" cy="600" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cream" />
            <circle cx="450" cy="600" r="130" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-cream" />
          </svg>

          {/* Floating glass cards */}
          <div className="relative z-10 flex h-full items-center justify-center p-12">
            <div className="w-full max-w-sm space-y-4">
              <motion.div
                className="rounded-xl border border-cream/10 bg-cream/5 p-6 backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <p className="text-xs font-medium tracking-wide text-cream/40 uppercase">Your #1 Match</p>
                <p className="mt-2 font-heading text-xl font-semibold text-cream">
                  Iron Horse Vineyards
                </p>
                <p className="mt-1 text-sm text-cream/50">
                  Russian River · Sparkling · $35–$55
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-sage/20 px-2.5 py-0.5 text-xs text-sage-light">Walk-in</span>
                  <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-xs text-gold-light">Views</span>
                  <span className="rounded-full bg-blush/20 px-2.5 py-0.5 text-xs text-blush">Dog-friendly</span>
                </div>
              </motion.div>

              <motion.div
                className="rounded-xl border border-cream/10 bg-cream/5 p-5 backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <p className="text-xs font-medium tracking-wide text-cream/40 uppercase">Why it fits</p>
                <ul className="mt-2 space-y-1.5 text-sm text-cream/60">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-gold" />
                    Excellent sparkling wines under your budget
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-gold" />
                    Stunning hilltop views, outdoor seating
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-gold" />
                    No reservation needed, dog-friendly patio
                  </li>
                </ul>
              </motion.div>

              <motion.div
                className="rounded-xl border border-cream/10 bg-cream/5 p-5 backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                <p className="text-xs font-medium tracking-wide text-cream/40 uppercase">Also matched</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cream/70">Gary Farrell</span>
                    <span className="text-xs text-cream/40">Russian River</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cream/70">Dutton-Goldfield</span>
                    <span className="text-xs text-cream/40">Green Valley</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
