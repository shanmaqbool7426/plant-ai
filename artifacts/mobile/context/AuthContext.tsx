import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  email: string;
  displayName: string;
  isGuest: boolean;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  identificationCount: number;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  incrementIdentificationCount: () => Promise<void>;
  canIdentify: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DAILY_FREE_LIMIT = 3;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [identificationCount, setIdentificationCount] = useState(0);

  useEffect(() => {
    loadUser();
    loadTodayCount();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem("leaflens_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTodayCount() {
    try {
      const today = new Date().toDateString();
      const stored = await AsyncStorage.getItem("leaflens_id_count");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date === today) {
          setIdentificationCount(data.count);
        } else {
          setIdentificationCount(0);
        }
      }
    } catch {}
  }

  async function signIn(email: string, _password: string) {
    const newUser: User = {
      id: Date.now().toString(),
      email,
      displayName: email.split("@")[0],
      isGuest: false,
    };
    await AsyncStorage.setItem("leaflens_user", JSON.stringify(newUser));
    setUser(newUser);
  }

  async function signInAsGuest() {
    const newUser: User = {
      id: "guest_" + Date.now().toString(),
      email: "guest@leaflens.app",
      displayName: "Guest",
      isGuest: true,
    };
    await AsyncStorage.setItem("leaflens_user", JSON.stringify(newUser));
    setUser(newUser);
  }

  async function signOut() {
    await AsyncStorage.removeItem("leaflens_user");
    setUser(null);
  }

  async function incrementIdentificationCount() {
    const today = new Date().toDateString();
    const newCount = identificationCount + 1;
    setIdentificationCount(newCount);
    await AsyncStorage.setItem(
      "leaflens_id_count",
      JSON.stringify({ date: today, count: newCount })
    );
  }

  function canIdentify() {
    return identificationCount < DAILY_FREE_LIMIT;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        identificationCount,
        signIn,
        signInAsGuest,
        signOut,
        incrementIdentificationCount,
        canIdentify,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
