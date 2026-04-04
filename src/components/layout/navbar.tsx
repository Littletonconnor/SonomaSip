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
    <svg viewBox="0 0 20 28" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 1.5 C7 1.5 5.2 6.5 5.2 9.5 C5.2 13.5 7.5 16 10 16.5 C12.5 16 14.8 13.5 14.8 9.5 C14.8 6.5 13 1.5 13 1.5"
        className="stroke-wine"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.2 6C8.5 7 11.5 7 12.8 6"
        className="stroke-gold"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="16.5"
        x2="10"
        y2="23.5"
        className="stroke-wine"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="6.5"
        y1="25"
        x2="13.5"
        y2="25"
        className="stroke-wine"
        strokeWidth="1.3"
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
          scrolled ? 'border-gold/20 bg-background/80 border-b backdrop-blur-xl' : 'bg-transparent',
        )}
      >
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" aria-label="Homepage" className="flex items-center gap-1.5">
            <WineGlassLogo className="h-6 w-auto" />
            <span className="font-heading text-bark text-lg font-medium tracking-wide">
              Sonoma Sip
            </span>
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-[0.8125rem] tracking-wide transition-colors"
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
            className="text-muted-foreground hover:text-foreground relative inline-flex items-center justify-center rounded-lg p-2 transition-colors md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            <span
              className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
              aria-hidden="true"
            />
          </button>
        </nav>

        {mobileOpen && (
          <div className="border-border/50 bg-background/95 border-t backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-muted-foreground hover:text-foreground px-3 py-2.5 text-[0.8125rem] tracking-wide transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-border/50 mt-2 border-t pt-3">
                <Button
                  className="border-wine/30 text-wine hover:bg-wine hover:text-primary-foreground w-full"
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
          'border-border/50 bg-background/95 fixed right-0 bottom-0 left-0 z-40 border-t px-4 py-3 backdrop-blur-xl transition-all duration-300 md:hidden',
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
