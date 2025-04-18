import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth, isAdmin } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CategoryPage from './pages/CategoryPage';
import AdminStatsPage from './pages/AdminStatsPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// 受保護的路由組件
const ProtectedRoute: React.FC<{ element: React.ReactElement; requireAdmin?: boolean }> = ({ 
  element, 
  requireAdmin = false 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!user) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        if (requireAdmin) {
          const adminStatus = await isAdmin(user);
          setIsAuthorized(adminStatus);
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('驗證權限時出錯:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return element;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
