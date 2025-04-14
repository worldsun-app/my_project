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
interface File {
  name: string;
  title?: string;
  downloadUrl: string;
  date?: string;
  sector?: string;
  category: string;
  attachment: any;
}

// 定義回傳類型
type FilesBySector = Record<string, {
  sector: string;
  categories: Record<string, File[]>;
}>;

// 獲取並分類檔案
export const getFilesGroupedBySector = async (): Promise<FilesBySector> => {
  try {
    console.log('開始獲取檔案列表...');
    const response = await airtableApi.get('', {
      params: {
        view: 'Grid view',
      },
    });

    console.log('Airtable 響應:', response.data);

    // 將檔案按 sector 和 category 分組
    const filesBySector: FilesBySector = {};
    
    response.data.records.forEach((record: any) => {
      console.log('處理記錄:', record);
      const category = record.fields.category || '未分類';
      const sector = record.fields.sector || '其他';
      
      // 檢查是否有附件
      if (record.fields.attachment && record.fields.attachment.length > 0) {
        const attachment = record.fields.attachment[0];
        const file: File = {
          name: record.fields.name || attachment.filename,
          title: record.fields.title,
          downloadUrl: attachment.url,
          date: record.fields.date,
          sector: sector,
          category: category,
          attachment: record.fields.attachment
        };

        // 初始化 sector
        if (!filesBySector[sector]) {
          filesBySector[sector] = {
            sector: sector,
            categories: {}
          };
        }

        // 初始化 category
        if (!filesBySector[sector].categories[category]) {
          filesBySector[sector].categories[category] = [];
        }

        filesBySector[sector].categories[category].push(file);
      }
    });

    console.log('處理後的檔案分類:', filesBySector);
    return filesBySector;
  } catch (error) {
    console.error('獲取檔案列表失敗:', error);
    if (axios.isAxiosError(error)) {
      console.error('錯誤詳情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          headers: error.config?.headers,
        }
      });
    }
    throw error;
  }
};

// 匯出類型
export type { File, FilesBySector };

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