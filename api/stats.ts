import { Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { table } from '../airtable';
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default async function handler(req: Request, res: Response) {
  try {
    // 驗證 Firebase Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const userEmail = decodedToken.email;

    // 檢查是否為管理員
    if (!['service@wsgfo.com', 'denniwu@wsgfo.com'].includes(userEmail || '')) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 獲取活動日誌
    const activityLogs = await table('Activity_Logs')
      .select({
        maxRecords: 5,
        sort: [{ field: 'timestamp', direction: 'desc' }],
        filterByFormula: 'AND(timestamp, userId, action)'
      })
      .firstPage();

    // 獲取檔案統計
    const fileStats = await table('File_Stats')
      .select({
        maxRecords: 5,
        sort: [{ field: 'viewCount', direction: 'desc' }]
      })
      .firstPage();

    // 獲取每日統計
    const dailyStats = await table('Daily_Stats')
      .select({
        maxRecords: 7,
        sort: [{ field: 'date', direction: 'desc' }]
      })
      .firstPage();

    // 獲取用戶總數
    const totalUsers = await table('Users')
      .select({
        filterByFormula: 'status = "active"'
      })
      .firstPage();

    // 獲取本週活躍用戶
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const activeUsers = await table('Activity_Logs')
      .select({
        filterByFormula: `AND(
          timestamp >= '${weekStart.toISOString()}',
          timestamp <= '${weekEnd.toISOString()}'
        )`,
        fields: ['userId']
      })
      .firstPage();

    // 獲取本月下載次數
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthlyDownloads = await table('Activity_Logs')
      .select({
        filterByFormula: `AND(
          timestamp >= '${monthStart.toISOString()}',
          timestamp <= '${monthEnd.toISOString()}',
          action = "downloaded"
        )`
      })
      .firstPage();

    // 格式化數據
    const formattedData = {
      activityLogs: activityLogs.map(record => ({
        id: record.id,
        userId: record.get('userId'),
        userName: record.get('userName'),
        timestamp: record.get('timestamp'),
        action: record.get('action'),
        fileId: record.get('fileId'),
        fileName: record.get('fileName')
      })),
      fileStats: fileStats.map(record => ({
        fileId: record.get('fileId'),
        fileName: record.get('fileName'),
        viewCount: record.get('viewCount')
      })),
      dailyStats: dailyStats.map(record => ({
        date: record.get('date'),
        visitCount: record.get('visitCount')
      })),
      totalUsers: totalUsers.length,
      activeUsers: new Set(activeUsers.map(record => record.get('userId'))).size,
      monthlyDownloads: monthlyDownloads.length
    };

    res.json(formattedData);
  } catch (error) {
    console.error('Error in stats API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 