import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api, setAccessToken, getAccessToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string; phone?: string; address?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLibrarian: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!getAccessToken()) {
        setIsLoading(false);
        return;
      }
      const data = await api.get<User>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await api.post<{ user: User; accessToken: string }>('/auth/login', {
      email,
      password: pass
    });

    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string; address?: string }): Promise<void> => {
    const res = await api.post<{ user: User; accessToken: string }>('/auth/register', data);
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore logout failure
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    await fetchCurrentUser();
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isLibrarian = user?.role === 'LIBRARIAN';
  const isMember = user?.role === 'MEMBER';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        isAuthenticated,
        isAdmin,
        isLibrarian,
        isMember
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
