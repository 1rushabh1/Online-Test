import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Button, Input, Alert } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
    } else {
      router.push('/');
    }
  }

  return (
    <>
      <Head><title>Sign In — ExamPortal</title></Head>
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
              ExamPortal
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-muted)' }}>
              Sign in to continue
            </p>
          </div>

          {/* Form card */}
          <div
            className="rounded-xl border p-8 shadow-sm"
            style={{ backgroundColor: '#fff', borderColor: 'var(--color-border)' }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {error && <Alert type="error">{error}</Alert>}

              <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
                Sign in
              </Button>
            </form>

            <hr className="my-6" style={{ borderColor: 'var(--color-border)' }} />

            <p className="text-sm text-center" style={{ color: 'var(--color-ink-muted)' }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium"
                style={{ color: 'var(--color-ink)' }}
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          <div
            className="mt-4 rounded-lg border p-4 text-sm"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--color-ink-muted)' }}>Default Admin:</p>
            <p className="font-mono text-xs" style={{ color: 'var(--color-accent)' }}>
              admin@examportal.com / Admin@123
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
