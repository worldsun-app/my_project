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

interface AirtableError {
  error: string;
  message: string;
  statusCode: number;
  url?: string;
}

export class AirtableService {
  private base: Airtable.Base;

  constructor() {
    this.base = new Airtable({
      apiKey: import.meta.env.VITE_AIRTABLE_API_KEY
    }).base(import.meta.env.VITE_AIRTABLE_BASE_ID);
    
    console.log('Airtable 服務初始化完成');
    console.log('Base ID:', import.meta.env.VITE_AIRTABLE_BASE_ID);
  }

  // 記錄用戶活動
  async logActivity(data: ActivityData): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log(`嘗試記錄活動 (第 ${retryCount + 1} 次):`, {
          'User ID': data.userId,
          'User Email': data.userEmail,
          'Action': data.action,
          'Details': data.details,
          'Timestamp': data.timestamp,
          'Device Info': data.deviceInfo,
          'Browser Info': data.browserInfo
        });
        
        const result = await this.base('Activity_Logs').create({
          'User ID': data.userId,
          'User Email': data.userEmail,
          'Action': data.action,
          'Details': data.details,
          'Timestamp': data.timestamp,
          'Device Info': data.deviceInfo,
          'Browser Info': data.browserInfo
        });
        
        console.log('活動記錄成功:', result);
        return;
      } catch (error) {
        const airtableError = error as AirtableError;
        console.error(`記錄活動失敗 (第 ${retryCount + 1} 次):`, {
          error: airtableError.error,
          message: airtableError.message,
          statusCode: airtableError.statusCode
        });

        if (airtableError.statusCode === 403) {
          console.error('權限錯誤，請檢查 API Key 權限設置');
          // 如果是權限錯誤，不需要重試
          break;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          // 等待一段時間後重試
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
      }
    }

    // 如果所有重試都失敗，記錄警告但不中斷操作
    console.warn('活動記錄失敗，但操作將繼續進行');
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
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log(`嘗試獲取用戶統計 (第 ${retryCount + 1} 次)`);
        console.log('查詢參數:', {
          sort: [{ field: 'last_login', direction: 'desc' }],
          maxRecords: 10
        });
        
        const records = await this.base('User_Stats')
          .select({
            sort: [{ field: 'last_login', direction: 'desc' }],
            maxRecords: 10
          })
          .all();

        console.log('成功獲取用戶統計記錄:', records.length, '條');
        console.log('記錄示例:', records[0] ? {
          email: records[0].get('email'),
          lastLogin: records[0].get('last_login'),
          loginCount: records[0].get('login_count')
        } : '無記錄');

        return records.map(record => ({
          email: record.get('email') as string,
          lastLogin: record.get('last_login') as string,
          loginCount: record.get('login_count') as number || 0
        }));
      } catch (error) {
        const airtableError = error as AirtableError;
        console.error(`獲取用戶統計失敗 (第 ${retryCount + 1} 次):`, {
          error: airtableError.error,
          message: airtableError.message,
          statusCode: airtableError.statusCode,
          url: airtableError.url
        });

        if (airtableError.statusCode === 403) {
          console.error('權限錯誤，請檢查 API Key 權限設置');
          console.error('建議檢查：');
          console.error('1. API Key 是否有對 User_Stats 表格的讀取權限');
          console.error('2. 表格名稱是否正確（大小寫敏感）');
          console.error('3. 欄位名稱是否正確（last_login, email, login_count）');
          break;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
      }
    }

    console.warn('獲取用戶統計失敗，返回空數據');
    return [];
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
  public async updateFileStats(fileName: string): Promise<void> {
    try {
      console.log('開始更新文件統計:', fileName);
      const records = await this.base('File_Stats')
        .select({
          filterByFormula: `{file_name} = '${fileName}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentCount = (record.get('download_count') as number) || 0;
        console.log('當前下載次數:', currentCount);
        await this.base('File_Stats').update(record.id, {
          'download_count': currentCount + 1,
          'last_downloaded': new Date().toISOString()
        });
        console.log('文件統計更新成功');
      } else {
        console.log('創建新的文件統計記錄');
        await this.base('File_Stats').create({
          'file_name': fileName,
          'download_count': 1,
          'last_downloaded': new Date().toISOString()
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
      const records = await this.base('Daily_Stats')
        .select({
          filterByFormula: `{date} = '${today}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentDownloads = (record.get('downloads') as number) || 0;
        console.log('當前每日下載次數:', currentDownloads);
        await this.base('Daily_Stats').update(record.id, {
          'downloads': currentDownloads + 1
        });
        console.log('每日統計更新成功');
      } else {
        console.log('創建新的每日統計記錄');
        await this.base('Daily_Stats').create({
          'date': today,
          'downloads': 1,
          'logins': 0
        });
        console.log('新的每日統計記錄創建成功');
      }
    } catch (error) {
      console.error('更新每日統計失敗:', error);
      throw error;
    }
  }

  // 測試所有表格的可訪問性
  async testTableAccess(): Promise<void> {
    const tables = [
      'Activity_Logs',
      'User_Stats',
      'File_Stats',
      'Daily_Stats',
      'Device_Stats',
      'Browser_Stats',
      'Admin_Users'
    ];

    console.log('開始測試表格可訪問性...');
    
    for (const table of tables) {
      try {
        console.log(`測試表格 ${table}...`);
        const records = await this.base(table)
          .select({
            maxRecords: 1
          })
          .all();
        
        console.log(`表格 ${table} 可訪問，記錄數: ${records.length}`);
        if (records.length > 0) {
          console.log(`表格 ${table} 示例記錄:`, records[0].fields);
        }
      } catch (error) {
        const airtableError = error as AirtableError;
        console.error(`表格 ${table} 訪問失敗:`, {
          error: airtableError.error,
          message: airtableError.message,
          statusCode: airtableError.statusCode
        });
      }
    }
    
    console.log('表格可訪問性測試完成');
  }
}

// 導出單例實例
export const airtableService = new AirtableService(); 