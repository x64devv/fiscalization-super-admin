'use client';
import { useQuery } from '@tanstack/react-query';
import { Building2, MonitorSmartphone, Receipt, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { KpiCard, Badge, SectionHeader } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, deviceStatusBadge, companyStatusBadge } from '@/lib/utils';

const revenueData = [
  { day: 'Mon', revenue: 142000 }, { day: 'Tue', revenue: 198000 },
  { day: 'Wed', revenue: 167000 }, { day: 'Thu', revenue: 231000 },
  { day: 'Fri', revenue: 204000 }, { day: 'Sat', revenue: 289000 }, { day: 'Sun', revenue: 175000 },
];

const companyRevenueData = [
  { name: 'ABC Retail', revenue: 89000 }, { name: 'XYZ Super', revenue: 124000 },
  { name: 'Small Shop', revenue: 23000 }, { name: 'Fresh Mart', revenue: 67000 },
  { name: 'City Store', revenue: 45000 },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.getStats, retry: false });
  const { data: companies } = useQuery({ queryKey: ['admin-companies', 0, 5], queryFn: () => adminApi.listCompanies({ limit: 5 }), retry: false });
  const { data: devices } = useQuery({ queryKey: ['admin-devices', 0, 5], queryFn: () => adminApi.listDevices({ limit: 5 }), retry: false });

  return (
    <>
      <AdminTopBar title="System Overview" subtitle="All companies · All devices · All fiscal operations" />
      <div className="flex-1 p-7 space-y-7">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Registered Companies" value={stats?.totalCompanies ?? '—'} sub={`${stats?.activeCompanies ?? 0} active`} accent="amber" icon={<Building2 className="w-4 h-4"/>} />
          <KpiCard label="Active Devices" value={stats?.activeDevices ?? '—'} sub={`of ${stats?.totalDevices ?? 0} total`} accent="blue" icon={<MonitorSmartphone className="w-4 h-4"/>} />
          <KpiCard label="Today's Receipts" value={stats?.todayReceipts ?? '—'} sub="across all companies" accent="green" icon={<Receipt className="w-4 h-4"/>} />
          <KpiCard label="Open Fiscal Days" value={stats?.openFiscalDays ?? '—'} sub="currently running" accent="amber" icon={<Calendar className="w-4 h-4"/>} />
        </div>

        {/* Revenue + Validation alerts */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1 card p-5 flex flex-col justify-between">
            <div>
              <p className="label">Today's Total Revenue</p>
              <p className="text-3xl font-mono font-bold text-[var(--accent)] mt-2">
                {stats ? formatCurrency(stats.todayRevenue) : '—'}
              </p>
              <p className="text-xs text-muted mt-1">Across all registered companies</p>
            </div>
            {stats?.validationErrors ? (
              <div className="mt-4 p-3 rounded-lg bg-[var(--accent2-dim)] border border-[var(--accent2)]/30 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--accent2)] flex-shrink-0" />
                <span className="text-xs text-[var(--accent2)] font-bold">{stats.validationErrors} validation error{stats.validationErrors !== 1 ? 's' : ''} today</span>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-lg bg-[var(--success-dim)] border border-[var(--success)]/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                <span className="text-xs text-[var(--success)] font-bold">No validation errors today</span>
              </div>
            )}
          </div>

          <div className="col-span-3 card p-5">
            <SectionHeader title="System-wide Revenue (7 days)" description="All companies combined (USD)" />
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueData} margin={{ left: -10, right: 4 }}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2030" vertical={false} />
                <XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:11, fontFamily:'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11, fontFamily:'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'#141820', border:'1px solid #1a2030', borderRadius:8, color:'#e2e8f0', fontSize:12, fontFamily:'var(--font-mono)' }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#adminGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-company revenue + tables */}
        <div className="grid grid-cols-2 gap-5">
          {/* Top companies by revenue */}
          <div className="card p-5">
            <SectionHeader title="Revenue by Company" description="Today (USD)" />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={companyRevenueData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2030" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:10, fontFamily:'var(--font-mono)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'#141820', border:'1px solid #1a2030', borderRadius:8, fontSize:12 }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent companies */}
          <div className="card">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <SectionHeader title="Recent Companies" />
              <a href="/companies" className="btn btn-secondary text-xs px-3 py-1.5">View All</a>
            </div>
            <table className="data-table">
              <thead><tr><th>Company</th><th>TIN</th><th>Status</th></tr></thead>
              <tbody>
                {(companies?.rows ?? []).map(c => (
                  <tr key={c.id}>
                    <td className="font-medium text-sm">{c.name}</td>
                    <td><span className="font-mono text-xs text-[var(--accent)]">{c.tin}</span></td>
                    <td><Badge variant={companyStatusBadge(c.status)}>{c.status}</Badge></td>
                  </tr>
                )) ?? <tr><td colSpan={3} className="text-center py-6 text-muted text-sm">No data from API</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device health */}
        <div className="card">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <SectionHeader title="Device Health" description="All registered fiscal devices" />
            <a href="/devices" className="btn btn-secondary text-xs px-3 py-1.5">View All</a>
          </div>
          <table className="data-table">
            <thead><tr><th>Device ID</th><th>Serial No.</th><th>Branch</th><th>Mode</th><th>Status</th><th>Cert Expires</th></tr></thead>
            <tbody>
              {(devices?.rows ?? []).map(d => (
                <tr key={d.device_id}>
                  <td><span className="font-mono text-xs text-[var(--accent)]">#{d.device_id}</span></td>
                  <td className="font-mono text-xs">{d.device_serial_no}</td>
                  <td className="text-sm">{d.branch_name}</td>
                  <td><Badge variant={d.operating_mode === 0 ? 'blue' : 'yellow'}>{d.operating_mode === 0 ? 'Online' : 'Offline'}</Badge></td>
                  <td><Badge variant={deviceStatusBadge(d.status)}>{d.status}</Badge></td>
                  <td className="font-mono text-xs text-muted">{d.certificate_valid_till ? formatDate(d.certificate_valid_till) : '—'}</td>
                </tr>
              )) ?? <tr><td colSpan={6} className="text-center py-6 text-muted text-sm">No devices — connect to API</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
