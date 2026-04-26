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
        <Link href="/" className="btn-back" aria-label="Back to bracu.network home">
          <span className="btn-back-arrow">←</span>
          <span className="btn-back-label">Home</span>
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
