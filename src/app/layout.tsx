import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Image from 'next/image';
import Analytics from '@/components/Analytics';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'bracu.network',
  description:
    'A webring and student directory for BRAC University students and alumni. Discover who is building cool things.',
  keywords: ['BRAC University', 'BRACU', 'webring', 'student directory', 'alumni network'],
  authors: [{ name: 'bracu.network community' }],
  openGraph: {
    title: 'bracu.network',
    description: 'A webring for BRAC University students and alumni.',
    url: 'https://bracu.network',
    siteName: 'bracu.network',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'bracu.network',
    description: 'A webring for BRAC University students and alumni.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
          <Analytics />
          {children}
        <footer className="site-footer">
          <Image
            src="/minimal-flat-b-and-n-should-be-inside-b--deep-navy.svg"
            alt="bracu.network"
            width={22}
            height={22}
            style={{ borderRadius: 5, opacity: 0.7 }}
          />
          <span className="site-footer-sep">·</span>
          <span className="site-footer-motto">by the BRACU people, for the BRACU people</span>
          <span className="site-footer-sep">·</span>
          <span>© {new Date().getFullYear()} bracu.network</span>
        </footer>
      </body>
    </html>
  );
}
