import Link from 'next/link';

const footerLinks = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/wineries', label: 'Wineries' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="font-heading text-xl font-semibold tracking-tight text-bark">
              Sonoma Sip
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your personalized Sonoma County winery guide. Independent recommendations based on
              curated data — no partnerships, no paid placement.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Navigate</h4>
              <ul className="mt-3 flex flex-col gap-2.5">
                {footerLinks.map((link) => (
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
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
            <p>
              Sonoma Sip is an independent guide. Hours, prices, and policies change — always verify
              before visiting.
            </p>
            <p className="shrink-0">Made with care in Sonoma County</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
