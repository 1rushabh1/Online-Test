import { useEffect, useRef, useState } from 'react';

interface TimerProps {
  initialSeconds: number;
  onExpire: () => void;
  onTick?: (remaining: number) => void;
}

export default function CountdownTimer({ initialSeconds, onExpire, onTick }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        const next = s - 1;
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          clearInterval(intervalRef.current!);
          onExpire();
          return 0;
        }
        onTick?.(next);
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onExpire]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const isWarning = seconds <= 300 && seconds > 60;   // 5 min warning
  const isDanger = seconds <= 60;                      // 1 min danger

  const display = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg transition-all duration-300"
      style={{
        backgroundColor: isDanger
          ? 'rgba(225,29,72,0.12)'
          : isWarning
          ? 'rgba(217,119,6,0.12)'
          : 'rgba(30,23,16,0.06)',
        color: isDanger
          ? '#e11d48'
          : isWarning
          ? '#d97706'
          : 'var(--color-ink)',
        animation: isDanger ? 'pulse-ring 1s ease-in-out infinite' : 'none',
      }}
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 6v6l4 2" />
      </svg>
      {display}
    </div>
  );
}
