import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User, UserRole } from '@/constants/dummy';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('velcrone_user');
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        return { success: false, error: payload?.message || 'Login gagal' };
      }

      const apiUser = payload?.user;
      if (!apiUser?.id || !apiUser?.email || !apiUser?.role) {
        return { success: false, error: 'Response login tidak valid' };
      }

      const rawRole = String(apiUser.role);
      const knownRoles: UserRole[] = [
        'superadmin',
        'owner',
        'manager',
        'kasir',
        'design',
        'setting',
        'printing',
        'heat press',
        'sewing',
        'qc',
        'packing',
        'delivery',
      ];

      const role: UserRole | null =
        rawRole === 'administrator'
          ? 'superadmin'
          : (knownRoles as readonly string[]).includes(rawRole)
            ? (rawRole as UserRole)
            : null;

      if (!role) {
        return { success: false, error: 'Role tidak dikenali' };
      }

      const nextUser: User = {
        id: String(apiUser.id),
        name: String(apiUser.name || apiUser.email),
        email: String(apiUser.email),
        role,
        status: 'active',
        createdAt: '',
      };

      setUser(nextUser);
      localStorage.setItem('velcrone_user', JSON.stringify(nextUser));
      return { success: true, role };
    } catch {
      return { success: false, error: 'Gagal terhubung ke server' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('velcrone_user');
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
