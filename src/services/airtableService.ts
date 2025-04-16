import Airtable from 'airtable';

// 定義統計數據接口
export interface DailyStats {
  date: string;
  downloads: number;
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
  type?: string;
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
    try {
      console.log('嘗試記錄活動:', {
        'User ID': data.userId,
        'User Email': data.userEmail,
        'Action': data.action,
        'Details': data.details,
        'Timestamp': data.timestamp,
        'Device Info': data.deviceInfo,
        'Browser Info': data.browserInfo
      });
      
      // 準備所有需要執行的更新操作
      const updatePromises: Promise<void>[] = [];
      
      // 1. 記錄到 Activity_Logs
      const activityPromise = this.base('Activity_Logs').create([{
        fields: {
          'User ID': data.userId,
          'User Email': data.userEmail,
          'Action': data.action,
          'Details': data.details,
          'Timestamp': data.timestamp,
          'Device Info': data.deviceInfo,
          'Browser Info': data.browserInfo
        }
      }]).then(records => {
        console.log('活動記錄成功:', records);
      });
      
      updatePromises.push(activityPromise);

      // 2. 更新用戶統計
      updatePromises.push(this.updateUserStats(data.userEmail));

      // 3. 更新文件統計
      if (data.action === 'download' || data.action === 'file_open') {
        let fileInfo: { fileName?: string } = {};
        
        try {
          fileInfo = JSON.parse(data.details);
        } catch (e) {
          console.warn('解析文件信息失敗:', e);
          fileInfo = { fileName: data.details };
        }

        if (fileInfo.fileName) {
          updatePromises.push(this.updateFileStats(fileInfo.fileName, data.action));
        }
      }

      // 4. 更新設備統計
      if (data.deviceInfo) {
        updatePromises.push(this.updateDeviceStats(data.deviceInfo));
      }

      // 5. 更新瀏覽器統計
      if (data.browserInfo) {
        updatePromises.push(this.updateBrowserStats(data.browserInfo));
      }

      // 並行執行所有更新操作
      await Promise.all(updatePromises);
      
    } catch (error) {
      console.error('記錄活動失敗:', error);
      throw error;
    }
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
        await this.base('User_Stats').create([{
          fields: {
            'email': email,
            'login_count': 1,
            'last_login': new Date().toISOString()
          }
        }]);
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
      // 使用當地時間計算日期範圍
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      // 獲取過去30天的活動記錄
      const activityRecords = await this.base('Activity_Logs')
        .select({
          filterByFormula: `AND(
            IS_AFTER({Timestamp}, '${thirtyDaysAgo.toISOString()}'),
            IS_BEFORE({Timestamp}, '${today.toISOString()}')
          )`,
          sort: [{ field: 'Timestamp', direction: 'desc' }]
        })
        .all();

      // 按日期分組統計
      const dailyStats = new Map<string, { downloads: number, views: number }>();
      
