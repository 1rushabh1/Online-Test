import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/ui/Layout';
import { Card, Badge, StatCard, Button, Spinner, Alert } from '@/components/ui';

export default function ResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id: attemptId } = router.query as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSubjective, setShowSubjective] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.replace('/auth/login'); return; }
    if (attemptId) {
      fetch(`/api/attempts/${attemptId}/result`)
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); });
    }
  }, [session, status, attemptId]);

  if (loading) return (
    <Layout title="Results">
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </Layout>
  );

  if (!data?.attempt) return (
    <Layout title="Results">
      <Alert type="error">Results not found</Alert>
    </Layout>
  );

  const { attempt, questions, answers } = data;
  const answerMap = new Map(answers.map((a: any) => [a.question_id, a]));
  const pct = attempt.total_marks > 0 ? Math.round((attempt.obtained_marks / attempt.total_marks) * 100) : 0;
  const mcqQuestions = questions.filter((q: any) => q.question_type === 'mcq');
  const subjectiveQuestions = questions.filter((q: any) => q.question_type === 'subjective');

  const passed = pct >= 60;

  return (
    <>
      <Head><title>Results — {attempt.test_title}</title></Head>
      <Layout title="Test Results">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

          {/* Score hero */}
          <Card className="text-center py-8">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-display font-bold"
              style={{
                backgroundColor: passed ? 'rgba(5,150,105,0.12)' : 'rgba(225,29,72,0.12)',
                color: passed ? '#059669' : '#e11d48',
                border: `3px solid ${passed ? '#059669' : '#e11d48'}`,
              }}
            >
              {pct}%
            </div>
            <h1 className="font-display text-2xl font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
              {attempt.test_title}
            </h1>
            <p className="text-sm mb-2" style={{ color: 'var(--color-ink-muted)' }}>
              {passed ? '🎉 Well done! You passed this test.' : 'You can review your answers below.'}
            </p>
            <p className="font-mono text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
              {attempt.obtained_marks} / {attempt.total_marks} marks
            </p>
            {attempt.submitted_at && (
              <p className="text-xs mt-2 font-mono" style={{ color: 'var(--color-ink-muted)' }}>
                Submitted: {new Date(attempt.submitted_at).toLocaleString()}
              </p>
            )}
          </Card>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="MCQ Correct" value={attempt.mcq_correct} color="#059669" />
            <StatCard label="MCQ Wrong" value={attempt.mcq_incorrect} color="#e11d48" />
            <StatCard label="MCQ Skipped" value={attempt.mcq_unattempted} color="#d97706" />
            <StatCard
              label="Accuracy"
              value={`${mcqQuestions.length > 0 ? Math.round((attempt.mcq_correct / mcqQuestions.length) * 100) : 0}%`}
              color="var(--color-ink)"
            />
          </div>

          {/* MCQ breakdown */}
          {mcqQuestions.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
                MCQ Review
              </h2>
              <div className="flex flex-col gap-4">
                {mcqQuestions.map((q: any, i: number) => {
                  const ans = answerMap.get(q.id) as any;
                  const isCorrect = ans?.is_correct;
                  const isAttempted = ans?.is_attempted;
                  return (
                    <div key={q.id} className="border-b pb-4 last:border-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-start gap-2 mb-2">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: !isAttempted ? 'rgba(217,119,6,0.15)' : isCorrect ? 'rgba(5,150,105,0.15)' : 'rgba(225,29,72,0.15)',
                            color: !isAttempted ? '#d97706' : isCorrect ? '#059669' : '#e11d48',
                          }}
                        >
                          {!isAttempted ? '—' : isCorrect ? '✓' : '✗'}
                        </span>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{q.question_text}</p>
                        <span className="ml-auto flex-shrink-0 text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                          {ans?.marks_awarded ?? 0}/{q.marks}
                        </span>
                      </div>
                      <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {q.options?.map((opt: any) => {
                          const isSelected = ans?.selected_option_id === opt.id;
                          const isCorrectOpt = opt.id === q.correct_option_id;
                          return (
                            <div
                              key={opt.id}
                              className="text-xs px-2 py-1 rounded flex items-center gap-1.5"
                              style={{
                                backgroundColor: isCorrectOpt
                                  ? 'rgba(5,150,105,0.1)'
                                  : isSelected && !isCorrectOpt
                                  ? 'rgba(225,29,72,0.08)'
                                  : 'var(--color-surface)',
                                color: isCorrectOpt ? '#065f46' : isSelected ? '#9f1239' : 'var(--color-ink-muted)',
                              }}
                            >
                              <span>{isCorrectOpt ? '✓' : isSelected ? '✗' : '○'}</span>
                              <span>{opt.text}</span>
                              {isSelected && !isCorrectOpt && <span className="ml-auto font-semibold text-xs">Your answer</span>}
                              {isCorrectOpt && <span className="ml-auto font-semibold text-xs">Correct</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Subjective section */}
          {subjectiveQuestions.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Subjective Answers
                </h2>
                <Button variant="secondary" size="sm" onClick={() => setShowSubjective((v) => !v)}>
                  {showSubjective ? 'Hide' : 'Show'} Answers
                </Button>
              </div>

              {showSubjective && (
                <div className="flex flex-col gap-5">
                  {subjectiveQuestions.map((q: any) => {
                    const ans = answerMap.get(q.id) as any;
                    const matchCount = ans?.keyword_matches?.length || 0;
                    const totalKeywords = q.keywords?.length || 0;
                    return (
                      <div key={q.id} className="border-b pb-4 last:border-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-ink)' }}>{q.question_text}</p>

                        <div
                          className="p-3 rounded text-sm mb-2"
                          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)' }}
                        >
                          {ans?.answer_text || <em style={{ color: 'var(--color-ink-muted)' }}>No answer provided</em>}
                        </div>

                        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                          <div>
                            {totalKeywords > 0 && (
                              <>
                                <span style={{ color: 'var(--color-ink-muted)' }}>
                                  Keywords matched: {matchCount}/{totalKeywords}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {q.keywords?.map((kw: string) => {
                                    const matched = ans?.keyword_matches?.includes(kw);
                                    return (
                                      <span
                                        key={kw}
                                        className="px-1.5 py-0.5 rounded font-mono"
                                        style={{
                                          backgroundColor: matched ? 'rgba(5,150,105,0.12)' : 'rgba(225,29,72,0.08)',
                                          color: matched ? '#065f46' : '#9f1239',
                                        }}
                                      >
                                        {matched ? '✓' : '✗'} {kw}
                                      </span>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                          <span className="font-mono font-bold" style={{ color: 'var(--color-ink)' }}>
                            {ans?.marks_awarded ?? 0}/{q.marks} marks
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* CTA */}
          <div className="flex gap-3 justify-center pb-4">
            <Link href="/tests">
              <Button size="lg">Take Another Test</Button>
            </Link>
            <Link href="/my-results">
              <Button variant="secondary" size="lg">All My Results</Button>
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
}
