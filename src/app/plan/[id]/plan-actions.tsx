'use client';

import { useState } from 'react';
import { Link2, Printer, Mail, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CopyLinkButton({ planUrl }: { planUrl: string }) {
  const [copied, setCopied] = useState(false);

  // TODO: convert this into a typed hook
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(planUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <Button variant="outline" size="sm" className="w-26" onClick={handleCopy}>
      <span className="relative size-3.5">
        <Link2
          className={`absolute inset-0 size-3.5 transition-all duration-200 ${copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        />
        <Check
          className={`text-wine absolute inset-0 size-3.5 transition-all duration-200 ${copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
        />
      </span>
      {copied ? 'Copied' : 'Copy Link'}
    </Button>
  );
}

export function PlanActions({ planUrl }: { planUrl: string }) {
  function handlePrint() {
    window.print();
  }

  function handleEmail() {
    const subject = encodeURIComponent('Check out my Sonoma wine day plan!');
    const body = encodeURIComponent(
      `I put together a wine tasting itinerary on Sonoma Sip — take a look!\n\n${planUrl}`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  }

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      <CopyLinkButton planUrl={planUrl} />
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="size-3.5" />
        Print
      </Button>
      <Button variant="outline" size="sm" onClick={handleEmail}>
        <Mail className="size-3.5" />
        Email
      </Button>
    </div>
  );
}
