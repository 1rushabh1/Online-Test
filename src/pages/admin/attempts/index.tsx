import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/ui/Layout';
import { Card, Badge, Button, Spinner } from '@/components/ui';

export default function AdminAttemptsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    const user = session?.user as any;
    if (!session || user?.role !== 'admin') { router.replace('/auth/login'); return; }
    fetch('/api/attempts').then((r) => r.json()).then((d) => {
      setAttempts(d.attempts || []);
      setLoading(false);
    });
  }, [session, status]);

  const filtered = filter
    ? attempts.filter(
        (a) =>
          a.test_title?.toLowerCase().includes(filter.toLowerCase()) ||
          a.user_name?.toLowerCase().includes(filter.toLowerCase()) ||
          a.user_email?.toLowerCase().includes(filter.toLowerCase())
      )
    : attempts;

  return (
    <>
      <Head><title>Submissions — ExamPortal</title></Head>
      <Layout title="All Submissions">
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <input
              type="search"
              placeholder="Search by test or student name..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 rounded border text-sm flex-1 max-w-xs"
              style={{ borderColor: 'var(--color-border)', backgroundColor: '#fff', outline: 'none' }}
            />
            <span className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <Card>
              <p className="text-center py-8" style={{ color: 'var(--color-ink-muted)' }}>
                No submissions found
              </p>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: 'var(--color-surface)' }}>
                  <tr>
                    {['Student', 'Test', 'Score', 'MCQ', 'Subjective', 'Status', 'Date', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide"
                        style={{ color: 'var(--color-ink-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => (
                    <tr
                      key={a.id}
                      className="border-t"
                      style={{ borderColor: 'var(--color-border)', backgroundColor: i % 2 === 0 ? '#fff' : 'var(--color-bg)' }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: 'var(--color-ink)' }}>{a.user_name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>{a.user_email}</p>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-ink)' }}>{a.test_title}</td>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--color-ink)' }}>
                        {a.obtained_marks}/{a.total_marks}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                        ✓{a.mcq_correct} ✗{a.mcq_incorrect} –{a.mcq_unattempted}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                        {a.subjective_attempted} attempted
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={a.status === 'submitted' ? 'emerald' : 'amber'}>
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--color-ink-muted)' }}>
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/attempts/${a.id}`}>
                          <Button variant="secondary" size="sm">Review</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
