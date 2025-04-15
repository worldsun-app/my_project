import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, isAdmin } from '../firebase';
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
import { format, subDays } from 'date-fns';
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

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  action: string;
  fileId?: string;
  fileName?: string;
}

interface FileStats {
  fileId: string;
  fileName: string;
  viewCount: number;
}

interface DailyStats {
  date: string;
  visitCount: number;
}

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [fileStats, setFileStats] = useState<FileStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [monthlyDownloads, setMonthlyDownloads] = useState(0);

  // 檢查管理員權限
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      if (!isAdmin(user)) {
        navigate('/', { replace: true });
        return;
      }

      fetchData();
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchData = async () => {
    try {
      // 獲取 Airtable 數據
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stats`, {
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      
      // 更新狀態
      setActivityLogs(data.activityLogs);
      setFileStats(data.fileStats);
      setDailyStats(data.dailyStats);
      setTotalUsers(data.totalUsers);
      setActiveUsers(data.activeUsers);
      setMonthlyDownloads(data.monthlyDownloads);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // 處理圖表數據
  const dailyVisits = {
    labels: dailyStats.map(stat => format(new Date(stat.date), 'MM/dd', { locale: zhTW })),
    datasets: [
      {
        label: '每日訪問量',
        data: dailyStats.map(stat => stat.visitCount),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  };

  const fileDownloads = {
    labels: fileStats.map(stat => stat.fileName),
    datasets: [
      {
        label: '檔案下載次數',
        data: fileStats.map(stat => stat.viewCount),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">載入中...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">管理員統計數據</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 每日訪問量圖表 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">每日訪問量</h2>
          <Line data={dailyVisits} />
        </div>

        {/* 檔案下載統計圖表 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">熱門檔案下載統計</h2>
          <Bar data={fileDownloads} />
        </div>

        {/* 用戶數據摘要 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">用戶數據摘要</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
              <div className="text-gray-600">總用戶數</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
              <div className="text-gray-600">本週活躍用戶</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">{monthlyDownloads}</div>
              <div className="text-gray-600">本月下載次數</div>
            </div>
          </div>
        </div>

        {/* 最近活動日誌 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">最近活動日誌</h2>
          <div className="space-y-2">
            {activityLogs.slice(0, 5).map((log) => (
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
  );
};

export default StatsPage; 