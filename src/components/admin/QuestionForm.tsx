import { useState } from 'react';
import { Button, Input, Alert } from '@/components/ui';
import { McqOption } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface QuestionFormProps {
  testId: string;
  onCreated: () => void;
  onCancel: () => void;
}

export default function QuestionForm({ testId, onCreated, onCancel }: QuestionFormProps) {
  const [type, setType] = useState<'mcq' | 'subjective'>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [marks, setMarks] = useState('1');
  const [tagsInput, setTagsInput] = useState('');
  // MCQ
  const [options, setOptions] = useState<McqOption[]>([
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState('');
  // Subjective
  const [keywordsInput, setKeywordsInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateOption(id: string, text: string) {
    setOptions((opts) => opts.map((o) => (o.id === id ? { ...o, text } : o)));
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions((opts) => [...opts, { id: uuidv4(), text: '' }]);
  }

  function removeOption(id: string) {
    if (options.length <= 2) return;
    setOptions((opts) => opts.filter((o) => o.id !== id));
    if (correctOptionId === id) setCorrectOptionId('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!questionText.trim()) { setError('Question text is required'); return; }

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    let body: any = {
      question_text: questionText.trim(),
      question_type: type,
      topic_tags: tags,
      marks: parseInt(marks) || 1,
    };

    if (type === 'mcq') {
      const validOptions = options.filter((o) => o.text.trim());
      if (validOptions.length < 2) { setError('Provide at least 2 options'); return; }
      if (!correctOptionId) { setError('Select the correct answer'); return; }
      if (!options.find((o) => o.id === correctOptionId)?.text.trim()) {
        setError('The selected correct answer option has no text'); return;
      }
      body.options = validOptions;
      body.correct_option_id = correctOptionId;
    } else {
      const keywords = keywordsInput.split(',').map((k) => k.trim()).filter(Boolean);
      body.keywords = keywords;
    }

    setLoading(true);
    const res = await fetch(`/api/tests/${testId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Failed to add question');
    } else {
      onCreated();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Type selector */}
      <div>
        <label className="text-sm font-medium block mb-2" style={{ color: 'var(--color-ink-muted)' }}>
          Question Type
        </label>
        <div className="flex gap-3">
          {(['mcq', 'subjective'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="px-4 py-2 rounded border text-sm font-medium transition-all"
              style={{
                backgroundColor: type === t ? '#1e1710' : '#fff',
                color: type === t ? '#fff' : 'var(--color-ink)',
                borderColor: type === t ? '#1e1710' : 'var(--color-border)',
              }}
            >
              {t === 'mcq' ? 'Multiple Choice (MCQ)' : 'Subjective (Text)'}
            </button>
          ))}
        </div>
      </div>

      {/* Question text */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
          Question Text *
        </label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter your question here..."
          rows={3}
          className="w-full px-3 py-2 rounded border text-sm"
          style={{
            backgroundColor: '#fff',
            borderColor: 'var(--color-border)',
            color: 'var(--color-ink)',
            outline: 'none',
            resize: 'vertical',
          }}
          required
        />
      </div>

      {/* MCQ options */}
      {type === 'mcq' && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
            Answer Options * — click radio to mark as correct
          </label>
          {options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={correctOptionId === opt.id}
                onChange={() => setCorrectOptionId(opt.id)}
                className="flex-shrink-0 w-4 h-4 accent-amber-600"
                title="Mark as correct answer"
              />
              <input
                type="text"
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-2 rounded border text-sm"
                style={{
                  backgroundColor: correctOptionId === opt.id ? 'rgba(5,150,105,0.06)' : '#fff',
                  borderColor: correctOptionId === opt.id ? '#059669' : 'var(--color-border)',
                  color: 'var(--color-ink)',
                  outline: 'none',
                }}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  style={{ color: '#e11d48' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="text-sm px-3 py-1.5 rounded border self-start transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink-muted)',
              }}
            >
              + Add option
            </button>
          )}
        </div>
      )}

      {/* Subjective keywords */}
      {type === 'subjective' && (
        <Input
          label="Scoring Keywords (comma-separated)"
          type="text"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          placeholder="e.g. photosynthesis, chlorophyll, sunlight, glucose"
          hint="Answers containing more of these keywords score higher"
        />
      )}

      {/* Marks & Tags row */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Marks"
          type="number"
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
          min="1"
          max="100"
        />
        <Input
          label="Topic Tags (comma-separated)"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. arrays, sorting"
        />
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>Add Question</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
