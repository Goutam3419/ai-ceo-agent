"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firebaseConfigured } from "./firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configError: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  configError: false,
});

export function RangoliAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, configError: !firebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useRangoliAuth() {
  return useContext(AuthContext);
}
