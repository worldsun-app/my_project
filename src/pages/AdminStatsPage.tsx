import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface DailyStats {
  date: string;
  visits: number;
  downloads: number;
}

interface FileStats {
  fileId: string;
  fileName: string;
  viewCount: number;
  downloadCount: number;
  firstViewed: string;
  lastViewed: string;
}

interface DeviceStats {
  deviceType: string;
  count: number;
}

interface BrowserStats {
  browser: string;
  count: number;
}

interface UserStats {
  userId: string;
  userName: string;
  loginCount: number;
  lastLogin: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [fileStats, setFileStats] = useState<FileStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
  const [browserStats, setBrowserStats] = useState<BrowserStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [weeklyDownloads, setWeeklyDownloads] = useState(0);
  const [totalLogins, setTotalLogins] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        const stats = await analyticsService.getAdminStats();
        
        // 處理每日統計
        const dailyData = stats.dailyStats.map(stat => ({
          date: stat.date,
          visits: stat.visits,
          downloads: stat.downloads || 0
        }));
        setDailyStats(dailyData);

        // 處理文件統計
        const fileData = stats.fileStats.map(stat => ({
          fileId: stat.fileId,
          fileName: stat.fileName,
          viewCount: stat.viewCount,
          downloadCount: stat.downloadCount || 0,
          firstViewed: new Date(stat.firstViewed).toLocaleString(),
          lastViewed: new Date(stat.lastViewed).toLocaleString()
        }));
        setFileStats(fileData);

        // 處理裝置統計
        const deviceData = stats.deviceStats.map(stat => ({
          deviceType: stat.deviceType,
          count: stat.count
        }));
        setDeviceStats(deviceData);

        // 處理瀏覽器統計
        const browserData = stats.browserStats.map(stat => ({
          browser: stat.browser,
          count: stat.count
        }));
        setBrowserStats(browserData);

        // 處理用戶統計
        const userData = stats.userStats.map(stat => ({
          userId: stat.userId,
          userName: stat.userName,
          loginCount: stat.loginCount,
          lastLogin: new Date(stat.lastLogin).toLocaleString()
        }));
        setUserStats(userData);

        // 計算總下載次數
        const total = fileData.reduce((sum, file) => sum + file.downloadCount, 0);
        setTotalDownloads(total);

        // 計算近一周下載次數
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekly = fileData
          .filter(file => new Date(file.lastViewed) >= oneWeekAgo)
          .reduce((sum, file) => sum + file.downloadCount, 0);
        setWeeklyDownloads(weekly);

        // 計算總登入次數
        const logins = userData.reduce((sum, user) => sum + user.loginCount, 0);
        setTotalLogins(logins);

      } catch (error) {
        console.error('載入統計數據失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>載入統計數據中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理員統計</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回主頁
          </button>
        </div>

        {/* 統計概覽 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">累計下載次數</h3>
            <p className="text-3xl font-bold text-blue-600">{totalDownloads}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">近一周下載次數</h3>
            <p className="text-3xl font-bold text-green-600">{weeklyDownloads}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">用戶登入次數</h3>
            <p className="text-3xl font-bold text-purple-600">{totalLogins}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">活躍用戶數</h3>
            <p className="text-3xl font-bold text-orange-600">{userStats.length}</p>
          </div>
        </div>

        {/* 每日下載統計圖表 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">每日下載統計</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="downloads" name="下載次數" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 熱門文件 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">熱門文件</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件名稱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下載次數</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">瀏覽次數</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最後訪問時間</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fileStats
                  .sort((a, b) => b.downloadCount - a.downloadCount)
                  .slice(0, 10)
                  .map((file) => (
                    <tr key={file.fileId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.fileName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.downloadCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.viewCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.lastViewed}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 近期登入用戶 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">近期登入用戶</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶名稱</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登入次數</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最後登入時間</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userStats
                  .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
                  .slice(0, 10)
                  .map((user) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.loginCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.lastLogin}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsPage; 