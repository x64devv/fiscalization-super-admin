'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Server, Key, BookOpen, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminTopBar from '@/components/layout/AdminTopBar';
import { SectionHeader, Field } from '@/components/ui';
import { useAdminStore } from '@/lib/store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const ONBOARDING_STEPS = [
  {
    step: 1,
    title: 'Create the Company',
    description: 'Register the taxpayer in the system with their TIN, VAT number, and company name.',
    endpoint: 'POST /api/admin/companies',
    note: 'The company starts as Active. You can deactivate it at any time to suspend all their devices.',
  },
  {
    step: 2,
    title: 'Provision a Device for each Branch',
    description: 'For every branch location, create a device linked to the company. Each device gets a unique Device ID and an 8-character activation key.',
    endpoint: 'POST /api/admin/devices',
    note: 'The activation key is only shown once immediately after provisioning. Copy and send it securely to the client.',
  },
  {
    step: 3,
    title: 'Share Credentials with the Client',
    description: 'Give the client their Device ID and activation key. They use these in the client dashboard to run device registration (verify taxpayer → register → issue certificate).',
    endpoint: 'Client runs: POST /api/v1/device/verify-taxpayer → POST /api/v1/device/register',
    note: 'The client also needs the API base URL and their login credentials (set separately via user management on their device).',
  },
  {
    step: 4,
    title: 'Client Registers and Starts Operating',
    description: 'Once the client completes device registration, their PKI certificate is issued and they can open fiscal days and submit receipts.',
    endpoint: 'Client runs: POST /api/v1/fiscal-day/open → POST /api/v1/receipt/submit',
    note: 'You can monitor all their activity from the Fiscal Days and Receipts sections of this admin portal.',
  },
];

function GuideStep({ step, open, toggle }: { step: typeof ONBOARDING_STEPS[0]; open: boolean; toggle: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(step.endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface2)] transition-colors text-left">
        <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
          {step.step}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{step.title}</p>
          <p className="text-xs text-muted mt-0.5">{step.description}</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[var(--border)]">
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-black/40 font-mono text-xs text-[var(--accent)] border border-[var(--accent)]/20">
              {step.endpoint}
            </code>
            <button onClick={copy} className="p-2 rounded-lg text-muted hover:text-[var(--accent)] hover:bg-[var(--accent-dim)] transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-[var(--accent-dim)] border border-[var(--accent)]/20">
            <p className="text-xs text-[var(--accent)] leading-relaxed">💡 {step.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { username } = useAdminStore();
  const [openStep, setOpenStep] = useState<number | null>(1);

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => axios.get(`${API_BASE}/health`).then((r) => r.data),
    retry: false,
  });

  return (
    <>
      <AdminTopBar title="Settings" subtitle="Admin credentials, API config, onboarding guide" />

      <div className="flex-1 p-7 space-y-7 max-w-3xl">

        {/* Session */}
        <div className="card">
          <div className="p-5 border-b border-[var(--border)]">
            <SectionHeader title="Current Session" icon={<Shield className="w-4 h-4" />} />
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              ['Username', username ?? '—'],
              ['Role', 'superadmin'],
              ['Access Level', 'System Owner — Full Access'],
              ['Portal', 'ZIMRA Admin Portal'],
            ].map(([k, v]) => (
              <div key={k} className="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                <p className="label">{k}</p>
                <p className="text-sm font-semibold font-mono">{v}</p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <div className="p-3 rounded-lg bg-[var(--accent-dim)] border border-[var(--accent)]/30">
              <p className="text-xs text-[var(--accent)]">
                Default admin credentials: <code className="font-mono font-bold">superadmin / ZimraAdmin2024!</code> — change this in <code className="font-mono">internal/service/admin_service.go</code> before production deployment.
              </p>
            </div>
          </div>
        </div>

        {/* API Connection */}
        <div className="card">
          <div className="p-5 border-b border-[var(--border)]">
            <SectionHeader title="API Connection" icon={<Server className="w-4 h-4" />} />
          </div>
          <div className="p-5 space-y-3">
            <Field label="Base URL">
              <input className="input font-mono text-xs" readOnly value={API_BASE} />
            </Field>
            {health && (
              <div className="grid grid-cols-3 gap-3">
                {[['Status', health.status], ['Service', health.service], ['Version', health.version]].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                    <p className="label">{k}</p>
                    <p className="text-sm font-bold">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Admin API quick reference */}
        <div className="card">
          <div className="p-5 border-b border-[var(--border)]">
            <SectionHeader title="Admin API Endpoints" description="All routes require Authorization: Bearer <token>" icon={<Key className="w-4 h-4" />} />
          </div>
          <div className="p-5 space-y-2">
            {[
              ['POST', '/api/admin/login', 'public', 'Authenticate as admin'],
              ['GET', '/api/admin/stats', 'auth', 'System-wide statistics'],
              ['GET', '/api/admin/companies', 'auth', 'List all companies'],
              ['POST', '/api/admin/companies', 'auth', 'Create company (onboarding)'],
              ['PUT', '/api/admin/companies/:id', 'auth', 'Update company details'],
              ['PATCH', '/api/admin/companies/:id/status', 'auth', 'Activate / deactivate'],
              ['GET', '/api/admin/companies/:id/devices', 'auth', 'List devices for a company'],
              ['GET', '/api/admin/devices', 'auth', 'List all devices'],
              ['POST', '/api/admin/devices', 'auth', 'Provision new device'],
              ['PATCH', '/api/admin/devices/:id/status', 'auth', 'Block / revoke device'],
              ['PATCH', '/api/admin/devices/:id/mode', 'auth', 'Switch online/offline'],
              ['GET', '/api/admin/fiscal-days', 'auth', 'Cross-tenant fiscal days'],
              ['GET', '/api/admin/receipts', 'auth', 'Cross-tenant receipts'],
              ['GET', '/api/admin/audit', 'auth', 'System audit log'],
            ].map(([method, path, access, desc]) => (
              <div key={path} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface2)] transition-colors">
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  method === 'GET' ? 'bg-[var(--info-dim)] text-[var(--info)]' :
                  method === 'POST' ? 'bg-[var(--success-dim)] text-[var(--success)]' :
                  method === 'PUT' ? 'bg-[var(--accent-dim)] text-[var(--accent)]' :
                  'bg-[var(--surface2)] text-muted'
                }`}>{method}</span>
                <code className="font-mono text-xs text-[var(--accent)] flex-1">{path}</code>
                <span className={`text-[10px] font-mono ${access === 'public' ? 'text-[var(--success)]' : 'text-muted'}`}>{access}</span>
                <span className="text-xs text-muted hidden md:block">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Onboarding guide */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-base font-bold">Client Onboarding Guide</h2>
          </div>
          <div className="space-y-3">
            {ONBOARDING_STEPS.map((step) => (
              <GuideStep
                key={step.step}
                step={step}
                open={openStep === step.step}
                toggle={() => setOpenStep(openStep === step.step ? null : step.step)}
              />
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
