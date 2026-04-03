import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Geist_Mono, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const cormorant = Cormorant_Garamond({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sonoma Sip',
  description:
    'Plan your Sonoma County winery visit. Answer a few questions and get a personalized, ranked list of wineries that fit your taste, budget, and group.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", cormorant.variable, geistMono.variable, "font-sans", geist.variable)}
    >
      <body className="flex min-h-full flex-col bg-cream text-text">{children}</body>
    </html>
  );
}
