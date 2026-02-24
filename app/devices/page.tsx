'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MonitorSmartphone, Plus, Copy, Wifi, WifiOff, ShieldOff, ShieldCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { Badge, KpiCard, SectionHeader, Modal, Field, EmptyState, Spinner } from '@/components/ui';
import { adminApi, type Device } from '@/lib/api';
import { formatDate, deviceStatusBadge, deviceModeLabel } from '@/lib/utils';

const PROVINCES = ['Harare','Bulawayo','Manicaland','Mashonaland Central','Mashonaland East','Mashonaland West','Masvingo','Matabeleland North','Matabeleland South','Midlands'];

const EMPTY = {
  deviceID: '', taxpayerID: '', deviceSerialNo: '', deviceModelName: 'ZIMRA-POS-2000',
  deviceModelVersion: '1.0', activationKey: '', operatingMode: 0,
  branchName: '', province: 'Harare', city: '', street: '', houseNo: '',
  phoneNo: '', email: '',
};

export default function DevicesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [showProvision, setShowProvision] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [provisionedDevice, setProvisionedDevice] = useState<Device & { activation_key?: string } | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-devices', page],
    queryFn: () => adminApi.listDevices({ offset: page * 20, limit: 20 }),
    retry: false,
  });

  const { data: companies } = useQuery({
    queryKey: ['admin-companies-list'],
    queryFn: () => adminApi.listCompanies({ limit: 200 }),
    retry: false,
  });

  const provision = useMutation({
    mutationFn: () => adminApi.provisionDevice({
      deviceID: Number(form.deviceID),
      taxpayerID: Number(form.taxpayerID),
      deviceSerialNo: form.deviceSerialNo,
      deviceModelName: form.deviceModelName,
      deviceModelVersion: form.deviceModelVersion,
      activationKey: form.activationKey.toUpperCase(),
      operatingMode: form.operatingMode as 0 | 1,
      branchName: form.branchName,
      branchAddress: { province: form.province, city: form.city, street: form.street, houseNo: form.houseNo },
      branchContacts: (form.phoneNo || form.email) ? { phoneNo: form.phoneNo || undefined, email: form.email || undefined } : undefined,
    }),
    onSuccess: (device) => {
      toast.success(`Device #${device.device_id} provisioned`);
      setShowProvision(false);
      setProvisionedDevice(device);
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ['admin-devices'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.title ?? 'Provisioning failed'),
  });

  const setDeviceStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'Active'|'Blocked'|'Revoked' }) => adminApi.setDeviceStatus(id, status),
    onSuccess: () => { toast.success('Device status updated'); qc.invalidateQueries({ queryKey: ['admin-devices'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.title ?? 'Failed'),
  });

  const setDeviceMode = useMutation({
    mutationFn: ({ id, mode }: { id: number; mode: 0|1 }) => adminApi.setDeviceMode(id, mode),
    onSuccess: () => { toast.success('Device mode updated'); qc.invalidateQueries({ queryKey: ['admin-devices'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.title ?? 'Failed'),
  });

  // const copyKey = (key: string) => { navigator.clipboard.writeText(key); toast.success('Activation key copied!'); };
  const copyKey = (key: string) => {
  if (!key) { toast.error('No activation key to copy'); return; }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(key).then(() => toast.success('Activation key copied!')).catch(() => fallbackCopy(key));
  } else {
    fallbackCopy(key);
  }
};

const fallbackCopy = (key: string) => {
  const el = document.createElement('textarea');
  el.value = key;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  try { document.execCommand('copy'); toast.success('Activation key copied!'); }
  catch { toast.error('Copy failed — please copy manually: ' + key); }
  document.body.removeChild(el);
};

  const devices = data?.rows ?? [];
  const total = data?.total ?? 0;
  const filtered = devices.filter(d => !search || d.device_serial_no.includes(search) || String(d.device_id).includes(search) || d.branch_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <AdminTopBar title="Devices" subtitle="Provision and manage fiscal devices across all companies"
        actions={<button onClick={() => setShowProvision(true)} className="btn btn-primary text-xs"><Plus className="w-3.5 h-3.5"/>Provision Device</button>} />

      <div className="flex-1 p-7 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Total Devices" value={total} accent="amber" icon={<MonitorSmartphone className="w-4 h-4"/>} />
          <KpiCard label="Online Mode" value={devices.filter(d => d.operating_mode === 0).length} accent="blue" icon={<Wifi className="w-4 h-4"/>} />
          <KpiCard label="Blocked / Revoked" value={devices.filter(d => d.status !== 'Active').length} accent="red" icon={<ShieldOff className="w-4 h-4"/>} />
        </div>

        {/* Activation key reveal */}
        {provisionedDevice && (
          <div className="card p-4 border-[var(--accent)] border flex items-start gap-4 bg-[var(--accent-dim)]">
            <ShieldCheck className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--accent)]">Device #{provisionedDevice.device_id} provisioned — save the activation key now!</p>
              <p className="text-xs text-muted mt-1">This key is only shown once. Provide it to the client to register their device.</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="px-3 py-1.5 rounded bg-black/30 font-mono text-base text-[var(--accent)] font-bold tracking-widest border border-[var(--accent)]/30">
                  {provisionedDevice.activation_key ?? 'KEY_HIDDEN'}
                </code>
                <button onClick={() => copyKey(provisionedDevice.activation_key ?? '')} className="btn btn-secondary text-xs px-3 py-1.5"><Copy className="w-3 h-3"/>Copy</button>
              </div>
            </div>
            <button onClick={() => setProvisionedDevice(null)} className="text-muted hover:text-[var(--text)] text-xl">×</button>
          </div>
        )}

        <div className="card">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)]">
            <SectionHeader title="All Devices" description={`${total} registered`} />
            <div className="relative ml-auto">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input pl-8 text-xs w-52" placeholder="Search by ID, serial, branch…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No devices provisioned yet" description="Click 'Provision Device' to add a device to a company."
              action={<button onClick={() => setShowProvision(true)} className="btn btn-primary text-xs"><Plus className="w-3.5 h-3.5"/>Provision Device</button>}
              icon={<MonitorSmartphone className="w-6 h-6"/>} />
          ) : (
            <>
              <table className="data-table">
                <thead><tr><th>Device ID</th><th>Serial No.</th><th>Model</th><th>Branch</th><th>Address</th><th>Mode</th><th>Status</th><th>Cert Expires</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.device_id}>
                      <td><span className="font-mono text-xs text-[var(--accent)]">#{d.device_id}</span></td>
                      <td className="font-mono text-xs">{d.device_serial_no}</td>
                      <td className="text-xs text-muted">{d.device_model_name}<br/>{d.device_model_version}</td>
                      <td className="font-medium text-sm">{d.branch_name}</td>
                      <td className="text-xs text-muted">{d.branch_address?.city}, {d.branch_address?.province}</td>
                      <td>
                        <button onClick={() => setDeviceMode.mutate({ id: d.device_id, mode: d.operating_mode === 0 ? 1 : 0 })}
                          className="group" title="Click to toggle mode">
                          <Badge variant={d.operating_mode === 0 ? 'blue' : 'yellow'}>
                            {d.operating_mode === 0 ? <Wifi className="w-2.5 h-2.5"/> : <WifiOff className="w-2.5 h-2.5"/>}
                            {deviceModeLabel(d.operating_mode)}
                          </Badge>
                        </button>
                      </td>
                      <td><Badge variant={deviceStatusBadge(d.status)}>{d.status}</Badge></td>
                      <td className="font-mono text-xs text-muted">{d.certificate_valid_till ? formatDate(d.certificate_valid_till) : '—'}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          {d.status === 'Active' && (
                            <button onClick={() => setDeviceStatus.mutate({ id: d.device_id, status: 'Blocked' })}
                              className="px-2 py-1 rounded text-xs text-[var(--accent2)] hover:bg-[var(--accent2-dim)] transition-colors font-mono">Block</button>
                          )}
                          {d.status === 'Blocked' && (
                            <button onClick={() => setDeviceStatus.mutate({ id: d.device_id, status: 'Active' })}
                              className="px-2 py-1 rounded text-xs text-[var(--success)] hover:bg-[var(--success-dim)] transition-colors font-mono">Activate</button>
                          )}
                          {d.status !== 'Revoked' && (
                            <button onClick={() => { if (confirm('Revoke this device? This cannot be undone.')) setDeviceStatus.mutate({ id: d.device_id, status: 'Revoked' }); }}
                              className="px-2 py-1 rounded text-xs text-muted hover:text-[var(--accent2)] hover:bg-[var(--accent2-dim)] transition-colors font-mono">Revoke</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
                <span className="text-xs text-muted font-mono">Showing {page*20+1}–{Math.min((page+1)*20, total)} of {total}</span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p-1)} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
                  <button disabled={(page+1)*20 >= total} onClick={() => setPage(p => p+1)} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Provision Device Modal */}
      <Modal open={showProvision} onClose={() => setShowProvision(false)} title="Provision New Device" size="lg">
        <div className="space-y-5">
          <div className="p-3 rounded-lg bg-[var(--accent-dim)] border border-[var(--accent)]/30">
            <p className="text-xs text-[var(--accent)]">After provisioning, the activation key will be shown once. Record it and provide it to the client along with their Device ID to complete device registration.</p>
          </div>

          {/* Identity */}
          <div>
            <p className="label mb-3">Device Identity</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Device ID (numeric, unique)"><input type="number" className="input font-mono" value={form.deviceID} onChange={e => setForm({...form, deviceID: e.target.value})} placeholder="e.g. 1001" /></Field>
              <Field label="Serial No. (max 20 chars)"><input className="input font-mono" value={form.deviceSerialNo} onChange={e => setForm({...form, deviceSerialNo: e.target.value})} placeholder="DEV-001-2024" maxLength={20} /></Field>
              <Field label="Model Name"><input className="input" value={form.deviceModelName} onChange={e => setForm({...form, deviceModelName: e.target.value})} /></Field>
              <Field label="Model Version"><input className="input font-mono" value={form.deviceModelVersion} onChange={e => setForm({...form, deviceModelVersion: e.target.value})} /></Field>
            </div>
          </div>

          {/* Assignment */}
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="label mb-3">Company Assignment</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Assign to Company">
                <select className="input" value={form.taxpayerID} onChange={e => setForm({...form, taxpayerID: e.target.value})}>
                  <option value="">— Select Company —</option>
                  {(companies?.rows ?? []).map(c => <option key={c.id} value={c.id}>{c.name} ({c.tin})</option>)}
                </select>
              </Field>
              <Field label="Activation Key (8 chars)">
                <div className="flex gap-2">
                  <input className="input font-mono uppercase tracking-widest flex-1" value={form.activationKey}
                    maxLength={8} onChange={e => setForm({...form, activationKey: e.target.value.toUpperCase()})} placeholder="ABC12345" />
                  <button type="button" onClick={() => setForm({...form, activationKey: Math.random().toString(36).slice(2,10).toUpperCase()})}
                    className="btn btn-secondary text-xs px-3 whitespace-nowrap">Generate</button>
                </div>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Operating Mode">
                <select className="input" value={form.operatingMode} onChange={e => setForm({...form, operatingMode: Number(e.target.value)})}>
                  <option value={0}>Online — real-time receipt submission</option>
                  <option value={1}>Offline — batch file submission</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Branch */}
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="label mb-3">Branch Details</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Branch Name"><input className="input" value={form.branchName} onChange={e => setForm({...form, branchName: e.target.value})} placeholder="Main Branch" /></Field>
              <Field label="Province">
                <select className="input" value={form.province} onChange={e => setForm({...form, province: e.target.value})}>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="City"><input className="input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Harare" /></Field>
              <Field label="Street"><input className="input" value={form.street} onChange={e => setForm({...form, street: e.target.value})} placeholder="Samora Machel Ave" /></Field>
              <Field label="House / Building No."><input className="input" value={form.houseNo} onChange={e => setForm({...form, houseNo: e.target.value})} placeholder="12" /></Field>
              <Field label="Phone (optional)"><input className="input font-mono" value={form.phoneNo} onChange={e => setForm({...form, phoneNo: e.target.value})} placeholder="+263..." /></Field>
              <Field label="Email (optional)"><input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="branch@company.com" /></Field>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowProvision(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={() => provision.mutate()} disabled={provision.isPending || !form.deviceID || !form.taxpayerID || !form.activationKey || form.activationKey.length !== 8 || !form.branchName} className="btn btn-primary flex-1">
              {provision.isPending ? 'Provisioning…' : 'Provision Device'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
