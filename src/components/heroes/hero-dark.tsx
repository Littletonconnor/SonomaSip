'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

export function HeroDark() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-bark">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 -z-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-wine/30 blur-[120px]"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-20 top-20 h-[500px] w-[500px] rounded-full bg-gold/20 blur-[100px]"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-sage/15 blur-[100px]"
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }} />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="inline-block border-b border-gold/30 pb-1 font-heading text-sm font-medium italic tracking-widest text-gold/80 uppercase">
            Sonoma County Wine Guide
          </span>
        </motion.div>

        <motion.h1
          className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-cream sm:text-6xl md:text-7xl lg:text-8xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          The wineries you&apos;ll
          <br />
          <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
            actually love.
          </span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-lg text-lg leading-relaxed text-cream/60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Answer a few questions. Get a personalized shortlist of Sonoma
          wineries matched to your taste, budget, and group — with honest
          reasons why each one fits.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
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
            className="text-sm font-medium text-cream/50 transition-colors hover:text-cream/80"
          >
            Browse all 68 wineries →
          </Link>
        </motion.div>

        {/* Bottom fade-in stat bar */}
        <motion.div
          className="mt-20 flex flex-wrap items-center justify-center gap-8 text-sm text-cream/40 md:gap-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className="text-center">
            <span className="block font-heading text-2xl font-semibold text-cream/70">68</span>
            <span>curated wineries</span>
          </div>
          <div className="h-8 w-px bg-cream/10" />
          <div className="text-center">
            <span className="block font-heading text-2xl font-semibold text-cream/70">6</span>
            <span>Sonoma regions</span>
          </div>
          <div className="h-8 w-px bg-cream/10" />
          <div className="text-center">
            <span className="block font-heading text-2xl font-semibold text-cream/70">2 min</span>
            <span>to your plan</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
