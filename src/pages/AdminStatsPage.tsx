import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../firebase';

const AdminStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      const adminStatus = await isAdmin(user);
      if (!adminStatus) {
        navigate('/');
        return;
      }

      setIsAdminUser(true);
      setIsLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">管理員統計</h1>
        
        {/* 這裡可以添加統計圖表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 每日訪問量 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">每日訪問量</h2>
            {/* 添加折線圖 */}
          </div>

          {/* 最受歡迎文件 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">最受歡迎文件</h2>
            {/* 添加柱狀圖 */}
          </div>

          {/* 設備分佈 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">設備分佈</h2>
            {/* 添加餅圖 */}
          </div>

          {/* 瀏覽器分佈 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">瀏覽器分佈</h2>
            {/* 添加餅圖 */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsPage; 