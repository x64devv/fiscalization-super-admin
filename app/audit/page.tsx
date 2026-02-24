'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, User, MonitorSmartphone, Building2, FileText, Key } from 'lucide-react';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { Badge, SectionHeader, EmptyState, Spinner } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const ENTITY_ICONS: Record<string, React.ElementType> = {
  taxpayer: Building2,
  device: MonitorSmartphone,
  user: User,
  receipt: FileText,
  certificate: Key,
};

const ACTION_VARIANT: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  activate: 'green',
  deactivate: 'yellow',
  block: 'red',
  revoke: 'red',
  login: 'blue',
};

const ENTITY_TYPES = ['', 'taxpayer', 'device', 'user', 'receipt', 'certificate', 'fiscal_day'];

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', page, entityType],
    queryFn: () =>
      adminApi.listAuditLogs({
        entityType: entityType || undefined,
        offset: page * 50,
        limit: 50,
      }),
    retry: false,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <AdminTopBar
        title="Audit Log"
        subtitle="Complete system event trail — all actions across all tenants"
      />

      <div className="flex-1 p-7 space-y-6">
        {/* Info banner */}
        <div className="card p-4 border-l-4 border-l-[var(--accent)] bg-[var(--accent-dim)]">
          <p className="text-sm font-semibold text-[var(--accent)]">System Audit Trail</p>
          <p className="text-xs text-muted mt-1">
            Every admin action — company creation, device provisioning, status changes, and certificate operations — is recorded here with full timestamps and IP addresses.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)]">
            <SectionHeader title="Event Log" description={`${total} events recorded`} />
            <div className="ml-auto">
              <select
                className="input text-xs w-40"
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setPage(0); }}
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t === '' ? 'All Events' : t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No audit events yet"
              icon={<ScrollText className="w-6 h-6" />}
              description="Actions will appear here as you manage companies, devices and users."
            />
          ) : (
            <>
              {/* Timeline-style list */}
              <div className="divide-y divide-[var(--border)]">
                {rows.map((log) => {
                  const Icon = ENTITY_ICONS[log.entityType] ?? FileText;
                  const actionVariant = ACTION_VARIANT[log.action?.toLowerCase() ?? ''] ?? 'gray';

                  return (
                    <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[var(--surface2)] transition-colors">
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-muted" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={actionVariant}>{log.action}</Badge>
                          <span className="text-xs font-mono text-muted">{log.entityType}</span>
                          {log.entityId && (
                            <span className="text-xs font-mono text-[var(--accent)]">#{log.entityId}</span>
                          )}
                          {log.deviceId && (
                            <span className="text-xs text-muted font-mono">· Device #{log.deviceId}</span>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-xs text-muted mt-1 font-mono truncate max-w-lg">{log.details}</p>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-mono text-muted">{formatDate(log.createdAt)}</p>
                        {log.ipAddress && (
                          <p className="text-[10px] font-mono text-[var(--text-dim)] mt-0.5">{log.ipAddress}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
                <span className="text-xs text-muted font-mono">
                  {page * 50 + 1}–{Math.min((page + 1) * 50, total)} of {total} events
                </span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Newer</button>
                  <button disabled={(page + 1) * 50 >= total} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Older →</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
