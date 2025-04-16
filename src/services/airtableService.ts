import Airtable from 'airtable';

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

interface UserStats {
  userId: string;
  userName: string;
  loginCount: number;
  lastLogin: string;
}

interface DeviceStats {
  deviceType: string;
  count: number;
}

interface BrowserStats {
  browser: string;
  count: number;
}

interface AdminUser {
  email: string;
}

interface ActivityData {
  userId: string;
  userName: string;
  timestamp: string;
  action: string;
  deviceType: string;
  browser: string;
  screenSize: string;
  userAgent: string;
  [key: string]: any;
}

export class AirtableService {
  private base: any;

  constructor() {
    Airtable.configure({
      apiKey: import.meta.env.VITE_AIRTABLE_API_KEY
    });
    this.base = Airtable.base(import.meta.env.VITE_AIRTABLE_BASE_ID);
  }

  async logActivity(activityData: ActivityData): Promise<void> {
    try {
      await this.base('Activity_Logs').create(activityData);

      // 如果是文件操作，更新文件統計
      if (activityData.action === 'file_open' && activityData.fileId) {
        await this.updateFileStats(activityData.fileId);
      }

      // 更新每日統計
      await this.updateDailyStats();
    } catch (error) {
      console.error('記錄活動失敗:', error);
      throw error;
    }
  }

  private async updateFileStats(fileId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const records = await this.base('File_Stats')
        .select({
          filterByFormula: `{fileId} = '${fileId}'`
        })
        .firstPage();

      if (records && records.length > 0) {
        await this.base('File_Stats').update([
          {
            id: records[0].id,
            fields: {
              viewCount: (records[0].fields.viewCount || 0) + 1,
              lastViewed: today
            }
          }
        ]);
      } else {
        await this.base('File_Stats').create([
          {
            fields: {
              fileId: fileId,
              viewCount: 1,
              lastViewed: today,
              firstViewed: today
            }
          }
        ]);
      }
    } catch (error) {
      console.error('更新文件統計失敗:', error);
      throw error;
    }
  }

  private async updateDailyStats(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const records = await this.base('Daily_Stats')
        .select({
          filterByFormula: `{date} = '${today}'`
        })
        .firstPage();

      if (records && records.length > 0) {
        await this.base('Daily_Stats').update([
          {
            id: records[0].id,
            fields: {
              visits: (records[0].fields.visits || 0) + 1
            }
          }
        ]);
      } else {
        await this.base('Daily_Stats').create([
          {
            fields: {
              date: today,
              visits: 1,
              downloads: 0
            }
          }
        ]);
      }
    } catch (error) {
      console.error('更新每日統計失敗:', error);
      throw error;
    }
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    try {
      const records = await this.base('Admin_Users')
        .select()
        .all();

      return records.map((record: any) => ({
        email: record.get('email')
      }));
    } catch (error) {
      console.error('獲取管理員用戶失敗:', error);
      return [];
    }
  }

  async getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
    try {
      const records = await this.base('Daily_Stats')
        .select({
          filterByFormula: `AND(
            {date} >= '${startDate}',
            {date} <= '${endDate}'
          )`,
          sort: [{ field: 'date', direction: 'asc' }]
        })
        .all();

      return records.map((record: any) => ({
        date: record.get('date'),
        visits: record.get('visits') || 0,
        downloads: record.get('downloads') || 0
      }));
    } catch (error) {
      console.error('獲取每日統計失敗:', error);
      return [];
    }
  }

  async getFileStats(): Promise<FileStats[]> {
    try {
      const records = await this.base('File_Stats')
        .select({
          sort: [{ field: 'downloadCount', direction: 'desc' }]
        })
        .all();

      return records.map((record: any) => ({
        fileId: record.get('fileId'),
        fileName: record.get('fileName'),
        viewCount: record.get('viewCount') || 0,
        downloadCount: record.get('downloadCount') || 0,
        firstViewed: record.get('firstViewed'),
        lastViewed: record.get('lastViewed')
      }));
    } catch (error) {
      console.error('獲取文件統計失敗:', error);
      return [];
    }
  }

  async getUserStats(): Promise<UserStats[]> {
    try {
      const records = await this.base('User_Stats')
        .select({
          sort: [{ field: 'lastLogin', direction: 'desc' }]
        })
        .all();

      return records.map((record: any) => ({
        userId: record.get('userId'),
        userName: record.get('userName'),
        loginCount: record.get('loginCount') || 0,
        lastLogin: record.get('lastLogin')
      }));
    } catch (error) {
      console.error('獲取用戶統計失敗:', error);
      return [];
    }
  }

  async getDeviceStats(): Promise<DeviceStats[]> {
    try {
      const records = await this.base('Device_Stats')
        .select({
          sort: [{ field: 'count', direction: 'desc' }]
        })
        .all();

      return records.map((record: any) => ({
        deviceType: record.get('deviceType'),
        count: record.get('count') || 0
      }));
    } catch (error) {
      console.error('獲取裝置統計失敗:', error);
      return [];
    }
  }

  async getBrowserStats(): Promise<BrowserStats[]> {
    try {
      const records = await this.base('Browser_Stats')
        .select({
          sort: [{ field: 'count', direction: 'desc' }]
        })
        .all();

      return records.map((record: any) => ({
        browser: record.get('browser'),
        count: record.get('count') || 0
      }));
    } catch (error) {
      console.error('獲取瀏覽器統計失敗:', error);
      return [];
    }
  }
} 