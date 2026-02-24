import AdminSidebar from './AdminSidebar';
import AuthGuard from './AuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-auto" style={{ marginLeft: 'var(--sidebar)' }}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