      // 初始化過去30天的所有日期
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyStats.set(dateStr, { downloads: 0, views: 0 });
      }
      
      // 統計活動記錄
      activityRecords.forEach(record => {
        const timestamp = record.get('Timestamp') as string;
        const date = timestamp.split('T')[0];
        const action = record.get('Action') as string;
        
        const stats = dailyStats.get(date);
        if (stats) {
          if (action === 'download' || action === 'file_open') {
            stats.downloads++;
          }
        }
      });

      // 轉換為數組並排序
      return Array.from(dailyStats.entries())
        .map(([date, stats]) => ({
          date,
          downloads: stats.downloads,
          views: 0  // 不再使用 views 統計
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('獲取每日統計失敗:', error);
      return [];
    }
  }

  // 格式化日期時間
  private formatDateTime(dateStr: string | undefined | null): string {
    if (!dateStr) return '無記錄';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '無效日期';
      
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Taipei'
      });
    } catch (error) {
      console.error('日期格式化失敗:', error);
      return '無效日期';
    }
  }

  // 測試表格可訪問性
  async testTableAccess(): Promise<void> {
    console.log('開始測試表格可訪問性...');
    const tables = [
      'Activity_Logs',
      'User_Stats',
      'File_Stats',
      'Daily_Stats',
      'Device_Stats',
      'Browser_Stats',
      'Admin_Users'
    ];

    for (const tableName of tables) {
      try {
        console.log(`測試表格 ${tableName}...`);
        const table = this.base(tableName);
        
        // 獲取表格記錄
        const records = await table.select({ maxRecords: 1 }).firstPage();
        console.log(`表格 ${tableName} 可訪問，記錄數: ${records.length}`);

        // 獲取並記錄字段信息
        if (records.length > 0) {
          const fields = records[0].fields;
          const fieldNames = Object.keys(fields);
          console.log(`表格 ${tableName} 字段列表:`, fieldNames);
          console.log(`表格 ${tableName} 字段值示例:`, fields);
        }

        // 檢查必要字段
        const requiredFields = this.getRequiredFields(tableName);
        const missingFields = requiredFields.filter(field => {
          const hasField = records.length > 0 && records[0].fields.hasOwnProperty(field);
          if (!hasField) {
            console.warn(`表格 ${tableName} 缺少字段: ${field}`);
          }
          return !hasField;
        });

        if (missingFields.length > 0) {
          console.warn(`表格 ${tableName} 缺少必要字段:`, missingFields);
        }

        // 記錄示例數據
        if (records.length > 0) {
          const sampleRecord = records[0].fields;
          console.log(`表格 ${tableName} 示例記錄:`, {
            原始數據: sampleRecord,
            字段類型: Object.entries(sampleRecord).reduce((acc, [key, value]) => {
              acc[key] = typeof value;
              return acc;
            }, {} as Record<string, string>)
          });
        }
      } catch (error) {
        console.error(`測試表格 ${tableName} 失敗:`, error);
      }
    }
    console.log('表格可訪問性測試完成');
  }

  // 獲取必要字段列表
  private getRequiredFields(tableName: string): string[] {
    const fieldMap: Record<string, string[]> = {
      'Activity_Logs': ['action', 'user_email', 'timestamp', 'file_name'],
      'User_Stats': ['email', 'login_count', 'last_login'],
      'File_Stats': ['file_name', 'download_count', 'last_accessed', 'last_downloaded'],
      'Daily_Stats': ['date', 'download_count'],
      'Device_Stats': ['device_type', 'count'],
      'Browser_Stats': ['browser', 'count'],
      'Admin_Users': ['email']
    };
    return fieldMap[tableName] || [];
  }

  // 獲取文件統計
  async getFileStats(): Promise<FileStats[]> {
    try {
      const records = await this.base('File_Stats')
        .select({
          sort: [{ field: 'download_count', direction: 'desc' }]
        })
        .all();

      console.log('原始文件統計記錄:', records.map(record => ({
        id: record.id,
        fields: record.fields,
        fieldTypes: Object.entries(record.fields).reduce((acc, [key, value]) => {
          acc[key] = typeof value;
          return acc;
        }, {} as Record<string, string>)
      })));

      const fileStats = records
        .filter(record => {
          const fileName = record.fields.file_name;
          if (!fileName) {
            console.warn('發現缺少文件名的記錄:', record.id);
            return false;
          }
          return true;
        })
        .map(record => {
          const lastAccessed = record.fields.last_accessed;
          console.log('文件訪問時間處理:', {
            recordId: record.id,
            fileName: record.fields.file_name,
            lastAccessed,
            lastAccessedType: typeof lastAccessed,
            downloadCount: record.fields.download_count
          });

          return {
            fileName: record.fields.file_name as string,
            downloadCount: (record.fields.download_count as number) || 0,
            lastDownloaded: this.formatDateTime(record.fields.last_accessed as string)
          };
        });

      console.log('處理後的文件統計:', fileStats);
      return fileStats;
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

      console.log('原始用戶統計記錄:', records.map(r => r.fields));

      return records
        .filter(record => {
          const email = record.get('email');
          return email && typeof email === 'string';
        })
        .map(record => {
          const lastLogin = record.get('last_login');
          console.log('用戶登入時間原始值:', {
            email: record.get('email'),
            lastLogin,
            type: typeof lastLogin
          });

          const email = record.get('email') as string;
          const displayName = email.includes('@') ? email.split('@')[0] : email;

          return {
            email: displayName,
            lastLogin: this.formatDateTime(lastLogin as string),
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
  public async updateFileStats(fileName: string, action: string): Promise<void> {
    let normalizedFileName = '';
    
    try {
      console.log('開始更新文件統計:', fileName, action);
      
      // 解析文件名並清理
      normalizedFileName = fileName;
      if (typeof fileName === 'string') {
        if (fileName.startsWith('{')) {
          try {
            const parsed = JSON.parse(fileName);
            normalizedFileName = parsed.fileName || parsed.fileId || fileName;
          } catch {
            normalizedFileName = fileName;
          }
        }
        normalizedFileName = normalizedFileName.replace(/['"\\]/g, '').trim();
      }
      
      console.log('標準化後的文件名:', normalizedFileName);

      // 使用 UTC 時間
      const now = new Date().toISOString();
      console.log('當前時間戳:', now);

      const fields = {
        'file_name': normalizedFileName,
        'download_count': 1,
        'last_accessed': now,
        'last_downloaded': now
      };

      // 使用精確匹配查找記錄
      const records = await this.base('File_Stats')
        .select({
          filterByFormula: `{file_name} = '${normalizedFileName.replace(/'/g, "\\'")}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        console.log('現有記錄:', record.fields);
        
        const currentDownloads = ((record.fields.download_count as number) || 0) + 1;
        const updates = {
          'download_count': currentDownloads,
          'last_accessed': now,
          'last_downloaded': now
        };

        await this.base('File_Stats').update(record.id, updates);
        console.log('文件統計更新成功:', updates);
      } else {
        const createResult = await this.base('File_Stats').create([{ fields }]);
        console.log('新的文件統計記錄創建成功:', createResult);
      }
    } catch (error: any) {
      console.error('更新文件統計失敗，詳細錯誤:', {
        originalFileName: fileName,
        processedFileName: normalizedFileName,
        action: action,
        errorType: error.type,
        statusCode: error.statusCode,
        message: error.message,
        fullError: error
      });
      throw error;
    }
  }

  // 更新每日統計
  public async updateDailyStats(): Promise<void> {
    // 這個方法保留但不執行任何操作
    console.log('每日統計現在直接從活動記錄計算，不需要更新');
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
        await this.base('Device_Stats').create([{
          fields: {
            'device_type': deviceInfo,
            'count': 1
          }
        }]);
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
        await this.base('Browser_Stats').create([{
          fields: {
            'browser': browserInfo,
            'count': 1
          }
        }]);
        console.log('新的瀏覽器統計記錄創建成功');
      }
    } catch (error) {
      console.error('更新瀏覽器統計失敗:', error);
    }
  }
}

// 導出單例實例
export const airtableService = new AirtableService(); 