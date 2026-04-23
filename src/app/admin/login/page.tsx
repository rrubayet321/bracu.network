'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('Invalid email or password.');
      } else {
        router.push('/admin');
        router.refresh();
      }
    });
  }

  return (
    <div className="login-wrapper">
      <div className="login-card" id="admin-login-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Lock size={16} color="var(--accent)" />
          <h1 className="login-title" style={{ margin: 0 }}>Admin Login</h1>
        </div>
        <p className="login-subtitle">bracu.network admin access only</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} id="admin-login-form">
          <div className="form-group">
            <label htmlFor="admin-email" className="form-label">Email</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="admin@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password" className="form-label">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending}
            id="admin-login-btn"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            {isPending ? <><Loader2 size={14} /> Signing in...</> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
