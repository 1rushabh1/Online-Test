import React from 'react';

// ── Button ──────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#1e1710',
    color: '#faf8f4',
    border: '1px solid #1e1710',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: '#1e1710',
    border: '1px solid #d9d2c0',
  },
  danger: {
    backgroundColor: '#e11d48',
    color: '#fff',
    border: '1px solid #e11d48',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#5c4a32',
    border: '1px solid transparent',
  },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${className}`}
      style={variantStyles[variant]}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`w-full px-3 py-2 rounded border text-sm transition-colors ${className}`}
        style={{
          backgroundColor: '#fff',
          borderColor: error ? '#e11d48' : 'var(--color-border)',
          color: 'var(--color-ink)',
          outline: 'none',
        }}
      />
      {error && <p className="text-xs" style={{ color: '#e11d48' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--color-accent)' }}>{hint}</p>}
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--color-ink-muted)' }}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...props}
        className={`w-full px-3 py-2 rounded border text-sm transition-colors ${className}`}
        style={{
          backgroundColor: '#fff',
          borderColor: error ? '#e11d48' : 'var(--color-border)',
          color: 'var(--color-ink)',
          outline: 'none',
          resize: 'vertical',
          minHeight: '80px',
        }}
      />
      {error && <p className="text-xs" style={{ color: '#e11d48' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--color-accent)' }}>{hint}</p>}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div
      className={`rounded-lg border p-6 ${className}`}
      style={{
        backgroundColor: '#fff',
        borderColor: 'var(--color-border)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  color?: 'amber' | 'emerald' | 'rose' | 'ink' | 'blue';
}

const badgeColors = {
  amber: { bg: 'rgba(217,119,6,0.1)', color: '#92400e' },
  emerald: { bg: 'rgba(5,150,105,0.1)', color: '#065f46' },
  rose: { bg: 'rgba(225,29,72,0.1)', color: '#9f1239' },
  ink: { bg: 'rgba(30,23,16,0.08)', color: '#3d3020' },
  blue: { bg: 'rgba(37,99,235,0.1)', color: '#1e40af' },
};

export function Badge({ children, color = 'ink' }: BadgeProps) {
  const c = badgeColors[color];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-mono"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      {children}
    </span>
  );
}

// ── Alert ─────────────────────────────────────────────────
interface AlertProps {
  type?: 'error' | 'success' | 'info' | 'warning';
  children: React.ReactNode;
  className?: string; // ✅ ADD THIS
}

const alertStyles = {
  error: { bg: 'rgba(225,29,72,0.08)', border: 'rgba(225,29,72,0.3)', color: '#9f1239', icon: '✕' },
  success: { bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.3)', color: '#065f46', icon: '✓' },
  info: { bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.3)', color: '#1e40af', icon: 'ℹ' },
  warning: { bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.3)', color: '#92400e', icon: '!' },
};

export function Alert({ type = 'info', children, className = '' }: AlertProps) {
const s = alertStyles[type];
return (
<div
className={`flex items-start gap-2 px-4 py-3 rounded border text-sm ${className}`}
style={{ backgroundColor: s.bg, borderColor: s.border, color: s.color }}
> <span className="font-bold mt-0.5 flex-shrink-0">{s.icon}</span> <div>{children}</div> </div>
);
}


// ── Spinner ───────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <svg className={`animate-spin ${sizes[size]}`} fill="none" viewBox="0 0 24 24" style={{ color: 'var(--color-accent)' }}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function StatCard({ label, value, sub, color = 'var(--color-ink)' }: StatCardProps) {
  return (
    <div className="rounded-lg border p-4" style={{ backgroundColor: '#fff', borderColor: 'var(--color-border)' }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-accent)' }}>
        {label}
      </p>
      <p className="text-3xl font-display font-semibold" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>{sub}</p>}
    </div>
  );
}
