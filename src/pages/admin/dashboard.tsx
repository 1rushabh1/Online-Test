import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/ui/Layout';
import { Card, Badge, StatCard, Spinner, Button } from '@/components/ui';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    const user = session?.user as any;
    if (!session || user?.role !== 'admin') {
      router.replace('/auth/login');
      return;
    }
    fetchData();
  }, [session, status]);

  async function fetchData() {
    setLoading(true);
    const [testsRes, attemptsRes] = await Promise.all([
      fetch('/api/tests'),
      fetch('/api/attempts'),
    ]);
    const [testsData, attemptsData] = await Promise.all([testsRes.json(), attemptsRes.json()]);
    setTests(testsData.tests || []);
    setAttempts(attemptsData.attempts || []);
    setLoading(false);
  }

  const published = tests.filter((t) => t.status === 'published').length;
  const drafts = tests.filter((t) => t.status === 'draft').length;
  const submitted = attempts.filter((a) => a.status === 'submitted').length;

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </Layout>
    );
  }

  return (
    <>
      <Head><title>Admin Dashboard — ExamPortal</title></Head>
      <Layout title="Dashboard">
        <div className="space-y-8 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Tests" value={tests.length} />
            <StatCard label="Published" value={published} color="#059669" />
            <StatCard label="Drafts" value={drafts} color="#d97706" />
            <StatCard label="Submissions" value={submitted} color="#1e1710" />
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/tests/new">
              <Button size="lg">+ Create New Test</Button>
            </Link>
            <Link href="/admin/tests">
              <Button variant="secondary" size="lg">Manage Tests</Button>
            </Link>
            <Link href="/admin/attempts">
              <Button variant="secondary" size="lg">View Submissions</Button>
            </Link>
          </div>

          {/* Recent tests */}
          <div>
            <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
              Recent Tests
            </h2>
            {tests.length === 0 ? (
              <Card>
                <p className="text-center py-8" style={{ color: 'var(--color-ink-muted)' }}>
                  No tests yet.{' '}
                  <Link href="/admin/tests/new" className="underline font-medium" style={{ color: 'var(--color-ink)' }}>
                    Create your first test
                  </Link>
                </p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {tests.slice(0, 5).map((test) => (
                  <Card key={test.id} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                          {test.title}
                        </h3>
                        <Badge color={test.status === 'published' ? 'emerald' : test.status === 'draft' ? 'amber' : 'ink'}>
                          {test.status}
                        </Badge>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                        {test.question_count} questions · {test.duration_minutes} min
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/admin/tests/${test.id}`}>
                        <Button variant="secondary" size="sm">Edit</Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent submissions */}
          {attempts.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
                Recent Submissions
              </h2>
              <div className="grid gap-3">
                {attempts.slice(0, 5).map((a) => (
                  <Card key={a.id} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--color-ink)' }}>
                        {a.user_name}
                        <span className="ml-2 text-xs font-normal" style={{ color: 'var(--color-ink-muted)' }}>
                          {a.user_email}
                        </span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                        {a.test_title} · Score: {a.obtained_marks}/{a.total_marks}
                      </p>
                    </div>
                    <Link href={`/admin/attempts/${a.id}`}>
                      <Button variant="secondary" size="sm">Review</Button>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
