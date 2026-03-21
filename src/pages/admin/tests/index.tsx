import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/ui/Layout';
import { Card, Badge, Button, Spinner, Alert } from '@/components/ui';

export default function AdminTestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    const user = session?.user as any;
    if (!session || user?.role !== 'admin') { router.replace('/auth/login'); return; }
    fetchTests();
  }, [session, status]);

  async function fetchTests() {
    setLoading(true);
    const res = await fetch('/api/tests');
    const data = await res.json();
    setTests(data.tests || []);
    setLoading(false);
  }

  async function handlePublish(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/tests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setActionMsg(`Test ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      fetchTests();
      setTimeout(() => setActionMsg(''), 3000);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete test "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/tests/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setActionMsg('Test deleted');
      fetchTests();
      setTimeout(() => setActionMsg(''), 3000);
    }
  }

  return (
    <>
      <Head><title>My Tests — ExamPortal</title></Head>
      <Layout title="My Tests">
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              {tests.length} test{tests.length !== 1 ? 's' : ''} created
            </p>
            <Link href="/admin/tests/new">
              <Button>+ New Test</Button>
            </Link>
          </div>

          {actionMsg && <Alert type="success">{actionMsg}</Alert>}

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : tests.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-lg font-display mb-2" style={{ color: 'var(--color-ink-muted)' }}>No tests yet</p>
                <p className="text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>Create your first test to get started</p>
                <Link href="/admin/tests/new"><Button>Create Test</Button></Link>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tests.map((test) => (
                <Card key={test.id}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display font-semibold text-lg truncate" style={{ color: 'var(--color-ink)' }}>
                          {test.title}
                        </h3>
                        <Badge color={test.status === 'published' ? 'emerald' : test.status === 'draft' ? 'amber' : 'ink'}>
                          {test.status}
                        </Badge>
                      </div>
                      {test.description && (
                        <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--color-ink-muted)' }}>
                          {test.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                        <span>{test.question_count} questions</span>
                        <span>{test.duration_minutes} min</span>
                        <span>{new Date(test.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/admin/tests/${test.id}`}>
                        <Button variant="secondary" size="sm">Edit & Manage</Button>
                      </Link>
                      <Button
                        variant={test.status === 'published' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handlePublish(test.id, test.status)}
                      >
                        {test.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(test.id, test.title)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
