import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { User } from "@prisma/client";

interface SessionContextType {
  session: User | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

interface SessionProviderProps {
  initialSession: User | null;
  children: React.ReactNode;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
  refreshSession: async () => {},
});

export const SessionProvider = ({
  initialSession,
  children,
}: SessionProviderProps) => {
  const [session, setSession] = useState<User | null>(initialSession);
  const [loading, setLoading] = useState(false);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          withCredentials: true,
        }
      );
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSession) {
      fetchSession();
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{ session, loading, refreshSession: fetchSession }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
