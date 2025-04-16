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
      await this.base('Activities').create({
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
      const records = await this.base('Daily')
        .select({
          sort: [{ field: 'Date', direction: 'desc' }],
          maxRecords: 30
        })
        .all();

      return records.map(record => ({
        date: record.get('Date') as string,
        downloads: record.get('Downloads') as number || 0,
        logins: record.get('Logins') as number || 0
      }));
    } catch (error) {
      console.error('獲取每日統計失敗:', error);
      return [];
    }
  }

  // 獲取文件統計
  async getFileStats(): Promise<FileStats[]> {
    try {
      const records = await this.base('Files')
        .select({
          sort: [{ field: 'Download Count', direction: 'desc' }],
          maxRecords: 10
        })
        .all();

      return records.map(record => ({
        fileName: record.get('File Name') as string,
        downloadCount: record.get('Download Count') as number || 0,
        lastDownloaded: record.get('Last Downloaded') as string
      }));
    } catch (error) {
      console.error('獲取文件統計失敗:', error);
      return [];
    }
  }

  // 獲取用戶統計
  async getUserStats(): Promise<UserStats[]> {
    try {
      const records = await this.base('Users')
        .select({
          sort: [{ field: 'Last Login', direction: 'desc' }],
          maxRecords: 10
        })
        .all();

      return records.map(record => ({
        email: record.get('User Email') as string,
        lastLogin: record.get('Last Login') as string,
        loginCount: record.get('Login Count') as number || 0
      }));
    } catch (error) {
      console.error('獲取用戶統計失敗:', error);
      return [];
    }
  }

  // 獲取裝置統計
  async getDeviceStats(): Promise<DeviceStats[]> {
    try {
      const records = await this.base('Devices')
        .select({
          sort: [{ field: 'Count', direction: 'desc' }]
        })
        .all();

      return records.map(record => ({
        deviceType: record.get('Device Type') as string,
        count: record.get('Count') as number || 0
      }));
    } catch (error) {
      console.error('獲取裝置統計失敗:', error);
      return [];
    }
  }

  // 獲取瀏覽器統計
  async getBrowserStats(): Promise<BrowserStats[]> {
    try {
      const records = await this.base('Browsers')
        .select({
          sort: [{ field: 'Count', direction: 'desc' }]
        })
        .all();

      return records.map(record => ({
        browser: record.get('Browser') as string,
        count: record.get('Count') as number || 0
      }));
    } catch (error) {
      console.error('獲取瀏覽器統計失敗:', error);
      return [];
    }
  }

  // 獲取管理員用戶列表
  async getAdminUsers(): Promise<string[]> {
    try {
      const records = await this.base('Admins')
        .select()
        .all();

      return records.map(record => record.get('Email') as string);
    } catch (error) {
      console.error('獲取管理員用戶列表失敗:', error);
      return [];
    }
  }

  // 更新文件統計
  public async updateFileStats(fileName: string): Promise<void> {
    try {
      console.log('開始更新文件統計:', fileName);
      const records = await this.base('Files')
        .select({
          filterByFormula: `{File Name} = '${fileName}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentCount = (record.get('Download Count') as number) || 0;
        console.log('當前下載次數:', currentCount);
        await this.base('Files').update(record.id, {
          'Download Count': currentCount + 1,
          'Last Downloaded': new Date().toISOString()
        });
        console.log('文件統計更新成功');
      } else {
        console.log('創建新的文件統計記錄');
        await this.base('Files').create({
          'File Name': fileName,
          'Download Count': 1,
          'Last Downloaded': new Date().toISOString()
        });
        console.log('新的文件統計記錄創建成功');
      }
    } catch (error) {
      console.error('更新文件統計失敗:', error);
      throw error;
    }
  }

  // 更新每日統計
  public async updateDailyStats(): Promise<void> {
    try {
      console.log('開始更新每日統計');
      const today = new Date().toISOString().split('T')[0];
      const records = await this.base('Daily')
        .select({
          filterByFormula: `{Date} = '${today}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentDownloads = (record.get('Downloads') as number) || 0;
        console.log('當前每日下載次數:', currentDownloads);
        await this.base('Daily').update(record.id, {
          'Downloads': currentDownloads + 1
        });
        console.log('每日統計更新成功');
      } else {
        console.log('創建新的每日統計記錄');
        await this.base('Daily').create({
          'Date': today,
          'Downloads': 1,
          'Logins': 0
        });
        console.log('新的每日統計記錄創建成功');
      }
    } catch (error) {
      console.error('更新每日統計失敗:', error);
      throw error;
    }
  }
}

// 導出單例實例
export const airtableService = new AirtableService(); 