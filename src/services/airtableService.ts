import Airtable from 'airtable';

// 定義統計數據接口
export interface DailyStats {
  date: string;
  downloads: number;
  logins: number;
}

export interface FileStats {
  fileName: string;
  downloadCount: number;
  lastDownloaded: string;
}

export interface UserStats {
  email: string;
  lastLogin: string;
  loginCount: number;
}

export interface DeviceStats {
  deviceType: string;
  count: number;
}

export interface BrowserStats {
  browser: string;
  count: number;
}

export interface AdminUser {
  email: string;
}

export interface ActivityData {
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  deviceInfo?: string;
  browserInfo?: string;
}

export class AirtableService {
  private base: Airtable.Base;

  constructor() {
    this.base = new Airtable({
      apiKey: import.meta.env.VITE_AIRTABLE_API_KEY
    }).base(import.meta.env.VITE_AIRTABLE_BASE_ID);
  }

  // 記錄用戶活動
  async logActivity(data: ActivityData): Promise<void> {
    try {
      await this.base('Activity_Logs').create({
        'User ID': data.userId,
        'User Email': data.userEmail,
        'Action': data.action,
        'Details': data.details,
        'Timestamp': data.timestamp,
        'Device Info': data.deviceInfo,
        'Browser Info': data.browserInfo
      });
    } catch (error) {
      console.error('記錄活動失敗:', error);
      throw error;
    }
  }

  // 獲取每日統計
  async getDailyStats(): Promise<DailyStats[]> {
    try {
      const records = await this.base('Daily_Stats')
        .select({
          sort: [{ field: 'date', direction: 'desc' }],
          maxRecords: 30
        })
        .all();

      return records.map(record => ({
        date: record.get('date') as string,
        downloads: record.get('downloads') as number || 0,
        logins: record.get('logins') as number || 0
      }));
    } catch (error) {
      console.error('獲取每日統計失敗:', error);
      return [];
    }
  }

  // 獲取文件統計
  async getFileStats(): Promise<FileStats[]> {
    try {
      const records = await this.base('File_Stats')
        .select({
          sort: [{ field: 'download_count', direction: 'desc' }],
          maxRecords: 10
        })
        .all();

      return records.map(record => ({
        fileName: record.get('file_name') as string,
        downloadCount: record.get('download_count') as number || 0,
        lastDownloaded: record.get('last_downloaded') as string
      }));
    } catch (error) {
      console.error('獲取文件統計失敗:', error);
      return [];
    }
  }

  // 獲取用戶統計
  async getUserStats(): Promise<UserStats[]> {
    try {
      const records = await this.base('User_Stats')
        .select({
          sort: [{ field: 'last_login', direction: 'desc' }],
          maxRecords: 10
        })
        .all();

      return records.map(record => ({
        email: record.get('email') as string,
        lastLogin: record.get('last_login') as string,
        loginCount: record.get('login_count') as number || 0
      }));
    } catch (error) {
      console.error('獲取用戶統計失敗:', error);
      return [];
    }
  }

  // 獲取裝置統計
  async getDeviceStats(): Promise<DeviceStats[]> {
    try {
      const records = await this.base('Device_Stats')
        .select({
          sort: [{ field: 'count', direction: 'desc' }]
        })
        .all();

      return records.map(record => ({
        deviceType: record.get('device_type') as string,
        count: record.get('count') as number || 0
      }));
    } catch (error) {
      console.error('獲取裝置統計失敗:', error);
      return [];
    }
  }

  // 獲取瀏覽器統計
  async getBrowserStats(): Promise<BrowserStats[]> {
    try {
      const records = await this.base('Browser_Stats')
        .select({
          sort: [{ field: 'count', direction: 'desc' }]
        })
        .all();

      return records.map(record => ({
        browser: record.get('browser') as string,
        count: record.get('count') as number || 0
      }));
    } catch (error) {
      console.error('獲取瀏覽器統計失敗:', error);
      return [];
    }
  }

  // 獲取管理員用戶列表
  async getAdminUsers(): Promise<string[]> {
    try {
      const records = await this.base('Admin_Users')
        .select()
        .all();

      return records.map(record => record.get('email') as string);
    } catch (error) {
      console.error('獲取管理員用戶列表失敗:', error);
      return [];
    }
  }

  // 更新文件統計
  private async updateFileStats(fileName: string): Promise<void> {
    try {
      const records = await this.base('File_Stats')
        .select({
          filterByFormula: `{file_name} = '${fileName}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentCount = (record.get('download_count') as number) || 0;
        await this.base('File_Stats').update(record.id, {
          'download_count': currentCount + 1,
          'last_downloaded': new Date().toISOString()
        });
      } else {
        await this.base('File_Stats').create({
          'file_name': fileName,
          'download_count': 1,
          'last_downloaded': new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('更新文件統計失敗:', error);
    }
  }

  // 更新每日統計
  private async updateDailyStats(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = await this.base('Daily_Stats')
        .select({
          filterByFormula: `{date} = '${today}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentDownloads = (record.get('downloads') as number) || 0;
        await this.base('Daily_Stats').update(record.id, {
          'downloads': currentDownloads + 1
        });
      } else {
        await this.base('Daily_Stats').create({
          'date': today,
          'downloads': 1,
          'logins': 0
        });
      }
    } catch (error) {
      console.error('更新每日統計失敗:', error);
    }
  }
}

// 導出單例實例
export const airtableService = new AirtableService(); 