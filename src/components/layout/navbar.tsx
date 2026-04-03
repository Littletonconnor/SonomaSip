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
            ? 'border-border/50 bg-background/80 border-b backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="font-heading text-bark text-xl font-semibold tracking-tight">
            Sonoma Sip
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Button size="sm" asChild>
              <Link href="/quiz">Plan Your Visit</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-lg p-2 transition-colors md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-border/50 bg-background/95 border-t backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-border/50 mt-2 border-t pt-3">
                <Button className="w-full" asChild>
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
