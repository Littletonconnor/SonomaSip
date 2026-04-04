import type { Metadata } from 'next';
import Link from 'next/link';
import { SidebarNav } from '@/components/legal/sidebar-nav';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for Sonoma Sip, an independent guide to Sonoma County wineries.',
};

const LAST_UPDATED = 'April 4, 2026';
const CONTACT_EMAIL = 'zvthach@gmail.com';

const SECTIONS = [
  { label: 'What Sonoma Sip Is', href: '#what-sonoma-sip-is' },
  { label: 'Accuracy', href: '#accuracy' },
  { label: 'Third-Party Content', href: '#third-party-content' },
  { label: 'Winery Opt-Out', href: '#winery-opt-out' },
  { label: 'Liability', href: '#liability' },
  { label: 'User Content', href: '#user-content' },
  { label: 'Changes', href: '#changes' },
  { label: 'Contact', href: '#contact' },
];

function SectionHeading({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-bark text-2xl font-semibold tracking-tight">
      <span className="inline-block w-8 font-sans tabular-nums">{number}.</span>
      {children}
    </h2>
  );
}

function TermsContent() {
  return (
    <>
      <section className="scroll-mt-20" id="what-sonoma-sip-is">
        <SectionHeading number={1}>What Sonoma Sip Is</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          Sonoma Sip is an independent informational guide to wineries in Sonoma County, California.
          We are not agents, representatives, or affiliates of any winery, vineyard, or tasting room
          listed on this site. A listing on Sonoma Sip does not imply endorsement, partnership, or
          sponsorship in either direction.
        </p>
      </section>

      <section className="scroll-mt-20" id="accuracy">
        <SectionHeading number={2}>No Guarantee of Accuracy</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          All winery information on Sonoma Sip — including hours, tasting fees, reservation policies,
          amenities, accessibility details, and availability — is provided for informational purposes
          only. We make reasonable efforts to keep our data current, but wineries change their
          operations frequently and without notice.
        </p>
        <p className="text-stone mt-3 text-pretty">
          <strong className="text-bark font-medium">
            Always verify details directly with a winery before visiting.
          </strong>{' '}
          Sonoma Sip is not responsible for any inconvenience, expense, or disappointment resulting
          from inaccurate or outdated information on this site.
        </p>
      </section>

      <section className="scroll-mt-20" id="third-party-content">
        <SectionHeading number={3}>Third-Party Content and Trademarks</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          Winery names, logos, descriptions, and related details displayed on Sonoma Sip are sourced
          from publicly available information. All trademarks, service marks, and trade names belong
          to their respective owners. We use them solely for identification and informational
          purposes.
        </p>
        <p className="text-stone mt-3 text-pretty">
          When you follow a link from Sonoma Sip to a winery&apos;s website or booking platform, you
          leave our site. We are not responsible for the content, privacy practices, or availability
          of those external sites.
        </p>
      </section>

      <section className="scroll-mt-20" id="winery-opt-out">
        <SectionHeading number={4}>Winery Opt-Out and Update Requests</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          If you represent a winery listed on Sonoma Sip and would like to update your listing
          information or request removal, please contact us at{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-wine decoration-wine/30 hover:decoration-wine underline underline-offset-4"
          >
            {CONTACT_EMAIL}
          </a>
          . We will process your request within 7 business days.
        </p>
      </section>

      <section className="scroll-mt-20" id="liability">
        <SectionHeading number={5}>Limitation of Liability</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          Sonoma Sip and its creators shall not be liable for any direct, indirect, incidental, or
          consequential damages arising from your use of this site or reliance on any information
          provided — including but not limited to incorrect hours, prices, policies, closures, or
          changes in winery operations.
        </p>
        <p className="text-stone mt-3 text-pretty">
          This site is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
          warranties of any kind, express or implied.
        </p>
      </section>

      <section className="scroll-mt-20" id="user-content">
        <SectionHeading number={6}>User-Generated Content</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          We may introduce features in the future that allow users to submit reviews, corrections, or
          reports. If we do, we reserve the right to moderate, edit, or remove user-submitted content
          at our discretion. We are not responsible for the accuracy or opinions expressed in
          user-generated content.
        </p>
      </section>

      <section className="scroll-mt-20" id="changes">
        <SectionHeading number={7}>Changes to These Terms</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          We may update these terms from time to time. When we do, we&apos;ll update the date at the
          top of this page. Continued use of Sonoma Sip after changes are posted constitutes your
          acceptance of the revised terms.
        </p>
      </section>

      <section className="scroll-mt-20" id="contact">
        <SectionHeading number={8}>Contact</SectionHeading>
        <p className="text-stone mt-4 text-pretty">
          Questions about these terms? Reach us at{' '}
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

export default function TermsPage() {
  return (
    <main className="flex-1 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12">
          <p className="text-wine font-mono text-sm tracking-wide">Legal</p>
          <h1 className="font-heading text-bark mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Terms of Service
          </h1>
          <p className="text-stone mt-4">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="grid gap-12 md:grid-cols-[200px_1fr]">
          <SidebarNav sections={SECTIONS} />

          <div className="space-y-10">
            <TermsContent />

            <div className="border-gold/20 border-t pt-8">
              <p className="text-stone text-sm">
                See also our{' '}
                <Link
                  href="/privacy"
                  className="text-wine decoration-wine/30 hover:decoration-wine underline underline-offset-4"
                >
                  Privacy Policy
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
