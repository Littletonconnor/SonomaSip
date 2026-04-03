'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

export function HeroImmersive() {
  return (
    <section className="relative min-h-[100vh] overflow-hidden">
      {/* Full-bleed abstract landscape — rolling hills as layered gradients */}
      <div className="absolute inset-0">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1520] via-[#2d1f2a] to-[#3d2830]" />

        {/* Stars / grain */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }} />

        {/* Moon/sun glow */}
        <div className="absolute top-[15%] right-[20%] h-[300px] w-[300px] rounded-full bg-gold/10 blur-[80px]" />

        {/* Rolling hills as layered SVG */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 500"
          preserveAspectRatio="none"
          style={{ height: '55%' }}
        >
          {/* Far hills */}
          <path
            d="M0 500 L0 280 Q180 180 400 240 Q600 300 800 200 Q1000 100 1200 180 Q1350 230 1440 200 L1440 500 Z"
            className="fill-[#2a2025]/80"
          />
          {/* Mid hills */}
          <path
            d="M0 500 L0 340 Q200 260 450 310 Q700 360 900 280 Q1100 200 1300 260 Q1400 290 1440 270 L1440 500 Z"
            className="fill-[#352530]/90"
          />
          {/* Near hills — vineyard rows suggested by subtle stripes */}
          <path
            d="M0 500 L0 380 Q150 340 350 370 Q550 400 750 350 Q950 300 1150 340 Q1300 365 1440 340 L1440 500 Z"
            className="fill-wine/40"
          />
          {/* Foreground */}
          <path
            d="M0 500 L0 430 Q200 400 500 420 Q800 440 1100 415 Q1300 400 1440 410 L1440 500 Z"
            className="fill-bark/80"
          />
        </svg>

        {/* Warm bottom gradient for text readability */}
        <div className="absolute right-0 bottom-0 left-0 h-1/3 bg-gradient-to-t from-bark/90 to-transparent" />
      </div>

      {/* Content — positioned in bottom third */}
      <div className="relative z-10 flex min-h-[100vh] flex-col justify-end">
        <div className="mx-auto w-full max-w-6xl px-6 pb-16 md:pb-24">
          <motion.p
            className="font-heading text-sm font-medium italic tracking-widest text-gold/70 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Sonoma County
          </motion.p>

          <motion.h1
            className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight text-cream sm:text-6xl md:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Discover your
            <br />
            perfect tasting day.
          </motion.h1>

          <motion.p
            className="mt-5 max-w-md text-base leading-relaxed text-cream/55 md:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            A short quiz matches you to the Sonoma wineries that fit your
            taste, budget, and group. No ads, no fluff — just good
            recommendations.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Button
              size="lg"
              className="bg-cream px-10 text-bark hover:bg-cream/90"
              asChild
            >
              <Link href="/quiz">Start Planning</Link>
            </Button>
            <Link
              href="/wineries"
              className="text-sm font-medium text-cream/40 transition-colors hover:text-cream/70"
            >
              Browse wineries →
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
