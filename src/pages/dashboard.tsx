import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/ui/Layout';
import { Card, Badge, StatCard, Button, Spinner } from '@/components/ui';

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.replace('/auth/login'); return; }
    const user = session.user as any;
    if (user?.role === 'admin') { router.replace('/admin/dashboard'); return; }
    Promise.all([fetch('/api/tests').then((r) => r.json()), fetch('/api/attempts').then((r) => r.json())])
      .then(([td, ad]) => {
        setTests(td.tests || []);
        setAttempts(ad.attempts || []);
        setLoading(false);
      });
  }, [session, status]);

  const completed = attempts.filter((a) => a.status === 'submitted').length;
  const avgScore = completed > 0
    ? Math.round(attempts.filter((a) => a.status === 'submitted').reduce((sum, a) => sum + (a.total_marks > 0 ? (a.obtained_marks / a.total_marks) * 100 : 0), 0) / completed)
    : 0;
  const available = tests.filter((t: any) => !t.attempt_id);

  if (loading) return (
    <Layout title="Dashboard"><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>
  );

  return (
    <>
      <Head><title>Dashboard — ExamPortal</title></Head>
      <Layout title="Dashboard">
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Tests Available" value={available.length} />
            <StatCard label="Completed" value={completed} color="#059669" />
            <StatCard label="Avg. Score" value={`${avgScore}%`} color="#1e1710" />
          </div>

          {/* Available tests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
                Available Tests
              </h2>
              <Link href="/tests">
                <Button variant="secondary" size="sm">View all</Button>
              </Link>
            </div>

            {available.length === 0 ? (
              <Card>
                <p className="text-center py-8" style={{ color: 'var(--color-ink-muted)' }}>
                  No new tests available at the moment.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {available.slice(0, 4).map((test: any) => (
                  <Card key={test.id} className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--color-ink)' }}>{test.title}</h3>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-accent)' }}>
                        {test.question_count} questions · {test.duration_minutes} min
                      </p>
                    </div>
                    <Link href={`/tests/${test.id}`}>
                      <Button size="sm">Start Test</Button>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent results */}
          {attempts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Recent Results
                </h2>
                <Link href="/my-results">
                  <Button variant="secondary" size="sm">All results</Button>
                </Link>
              </div>
              <div className="grid gap-3">
                {attempts.filter((a) => a.status === 'submitted').slice(0, 3).map((a: any) => {
                  const pct = a.total_marks > 0 ? Math.round((a.obtained_marks / a.total_marks) * 100) : 0;
                  return (
                    <Card key={a.id} className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-medium" style={{ color: 'var(--color-ink)' }}>{a.test_title}</h3>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-accent)' }}>
                          {new Date(a.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-lg font-display font-bold"
                          style={{ color: pct >= 60 ? '#059669' : '#e11d48' }}
                        >
                          {pct}%
                        </span>
                        <Link href={`/results/${a.id}`}>
                          <Button variant="secondary" size="sm">View</Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
