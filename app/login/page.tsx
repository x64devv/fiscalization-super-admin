'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { useAdminStore } from '@/lib/store';

export default function AdminLogin() {
  const router = useRouter();
  const { setAuth } = useAdminStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  const login = useMutation({
    mutationFn: () => adminApi.login(form),
    onSuccess: (data) => {
      setAuth(data.token, data.username, data.role);
      toast.success('Welcome to Admin Portal');
      router.push('/dashboard');
    },
    onError: (e: any) => toast.error(e?.response?.data?.title ?? 'Invalid credentials'),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"
      style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(239,68,68,0.04) 0%, transparent 50%)' }}>
      <div className="w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--accent)]/20">
            <Shield className="w-7 h-7 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-sm text-muted mt-1 font-mono">ZIMRA System Owner Access</p>
        </div>

        {/* Warning banner */}
        <div className="mb-4 p-3 rounded-lg bg-[var(--accent-dim)] border border-[var(--accent)]/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--accent)] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[var(--accent)]">
            Restricted access. This portal manages all registered companies and devices. Only authorised ZIMRA administrators.
          </p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-2xl border-[var(--accent)]/20">
          <form onSubmit={(e) => { e.preventDefault(); login.mutate(); }} className="space-y-4">
            <div>
              <label className="label">Administrator Username</label>
              <input className="input font-mono" placeholder="superadmin"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} autoComplete="username" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPwd ? 'text' : 'password'}
                  placeholder="Enter admin password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--text)] transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={login.isPending} className="btn btn-primary w-full justify-center mt-2">
              {login.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</> : 'Sign In to Admin Portal'}
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-muted text-center font-mono">
              API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-dim mt-6 font-mono">
          © {new Date().getFullYear()} Zimbabwe Revenue Authority — System Owner Portal
        </p>
      </div>
    </div>
  );
}
