import type { Metadata } from 'next';
import Link from 'next/link';
import { SidebarNav } from '@/components/legal/sidebar-nav';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Sonoma Sip — how we handle your data, what we collect, and your rights.',
};

const LAST_UPDATED = 'April 4, 2026';
const CONTACT_EMAIL = 'zvthach@gmail.com';

const SECTIONS = [
  { label: 'Short Version', href: '#short-version' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Email Collection', href: '#email-collection' },
  { label: 'Shared Plan Data', href: '#shared-plan-data' },
  { label: 'No Data Sale', href: '#no-data-sale' },
  { label: 'Your Rights', href: '#your-rights' },
  { label: 'Third-Party Services', href: '#third-party-services' },
  { label: 'Changes', href: '#changes' },
  { label: 'Contact', href: '#contact' },
];

function SectionHeading({ number, children }: { number?: number; children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-bark text-2xl font-semibold tracking-tight">
      {number !== undefined && (
        <span className="inline-block w-8 font-sans tabular-nums">{number}.</span>
      )}
      {children}
    </h2>
  );
}

function PrivacyContent() {
  return (
    <>
      <section className="scroll-mt-20" id="short-version">
        <SectionHeading>The Short Version</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          We collect very little data. We don&apos;t use tracking cookies. We don&apos;t sell your
          information. If you give us your email to receive your winery plan, we use it for that and
          nothing else.
        </p>
      </section>

      <section className="scroll-mt-20" id="analytics">
        <SectionHeading number={1}>Analytics</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          We use Plausible Analytics, a privacy-focused analytics service. Plausible does not use
          cookies, does not collect personal data, and does not track you across websites. It gives
          us aggregate information like page views and referral sources — nothing that identifies
          you personally.
        </p>
        <p className="text-stone mt-3 text-pretty">
          Because Plausible is cookie-free, you won&apos;t see a cookie consent banner on Sonoma
          Sip. There&apos;s nothing to consent to.
        </p>
      </section>

      <section className="scroll-mt-20" id="email-collection">
        <SectionHeading number={2}>Email Collection</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          We only collect your email address if you choose to email yourself a winery plan. Your
          email is used solely to deliver that plan. We do not add you to a marketing list, and we
          do not share your email with anyone.
        </p>
        <p className="text-stone mt-3 text-pretty">
          If we ever introduce a newsletter or marketing emails in the future, it will be a
          separate, explicit opt-in — never automatic.
        </p>
      </section>

      <section className="scroll-mt-20" id="shared-plan-data">
        <SectionHeading number={3}>Shared Plan Data</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          When you create a winery plan on Sonoma Sip, we generate a shareable link so you can send
          it to friends or save it for later. Here&apos;s what that involves:
        </p>
        <ul role="list" className="text-stone mt-4 list-disc space-y-2 pl-6">
          <li className="text-pretty">
            <strong className="text-bark font-medium">What&apos;s stored:</strong> Your quiz answers
            and the resulting winery matches. No personal information beyond what you entered in the
            quiz.
          </li>
          <li className="text-pretty">
            <strong className="text-bark font-medium">Who can access it:</strong> Anyone with the
            link. Treat shared plan links like any other shareable URL — share them only with people
            you trust.
          </li>
        </ul>
      </section>

      <section className="scroll-mt-20" id="no-data-sale">
        <SectionHeading number={4}>No Sale of Personal Data</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          We do not sell, rent, or trade your personal information to third parties. Period.
        </p>
      </section>

      <section className="scroll-mt-20" id="your-rights">
        <SectionHeading number={5}>Your Rights (CCPA)</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          If you&apos;re a California resident, the California Consumer Privacy Act (CCPA) gives you
          specific rights regarding your personal information:
        </p>
        <ul role="list" className="text-stone mt-4 list-disc space-y-2 pl-6">
          <li className="text-pretty">
            <strong className="text-bark font-medium">Right to know:</strong> You can request what
            personal information we&apos;ve collected about you.
          </li>
          <li className="text-pretty">
            <strong className="text-bark font-medium">Right to delete:</strong> You can request that
            we delete any personal information we&apos;ve collected.
          </li>
          <li className="text-pretty">
            <strong className="text-bark font-medium">Right to opt out:</strong> Since we don&apos;t
            sell personal data, there&apos;s nothing to opt out of — but the right is yours.
          </li>
          <li className="text-pretty">
            <strong className="text-bark font-medium">Non-discrimination:</strong> We will never
            treat you differently for exercising your privacy rights.
          </li>
        </ul>
        <p className="text-stone mt-4 text-pretty">
          To exercise any of these rights, contact us at{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-wine decoration-wine/30 hover:decoration-wine underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section className="scroll-mt-20" id="third-party-services">
        <SectionHeading number={6}>Third-Party Services</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          Sonoma Sip uses the following third-party services:
        </p>
        <ul role="list" className="text-stone mt-4 list-disc space-y-2 pl-6">
          <li className="text-pretty">
            <strong className="text-bark font-medium">Plausible Analytics</strong> — privacy-focused
            web analytics (no cookies, no personal data)
          </li>
          <li className="text-pretty">
            <strong className="text-bark font-medium">Mapbox</strong> — for interactive maps on
            results and winery detail pages
          </li>
          <li className="text-pretty">
            <strong className="text-bark font-medium">Vercel</strong> — hosting and infrastructure
          </li>
          <li className="text-pretty">
            <strong className="text-bark font-medium">Supabase</strong> — database and
            authentication infrastructure
          </li>
        </ul>
        <p className="text-stone mt-3 text-pretty">
          Each service has its own privacy policy. We chose these services for their strong privacy
          practices.
        </p>
      </section>

      <section className="scroll-mt-20" id="changes">
        <SectionHeading number={7}>Changes to This Policy</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          If we make meaningful changes to this policy, we&apos;ll update the date at the top and
          note what changed. We won&apos;t bury changes in fine print.
        </p>
      </section>

      <section className="scroll-mt-20" id="contact">
        <SectionHeading number={8}>Contact</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          Questions or concerns about your privacy? Reach us at{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-wine decoration-wine/30 hover:decoration-wine underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </>
  );
}

export default function PrivacyPage() {
  return (
    <main className="flex-1 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12">
          <p className="text-wine font-mono text-sm tracking-wide">Legal</p>
          <h1 className="font-heading text-bark mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-stone mt-4">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="grid gap-12 md:grid-cols-[200px_1fr]">
          <SidebarNav sections={SECTIONS} />

          <div className="space-y-10">
            <PrivacyContent />

            <div className="border-gold/20 border-t pt-8">
              <p className="text-stone text-sm">
                See also our{' '}
                <Link
                  href="/terms"
                  className="text-wine decoration-wine/30 hover:decoration-wine underline underline-offset-4"
                >
                  Terms of Service
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
