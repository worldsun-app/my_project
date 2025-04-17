import Airtable from 'airtable';

// 定義統計數據接口
export interface DailyStats {
  date: string;
  downloads: number;
}

export interface FileStats {
  fileName: string;
  downloadCount: number;
  lastAccessed: string;
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
      if (data.action === 'file_download' || data.action === 'file_open') {
        let fileInfo: { fileName?: string } = {};
        
        try {
          fileInfo = JSON.parse(data.details);
        } catch (e) {
          console.warn('解析文件信息失敗:', e);
          fileInfo = { fileName: data.details };
        }

        if (fileInfo.fileName) {
          console.log('更新文件統計:', {
            fileName: fileInfo.fileName,
            action: data.action,
            timestamp: data.timestamp
          });
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
          filterByFormula: `LOWER(TRIM({email})) = LOWER(TRIM('${email.replace(/'/g, "\\'")}')`
        })
        .firstPage();

      const now = new Date().toISOString();

      if (records.length > 0) {
        const record = records[0];
        const currentCount = (record.get('login_count') as number) || 0;
        console.log('當前登入次數:', currentCount);
        await this.base('User_Stats').update(record.id, {
          'login_count': currentCount + 1,
          'last_login': now,
          'email': email  // 確保 email 字段存在
        });
        console.log('用戶統計更新成功');
      } else {
        console.log('創建新的用戶統計記錄');
        await this.base('User_Stats').create([{
          fields: {
            'email': email,
            'login_count': 1,
            'last_login': now
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
  private formatDateTime(dateTimeStr: string | undefined | null): string {
    if (!dateTimeStr) {
      console.log('無日期數據:', dateTimeStr);
      return '無日期資料';
    }
    
    try {
      console.log('格式化日期:', dateTimeStr);
      
      // 嘗試解析日期
      const date = new Date(dateTimeStr);
      
      // 檢查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('無效的日期字符串:', dateTimeStr);
        return '無效日期';
      }
      
      // 使用台北時區進行格式化
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Taipei'
      }).format(date);
      
    } catch (error) {
      console.error('日期格式化錯誤:', {
        input: dateTimeStr,
        error: error
      });
      return '無效日期';
    }
  }

  // 檢查是否為有效的日期時間字符串
  private isValidDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  // 獲取字段類型信息
  private getFieldTypeInfo(value: any) {
    return {
      type: typeof value,
      value: value,
      isDate: this.isValidDateString(value)
    };
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
          const record = records[0];
          console.log('原始記錄:', record);
          console.log('記錄 ID:', record.id);
          console.log('字段數據:', record.fields);
          
          const fieldNames = Object.keys(record.fields);
          console.log(`表格 ${tableName} 字段列表:`, fieldNames);

          // 檢查必要字段
          const requiredFields = this.getRequiredFields(tableName);
          const missingFields = requiredFields.filter(field => !fieldNames.includes(field));

          if (missingFields.length > 0) {
            console.warn(`表格 ${tableName} 缺少必要字段:`, missingFields);
            console.warn('需要添加這些字段到 Airtable 表格中');
          }

          // 記錄字段值和類型
          const fieldTypes = Object.entries(record.fields).reduce((acc, [key, value]) => {
            acc[key] = this.getFieldTypeInfo(value);
            return acc;
          }, {} as Record<string, any>);

          console.log(`表格 ${tableName} 字段類型:`, fieldTypes);
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
      'Activity_Logs': ['User ID', 'User Email', 'Action', 'Details', 'Timestamp', 'Device Info', 'Browser Info'],
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
          acc[key] = this.getFieldTypeInfo(value);
          return acc;
        }, {} as Record<string, any>)
      })));

      const fileStats = records
        .filter(record => {
          const fileName = record.get('file_name');
          if (!fileName) {
            console.warn('發現缺少文件名的記錄:', record.id);
            return false;
          }
          return true;
        })
        .map(record => {
          // 獲取最後訪問時間
          const lastAccessTime = record.get('last_accessed');
          
          console.log('日期處理:', {
            fileName: record.get('file_name'),
            lastAccessTime,
            lastAccessType: typeof lastAccessTime,
            rawDate: lastAccessTime && typeof lastAccessTime === 'string' ? new Date(lastAccessTime) : null
          });

          return {
            fileName: record.get('file_name') as string,
            downloadCount: (record.get('download_count') as number) || 0,
            lastAccessed: this.formatDateTime(lastAccessTime as string)
          };
        });

      console.log('處理後的文件統計:', fileStats);
      return fileStats;
    } catch (error) {
      console.error('獲取文件統計失敗:', error);
      throw error;
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
          if (!email || typeof email !== 'string') {
            console.warn('發現無效的 email 記錄:', record.id);
            return false;
          }
          return true;
        })
        .map(record => {
          const lastLogin = record.get('last_login');
          console.log('用戶登入時間原始值:', {
            email: record.get('email'),
            lastLogin,
            type: typeof lastLogin
          });

          return {
            email: record.get('email') as string,  // 使用完整 email
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

  // 更新每日統計
  public async updateDailyStats(action: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('更新每日統計:', { date: today, action });

      const records = await this.base('Daily_Stats')
        .select({
          filterByFormula: `{date} = '${today}'`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        const currentCount = (record.get('download_count') as number) || 0;
        
        if (action === 'download') {
          await this.base('Daily_Stats').update(record.id, {
            'download_count': currentCount + 1
          });
          console.log('每日統計更新成功');
        }
      } else {
        if (action === 'download') {
          await this.base('Daily_Stats').create([{
            fields: {
              'date': today,
              'download_count': 1
            }
          }]);
          console.log('新的每日統計記錄創建成功');
        }
      }
    } catch (error) {
      console.error('更新每日統計失敗:', error);
    }
  }

  // 更新文件統計
  public async updateFileStats(fileName: string, action: string): Promise<void> {
    let normalizedFileName = '';
    
    try {
      console.log('開始更新文件統計:', { fileName, action });
      
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

      // 使用 ISO 格式存儲時間
      const now = new Date();
      const nowISO = now.toISOString();
      
      console.log('當前時間戳:', {
        original: now,
        iso: nowISO
      });

      // 使用精確匹配查找記錄
      const records = await this.base('File_Stats')
        .select({
          filterByFormula: `LOWER(TRIM({file_name})) = LOWER(TRIM('${normalizedFileName.replace(/'/g, "\\'")}')`
        })
        .firstPage();

      if (records.length > 0) {
        const record = records[0];
        console.log('現有記錄:', record.fields);
        
        const currentDownloads = ((record.get('download_count') as number) || 0);
        
        // 更新字段
        const updateFields: Record<string, any> = {
          'last_accessed': nowISO
        };

        // 如果是下載操作，更新相關字段
        if (action === 'file_download') {
          updateFields['download_count'] = currentDownloads + 1;
          updateFields['last_downloaded'] = nowISO;
          // 同時更新每日統計
          await this.updateDailyStats('download');
        }

        console.log('準備更新字段:', updateFields);
        await this.base('File_Stats').update(record.id, updateFields);
        console.log('文件統計更新成功:', updateFields);
      } else {
        // 創建新記錄
        const createFields: Record<string, any> = {
          'file_name': normalizedFileName,
          'download_count': action === 'file_download' ? 1 : 0,
          'last_accessed': nowISO
        };

        // 如果是下載操作，設置 last_downloaded
        if (action === 'file_download') {
          createFields['last_downloaded'] = nowISO;
          // 同時更新每日統計
          await this.updateDailyStats('download');
        }

        console.log('準備創建新記錄:', createFields);
        const createResult = await this.base('File_Stats').create([{
          fields: createFields
        }]);
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