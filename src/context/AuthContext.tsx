import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Change this to your laptop's LAN IP ─────────────────────────────────────
// Find it by running `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
// e.g. 'http://192.168.1.6:3001'
const API_BASE = 'http://10.0.2.2:3001';
// ─────────────────────────────────────────────────────────────────────────────

interface User {
  username: string;
  name: string;
  email: string;
  points: number;
  highestGrade: string;
  membershipType?: string;   
  membershipExpiry?: string;
}
interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('authUser');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn('Failed to restore session', e);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Registration failed' };
      }

      // Persist token and user locally for session restore
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('authUser', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (e: any) {
      return { success: false, message: 'Could not reach server. Check your network.' };
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Login failed' };
      }

      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('authUser', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (e: any) {
      return { success: false, message: 'Could not reach server. Check your network.' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      if (user?.username) {
        const response = await fetch(`${API_BASE}/api/users/${user.username}`);
        const data = await response.json();
        if (data.success && data.user) {
          await AsyncStorage.setItem('authUser', JSON.stringify(data.user));
          setUser(data.user);
          return;
        }
      }
      
      const storedUser = await AsyncStorage.getItem('authUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed to refresh user', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
