import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import apiClient from '../../lib/apiClient';

// Define types compatible with what the client expects
interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Session {
  user: User;
  expires: string;
}

interface AuthContextType {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const fetchSession = async () => {
    try {
      const response = await apiClient.get("/auth/me");
      if (response.data) {
        setSession({
          user: response.data,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
        setStatus('authenticated');
      } else {
        setSession(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      setSession(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <AuthContext.Provider value={{ data: session, status, update: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Aliases for easier migration
export const useSession = useAuth;

export const signIn = (provider?: string) => {
  window.location.href = `${API_BASE_URL}/api/auth/${provider || 'google'}`;
};

export const signOut = async () => {
  try {
    await apiClient.get("/auth/logout");
    window.location.href = '/';
  } catch (error) {
    console.error('Logout failed', error);
    window.location.href = '/';
  }
};
