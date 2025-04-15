import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, isAdmin } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CategoryPage from './pages/CategoryPage';
import AdminStatsPage from './pages/AdminStatsPage';
import { AuthProvider } from './contexts/AuthContext';

// 受保護的路由組件
const ProtectedRoute: React.FC<{ element: React.ReactElement; requireAdmin?: boolean }> = ({ 
  element, 
  requireAdmin = false 
}) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('ProtectedRoute - 用戶狀態變更:', currentUser?.email);
      setUser(currentUser);
      
      if (!currentUser) {
        console.log('ProtectedRoute - 用戶未登錄');
        setAuthorized(false);
      } else if (requireAdmin) {
        console.log('ProtectedRoute - 檢查管理員權限');
        const adminStatus = await isAdmin(currentUser);
        console.log('ProtectedRoute - 管理員權限檢查結果:', adminStatus);
        setAuthorized(adminStatus);
      } else {
        console.log('ProtectedRoute - 普通用戶授權');
        setAuthorized(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [requireAdmin]);

  if (loading) {
    console.log('ProtectedRoute - 載入中...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    console.log('ProtectedRoute - 未授權，重定向到:', user ? '首頁' : '登錄頁');
    return <Navigate to={user ? '/' : '/login'} replace />;
  }

  console.log('ProtectedRoute - 已授權，渲染組件');
  return element;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
          <Route path="/" element={<ProtectedRoute element={<DashboardPage />} />} />
          <Route path="/category/:categoryName" element={<ProtectedRoute element={<CategoryPage />} />} />
          <Route path="/admin/stats" element={<ProtectedRoute element={<AdminStatsPage />} requireAdmin={true} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
