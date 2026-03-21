interface QuestionPaletteProps {
  questions: any[];
  currentIndex: number;
  answeredIds: Set<string>;
  onSelect: (index: number) => void;
}

export default function QuestionPalette({
  questions,
  currentIndex,
  answeredIds,
  onSelect,
}: QuestionPaletteProps) {
  const answered = questions.filter((q) => answeredIds.has(q.id)).length;

  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: '#fff', borderColor: 'var(--color-border)' }}
    >
      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-muted)' }}>
          Question Palette
        </p>
        <p className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
          {answered}/{questions.length} answered
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#1e1710' }} />
          Current
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#059669' }} />
          Answered
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
          Not yet
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredIds.has(q.id);
          return (
            <button
              key={q.id}
              onClick={() => onSelect(i)}
              className="w-full aspect-square flex items-center justify-center text-xs font-mono font-bold rounded transition-all duration-100"
              style={{
                backgroundColor: isCurrent
                  ? '#1e1710'
                  : isAnswered
                  ? '#059669'
                  : 'var(--color-surface)',
                color: isCurrent || isAnswered ? '#fff' : 'var(--color-ink-muted)',
                border: isCurrent
                  ? '2px solid #1e1710'
                  : '1px solid var(--color-border)',
                transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
              }}
              title={`Question ${i + 1}${isAnswered ? ' (answered)' : ''}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
