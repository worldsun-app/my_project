import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as firebaseAuth } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    console.log('設置 Firebase 認證監聽器');
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      console.log('認證狀態變更:', user?.email);
      setUser(user);
    });

    return () => {
      console.log('清理 Firebase 認證監聽器');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('嘗試登入:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('登入成功:', userCredential.user.email);
    } catch (error: any) {
      console.error('登入失敗:', error.code, error.message);
      throw error;
    }
  };

  const logout = async () => {
    console.log('嘗試登出');
    try {
      await signOut(firebaseAuth);
      console.log('登出成功');
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
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