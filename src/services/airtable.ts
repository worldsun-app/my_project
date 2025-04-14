import axios from 'axios';

// Airtable API 配置
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = import.meta.env.VITE_AIRTABLE_TABLE_NAME;

// 檢查配置
if (!AIRTABLE_API_KEY) {
  console.error('錯誤: VITE_AIRTABLE_API_KEY 未設置');
}
if (!AIRTABLE_BASE_ID) {
  console.error('錯誤: VITE_AIRTABLE_BASE_ID 未設置');
}
if (!AIRTABLE_TABLE_NAME) {
  console.error('錯誤: VITE_AIRTABLE_TABLE_NAME 未設置');
}

const baseURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
console.log('Airtable API URL:', baseURL);

const airtableApi = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  },
});

// 定義檔案類型
export type File = {
  name: string;
  title: string;
  downloadUrl: string;
  date: string;
  sector: string;
  category: string;
  attachment: any;
};

// 定義回傳類型
type FilesBySector = Record<string, {
  sector: string;
  categories: Record<string, File[]>;
}>;

// 獲取並分類檔案
export async function getFilesGroupedBySector(): Promise<Record<string, File[]>> {
  console.log('開始獲取檔案列表...');
  
  try {
    const response = await fetch(baseURL, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Airtable 完整響應:', data);

    const filesBySector: Record<string, File[]> = {};

    if (!data.records || !Array.isArray(data.records)) {
      console.error('無效的響應格式:', data);
      throw new Error('無效的響應格式');
    }

    for (const record of data.records) {
      console.log('完整記錄數據:', record);
      console.log('記錄字段:', record.fields);

      const {
        name,
        title,
        sector,
        category,
        date,
        attachment
      } = record.fields;

      console.log('處理文件:', record.fields);

      // 確保所有必要字段都存在
      if (!name || !sector || !attachment || !attachment[0]) {
        console.log(`跳過不完整記錄: ${name || '未命名文件'}`, {
          name,
          sector,
          hasAttachment: !!attachment
        });
        continue;
      }

      const file: File = {
        name,
        title: title || name,
        sector,
        category: category || '未分類',
        date: date || new Date().toISOString().split('T')[0],
        downloadUrl: attachment[0].url,
        attachment: attachment[0]
      };

      if (!filesBySector[sector]) {
        filesBySector[sector] = [];
      }
      filesBySector[sector].push(file);
      console.log(`成功添加文件: ${name} 到 ${sector} 分類`);
    }

    console.log('處理後的檔案分類摘要:', Object.keys(filesBySector));
    console.log('完整的檔案分類數據:', filesBySector);
    return filesBySector;

  } catch (error) {
    console.error('獲取檔案列表時出錯:', error);
    throw error;
  }
}

// Airtable 服务
export const airtable = {
  // 获取文件列表
  getFiles: async () => {
    // 待实现
  },
  
  // 获取分类文件
  getFilesByCategory: async (category: string): Promise<File[]> => {
    try {
      const response = await airtableApi.get('/Files', {
        params: {
          filterByFormula: `{Category} = '${category}'`
        }
      });
      return response.data.records.map((record: any) => ({
        id: record.id,
        name: record.fields.Name as string,
        url: (record.fields.Attachments as any[])?.[0]?.url || '',
        category: record.fields.Category as string,
        sector: record.fields.Sector as string,
        date: record.fields.Date as string
      }));
    } catch (error) {
      console.error('Error fetching files by category:', error);
      return [];
    }
  },
  
  // 下载文件
  downloadFile: async (fileId: string): Promise<string> => {
    try {
      const response = await airtableApi.get(`/Files/${fileId}`);
      const attachments = response.data.fields.Attachments as any[];
      if (attachments && attachments.length > 0) {
        return attachments[0].url;
      }
      throw new Error('No attachment found');
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}; 