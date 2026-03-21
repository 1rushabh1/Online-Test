import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/ui/Layout';
import { Card, Button, Input, Textarea, Alert } from '@/components/ui';

export default function NewTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', duration_minutes: '60' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    const user = session?.user as any;
    if (!session || user?.role !== 'admin') router.replace('/auth/login');
  }, [session, status]);

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.duration_minutes || parseInt(form.duration_minutes) < 1) {
      setError('Duration must be at least 1 minute'); return;
    }

    setLoading(true);
    const res = await fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim(),
        duration_minutes: parseInt(form.duration_minutes),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Failed to create test');
    } else {
      router.push(`/admin/tests/${data.test.id}`);
    }
  }

  return (
    <>
      <Head><title>New Test — ExamPortal</title></Head>
      <Layout title="Create New Test">
        <div className="max-w-2xl animate-slide-up">
          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Test title *"
                type="text"
                value={form.title}
                onChange={update('title')}
                placeholder="e.g. JavaScript Fundamentals"
                required
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={update('description')}
                  placeholder="What is this test about? (optional)"
                  rows={3}
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{
                    backgroundColor: '#fff',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-ink)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
              <Input
                label="Duration (minutes) *"
                type="number"
                value={form.duration_minutes}
                onChange={update('duration_minutes')}
                min="1"
                max="480"
                required
                hint="How long test-takers have to complete this test"
              />

              {error && <Alert type="error">{error}</Alert>}

              <div className="flex gap-3 mt-2">
                <Button type="submit" loading={loading} size="lg">
                  Create Test & Add Questions →
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </Layout>
    </>
  );
}
