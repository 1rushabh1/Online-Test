import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/ui/Layout';
import { Card, Badge, Button, Spinner } from '@/components/ui';

export default function TestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.replace('/auth/login'); return; }
    fetch('/api/tests').then((r) => r.json()).then((d) => {
      setTests(d.tests || []);
      setLoading(false);
    });
  }, [session, status]);

  return (
    <>
      <Head><title>Available Tests — ExamPortal</title></Head>
      <Layout title="Available Tests">
        <div className="space-y-4 animate-fade-in">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : tests.length === 0 ? (
            <Card>
              <p className="text-center py-12" style={{ color: 'var(--color-ink-muted)' }}>
                No tests published yet. Check back soon!
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tests.map((test) => {
                const isSubmitted = test.attempt_status === 'submitted';
                const isInProgress = test.attempt_status === 'in_progress';
                return (
                  <Card key={test.id} className="flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="font-display font-semibold text-lg leading-tight" style={{ color: 'var(--color-ink)' }}>
                          {test.title}
                        </h2>
                        {isSubmitted && <Badge color="emerald">Completed</Badge>}
                        {isInProgress && <Badge color="amber">In Progress</Badge>}
                      </div>
                      {test.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-ink-muted)' }}>
                          {test.description}
                        </p>
                      )}
                      <div className="flex gap-3 text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                        <span>{test.question_count} questions</span>
                        <span>{test.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {isSubmitted ? (
                        <>
                          <span className="text-sm font-mono font-bold" style={{ color: '#059669' }}>
                            Score: {test.obtained_marks}/{test.total_marks}
                          </span>
                          <Link href={`/results/${test.attempt_id}`}>
                            <Button variant="secondary" size="sm">View Results</Button>
                          </Link>
                        </>
                      ) : (
                        <Link href={`/tests/${test.id}`} className="w-full">
                          <Button size="sm" className="w-full">
                            {isInProgress ? 'Resume Test →' : 'Start Test →'}
                          </Button>
                        </Link>
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
