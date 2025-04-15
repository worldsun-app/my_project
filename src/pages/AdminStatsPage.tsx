import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../firebase';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from 'chart.js';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 註冊 ChartJS 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
);

interface Stats {
  activityLogs: Array<{
    id: string;
    userId: string;
    userName: string;
    timestamp: string;
    action: string;
    fileId?: string;
    fileName?: string;
  }>;
  fileStats: Array<{
    fileId: string;
    fileName: string;
    viewCount: number;
  }>;
  dailyStats: Array<{
    date: string;
    visitCount: number;
  }>;
  totalUsers: number;
  activeUsers: number;
  monthlyDownloads: number;
}

const AdminStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      fetchStats();
    };

    checkAdmin();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stats`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error instanceof Error ? error.message : '獲取統計數據時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => fetchStats()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">
          <p>無可用數據</p>
        </div>
      </div>
    );
  }

  const dailyVisits = {
    labels: stats.dailyStats.map(stat => format(new Date(stat.date), 'MM/dd', { locale: zhTW })),
    datasets: [
      {
        label: '每日訪問量',
        data: stats.dailyStats.map(stat => stat.visitCount),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  };

  const fileDownloads = {
    labels: stats.fileStats.map(stat => stat.fileName),
    datasets: [
      {
        label: '檔案瀏覽次數',
        data: stats.fileStats.map(stat => stat.viewCount),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">管理員統計</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 每日訪問量 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">每日訪問量</h2>
            <Line data={dailyVisits} />
          </div>

          {/* 最受歡迎文件 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">最受歡迎文件</h2>
            <Bar data={fileDownloads} />
          </div>

          {/* 用戶數據摘要 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">用戶數據摘要</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-gray-600">總用戶數</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                <div className="text-gray-600">本週活躍用戶</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">{stats.monthlyDownloads}</div>
                <div className="text-gray-600">本月下載次數</div>
              </div>
            </div>
          </div>

          {/* 最近活動日誌 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">最近活動日誌</h2>
            <div className="space-y-2">
              {stats.activityLogs.map((log) => (
                <div key={log.id} className="p-2 hover:bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">
                    {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm')}
                  </div>
                  <div>
                    用戶 {log.userName} {log.action}
                    {log.fileName && ` "${log.fileName}"`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsPage; 