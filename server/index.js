require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Airtable = require('airtable');
const admin = require('firebase-admin');
const { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

// 初始化 Firebase Admin
const serviceAccount = require('./firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 初始化 Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

const app = express();
app.use(cors());
app.use(express.json());

// 驗證 Firebase Token 中間件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 檢查管理員權限中間件
const checkAdmin = (req, res, next) => {
  const adminEmails = ['service@wsgfo.com', 'denniswu@wsgfo.com'];
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
};

// 獲取統計數據
app.get('/api/stats', authenticateToken, checkAdmin, async (req, res) => {
  try {
    // 獲取活動日誌
    const activityLogs = await base('Activity_Logs')
      .select({
        maxRecords: 5,
        sort: [{ field: 'timestamp', direction: 'desc' }],
        filterByFormula: 'AND(timestamp, userId, action)'
      })
      .firstPage();

    // 獲取檔案統計
    const fileStats = await base('File_Stats')
      .select({
        maxRecords: 5,
        sort: [{ field: 'viewCount', direction: 'desc' }]
      })
      .firstPage();

    // 獲取每日統計
    const dailyStats = await base('Daily_Stats')
      .select({
        maxRecords: 7,
        sort: [{ field: 'date', direction: 'desc' }]
      })
      .firstPage();

    // 獲取用戶總數
    const totalUsers = await base('Users')
      .select({
        filterByFormula: 'status = "active"'
      })
      .firstPage();

    // 獲取本週活躍用戶
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const activeUsers = await base('Activity_Logs')
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
    const monthlyDownloads = await base('Activity_Logs')
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 