import Link from 'next/link';
import { WineGlassLogo } from '@/components/layout/navbar';

const navLinks = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/wineries', label: 'Wineries' },
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function Footer() {
  return (
    <footer className="border-t border-gold/20 bg-card">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
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
            <p className="mt-4 max-w-[36ch] text-sm text-muted-foreground">
              An independent guide to Sonoma County wine country. We recommend
              based on fit, not who pays us.
            </p>
          </div>

          <nav aria-label="Site links">
            <h4 className="font-heading text-sm font-medium tracking-wide text-bark">
              Explore
            </h4>
            <ul role="list" className="mt-4 flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h4 className="font-heading text-sm font-medium tracking-wide text-bark">
              Legal
            </h4>
            <ul role="list" className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-gold/20 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-xs tracking-wide text-muted-foreground md:flex-row">
            <p>
              Independent guide. Verify hours and policies before visiting.
            </p>
            <p className="shrink-0">Made with care in Sonoma County</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
