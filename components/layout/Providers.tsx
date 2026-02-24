'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }));
  return (
    <QueryClientProvider client={qc}>
      {children}
      <Toaster position="top-right" toastOptions={{
        style: { background: '#141820', color: '#e2e8f0', border: '1px solid #1a2030', fontSize: '13px' },
        success: { iconTheme: { primary: '#f59e0b', secondary: '#000' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }} />
    </QueryClientProvider>
  );
}
