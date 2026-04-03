'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/wineries', label: 'Wineries' },
];

export function WineGlassLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5.5 1h13l-1.5 12c-.3 2.5-2.2 4.5-5 5-2.8-.5-4.7-2.5-5-5L5.5 1z"
        className="stroke-wine"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 5.5c2 1.2 5.5 1.2 8 0"
        className="stroke-gold"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="26"
        className="stroke-wine"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M7.5 26c0 0 2-1 4.5-1s4.5 1 4.5 1"
        className="stroke-wine"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-gold/20 bg-background/80 backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            aria-label="Homepage"
            className="flex items-center gap-2.5"
          >
            <WineGlassLogo className="h-7 w-auto" />
            <span className="font-heading text-lg font-medium tracking-wide text-bark">
              Sonoma Sip
            </span>
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.8125rem] tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="border-wine/30 text-wine hover:bg-wine hover:text-primary-foreground"
              asChild
            >
              <Link href="/quiz">Plan Your Visit</Link>
            </Button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
            <span
              className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
              aria-hidden="true"
            />
          </button>
        </nav>

        {mobileOpen && (
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-[0.8125rem] tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-border/50 pt-3">
                <Button
                  className="w-full border-wine/30 text-wine hover:bg-wine hover:text-primary-foreground"
                  variant="outline"
                  asChild
                >
                  <Link href="/quiz" onClick={() => setMobileOpen(false)}>
                    Plan Your Visit
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile sticky bottom CTA — appears after scrolling past hero */}
      <div
        className={cn(
          'fixed right-0 bottom-0 left-0 z-40 border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur-xl transition-all duration-300 md:hidden',
          scrolled ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
        )}
      >
        <Button className="w-full" size="lg" asChild>
          <Link href="/quiz">Plan Your Visit</Link>
        </Button>
      </div>
    </>
  );
}
