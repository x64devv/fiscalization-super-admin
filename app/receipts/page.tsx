'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { Badge, KpiCard, SectionHeader, EmptyState, Spinner } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatDate, formatCurrency, receiptTypeLabel } from '@/lib/utils';

const TYPE_VARIANT: Record<number, string> = { 0: 'green', 1: 'red', 2: 'yellow' };
const VALIDATION_VARIANT: Record<string, string> = { Grey: 'gray', Yellow: 'yellow', Red: 'red' };

export default function AdminReceiptsPage() {
  const [taxpayerFilter, setTaxpayerFilter] = useState('');
  const [page, setPage] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: companies } = useQuery({
    queryKey: ['admin-companies-list'],
    queryFn: () => adminApi.listCompanies({ limit: 200 }),
    retry: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-receipts', page, taxpayerFilter, fromDate, toDate],
    queryFn: () =>
      adminApi.listReceipts({
        taxpayerID: taxpayerFilter ? Number(taxpayerFilter) : undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined,
        offset: page * 25,
        limit: 25,
      }),
    retry: false,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const withErrors = rows.filter((r) => r.validationColor).length;

  return (
    <>
      <AdminTopBar
        title="Receipts"
        subtitle="Cross-tenant receipt monitoring and validation"
      />

      <div className="flex-1 p-7 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Total (filtered)" value={total} accent="amber" icon={<Receipt className="w-4 h-4" />} />
          <KpiCard label="Clean" value={rows.length - withErrors} accent="green" icon={<CheckCircle2 className="w-4 h-4" />} />
          <KpiCard label="Validation Issues" value={withErrors} accent="red" icon={<AlertTriangle className="w-4 h-4" />} />
        </div>

        <div className="card">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
            <SectionHeader title="All Receipts" description={`${total} total`} />
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <select
                className="input text-xs w-48"
                value={taxpayerFilter}
                onChange={(e) => { setTaxpayerFilter(e.target.value); setPage(0); }}
              >
                <option value="">All Companies</option>
                {(companies?.rows ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="date"
                className="input text-xs w-36 font-mono"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
                placeholder="From"
              />
              <span className="text-xs text-muted font-mono">to</span>
              <input
                type="date"
                className="input text-xs w-36 font-mono"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(0); }}
                placeholder="To"
              />
              {(fromDate || toDate || taxpayerFilter) && (
                <button
                  onClick={() => { setFromDate(''); setToDate(''); setTaxpayerFilter(''); setPage(0); }}
                  className="btn btn-ghost text-xs px-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : rows.length === 0 ? (
            <EmptyState title="No receipts found" icon={<Receipt className="w-6 h-6" />}
              description="Receipts appear here once companies submit fiscal invoices." />
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt ID</th>
                    <th>Invoice No.</th>
                    <th>Device</th>
                    <th>Type</th>
                    <th>Currency</th>
                    <th>Total</th>
                    <th>Validation</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="font-mono text-xs text-[var(--accent)]">#{r.receiptID}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs">{r.invoiceNo}</span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-muted">#{r.deviceID}</span>
                      </td>
                      <td>
                        <Badge variant={TYPE_VARIANT[r.receiptType] ?? 'gray'}>
                          {receiptTypeLabel(r.receiptType)}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs">{r.receiptCurrency}</td>
                      <td className="font-mono font-bold text-sm">
                        {formatCurrency(r.receiptTotal, r.receiptCurrency)}
                      </td>
                      <td>
                        {r.validationColor ? (
                          <Badge variant={VALIDATION_VARIANT[r.validationColor] ?? 'gray'}>
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {r.validationColor}
                          </Badge>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                        )}
                      </td>
                      <td className="font-mono text-xs text-muted">{formatDate(r.receiptDate)}</td>
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
