import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface AdminStore {
  token: string | null;
  username: string | null;
  role: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, username: string, role: string) => void;
  clearAuth: () => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      token: null, username: null, role: null, isAuthenticated: false,
      setAuth: (token, username, role) => {
        Cookies.set('zimra_admin_token', token, { expires: 0.33 }); // 8h
        set({ token, username, role, isAuthenticated: true });
      },
      clearAuth: () => {
        Cookies.remove('zimra_admin_token');
        set({ token: null, username: null, role: null, isAuthenticated: false });
      },
    }),
    {
      name: 'zimra-admin-auth',
      partialize: s => ({ token: s.token, username: s.username, role: s.role, isAuthenticated: s.isAuthenticated }),
    }
  )
);
