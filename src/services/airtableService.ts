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
        
        // 1. 記錄到 Activity_Logs
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

        // 2. 更新用戶統計（無論是登入還是文件操作）
        await this.updateUserStats(data.userEmail);

        // 3. 更新文件統計
        if (data.action === 'download' || data.action === 'view') {
          const fileName = data.details.split(':')[1]?.trim();
          if (fileName) {
            await this.updateFileStats(fileName);
          }
        }

        // 4. 更新每日統計
        await this.updateDailyStats();

        // 5. 更新設備統計
        if (data.deviceInfo) {
          await this.updateDeviceStats(data.deviceInfo);
        }

        // 6. 更新瀏覽器統計
        if (data.browserInfo) {
          await this.updateBrowserStats(data.browserInfo);
        }

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
          break;
        }

        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
      }
    }

    console.warn('活動記錄失敗，但操作將繼續進行');
  }

  // 更新用戶統計
  private async updateUserStats(email: string): Promise<void> {
    try {
      console.log('開始更新用戶統計:', email);
      const records = await this.base('User_Stats')
        .select({
          filterByFormula: `{email} = '${email}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentCount = (record.get('login_count') as number) || 0;
        console.log('當前登入次數:', currentCount);
        await this.base('User_Stats').update(record.id, {
          'login_count': currentCount + 1,
          'last_login': new Date().toISOString()
        });
        console.log('用戶統計更新成功');
      } else {
        console.log('創建新的用戶統計記錄');
        await this.base('User_Stats').create({
          'email': email,
          'login_count': 1,
          'last_login': new Date().toISOString()
        });
        console.log('新的用戶統計記錄創建成功');
      }
    } catch (error) {
      console.error('更新用戶統計失敗:', error);
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

      return records.map(record => {
        const fileName = record.get('file_name');
        // 如果 fileName 是 JSON 字符串，嘗試解析它
        let parsedFileName = fileName;
        if (typeof fileName === 'string' && fileName.startsWith('{')) {
          try {
            const parsed = JSON.parse(fileName);
            parsedFileName = parsed.fileName || parsed.fileId || fileName;
          } catch (e) {
            console.warn('解析文件名失敗:', e);
          }
        }

        const lastDownloaded = record.get('last_downloaded');
        // 確保日期格式正確
        const formattedDate = typeof lastDownloaded === 'string' ? 
          new Date(lastDownloaded).toLocaleString('zh-TW') : '無記錄';

        return {
          fileName: parsedFileName as string,
          downloadCount: record.get('download_count') as number || 0,
          lastDownloaded: formattedDate
        };
      });
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

      return records.map(record => {
        const lastLogin = record.get('last_login');
        // 確保日期格式正確
        const formattedDate = typeof lastLogin === 'string' ? 
          new Date(lastLogin).toLocaleString('zh-TW') : '無記錄';

        return {
          email: record.get('email') as string,
          lastLogin: formattedDate,
          loginCount: record.get('login_count') as number || 0
        };
      });
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
      
      // 獲取今天的活動記錄
      const activityRecords = await this.base('Activity_Logs')
        .select({
          filterByFormula: `AND(
            IS_SAME({Timestamp}, '${today}', 'day'),
            OR(
              {Action} = 'download',
              {Action} = 'view'
            )
          )`
        })
        .all();

      const downloadCount = activityRecords.length;
      console.log(`今日下載總數: ${downloadCount}`);

      const dailyRecords = await this.base('Daily_Stats')
        .select({
          filterByFormula: `{date} = '${today}'`
        })
        .firstPage();

      if (dailyRecords.length > 0) {
        const record = dailyRecords[0];
        await this.base('Daily_Stats').update(record.id, {
          'downloads': downloadCount
        });
        console.log('每日統計更新成功');
      } else {
        await this.base('Daily_Stats').create({
          'date': today,
          'downloads': downloadCount,
          'logins': 0
        });
        console.log('新的每日統計記錄創建成功');
      }
    } catch (error) {
      console.error('更新每日統計失敗:', error);
      throw error;
    }
  }

  // 更新設備統計
  private async updateDeviceStats(deviceInfo: string): Promise<void> {
    try {
      console.log('開始更新設備統計:', deviceInfo);
      const records = await this.base('Device_Stats')
        .select({
          filterByFormula: `{device_type} = '${deviceInfo}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentCount = (record.get('count') as number) || 0;
        await this.base('Device_Stats').update(record.id, {
          'count': currentCount + 1
        });
        console.log('設備統計更新成功');
      } else {
        await this.base('Device_Stats').create({
          'device_type': deviceInfo,
          'count': 1
        });
        console.log('新的設備統計記錄創建成功');
      }
    } catch (error) {
      console.error('更新設備統計失敗:', error);
    }
  }

  // 更新瀏覽器統計
  private async updateBrowserStats(browserInfo: string): Promise<void> {
    try {
      console.log('開始更新瀏覽器統計:', browserInfo);
      const records = await this.base('Browser_Stats')
        .select({
          filterByFormula: `{browser} = '${browserInfo}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentCount = (record.get('count') as number) || 0;
        await this.base('Browser_Stats').update(record.id, {
          'count': currentCount + 1
        });
        console.log('瀏覽器統計更新成功');
      } else {
        await this.base('Browser_Stats').create({
          'browser': browserInfo,
          'count': 1
        });
        console.log('新的瀏覽器統計記錄創建成功');
      }
    } catch (error) {
      console.error('更新瀏覽器統計失敗:', error);
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