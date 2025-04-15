import Airtable from 'airtable';
import { auth } from '../firebase';

export class AnalyticsService {
  private base: any;

  constructor() {
    Airtable.configure({
      apiKey: import.meta.env.VITE_AIRTABLE_API_KEY
    });
    this.base = Airtable.base(import.meta.env.VITE_AIRTABLE_BASE_ID);
  }

  async logActivity(data: {
    actionType: string;
    fileId?: string;
    fileName?: string;
    category?: string;
    duration?: number;
    deviceType?: string;
    browser?: string;
    screenSize?: string;
  }) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('No user logged in, skipping activity logging');
        return;
      }

      await this.base('Activity_Logs').create([
        {
          fields: {
            userId: currentUser.email || '',
            userName: currentUser.displayName || '',
            timestamp: new Date().toISOString(),
            actionType: data.actionType,
            fileId: data.fileId || '',
            fileName: data.fileName || '',
            category: data.category || '',
            deviceType: data.deviceType || this.getDeviceType(),
            browser: data.browser || navigator.userAgent,
            screenSize: data.screenSize || `${window.innerWidth}x${window.innerHeight}`,
            duration: data.duration || 0
          }
        }
      ]);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
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
}

export const analyticsService = new AnalyticsService(); 