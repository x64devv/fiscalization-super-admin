'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, Eye, CheckCircle2, XCircle, MonitorSmartphone, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { Badge, KpiCard, SectionHeader, Modal, Field, EmptyState, Spinner } from '@/components/ui';
import { adminApi, type Taxpayer, type Device } from '@/lib/api';
import { formatDate, companyStatusBadge, deviceStatusBadge, deviceModeLabel } from '@/lib/utils';

const EMPTY_FORM = { tin: '', name: '', vatNumber: '', taxPayerDayMaxHrs: 24, taxpayerDayEndNotificationHrs: 2, qrUrl: 'https://receipt.zimra.co.zw' };

export default function CompaniesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Taxpayer | null>(null);
  const [showDetail, setShowDetail] = useState<Taxpayer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-companies', page, search],
    queryFn: () => adminApi.listCompanies({ offset: page * 20, limit: 20, search }),
    retry: false,
  });

  const { data: companyDevices } = useQuery({
    queryKey: ['company-devices', showDetail?.id],
    queryFn: () => adminApi.listCompanyDevices(showDetail!.id),
    enabled: !!showDetail,
    retry: false,
  });

  const create = useMutation({
    mutationFn: () => adminApi.createCompany({ ...form, vatNumber: form.vatNumber || undefined }),
    onSuccess: () => { toast.success('Company onboarded successfully'); setShowCreate(false); setForm(EMPTY_FORM); qc.invalidateQueries({ queryKey: ['admin-companies'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.title ?? 'Failed to create company'),
  });

  const update = useMutation({
    mutationFn: () => adminApi.updateCompany(showEdit!.id, { name: showEdit!.name, vatNumber: showEdit!.vat_number, status: showEdit!.status, taxPayerDayMaxHrs: showEdit!.taxpayer_day_max_hrs, taxpayerDayEndNotificationHrs: showEdit!.taxpayer_day_end_notification_hrs, qrUrl: showEdit!.qr_url }),
    onSuccess: () => { toast.success('Company updated'); setShowEdit(null); qc.invalidateQueries({ queryKey: ['admin-companies'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.title ?? 'Update failed'),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'Active' | 'Inactive' }) => adminApi.setCompanyStatus(id, status),
    onSuccess: (_, vars) => { toast.success(`Company ${vars.status === 'Active' ? 'activated' : 'deactivated'}`); qc.invalidateQueries({ queryKey: ['admin-companies'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.title ?? 'Status update failed'),
  });

  const companies = data?.rows ?? [];
  const total = data?.total ?? 0;
  const active = companies.filter(c => c.status === 'Active').length;

  return (
    <>
      <AdminTopBar title="Companies" subtitle="Onboard and manage taxpayer companies"
        actions={<button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs"><Plus className="w-3.5 h-3.5" />Onboard Company</button>} />

      <div className="flex-1 p-7 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Total Companies" value={total} accent="amber" icon={<Building2 className="w-4 h-4"/>} />
          <KpiCard label="Active" value={active} accent="green" icon={<CheckCircle2 className="w-4 h-4"/>} />
          <KpiCard label="Inactive" value={total - active} accent="red" icon={<XCircle className="w-4 h-4"/>} />
        </div>

        <div className="card">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)]">
            <SectionHeader title="All Companies" description={`${total} registered taxpayers`} />
            <div className="relative ml-auto">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input pl-8 text-xs w-56" placeholder="Search by name or TIN…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : companies.length === 0 ? (
            <EmptyState title="No companies yet" description="Click 'Onboard Company' to register the first taxpayer."
              action={<button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs"><Plus className="w-3.5 h-3.5"/>Onboard Company</button>}
              icon={<Building2 className="w-6 h-6" />} />
          ) : (
            <>
              <table className="data-table">
                <thead><tr><th>Company Name</th><th>TIN</th><th>VAT No.</th><th>Day Max</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
                <tbody>
                  {companies.map(c => (
                    <tr key={c.id}>
                      <td className="font-semibold">{c.name}</td>
                      <td><span className="font-mono text-xs text-[var(--accent)]">{c.tin}</span></td>
                      <td className="font-mono text-xs">{c.vat_number ?? '—'}</td>
                      <td className="font-mono text-xs">{c.taxpayer_day_max_hrs}h</td>
                      <td><Badge variant={companyStatusBadge(c.status)}>{c.status}</Badge></td>
                      <td className="text-muted text-xs font-mono">{formatDate(c.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShowDetail(c)} className="p-1.5 rounded text-muted hover:text-[var(--info)] hover:bg-[var(--info-dim)] transition-colors" title="View details"><Eye className="w-3.5 h-3.5"/></button>
                          <button onClick={() => setShowEdit({ ...c })} className="p-1.5 rounded text-muted hover:text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5"/></button>
                          {c.status === 'Active'
                            ? <button onClick={() => setStatus.mutate({ id: c.id, status: 'Inactive' })} className="p-1.5 rounded text-muted hover:text-[var(--accent2)] hover:bg-[var(--accent2-dim)] transition-colors" title="Deactivate"><XCircle className="w-3.5 h-3.5"/></button>
                            : <button onClick={() => setStatus.mutate({ id: c.id, status: 'Active' })} className="p-1.5 rounded text-muted hover:text-[var(--success)] hover:bg-[var(--success-dim)] transition-colors" title="Activate"><CheckCircle2 className="w-3.5 h-3.5"/></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
                <span className="text-xs text-muted font-mono">Showing {page * 20 + 1}–{Math.min((page + 1) * 20, total)} of {total}</span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
                  <button disabled={(page + 1) * 20 >= total} onClick={() => setPage(p => p + 1)} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Company Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Onboard New Company" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-[var(--accent-dim)] border border-[var(--accent)]/30">
            <p className="text-xs text-[var(--accent)]">After creating the company, provision devices from the Devices section and provide the activation keys to the client.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="TIN (10 digits)"><input className="input font-mono" maxLength={10} value={form.tin} onChange={e => setForm({...form, tin: e.target.value})} placeholder="1234567890" /></Field>
            <Field label="VAT Number (optional)"><input className="input font-mono" maxLength={9} value={form.vatNumber} onChange={e => setForm({...form, vatNumber: e.target.value})} placeholder="123456789" /></Field>
          </div>
          <Field label="Registered Company Name"><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="ABC Retail Store Ltd" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fiscal Day Max Hours"><input type="number" className="input font-mono" value={form.taxPayerDayMaxHrs} onChange={e => setForm({...form, taxPayerDayMaxHrs: Number(e.target.value)})} min={1} max={48} /></Field>
            <Field label="End Notification (hrs before)"><input type="number" className="input font-mono" value={form.taxpayerDayEndNotificationHrs} onChange={e => setForm({...form, taxpayerDayEndNotificationHrs: Number(e.target.value)})} min={0} max={12} /></Field>
          </div>
          <Field label="QR Receipt URL"><input className="input font-mono text-xs" value={form.qrUrl} onChange={e => setForm({...form, qrUrl: e.target.value})} /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={() => create.mutate()} disabled={create.isPending || !form.tin || !form.name} className="btn btn-primary flex-1">
              {create.isPending ? 'Creating…' : 'Onboard Company'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Company Modal */}
      <Modal open={!!showEdit} onClose={() => setShowEdit(null)} title={`Edit: ${showEdit?.name}`} size="md">
        {showEdit && (
          <div className="space-y-4">
            <Field label="Company Name"><input className="input" value={showEdit.name} onChange={e => setShowEdit({...showEdit, name: e.target.value})} /></Field>
            <Field label="VAT Number"><input className="input font-mono" value={showEdit.vat_number ?? ''} onChange={e => setShowEdit({...showEdit, vat_number: e.target.value || undefined})} /></Field>
            <Field label="Status">
              <select className="input" value={showEdit.status} onChange={e => setShowEdit({...showEdit, status: e.target.value})}>
                <option>Active</option><option>Inactive</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Day Max Hours"><input type="number" className="input font-mono" value={showEdit.taxpayer_day_max_hrs} onChange={e => setShowEdit({...showEdit, taxpayer_day_max_hrs: Number(e.target.value)})} /></Field>
              <Field label="Notification Hours"><input type="number" className="input font-mono" value={showEdit.taxpayer_day_end_notification_hrs} onChange={e => setShowEdit({...showEdit, taxpayer_day_end_notification_hrs: Number(e.target.value)})} /></Field>
            </div>
            <Field label="QR URL"><input className="input font-mono text-xs" value={showEdit.qr_url} onChange={e => setShowEdit({...showEdit, qr_url: e.target.value})} /></Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowEdit(null)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={() => update.mutate()} disabled={update.isPending} className="btn btn-primary flex-1">{update.isPending ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Company Detail + Devices Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail?.name ?? ''} size="lg">
        {showDetail && (
          <div className="space-y-5">
            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              {[['ID', String(showDetail.id)], ['TIN', showDetail.tin], ['VAT No.', showDetail.vat_number ?? '—'], ['Status', showDetail.status], ['Day Max', `${showDetail.taxpayer_day_max_hrs}h`], ['Notification', `${showDetail.taxpayer_day_end_notification_hrs}h before`], ['QR URL', showDetail.qr_url], ['Registered', formatDate(showDetail.created_at)]].map(([k,v]) => (
                <div key={k} className="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                  <p className="label">{k}</p>
                  <p className="text-sm font-mono font-semibold truncate">{v}</p>
                </div>
              ))}
            </div>
            {/* Devices */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold">Registered Devices</p>
                <a href="/devices" className="text-xs text-[var(--accent)] hover:underline font-mono">+ Provision Device</a>
              </div>
              {(companyDevices?.rows ?? []).length === 0 ? (
                <div className="p-4 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-center text-sm text-muted">No devices yet</div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>ID</th><th>Serial</th><th>Branch</th><th>Mode</th><th>Status</th></tr></thead>
                  <tbody>
                    {(companyDevices?.rows?? []).map(d => (
                      <tr key={d.device_id}>
                        <td className="font-mono text-xs text-[var(--accent)]">#{d.device_id}</td>
                        <td className="font-mono text-xs">{d.device_serial_no}</td>
                        <td className="text-sm">{d.branch_name}<br/><span className="text-xs text-muted">{d.branch_address?.city}, {d.branch_address?.province}</span></td>
                        <td><Badge variant={d.operating_mode === 0 ? 'blue' : 'yellow'}>{deviceModeLabel(d.operating_mode)}</Badge></td>
                        <td><Badge variant={deviceStatusBadge(d.status)}>{d.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
