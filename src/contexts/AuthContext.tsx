import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminUser } from '../types/database';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrentProfile: (updates: Partial<AdminUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { success, error: toastError } = useToast();

  const fetchAdminRecord = async (userId: string, userEmail?: string): Promise<AdminUser | null> => {
    if (!supabase) return null;

    // 1. Try finding by user_id
    const { data: byId, error: errById } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (byId && !errById) {
      return byId as AdminUser;
    }

    // 2. If not found by user_id, check by email and link user_id
    if (userEmail) {
      const { data: byEmail, error: errByEmail } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .maybeSingle();

      if (byEmail && !errByEmail) {
        // Link user_id in admin_users
        await supabase
          .from('admin_users')
          .update({ user_id: userId, updated_at: new Date().toISOString() })
          .eq('id', byEmail.id);

        return { ...byEmail, user_id: userId } as AdminUser;
      }
    }

    return null;
  };

  // Hydrate session on app load directly from Supabase
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const adminRecord = await fetchAdminRecord(session.user.id, session.user.email);
            if (adminRecord) {
              setUser(adminRecord);
            } else {
              await supabase.auth.signOut();
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Supabase session init error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const adminRecord = await fetchAdminRecord(session.user.id, session.user.email);
          if (adminRecord) {
            setUser(adminRecord);
          } else {
            await client.auth.signOut();
            setUser(null);
            toastError('Access Denied', 'Your account does not have admin privileges in admin_users.');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return {
          success: false,
          error: 'Supabase URL and Anon Key are missing in .env',
        };
      }

      if (!password) {
        return { success: false, error: 'Password is required' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const adminRecord = await fetchAdminRecord(data.user.id, data.user.email);

        if (!adminRecord) {
          await supabase.auth.signOut();
          return {
            success: false,
            error: `Access Denied: ${email} is not authorized in the admin_users table.`,
          };
        }

        setUser(adminRecord);
        success('Welcome Back', `Logged in as ${adminRecord.name} (${adminRecord.role})`);
        return { success: true };
      }

      return { success: false, error: 'User could not be authenticated.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    success('Logged Out', 'You have been signed out safely.');
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, error: 'Supabase is not configured' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) return { success: false, error: error.message };

      success('Password Reset Sent', `Password reset instructions sent to ${email}.`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed' };
    }
  };

  const updateCurrentProfile = async (updates: Partial<AdminUser>) => {
    if (!user || !supabase) return;
    const { error } = await supabase
      .from('admin_users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;

    setUser((prev) => (prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null));
    success('Profile Updated', 'Your admin profile changes have been saved.');
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isSuperAdmin,
        login,
        logout,
        resetPassword,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
