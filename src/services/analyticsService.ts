import { AirtableService } from './airtableService';
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
  private airtableService: AirtableService;

  constructor() {
    this.airtableService = new AirtableService();
  }

  async logActivity(action: string, metadata: Record<string, any> = {}) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userAgent = this.getUserAgent();
      const deviceType = this.getDeviceType();
      const browser = this.getBrowser();
      const screenSize = this.getScreenSize();

      const activityData = {
        userId: user.uid,
        userName: user.displayName || user.email,
        timestamp: new Date().toISOString(),
        action,
        ...metadata,
        deviceType,
        browser,
        screenSize,
        userAgent
      };

      await this.airtableService.logActivity(activityData);
    } catch (error) {
      console.error('記錄活動失敗:', error);
    }
  }

  private getUserAgent(): string {
    return navigator.userAgent;
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mobile')) return 'Mobile';
    if (userAgent.includes('tablet')) return 'Tablet';
    return 'Desktop';
  }

  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
    return 'Other';
  }

  private getScreenSize(): string {
    return `${window.innerWidth}x${window.innerHeight}`;
  }

  async isAdmin(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const adminUsers = await this.airtableService.getAdminUsers();
      return adminUsers.some((admin: AdminUser) => admin.email === user.email);
    } catch (error) {
      console.error('檢查管理員權限失敗:', error);
      return false;
    }
  }

  async getAdminStats(): Promise<AdminStats> {
    try {
      // 獲取過去 7 天的數據
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 獲取每日統計
      const dailyStats = await this.airtableService.getDailyStats(startDate, endDate);

      // 獲取文件統計
      const fileStats = await this.airtableService.getFileStats();

      // 獲取用戶統計
      const userStats = await this.airtableService.getUserStats();

      // 獲取裝置統計
      const deviceStats = await this.airtableService.getDeviceStats();

      // 獲取瀏覽器統計
      const browserStats = await this.airtableService.getBrowserStats();

      return {
        dailyStats,
        fileStats,
        userStats,
        deviceStats,
        browserStats
      };
    } catch (error) {
      console.error('獲取管理員統計數據失敗:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService(); 