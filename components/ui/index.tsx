'use client';
import { cn } from '@/lib/utils';
import { Loader2, Inbox } from 'lucide-react';

export function Badge({ children, variant = 'default', className }: {
  children: React.ReactNode; variant?: string; className?: string;
}) {
  const v: Record<string, string> = {
    green:   'bg-[var(--success-dim)] text-[var(--success)] border border-[var(--success)]/30',
    yellow:  'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]/30',
    red:     'bg-[var(--accent2-dim)] text-[var(--accent2)] border border-[var(--accent2)]/30',
    blue:    'bg-[var(--info-dim)] text-[var(--info)] border border-[var(--info)]/30',
    gray:    'bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border)]',
    default: 'bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)]',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest', v[variant] ?? v.default, className)}>
      {children}
    </span>
  );
}

export function StatusDot({ color, pulse }: { color: 'green'|'yellow'|'red'|'gray'; pulse?: boolean }) {
  const c = { green: 'bg-[var(--success)]', yellow: 'bg-[var(--accent)]', red: 'bg-[var(--accent2)]', gray: 'bg-[var(--text-dim)]' };
  return <span className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', c[color], pulse && 'animate-pulse')} />;
}

export function KpiCard({ label, value, sub, icon, accent = 'amber' }: {
  label: string; value: string|number; sub?: string; icon?: React.ReactNode;
  accent?: 'amber'|'red'|'blue'|'green';
}) {
  const colors = {
    amber: 'var(--accent)', red: 'var(--accent2)', blue: 'var(--info)', green: 'var(--success)',
  };
  const col = colors[accent];
  return (
    <div className="card p-5 relative overflow-hidden hover:border-[var(--border-bright)] transition-all">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: col }} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">{label}</p>
        {icon && <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${col}18`, color: col }}>{icon}</div>}
      </div>
      <p className="text-3xl font-mono font-bold leading-none" style={{ color: col }}>{value}</p>
      {sub && <p className="mt-2 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function Spinner({ size = 'md' }: { size?: 'sm'|'md'|'lg' }) {
  const s = { sm:'w-4 h-4', md:'w-6 h-6', lg:'w-8 h-8' };
  return <Loader2 className={cn(s[size], 'animate-spin text-[var(--accent)]')} />;
}

export function EmptyState({ title, description, action, icon }: {
  title: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center mb-4 text-muted">
        {icon ?? <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      {description && <p className="text-xs text-muted max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, description, actions, icon }: {
  title: string; description?: string; actions?: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[var(--accent)]">{icon}</span>}
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size='md' }: {
  open: boolean; onClose: ()=>void; title: string; children: React.ReactNode; size?: 'sm'|'md'|'lg'|'xl';
}) {
  if (!open) return null;
  const w = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full card shadow-2xl animate-slide-up', w[size])}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded text-muted hover:text-[var(--text)] transition-colors text-xl">×</button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--accent2)]">{error}</p>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string)=>void }) {
  return (
    <div className="flex gap-1 p-1 bg-[var(--surface2)] rounded-lg border border-[var(--border)] w-fit">
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)}
          className={cn('px-4 py-1.5 rounded-md text-sm font-semibold transition-all',
            active === t ? 'bg-[var(--accent)] text-black' : 'text-muted hover:text-[var(--text)]')}>
          {t}
        </button>
      ))}
    </div>
  );
}
