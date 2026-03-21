import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spinner } from '@/components/ui';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/auth/login');
    } else {
      const user = session.user as any;
      router.replace(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Spinner size="lg" />
    </div>
  );
}
