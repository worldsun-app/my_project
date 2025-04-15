import Airtable from 'airtable';
import { auth } from '../firebase';

interface AirtableRecord {
  fields: Record<string, any>;
  get: (field: string) => any;
}

export class AnalyticsService {
  private base: any;

  constructor() {
    Airtable.configure({
      apiKey: import.meta.env.VITE_AIRTABLE_API_KEY
    });
    this.base = Airtable.base(import.meta.env.VITE_AIRTABLE_BASE_ID);
  }

  async isAdmin(email: string): Promise<boolean> {
    try {
      const records = await this.base('Admin_Users').select({
        filterByFormula: `{email} = '${email}'`
      }).firstPage();

      return records && records.length > 0;
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  }

  async logActivity(action: string, metadata: any = {}) {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('No user logged in, skipping activity log');
        return;
      }

      // 準備活動記錄數據
      const activityData = {
        userId: user.uid,
        userName: user.displayName || user.email || 'Unknown User',
        timestamp: new Date().toISOString(),
        action,
        ...metadata,
        deviceType: this.getDeviceType(),
        browser: this.getBrowser(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      };

      console.log('Logging activity with data:', activityData);

      // 創建活動記錄
      const record = await this.base('Activity_Logs').create(activityData);
      console.log('Activity logged successfully:', record);

      // 如果是文件操作，更新文件統計
      if (action === 'file_open' && metadata.fileId) {
        await this.updateFileStats(metadata.fileId);
      }

      // 更新每日統計
      await this.updateDailyStats();

    } catch (error) {
      console.error('Failed to log activity:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    }
  }

  private async updateFileStats(fileId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const records = await this.base('File_Stats').select({
        filterByFormula: `{fileId} = '${fileId}'`
      }).firstPage();

      if (records && records.length > 0) {
        await this.base('File_Stats').update([
          {
            id: records[0].id,
            fields: {
              viewCount: (records[0].fields.viewCount || 0) + 1,
              lastViewedAt: today
            }
          }
        ]);
      } else {
        await this.base('File_Stats').create([
          {
            fields: {
              fileId: fileId,
              viewCount: 1,
              lastViewedAt: today,
              firstViewedAt: today
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to update file stats:', error);
    }
  }

  private async updateDailyStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const records = await this.base('Daily_Stats').select({
        filterByFormula: `{date} = '${today}'`
      }).firstPage();

      if (records && records.length > 0) {
        await this.base('Daily_Stats').update([
          {
            id: records[0].id,
            fields: {
              visitCount: (records[0].fields.visitCount || 0) + 1
            }
          }
        ]);
      } else {
        await this.base('Daily_Stats').create([
          {
            fields: {
              date: today,
              visitCount: 1
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to update daily stats:', error);
    }
  }

  async getFileStats(fileId?: string): Promise<Array<{ fileId: string; fileName: string; viewCount: number }> | { viewCount: number; lastViewedAt: string; firstViewedAt: string } | null> {
    try {
      if (fileId) {
        const records = await this.base('File_Stats').select({
          filterByFormula: `{fileId} = '${fileId}'`
        }).firstPage();

        if (records && records.length > 0) {
          return {
            viewCount: records[0].fields.viewCount || 0,
            lastViewedAt: records[0].fields.lastViewedAt,
            firstViewedAt: records[0].fields.firstViewedAt
          };
        }
        return null;
      } else {
        const records = await this.base('File_Stats').select({
          sort: [{ field: 'viewCount', direction: 'desc' }],
          maxRecords: 10
        }).all();

        return records.map((record: AirtableRecord) => ({
          fileId: record.get('fileId') as string,
          fileName: record.get('fileName') as string,
          viewCount: record.get('viewCount') as number
        }));
      }
    } catch (error) {
      console.error('Failed to get file stats:', error);
      return fileId ? null : [];
    }
  }

  async getDailyStats(startDate?: string, endDate?: string): Promise<Array<{ date: string; visitCount: number }>> {
    try {
      if (startDate && endDate) {
        const records = await this.base('Daily_Stats').select({
          filterByFormula: `AND({date} >= '${startDate}', {date} <= '${endDate}')`
        }).firstPage();

        return records.map((record: AirtableRecord) => ({
          date: record.fields.date,
          visitCount: record.fields.visitCount || 0
        }));
      } else {
        const records = await this.base('Daily_Stats').select({
          sort: [{ field: 'date', direction: 'desc' }],
          maxRecords: 30
        }).all();

        return records.map((record: AirtableRecord) => ({
          date: record.get('date') as string,
          visitCount: record.get('visitCount') as number
        }));
      }
    } catch (error) {
      console.error('Failed to get daily stats:', error);
      return [];
    }
  }

  async getDeviceStats(): Promise<Array<{ deviceType: string; count: number }>> {
    const records = await this.base('Activity_Logs').select({
      groupBy: [{ field: 'deviceType' }],
      fields: ['deviceType']
    }).all();

    const deviceCounts = new Map<string, number>();
    records.forEach((record: AirtableRecord) => {
      const deviceType = record.get('deviceType') as string;
      deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);
    });

    return Array.from(deviceCounts.entries()).map(([deviceType, count]) => ({
      deviceType,
      count
    }));
  }

  async getBrowserStats(): Promise<Array<{ browser: string; count: number }>> {
    const records = await this.base('Activity_Logs').select({
      groupBy: [{ field: 'browser' }],
      fields: ['browser']
    }).all();

    const browserCounts = new Map<string, number>();
    records.forEach((record: AirtableRecord) => {
      const browser = record.get('browser') as string;
      browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);
    });

    return Array.from(browserCounts.entries()).map(([browser, count]) => ({
      browser,
      count
    }));
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowser(): string {
    return navigator.userAgent;
  }
}

export const analyticsService = new AnalyticsService(); 