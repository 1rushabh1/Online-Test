import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Button, Input, Alert } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Registration failed');
    } else {
      router.push('/auth/login?registered=1');
    }
  }

  return (
    <>
      <Head><title>Create Account — ExamPortal</title></Head>
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="w-full max-w-md animate-slide-up">
          {/* Brand */}
          <div className="text-center mb-10">
            <div
              className="w-12 h-12 rounded-md flex items-center justify-center font-display font-bold text-xl mx-auto mb-4"
              style={{ backgroundColor: '#1e1710', color: '#fbbf24' }}
            >
              EP
            </div>
            <h1 className="text-3xl font-display font-semibold" style={{ color: 'var(--color-ink)' }}>
              Create Account
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-muted)' }}>
              Register as a Test Taker
            </p>
          </div>

          <div
            className="rounded-xl border p-8 shadow-sm"
            style={{ backgroundColor: '#fff', borderColor: 'var(--color-border)' }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Full name"
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Jane Smith"
                required
                autoFocus
              />
              <Input
                label="Email address"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="At least 6 characters"
                required
              />
              <Input
                label="Confirm password"
                type="password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="Repeat your password"
                required
              />

              {error && <Alert type="error">{error}</Alert>}

              <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
                Create account
              </Button>
            </form>

            <hr className="my-6" style={{ borderColor: 'var(--color-border)' }} />

            <p className="text-sm text-center" style={{ color: 'var(--color-ink-muted)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium" style={{ color: 'var(--color-ink)' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
