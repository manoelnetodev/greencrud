import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true, // Start as true to indicate session check is in progress
  setUser: (user) => set({ user }),
  checkSession: async () => {
    set({ loading: true });
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error checking session:', error);
      set({ user: null, loading: false });
    } else {
      set({ user: session?.user || null, loading: false });
    }
  },
  logout: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      set({ user: null });
    }
    set({ loading: false });
  },
}));

// Initialize session check on store creation
useAuthStore.getState().checkSession();

// Listen for auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setUser(session?.user || null);
});
