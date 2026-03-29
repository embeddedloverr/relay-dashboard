import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'subuser';
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  loginError: string | null;
  
  // Actions
  fetchSession: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoginError: (error: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  loginError: null,

  fetchSession: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/me');
      
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          set({ user: json.data });
        } else {
          set({ user: null });
        }
      } else {
        set({ user: null });
      }
    } catch (error) {
      console.error('Failed to fetch session', error);
      set({ user: null });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  setUser: (user) => set({ user }),
  setLoginError: (error) => set({ loginError: error }),
  
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ user: null });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  }
}));
