import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user as any;

  const navLinks = user?.role === 'admin'
    ? [
        { href: '/admin/dashboard', label: 'Dashboard' },
        { href: '/admin/tests', label: 'My Tests' },
        { href: '/admin/attempts', label: 'Submissions' },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/tests', label: 'Available Tests' },
        { href: '/my-results', label: 'My Results' },
      ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: 'var(--color-ink-950, #0f0c08)',
          borderColor: 'var(--color-ink-800, #3d3020)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-3 group">
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center font-display font-bold text-sm"
                style={{ backgroundColor: 'var(--color-amber)', color: '#0f0c08' }}
              >
                EP
              </div>
              <span className="font-display text-lg font-semibold text-white hidden sm:block">
                ExamPortal
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = router.pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded text-sm transition-all duration-150 font-medium"
                    style={{
                      color: isActive ? '#fbbf24' : '#c2b89a',
                      backgroundColor: isActive ? 'rgba(251,191,36,0.1)' : 'transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-3">
              {session ? (
                <>
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-medium text-white leading-tight">{user?.name}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-sm font-mono uppercase tracking-wider"
                      style={{
                        backgroundColor: user?.role === 'admin' ? 'rgba(217,119,6,0.2)' : 'rgba(5,150,105,0.2)',
                        color: user?.role === 'admin' ? '#fbbf24' : '#34d399',
                      }}
                    >
                      {user?.role === 'admin' ? 'Admin' : 'Test Taker'}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className="px-3 py-1.5 text-sm rounded border transition-all duration-150 font-medium"
                    style={{
                      borderColor: 'rgba(194,184,154,0.3)',
                      color: '#c2b89a',
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="px-3 py-1.5 text-sm rounded font-medium text-white">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {session && (
          <div
            className="md:hidden border-t flex overflow-x-auto"
            style={{ borderColor: 'rgba(194,184,154,0.15)' }}
          >
            {navLinks.map((link) => {
              const isActive = router.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? '#fbbf24' : '#c2b89a',
                    borderBottom: isActive ? '2px solid #fbbf24' : '2px solid transparent',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Page title bar */}
      {title && (
        <div className="border-b py-4 px-4 sm:px-6 lg:px-8" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-display font-semibold" style={{ color: 'var(--color-ink)' }}>
              {title}
            </h1>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-4 text-center text-sm"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-muted)' }}
      >
        ExamPortal &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
