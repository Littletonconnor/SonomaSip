import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Geist_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import './globals.css';

const cormorant = Cormorant_Garamond({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Sonoma Sip — Your Personalized Sonoma County Winery Guide',
    template: '%s | Sonoma Sip',
  },
  description:
    'Plan your Sonoma County winery visit. Answer a few questions and get a personalized, ranked list of wineries that fit your taste, budget, and group.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Sonoma Sip — Your Personalized Sonoma County Winery Guide',
    description:
      'Answer a few questions and get a personalized, ranked list of Sonoma County wineries that fit your taste, budget, and group.',
    siteName: 'Sonoma Sip',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <Navbar />
          <div className="flex flex-1 flex-col pt-16">{children}</div>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
