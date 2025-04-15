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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setAuthorized(false);
      } else if (requireAdmin) {
        setAuthorized(isAdmin(user));
      } else {
        setAuthorized(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [requireAdmin]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">載入中...</div>;
  }

  return authorized ? element : <Navigate to={authorized ? '/' : '/login'} replace />;
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
