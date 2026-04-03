import Link from 'next/link';

const footerLinks = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/wineries', label: 'Wineries' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function Footer() {
  return (
    <footer className="border-border bg-card border-t">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="font-heading text-bark text-xl font-semibold tracking-tight">
              Sonoma Sip
            </Link>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Your personalized Sonoma County winery guide. Independent recommendations based on
              curated data — no partnerships, no paid placement.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <h4 className="text-foreground text-sm font-semibold">Navigate</h4>
              <ul className="mt-3 flex flex-col gap-2.5">
                {footerLinks.map((link) => (
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
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-border mt-10 border-t pt-6">
          <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 text-xs md:flex-row">
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
