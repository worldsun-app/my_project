import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as firebaseAuth } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('初始化 Firebase 認證監聽器');
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      console.log('認證狀態變更:', currentUser?.email);
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      console.log('清理 Firebase 認證監聽器');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('嘗試登入:', email);
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('登入成功:', userCredential.user.email);
      setUser(userCredential.user);
    } catch (error: any) {
      console.error('登入失敗:', error.code, error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('嘗試登出');
    try {
      setLoading(true);
      await signOut(firebaseAuth);
      console.log('登出成功');
      setUser(null);
      // 清除本地存儲的認證信息
      localStorage.removeItem('firebase:authUser:' + firebaseAuth.config.apiKey + ':[DEFAULT]');
      sessionStorage.removeItem('firebase:authUser:' + firebaseAuth.config.apiKey + ':[DEFAULT]');
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading
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