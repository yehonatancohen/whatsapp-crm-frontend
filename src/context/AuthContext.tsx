import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  emailVerified: boolean;
  subscription?: {
    planTier: 'STARTER' | 'PRO' | 'ENTERPRISE';
    status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  usage?: {
    totalAccounts: number;
    totalCampaigns: number;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));

      // If the JWT has a stale role, refresh it so API calls reflect the latest permissions
      const accessToken = localStorage.getItem('accessToken');
      const refreshTokenVal = localStorage.getItem('refreshToken');
      if (accessToken && refreshTokenVal) {
        try {
          const parts = accessToken.split('.');
          if (parts.length === 3) {
            const jwtPayload = JSON.parse(atob(parts[1]));
            if (jwtPayload.role !== data.role || jwtPayload.emailVerified !== data.emailVerified) {
              const { data: tokenData } = await api.post('/auth/refresh', { refreshToken: refreshTokenVal });
              localStorage.setItem('accessToken', tokenData.accessToken);
              localStorage.setItem('refreshToken', tokenData.refreshToken);
            }
          }
        } catch {
          // Non-critical: JWT decode or refresh failed, continue with existing token
        }
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  // Restore user from stored tokens on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Silently refresh in background to get latest subscription/usage
        refreshUser();
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    // Fetch full profile after login
    await refreshUser();
  }, [refreshUser]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { data } = await api.post('/auth/register', { email, password, name });
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    // Fetch full profile after registration
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Best-effort logout
    }
    localStorage.clear();
    setUser(null);
  }, []);

  const resendVerification = useCallback(async () => {
    await api.post('/auth/resend-verification');
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, resendVerification, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
