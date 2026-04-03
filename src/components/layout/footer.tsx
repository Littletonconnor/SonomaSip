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
    <footer className="border-gold/20 bg-card border-t">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Homepage" className="flex items-center gap-2.5">
              <WineGlassLogo className="h-7 w-auto" />
              <span className="font-heading text-bark text-lg font-medium tracking-wide">
                Sonoma Sip
              </span>
            </Link>
            <p className="text-muted-foreground mt-4 max-w-[36ch] text-sm">
              An independent guide to Sonoma County wine country. We recommend based on fit, not who
              pays us.
            </p>
          </div>

          <nav aria-label="Site links">
            <h4 className="font-heading text-bark text-sm font-medium tracking-wide">Explore</h4>
            <ul role="list" className="mt-4 flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h4 className="font-heading text-bark text-sm font-medium tracking-wide">Legal</h4>
            <ul role="list" className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-gold/20 mt-12 border-t pt-6">
          <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 text-xs tracking-wide md:flex-row">
            <p>Independent guide. Verify hours and policies before visiting.</p>
            <p className="shrink-0">Made with care in Sonoma County</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
