import { airtableService } from './airtableService';
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
  async logActivity(
    userId: string,
    userEmail: string,
    action: string,
    details: string,
    deviceInfo?: string,
    browserInfo?: string
  ): Promise<void> {
    try {
      await airtableService.logActivity({
        userId,
        userEmail,
        action,
        details,
        timestamp: new Date().toISOString(),
        deviceInfo,
        browserInfo
      });
    } catch (error) {
      console.error('記錄活動失敗:', error);
    }
  }

  // 檢查用戶是否為管理員
  async isAdmin(user: any): Promise<boolean> {
    if (!user) return false;
    const adminUsers = await airtableService.getAdminUsers();
    return adminUsers.includes(user.email);
  }

  // 獲取管理員統計數據
  async getAdminStats(): Promise<{
    dailyStats: any[];
    fileStats: any[];
    userStats: any[];
    deviceStats: any[];
    browserStats: any[];
  }> {
    try {
      const [
        dailyStats,
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

      return {
        dailyStats,
        fileStats,
        userStats,
        deviceStats,
        browserStats
      };
    } catch (error) {
      console.error('獲取管理員統計數據失敗:', error);
      return {
        dailyStats: [],
        fileStats: [],
        userStats: [],
        deviceStats: [],
        browserStats: []
      };
    }
  }
}

export default new AnalyticsService(); 