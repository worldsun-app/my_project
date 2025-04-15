import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analyticsService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface DailyStat {
  date: string;
  visitCount: number;
}

interface FileStat {
  fileId: string;
  fileName: string;
  viewCount: number;
}

interface DeviceStat {
  deviceType: string;
  count: number;
}

interface BrowserStat {
  browser: string;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [fileStats, setFileStats] = useState<FileStat[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStat[]>([]);
  const [browserStats, setBrowserStats] = useState<BrowserStat[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const adminStatus = await analyticsService.isAdmin(user.email || '');
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          navigate('/');
        } else {
          // 获取统计数据
          const stats = await analyticsService.getDailyStats();
          setDailyStats(stats);
          
          const fileStats = await analyticsService.getFileStats();
          setFileStats(fileStats);
          
          const deviceStats = await analyticsService.getDeviceStats();
          setDeviceStats(deviceStats);
          
          const browserStats = await analyticsService.getBrowserStats();
          setBrowserStats(browserStats);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">管理統計</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 每日訪問統計 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">每日訪問統計</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visitCount" fill="#8884d8" name="訪問次數" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 熱門文件 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">熱門文件</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fileStats.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="fileName" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="viewCount" fill="#82ca9d" name="查看次數" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 設備分佈 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">設備分佈</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceStats}
                    dataKey="count"
                    nameKey="deviceType"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {deviceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 瀏覽器分佈 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">瀏覽器分佈</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={browserStats}
                    dataKey="count"
                    nameKey="browser"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {browserStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsPage; 