'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Search, Building2 } from 'lucide-react';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { Badge, KpiCard, SectionHeader, EmptyState, Spinner } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatDate, fiscalDayStatusLabel } from '@/lib/utils';

const STATUS_VARIANT: Record<number, string> = { 0: 'gray', 1: 'green', 2: 'yellow', 3: 'red' };

export default function AdminFiscalDaysPage() {
  const [taxpayerFilter, setTaxpayerFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data: companies } = useQuery({
    queryKey: ['admin-companies-list'],
    queryFn: () => adminApi.listCompanies({ limit: 200 }),
    retry: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-fiscal-days', page, taxpayerFilter],
    queryFn: () =>
      adminApi.listFiscalDays({
        taxpayerID: taxpayerFilter ? Number(taxpayerFilter) : undefined,
        offset: page * 25,
        limit: 25,
      }),
    retry: false,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const open = rows.filter((r) => r.status === 1).length;
  const failed = rows.filter((r) => r.status === 3).length;

  return (
    <>
      <AdminTopBar
        title="Fiscal Days"
        subtitle="Cross-tenant fiscal day monitoring"
      />

      <div className="flex-1 p-7 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Total (this page)" value={rows.length} accent="amber" icon={<Calendar className="w-4 h-4" />} />
          <KpiCard label="Open Days" value={open} accent="green" icon={<Calendar className="w-4 h-4" />} />
          <KpiCard label="Close Failed" value={failed} accent="red" icon={<Calendar className="w-4 h-4" />} />
        </div>

        <div className="card">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)]">
            <SectionHeader title="All Fiscal Days" description={`${total} total across all companies`} />
            <div className="ml-auto flex items-center gap-2">
              <select
                className="input text-xs w-56"
                value={taxpayerFilter}
                onChange={(e) => { setTaxpayerFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Companies</option>
                {(companies?.rows ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : rows.length === 0 ? (
            <EmptyState title="No fiscal days found" icon={<Calendar className="w-6 h-6" />}
              description="Fiscal days appear here once companies start operating their devices." />
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Day #</th>
                    <th>Device ID</th>
                    <th>Status</th>
                    <th>Opened</th>
                    <th>Closed</th>
                    <th>Last Receipt #</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((fd) => (
                    <tr key={fd.id}>
                      <td>
                        <span className="font-mono font-bold text-[var(--accent)]">#{fd.fiscalDayNo}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-muted">Device #{fd.deviceID}</span>
                      </td>
                      <td>
                        <Badge variant={STATUS_VARIANT[fd.status] ?? 'gray'}>
                          {fiscalDayStatusLabel(fd.status)}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs text-muted">{formatDate(fd.fiscalDayOpened)}</td>
                      <td className="font-mono text-xs text-muted">
                        {fd.fiscalDayClosed ? formatDate(fd.fiscalDayClosed) : '—'}
                      </td>
                      <td className="font-mono text-sm">{fd.lastReceiptGlobalNo ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
                <span className="text-xs text-muted font-mono">
                  {page * 25 + 1}–{Math.min((page + 1) * 25, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
                  <button disabled={(page + 1) * 25 >= total} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
