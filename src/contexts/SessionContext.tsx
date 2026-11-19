"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionUser } from "@/lib/auth";

interface SessionContextType {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser);

  // Fallback nếu vì lý do nào đó server layout chưa kịp truyền initialUser
  useEffect(() => {
    if (!user && !initialUser) {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [user, initialUser]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      window.location.href = "/admin/login";
    }
  };

  return (
    <SessionContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
