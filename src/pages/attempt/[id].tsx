import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { Spinner, Alert, Button } from '@/components/ui';
import CountdownTimer from '@/components/test/CountdownTimer';
import QuestionPalette from '@/components/test/QuestionPalette';

interface Answer {
  selected_option_id?: string;
  answer_text?: string;
  is_attempted: boolean;
}

export default function AttemptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id: attemptId } = router.query as { id: string };

  const [attempt, setAttempt] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const saveQueueRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const timeRef = useRef<number>(0);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) { router.replace('/auth/login'); return; }
    if (attemptId) loadAttempt();
  }, [session, status, attemptId]);

  async function loadAttempt() {
    setLoading(true);
    // Load test info from attempt
    const res = await fetch(`/api/attempts/${attemptId}/answers`);
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to load attempt'); setLoading(false); return; }

    const att = data.attempt;
    if (att.status === 'submitted') {
      router.replace(`/results/${attemptId}`);
      return;
    }

    // Load test questions
    const testRes = await fetch(`/api/tests/${att.test_id}`);
    const testData = await testRes.json();

    setAttempt(att);
    setTest(testData.test);
    setQuestions(testData.questions || []);

    // Rebuild answers map from existing answers
    const map = new Map<string, Answer>();
    for (const ans of data.answers || []) {
      map.set(ans.question_id, {
        selected_option_id: ans.selected_option_id,
        answer_text: ans.answer_text,
        is_attempted: ans.is_attempted,
      });
    }
    setAnswers(map);
    setTimeRemaining(att.time_remaining_seconds || testData.test.duration_minutes * 60);
    timeRef.current = att.time_remaining_seconds || testData.test.duration_minutes * 60;
    setLoading(false);
  }

  // Debounced save answer
  function scheduleSave(questionId: string, answer: Answer) {
    const queue = saveQueueRef.current;
    if (queue.has(questionId)) clearTimeout(queue.get(questionId)!);
    const timeout = setTimeout(() => {
      saveAnswer(questionId, answer);
      queue.delete(questionId);
    }, 600);
    queue.set(questionId, timeout);
  }

  async function saveAnswer(questionId: string, answer: Answer) {
    setSaving(true);
    await fetch(`/api/attempts/${attemptId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: questionId,
        selected_option_id: answer.selected_option_id ?? null,
        answer_text: answer.answer_text ?? null,
        time_remaining_seconds: timeRef.current,
      }),
    });
    setSaving(false);
  }

  function handleMcqSelect(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const updated = new Map(prev);
      const ans = { selected_option_id: optionId, is_attempted: true };
      updated.set(questionId, ans);
      scheduleSave(questionId, ans);
      return updated;
    });
  }

  function handleTextChange(questionId: string, text: string) {
    setAnswers((prev) => {
      const updated = new Map(prev);
      const ans = { answer_text: text, is_attempted: text.trim().length > 0 };
      updated.set(questionId, ans);
      scheduleSave(questionId, ans);
      return updated;
    });
  }

  const handleTimerTick = useCallback((remaining: number) => {
    timeRef.current = remaining;
  }, []);

  const handleTimeExpire = useCallback(() => {
    submitAttempt(true);
  }, [attemptId]);

  async function submitAttempt(auto = false) {
    setSubmitting(true);
    // Flush all pending saves first
    for (const [qid, timeout] of saveQueueRef.current.entries()) {
      clearTimeout(timeout);
      const ans = answers.get(qid);
      if (ans) await saveAnswer(qid, ans);
    }
    saveQueueRef.current.clear();

    const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: 'POST' });
    if (res.ok) {
      router.push(`/results/${attemptId}`);
    } else {
      const d = await res.json();
      setError(d.error || 'Submission failed');
      setSubmitting(false);
      setShowConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="max-w-md w-full"><Alert type="error">{error}</Alert></div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion?.id) || { is_attempted: false };
  const answeredIds = new Set(
    [...answers.entries()].filter(([, a]) => a.is_attempted).map(([id]) => id)
  );
  const answeredCount = answeredIds.size;
  const unansweredCount = questions.length - answeredCount;

  return (
    <>
      <Head><title>{test?.title} — ExamPortal</title></Head>

      {/* Full-screen exam layout */}
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>

        {/* Top bar */}
        <header
          className="sticky top-0 z-50 border-b shadow-sm"
          style={{ backgroundColor: '#0f0c08', borderColor: '#3d3020' }}
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white font-display font-semibold text-sm truncate">{test?.title}</p>
              <p className="text-xs font-mono" style={{ color: '#c2b89a' }}>
                {questions.length} questions · {answeredCount} answered
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {saving && (
                <span className="text-xs font-mono" style={{ color: '#c2b89a' }}>Saving…</span>
              )}
              {timeRemaining > 0 && (
                <CountdownTimer
                  initialSeconds={timeRemaining}
                  onExpire={handleTimeExpire}
                  onTick={handleTimerTick}
                />
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
              >
                Submit Test
              </Button>
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Question area */}
          <main className="lg:col-span-3">
            {currentQuestion && (
              <div className="animate-fade-in" key={currentQuestion.id}>
                {/* Question card */}
                <div
                  className="rounded-xl border p-6 mb-5"
                  style={{ backgroundColor: '#fff', borderColor: 'var(--color-border)' }}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 mb-5">
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-mono font-bold"
                      style={{ backgroundColor: '#1e1710', color: '#fbbf24' }}
                    >
                      {currentIndex + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: currentQuestion.question_type === 'mcq' ? 'rgba(37,99,235,0.1)' : 'rgba(217,119,6,0.1)',
                            color: currentQuestion.question_type === 'mcq' ? '#1e40af' : '#92400e',
                          }}
                        >
                          {currentQuestion.question_type === 'mcq' ? 'Multiple Choice' : 'Subjective'}
                        </span>
                        <span className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                          {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
                        </span>
                        {currentQuestion.topic_tags?.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-ink-muted)' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-base font-medium leading-relaxed" style={{ color: 'var(--color-ink)' }}>
                        {currentQuestion.question_text}
                      </p>
                    </div>
                  </div>

                  {/* MCQ options */}
                  {currentQuestion.question_type === 'mcq' && (
                    <div className="flex flex-col gap-2.5 ml-12">
                      {currentQuestion.options?.map((opt: any, oi: number) => {
                        const isSelected = currentAnswer.selected_option_id === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleMcqSelect(currentQuestion.id, opt.id)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-150"
                            style={{
                              backgroundColor: isSelected ? '#1e1710' : '#fff',
                              borderColor: isSelected ? '#1e1710' : 'var(--color-border)',
                              color: isSelected ? '#fff' : 'var(--color-ink)',
                            }}
                          >
                            <span
                              className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold"
                              style={{
                                borderColor: isSelected ? '#fbbf24' : 'var(--color-border)',
                                backgroundColor: isSelected ? '#fbbf24' : 'transparent',
                                color: isSelected ? '#1e1710' : 'var(--color-ink-muted)',
                              }}
                            >
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="text-sm leading-relaxed">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Subjective answer */}
                  {currentQuestion.question_type === 'subjective' && (
                    <div className="ml-12">
                      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-ink-muted)' }}>
                        Your Answer
                      </label>
                      <textarea
                        value={currentAnswer.answer_text || ''}
                        onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                        placeholder="Type your answer here..."
                        rows={7}
                        className="w-full px-4 py-3 rounded-lg border text-sm leading-relaxed"
                        style={{
                          backgroundColor: '#faf8f4',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-ink)',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'var(--font-body)',
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
                        {(currentAnswer.answer_text || '').length} characters
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                  >
                    ← Previous
                  </Button>
                  <span className="text-xs font-mono" style={{ color: 'var(--color-ink-muted)' }}>
                    {currentIndex + 1} of {questions.length}
                  </span>
                  {currentIndex < questions.length - 1 ? (
                    <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
                      Next →
                    </Button>
                  ) : (
                    <Button onClick={() => setShowConfirm(true)}>
                      Review & Submit →
                    </Button>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar palette */}
          <aside className="lg:col-span-1">
            <QuestionPalette
              questions={questions}
              currentIndex={currentIndex}
              answeredIds={answeredIds}
              onSelect={setCurrentIndex}
            />
          </aside>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-md rounded-xl border p-6 animate-slide-up"
            style={{ backgroundColor: '#fff', borderColor: 'var(--color-border)' }}
          >
            <h2 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
              Submit Test?
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>
              Once submitted, you cannot change your answers.
            </p>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { label: 'Answered', value: answeredCount, color: '#059669' },
                { label: 'Unanswered', value: unansweredCount, color: unansweredCount > 0 ? '#d97706' : '#059669' },
                { label: 'Total', value: questions.length, color: 'var(--color-ink)' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="px-3 py-2 rounded-lg text-center"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <p className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {unansweredCount > 0 && (
              <div
                className="mb-4 px-3 py-2 rounded text-sm"
                style={{ backgroundColor: 'rgba(217,119,6,0.1)', color: '#92400e' }}
              >
                ⚠ You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}.
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="danger"
                size="lg"
                loading={submitting}
                onClick={() => submitAttempt(false)}
                className="flex-1"
              >
                Submit Now
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Review More
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
