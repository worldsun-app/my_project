import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as firebaseAuth } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
      setIsAuthenticating(true);
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('登入成功:', userCredential.user.email);
      // 不需要手動設置 user，因為 onAuthStateChanged 會處理
    } catch (error: any) {
      console.error('登入失敗:', error.code, error.message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    console.log('嘗試登出');
    try {
      setIsAuthenticating(true);
      await signOut(firebaseAuth);
      console.log('登出成功');
      // 不需要手動設置 user，因為 onAuthStateChanged 會處理
      
      // 清除本地存儲的認證信息
      localStorage.removeItem('firebase:authUser:' + firebaseAuth.config.apiKey + ':[DEFAULT]');
      sessionStorage.removeItem('firebase:authUser:' + firebaseAuth.config.apiKey + ':[DEFAULT]');
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticating
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>初始化中...</p>
        </div>
      </div>
    );
  }

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