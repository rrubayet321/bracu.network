import type { Metadata } from 'next';
import Link from 'next/link';
import JoinForm from '@/components/JoinForm';

export const metadata: Metadata = {
  title: 'Join — bracu.network',
  description: 'Join the bracu.network webring as a BRAC University student or alumni.',
};

export default function JoinPage() {
  return (
    <main className="join-wrapper">
      <div className="join-header">
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, display: 'inline-block' }}>
          ← bracu.network
        </Link>
        <h1 className="join-title">Join the network</h1>
        <p className="join-subtitle">
          Fill out the form below to apply. Once approved you&apos;ll appear in the
          directory and network graph. No GitHub required.
        </p>
      </div>

      <JoinForm />
    </main>
  );
}
