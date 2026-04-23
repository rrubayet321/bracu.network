import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
