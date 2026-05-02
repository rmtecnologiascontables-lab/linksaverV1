import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { googleSheetsDB } from '../lib/googleSheetsDB';

export interface AuthUser {
  email: string;
  name: string;
  company?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  showSplash: boolean;
  showAuth: boolean;
  
  login: (user: AuthUser) => void;
  logout: () => void;
  setShowSplash: (show: boolean) => void;
  setShowAuth: (show: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      showSplash: true,
      showAuth: false,
      
      login: (user) => set({ 
        isAuthenticated: true, 
        user, 
        showSplash: false,
        showAuth: false,
      }),
      
      logout: async () => {
        const { user } = get();
        if (user?.email) {
          try {
            await googleSheetsDB.logout();
          } catch (e) {
            console.error('Error registering logout:', e);
          }
        }
        set({ 
          isAuthenticated: false, 
          user: null,
          showAuth: true,
          showSplash: false,
        });
      },
      
      setShowSplash: (show) => set({ showSplash: show }),
      setShowAuth: (show) => set({ showAuth: show }),
    }),
    {
      name: 'rm-brain-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);