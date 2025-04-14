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
    
    if (!response.data.records || !Array.isArray(response.data.records)) {
      console.error('無效的響應數據格式:', response.data);
      return {};
    }

    response.data.records.forEach((record: any) => {
      const fields = record.fields || {};
      console.log('處理記錄:', fields);

      // 獲取必要的欄位，使用預設值處理空值情況
      const name = fields.Name || '未命名文件';
      const title = fields.Title || '';
      const category = fields.Category || '未分類';
      const sector = fields.Sector || '其他';
      const date = fields.Date || null;
      const attachments = fields.Attachments || [];

      console.log('處理文件:', {
        name,
        title,
        category,
        sector,
        hasAttachments: attachments.length > 0
      });

      // 檢查是否有附件
      if (attachments.length > 0) {
        const attachment = attachments[0];
        const file: File = {
          name,
          title,
          downloadUrl: attachment.url,
          date,
          sector,
          category,
          attachment: attachments
        };

        // 初始化 sector
        if (!filesBySector[sector]) {
          filesBySector[sector] = {
            sector,
            categories: {}
          };
        }

        // 初始化 category
        if (!filesBySector[sector].categories[category]) {
          filesBySector[sector].categories[category] = [];
        }

        filesBySector[sector].categories[category].push(file);
        console.log(`添加文件到 ${sector}/${category}:`, file.name);
      } else {
        console.log('跳過沒有附件的記錄:', name);
      }
    });

    // 檢查處理後的數據
    const summary = {
      sectors: Object.keys(filesBySector),
      categories: Object.values(filesBySector).flatMap(sector => 
        Object.keys(sector.categories)
      ),
      totalFiles: Object.values(filesBySector).reduce((total, sector) => 
        total + Object.values(sector.categories).reduce((sum, files) => sum + files.length, 0), 0)
    };

    console.log('處理後的檔案分類摘要:', summary);
    console.log('完整的檔案分類數據:', filesBySector);

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
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          params: error.config?.params
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