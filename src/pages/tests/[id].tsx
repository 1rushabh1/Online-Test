import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/ui/Layout';
import { Card, Badge, Button, Spinner, Alert } from '@/components/ui';

export default function TestDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.replace('/auth/login'); return; }
    if (id) {
      fetch(`/api/tests/${id}`).then((r) => r.json()).then((d) => {
        if (d.test) { setTest(d.test); setQuestions(d.questions || []); }
        else setError('Test not found');
        setLoading(false);
      });
    }
  }, [session, status, id]);

  async function handleStart() {
    setStarting(true);
    setError('');
    const res = await fetch(`/api/tests/${id}/start`, { method: 'POST' });
    const data = await res.json();
    setStarting(false);
    if (res.ok) {
      router.push(`/attempt/${data.attempt.id}`);
    } else if (res.status === 409 && data.attemptId) {
      router.push(`/results/${data.attemptId}`);
    } else {
      setError(data.error || 'Failed to start test');
    }
  }

  if (loading) return <Layout><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>;
  if (error && !test) return <Layout><Alert type="error">{error}</Alert></Layout>;

  const mcqCount = questions.filter((q) => q.question_type === 'mcq').length;
  const subjectiveCount = questions.filter((q) => q.question_type === 'subjective').length;
  const totalMarks = questions.reduce((s: number, q: any) => s + q.marks, 0);

  return (
    <>
      <Head><title>{test.title} — ExamPortal</title></Head>
      <Layout>
        <div className="max-w-2xl mx-auto animate-slide-up">
          <Card className="mb-6">
            <div className="text-center py-4">
              <h1 className="font-display text-3xl font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
                {test.title}
              </h1>
              {test.description && (
                <p className="text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>
                  {test.description}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3 my-6">
                {[
                  { label: 'Duration', value: `${test.duration_minutes} min` },
                  { label: 'Questions', value: questions.length },
                  { label: 'Total Marks', value: totalMarks },
                  { label: 'MCQ', value: mcqCount },
                  { label: 'Subjective', value: subjectiveCount },
                ].map((s) => (
                  <div key={s.label} className="px-4 py-3 rounded-lg text-center" style={{ backgroundColor: 'var(--color-surface)', minWidth: '80px' }}>
                    <p className="text-xl font-display font-bold" style={{ color: 'var(--color-ink)' }}>{s.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="font-display font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>Instructions</h2>
            <ul className="text-sm space-y-2" style={{ color: 'var(--color-ink-muted)' }}>
              <li>• You have <strong>{test.duration_minutes} minutes</strong> to complete this test. The timer starts when you click Start.</li>
              <li>• You can navigate between questions freely using the question palette.</li>
              <li>• MCQ answers are auto-evaluated upon submission.</li>
              <li>• Subjective answers are scored based on keyword matching.</li>
              <li>• Once submitted, you cannot change your answers.</li>
              <li>• Make sure you have a stable internet connection before starting.</li>
            </ul>
          </Card>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <div className="flex gap-3 justify-center">
            <Button size="lg" loading={starting} onClick={handleStart}>
              Begin Test →
            </Button>
            <Button variant="secondary" size="lg" onClick={() => router.push('/tests')}>
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    </>
  );
}
