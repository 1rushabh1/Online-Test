import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/ui/Layout';
import { Card, Badge, Button, Spinner, StatCard } from '@/components/ui';

export default function MyResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.replace('/auth/login'); return; }
    fetch('/api/attempts').then((r) => r.json()).then((d) => {
      setAttempts(d.attempts || []);
      setLoading(false);
    });
  }, [session, status]);

  const submitted = attempts.filter((a) => a.status === 'submitted');
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((sum, a) => sum + (a.total_marks > 0 ? (a.obtained_marks / a.total_marks) * 100 : 0), 0) / submitted.length)
    : 0;
  const best = submitted.length > 0
    ? Math.max(...submitted.map((a) => a.total_marks > 0 ? Math.round((a.obtained_marks / a.total_marks) * 100) : 0))
    : 0;

  return (
    <>
      <Head><title>My Results — ExamPortal</title></Head>
      <Layout title="My Results">
        <div className="space-y-6 animate-fade-in">
          {!loading && submitted.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Tests Completed" value={submitted.length} />
              <StatCard label="Average Score" value={`${avgScore}%`} color="#1e1710" />
              <StatCard label="Best Score" value={`${best}%`} color="#059669" />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : attempts.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-lg font-display mb-2" style={{ color: 'var(--color-ink-muted)' }}>No test results yet</p>
                <p className="text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>Take a test to see your results here</p>
                <Link href="/tests"><Button>Browse Tests</Button></Link>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {attempts.map((a) => {
                const pct = a.total_marks > 0 ? Math.round((a.obtained_marks / a.total_marks) * 100) : 0;
                const isSubmitted = a.status === 'submitted';
                return (
                  <Card key={a.id} className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" style={{ color: 'var(--color-ink)' }}>{a.test_title}</h3>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-accent)' }}>
                        {isSubmitted
                          ? `Submitted ${new Date(a.submitted_at).toLocaleDateString()}`
                          : `Started ${new Date(a.created_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isSubmitted ? (
                        <>
                          <div className="text-right">
                            <p
                              className="text-xl font-display font-bold"
                              style={{ color: pct >= 60 ? '#059669' : '#e11d48' }}
                            >
                              {pct}%
                            </p>
                            <p className="text-xs font-mono" style={{ color: 'var(--color-ink-muted)' }}>
                              {a.obtained_marks}/{a.total_marks}
                            </p>
                          </div>
                          <Link href={`/results/${a.id}`}>
                            <Button variant="secondary" size="sm">View</Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Badge color="amber">In Progress</Badge>
                          <Link href={`/attempt/${a.id}`}>
                            <Button size="sm">Resume</Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
