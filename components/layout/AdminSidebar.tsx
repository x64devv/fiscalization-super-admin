'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, MonitorSmartphone, Calendar, Receipt, ScrollText, Settings, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@/lib/store';

const NAV = [
  { section: 'System', items: [{ label: 'Overview', href: '/dashboard', icon: LayoutDashboard }] },
  { section: 'Onboarding', items: [
    { label: 'Companies', href: '/companies', icon: Building2 },
    { label: 'Devices', href: '/devices', icon: MonitorSmartphone },
  ]},
  { section: 'Monitor', items: [
    { label: 'Fiscal Days', href: '/fiscal-days', icon: Calendar },
    { label: 'Receipts', href: '/receipts', icon: Receipt },
    { label: 'Audit Log', href: '/audit', icon: ScrollText },
  ]},
  { section: 'Admin', items: [{ label: 'Settings', href: '/settings', icon: Settings }] },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { username, clearAuth } = useAdminStore();

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[var(--surface)] border-r border-[var(--border)]" style={{ width: 'var(--sidebar)' }}>
      {/* Logo - amber theme to signal admin context */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide leading-tight">ZIMRA</div>
          <div className="text-[10px] font-mono text-[var(--accent)] tracking-widest uppercase font-bold">
            Admin Portal
          </div>
        </div>
      </div>

      {/* System badge */}
      <div className="mx-3 my-3 px-3 py-2 rounded-lg bg-[var(--accent-dim)] border border-[var(--accent)]/30">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--accent)]">
          ⚡ System Owner Access
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">All tenants visible</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV.map(group => (
          <div key={group.section} className="mb-4">
            <div className="px-3 py-2 text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--text-dim)]">
              {group.section}
            </div>
            {group.items.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 border-l-2',
                    active
                      ? 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--accent)]'
                      : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--surface2)]')}>
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-[var(--accent)]' : 'opacity-70')} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
            SA
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{username ?? 'Superadmin'}</div>
            <div className="text-[10px] font-mono text-[var(--accent)]">System Owner</div>
          </div>
          <button onClick={clearAuth} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent2)] transition-colors" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
