import { airtableService, ActivityData, DailyStats } from './airtableService';
import { auth } from '../firebase';

interface AirtableRecord {
  fields: Record<string, any>;
  get: (field: string) => any;
}

interface AdminStats {
  dailyStats: {
    date: string;
    visits: number;
    downloads: number;
  }[];
  fileStats: {
    fileId: string;
    fileName: string;
    viewCount: number;
    downloadCount: number;
    firstViewed: string;
    lastViewed: string;
  }[];
  userStats: {
    userId: string;
    userName: string;
    loginCount: number;
    lastLogin: string;
    email: string;
  }[];
  deviceStats: {
    deviceType: string;
    count: number;
  }[];
  browserStats: {
    browser: string;
    count: number;
  }[];
}

interface AdminUser {
  email: string;
}

export class AnalyticsService {
  // 記錄用戶活動
  async logActivity(data: ActivityData): Promise<void> {
    try {
      console.log('開始記錄活動:', data);
      await airtableService.logActivity(data).catch(error => {
        console.warn('記錄活動失敗（非阻塞）:', error);
      });
    } catch (error) {
      console.warn('記錄活動時發生錯誤（非阻塞）:', error);
    }
  }

  // 檢查用戶是否為管理員
  async isAdmin(user: any): Promise<boolean> {
    if (!user) return false;
    const adminUsers = await airtableService.getAdminUsers();
    return adminUsers.includes(user.email);
  }

  // 獲取管理員統計數據
  async getAdminStats(): Promise<AdminStats> {
    try {
      // 並行獲取所有統計數據
      const [
        dailyStatsRaw,
        fileStats,
        userStats,
        deviceStats,
        browserStats
      ] = await Promise.all([
        airtableService.getDailyStats(),
        airtableService.getFileStats(),
        airtableService.getUserStats(),
        airtableService.getDeviceStats(),
        airtableService.getBrowserStats()
      ]);

      // 格式化每日統計
      const dailyStats = dailyStatsRaw.map(stat => ({
        date: stat.date,
        visits: 0, // 目前不統計訪問次數
        downloads: stat.downloads
      }));

      // 格式化文件統計
      const fileStatsFormatted = fileStats.map(stat => ({
        fileId: stat.fileName, // 使用文件名作為 ID
        fileName: stat.fileName,
        viewCount: 0, // 目前不統計瀏覽次數
        downloadCount: stat.downloadCount,
        firstViewed: '', // 目前不使用此欄位
        lastViewed: stat.lastAccessed // 使用 lastAccessed 欄位
      }));

      // 格式化用戶統計
      const userStatsFormatted = userStats.map(stat => ({
        userId: stat.email, // 使用 email 作為用戶 ID
        userName: stat.email.split('@')[0], // 使用 email 前綴作為用戶名
        loginCount: stat.loginCount,
        lastLogin: stat.lastLogin,
        email: stat.email
      }));

      // 格式化裝置統計
      const deviceStatsFormatted = deviceStats.map(stat => ({
        deviceType: stat.deviceType,
        count: stat.count
      }));

      // 格式化瀏覽器統計
      const browserStatsFormatted = browserStats.map(stat => ({
        browser: stat.browser,
        count: stat.count
      }));

      return {
        dailyStats,
        fileStats: fileStatsFormatted,
        userStats: userStatsFormatted,
        deviceStats: deviceStatsFormatted,
        browserStats: browserStatsFormatted
      };
    } catch (error) {
      console.error('獲取管理員統計數據失敗:', error);
      throw error;
    }
  }
}

// 導出單例實例
export const analyticsService = new AnalyticsService();
export default analyticsService; 