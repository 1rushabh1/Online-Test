import Link from 'next/link';
import Head from 'next/head';

export default function NotFound() {
  return (
    <>
      <Head><title>404 — ExamPortal</title></Head>
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <p className="font-mono text-6xl font-bold mb-2" style={{ color: 'var(--color-border)' }}>404</p>
        <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
          Page not found
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-ink-muted)' }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded font-medium text-sm"
          style={{ backgroundColor: '#1e1710', color: '#fff' }}
        >
          Go home
        </Link>
      </div>
    </>
  );
}
