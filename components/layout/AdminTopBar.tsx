'use client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminTopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const { isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/health`).then(r => r.data),
    refetchInterval: 30_000,
  });

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-7 py-4 bg-[var(--surface)] border-b border-[var(--border)]">
      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        {subtitle && <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono',
          !isError ? 'border-[var(--success)] text-[var(--success)] bg-[var(--success-dim)]'
                   : 'border-[var(--border)] text-muted bg-[var(--surface2)]')}>
          <Activity className="w-3 h-3" />
          <span>{!isError ? 'API Online' : 'API Offline'}</span>
          <span className={cn('w-1.5 h-1.5 rounded-full', !isError ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--border-bright)]')} />
        </div>
        {actions}
      </div>
    </header>
  );
}
