import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/ui/Layout';
import { Card, Badge, Button, Spinner, Alert } from '@/components/ui';
import QuestionForm from '@/components/admin/QuestionForm';
import { Question } from '@/types';

export default function AdminTestDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query as { id: string };

  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState(false);
  const [testForm, setTestForm] = useState({ title: '', description: '', duration_minutes: '' });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (status === 'loading') return;
    const user = session?.user as any;
    if (!session || user?.role !== 'admin') { router.replace('/auth/login'); return; }
    if (id) fetchTest();
  }, [session, status, id]);

  async function fetchTest() {
    setLoading(true);
    const res = await fetch(`/api/tests/${id}`);
    const data = await res.json();
    if (res.ok) {
      setTest(data.test);
      setQuestions(data.questions || []);
      setTestForm({
        title: data.test.title,
        description: data.test.description || '',
        duration_minutes: String(data.test.duration_minutes),
      });
    }
    setLoading(false);
  }

  function flash(message: string, type: 'success' | 'error' = 'success') {
    setMsg(message);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }

  async function handlePublishToggle() {
    const newStatus = test.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/tests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { flash(`Test ${newStatus}`); fetchTest(); }
  }

  async function handleSaveTest(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/tests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: testForm.title,
        description: testForm.description,
        duration_minutes: parseInt(testForm.duration_minutes),
      }),
    });
    if (res.ok) { flash('Test details saved'); setEditingTest(false); fetchTest(); }
    else flash('Failed to save', 'error');
  }

  async function handleDeleteQuestion(qid: string) {
    if (!confirm('Delete this question?')) return;
    const res = await fetch(`/api/tests/${id}/questions/${qid}`, { method: 'DELETE' });
    if (res.ok) { flash('Question deleted'); fetchTest(); }
    else flash('Failed to delete', 'error');
  }

  if (loading) return (
    <Layout><div className="flex justify-center py-20"><Spinner size="lg" /></div></Layout>
  );

  if (!test) return (
    <Layout><Alert type="error">Test not found</Alert></Layout>
  );

  const mcqCount = questions.filter((q) => q.question_type === 'mcq').length;
  const subjectiveCount = questions.filter((q) => q.question_type === 'subjective').length;
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <>
      <Head><title>{test.title} — Admin</title></Head>
      <Layout title={test.title}>
        <div className="space-y-6 animate-fade-in">
          {/* Breadcrumb */}
          <nav className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            <Link href="/admin/tests" className="hover:underline">Tests</Link>
            <span className="mx-2">›</span>
            <span>{test.title}</span>
          </nav>

          {msg && <Alert type={msgType}>{msg}</Alert>}

          {/* Test meta card */}
          <Card>
            {editingTest ? (
              <form onSubmit={handleSaveTest} className="flex flex-col gap-4">
                <input
                  className="w-full px-3 py-2 rounded border text-base font-display font-semibold"
                  value={testForm.title}
                  onChange={(e) => setTestForm((f) => ({ ...f, title: e.target.value }))}
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                  required
                />
                <textarea
                  className="w-full px-3 py-2 rounded border text-sm"
                  value={testForm.description}
                  onChange={(e) => setTestForm((f) => ({ ...f, description: e.target.value }))}
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', resize: 'vertical' }}
                  rows={2}
                  placeholder="Description (optional)"
                />
                <input
                  type="number"
                  className="w-32 px-3 py-2 rounded border text-sm"
                  value={testForm.duration_minutes}
                  onChange={(e) => setTestForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                  min="1"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Save</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setEditingTest(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Badge color={test.status === 'published' ? 'emerald' : 'amber'}>{test.status}</Badge>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                      {test.duration_minutes} min · {questions.length} questions · {totalMarks} marks
                    </span>
                  </div>
                  {test.description && (
                    <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>{test.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                    <span>MCQ: {mcqCount}</span>
                    <span>Subjective: {subjectiveCount}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" size="sm" onClick={() => setEditingTest(true)}>Edit Details</Button>
                  <Button
                    variant={test.status === 'published' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={handlePublishToggle}
                  >
                    {test.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
                Questions
              </h2>
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>+ Add Question</Button>
              )}
            </div>

            {showForm && (
              <Card className="mb-4" style={{ borderColor: '#d97706', borderWidth: 2 }}>
                <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
                  New Question
                </h3>
                <QuestionForm
                  testId={id}
                  onCreated={() => { setShowForm(false); flash('Question added'); fetchTest(); }}
                  onCancel={() => setShowForm(false)}
                />
              </Card>
            )}

            {questions.length === 0 ? (
              <Card>
                <p className="text-center py-8" style={{ color: 'var(--color-ink-muted)' }}>
                  No questions yet. Click &quot;Add Question&quot; to start building your test.
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <Card key={q.id}>
                    <div className="flex gap-4">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-ink-muted)' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-medium text-sm leading-relaxed" style={{ color: 'var(--color-ink)' }}>
                            {q.question_text}
                          </p>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="flex-shrink-0 text-xs px-2 py-1 rounded transition-colors"
                            style={{ color: '#e11d48' }}
                          >
                            Delete
                          </button>
                        </div>

                        <div className="flex gap-2 flex-wrap mb-2">
                          <Badge color={q.question_type === 'mcq' ? 'blue' : 'amber'}>
                            {q.question_type === 'mcq' ? 'MCQ' : 'Subjective'}
                          </Badge>
                          <Badge color="ink">{q.marks} mark{q.marks !== 1 ? 's' : ''}</Badge>
                          {q.topic_tags?.map((tag) => (
                            <Badge key={tag} color="ink">{tag}</Badge>
                          ))}
                        </div>

                        {q.question_type === 'mcq' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: opt.id === q.correct_option_id ? 'rgba(5,150,105,0.1)' : 'var(--color-surface)',
                                  color: opt.id === q.correct_option_id ? '#065f46' : 'var(--color-ink-muted)',
                                  border: opt.id === q.correct_option_id ? '1px solid rgba(5,150,105,0.3)' : '1px solid transparent',
                                }}
                              >
                                {opt.id === q.correct_option_id && '✓ '}{opt.text}
                              </div>
                            ))}
                          </div>
                        )}

                        {q.question_type === 'subjective' && q.keywords && q.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Keywords:</span>
                            {q.keywords.map((kw) => (
                              <span key={kw} className="text-xs px-1.5 py-0.5 rounded font-mono"
                                style={{ backgroundColor: 'rgba(217,119,6,0.1)', color: '#92400e' }}>
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
