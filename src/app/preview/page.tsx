'use client';

import { useState } from 'react';
import { HeroDark } from '@/components/heroes/hero-dark';
import { HeroImmersive } from '@/components/heroes/hero-immersive';
import { HeroSplit } from '@/components/heroes/hero-split';

const variants = [
  { id: 'dark', label: 'A: Dark & Luxurious', component: HeroDark },
  { id: 'immersive', label: 'B: Immersive Landscape', component: HeroImmersive },
  { id: 'split', label: 'C: Split Layout', component: HeroSplit },
] as const;

export default function PreviewPage() {
  const [active, setActive] = useState<string>('dark');
  const ActiveHero = variants.find((v) => v.id === active)!.component;

  return (
    <div className="-mt-16">
      {/* Variant switcher — fixed at top */}
      <div className="fixed top-0 right-0 left-0 z-[60] border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-1 px-6 py-2">
          <span className="mr-4 text-xs font-medium text-muted-foreground">Hero variants:</span>
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setActive(v.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active === v.id
                  ? 'bg-wine text-cream'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active hero */}
      <ActiveHero />
    </div>
  );
}
