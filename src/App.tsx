import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './services/auth';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CategoryPage from './pages/CategoryPage';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    // 清理訂閱
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

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
        {user ? (
          <div>
            <nav className="bg-white shadow">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold">財經資訊平台</h1>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-4 text-gray-600">{user.email}</span>
                    <button
                      onClick={handleLogout}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      登出
                    </button>
                  </div>
                </div>
              </div>
            </nav>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </AuthProvider>
    </Router>
  );
}

export default App;
