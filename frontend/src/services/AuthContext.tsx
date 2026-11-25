import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (loginIdentifier: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (
    name: string,
    email: string,
    phone: string,
    location: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'jalrakshak_auth_token';

const getAuthBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_AUTH_API_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return '/api/auth';
};

const AUTH_BASE = getAuthBaseUrl();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore user session on mount
  useEffect(() => {
    const checkAuthSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${AUTH_BASE}/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (err) {
        console.warn('[AuthContext] Session check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthSession();
  }, []);

  const login = async (loginIdentifier: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${AUTH_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        setUser(data.user);
        return { success: true, message: data.message || 'Logged in successfully.' };
      } else {
        return { success: false, message: data.message || 'Invalid credentials.' };
      }
    } catch (err: any) {
      console.error('[AuthContext Login Error]', err);
      return { success: false, message: 'Unable to connect to authentication server. Please try again.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    location: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${AUTH_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, location, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        setUser(data.user);
        return { success: true, message: data.message || 'Registration successful!' };
      } else {
        return { success: false, message: data.message || 'Registration failed.' };
      }
    } catch (err: any) {
      console.error('[AuthContext Register Error]', err);
      return { success: false, message: 'Unable to connect to authentication server. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch(`${AUTH_BASE}/logout`, { method: 'POST' });
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
