import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/ui/Layout';
import { Card, Badge, StatCard, Spinner, Alert } from '@/components/ui';

export default function AdminAttemptReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    const user = session?.user as any;
    if (!session || user?.role !== 'admin') { router.replace('/auth/login'); return; }
    if (id) {
      fetch(`/api/attempts/${id}/result`).then((r) => r.json()).then((d) => {
        setData(d);
        setLoading(false);
      });
    }
  }, [session, status, id]);

  if (loading) return (
    <Layout><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>
  );

  if (!data?.attempt) return (
    <Layout><Alert type="error">Attempt not found</Alert></Layout>
  );

  const { attempt, questions, answers } = data;
  const answerMap = new Map(answers.map((a: any) => [a.question_id, a]));
  const pct = attempt.total_marks > 0 ? Math.round((attempt.obtained_marks / attempt.total_marks) * 100) : 0;

  return (
    <>
      <Head><title>Review: {attempt.test_title} — Admin</title></Head>
      <Layout title="Submission Review">
        <div className="space-y-6 animate-fade-in">
          <nav className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            <Link href="/admin/attempts" className="hover:underline">Submissions</Link>
            <span className="mx-2">›</span>
            <span>{attempt.user_name}</span>
          </nav>

          {/* Header */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                  {attempt.test_title}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                  Student: <strong>{attempt.user_name}</strong> ({attempt.user_email})
                </p>
                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--color-accent)' }}>
                  Submitted: {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div
                className="text-center px-6 py-3 rounded-lg"
                style={{ backgroundColor: pct >= 60 ? 'rgba(5,150,105,0.1)' : 'rgba(225,29,72,0.1)' }}
              >
                <p className="text-4xl font-display font-bold" style={{ color: pct >= 60 ? '#059669' : '#e11d48' }}>
                  {pct}%
                </p>
                <p className="text-sm font-mono" style={{ color: 'var(--color-ink-muted)' }}>
                  {attempt.obtained_marks}/{attempt.total_marks} marks
                </p>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="MCQ Correct" value={attempt.mcq_correct} color="#059669" />
            <StatCard label="MCQ Wrong" value={attempt.mcq_incorrect} color="#e11d48" />
            <StatCard label="MCQ Skipped" value={attempt.mcq_unattempted} color="#d97706" />
            <StatCard label="Subj. Attempted" value={attempt.subjective_attempted} />
            <StatCard label="Subj. Skipped" value={attempt.subjective_unattempted} color="#d97706" />
          </div>

          {/* Detailed answers */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
              Detailed Responses
            </h3>
            <div className="flex flex-col gap-4">
              {questions.map((q: any, i: number) => {
                const ans = answerMap.get(q.id) as any;
                return (
                  <Card key={q.id}>
                    <div className="flex gap-3">
                      <div
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-ink-muted)' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{q.question_text}</p>
                          <div className="flex-shrink-0 flex gap-1 items-center">
                            <Badge color={q.question_type === 'mcq' ? 'blue' : 'amber'}>
                              {q.question_type === 'mcq' ? 'MCQ' : 'Subjective'}
                            </Badge>
                            <span className="text-xs font-mono" style={{ color: 'var(--color-ink-muted)' }}>
                              {ans?.marks_awarded ?? 0}/{q.marks}
                            </span>
                          </div>
                        </div>

                        {q.question_type === 'mcq' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {q.options?.map((opt: any) => {
                              const isSelected = ans?.selected_option_id === opt.id;
                              const isCorrect = opt.id === q.correct_option_id;
                              return (
                                <div
                                  key={opt.id}
                                  className="text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5"
                                  style={{
                                    backgroundColor: isCorrect
                                      ? 'rgba(5,150,105,0.1)'
                                      : isSelected && !isCorrect
                                      ? 'rgba(225,29,72,0.08)'
                                      : 'var(--color-surface)',
                                    color: isCorrect ? '#065f46' : isSelected && !isCorrect ? '#9f1239' : 'var(--color-ink-muted)',
                                    border: isSelected ? `1px solid ${isCorrect ? '#059669' : '#e11d48'}` : '1px solid transparent',
                                  }}
                                >
                                  <span>{isCorrect ? '✓' : isSelected ? '✗' : '○'}</span>
                                  <span>{opt.text}</span>
                                  {isSelected && !isCorrect && <span className="ml-auto font-bold">← Student</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.question_type === 'subjective' && (
                          <div className="flex flex-col gap-2">
                            <div
                              className="p-3 rounded text-sm"
                              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }}
                            >
                              {ans?.answer_text || <em style={{ color: 'var(--color-ink-muted)' }}>No answer provided</em>}
                            </div>
                            {q.keywords?.length > 0 && (
                              <div>
                                <p className="text-xs mb-1" style={{ color: 'var(--color-ink-muted)' }}>
                                  Keywords matched: {ans?.keyword_matches?.length || 0}/{q.keywords.length}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {q.keywords.map((kw: string) => {
                                    const matched = ans?.keyword_matches?.includes(kw);
                                    return (
                                      <span
                                        key={kw}
                                        className="text-xs px-1.5 py-0.5 rounded font-mono"
                                        style={{
                                          backgroundColor: matched ? 'rgba(5,150,105,0.15)' : 'rgba(225,29,72,0.08)',
                                          color: matched ? '#065f46' : '#9f1239',
                                        }}
                                      >
                                        {matched ? '✓' : '✗'} {kw}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
