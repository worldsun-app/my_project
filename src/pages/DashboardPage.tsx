import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFilesGroupedBySector, type File } from '../services/airtable';

// 定義類型
type Category = {
  name: string;
  files: File[];
};

type CategoryGroup = {
  sector: string;
  categories: Category[];
};

// 預定義的顏色方案
const colorSchemes = [
  { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  { bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
  { bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
  { bgColor: 'bg-teal-50', textColor: 'text-teal-700', borderColor: 'border-teal-200' },
];

const DashboardPage: React.FC = () => {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setError(null);
        console.log('開始獲取文件...');
        const filesBySector = await getFilesGroupedBySector();
        console.log('獲取到的原始數據:', filesBySector);
        const groups: CategoryGroup[] = [];

        Object.entries(filesBySector).forEach(([sectorName, sectorData]) => {
          console.log('處理 sector:', sectorName);
          const categoryList: Category[] = [];

          Object.entries(sectorData.categories).forEach(([categoryName, files]) => {
            console.log('處理 category:', categoryName, '文件數量:', files.length);
            categoryList.push({
              name: categoryName,
              files: files
            });
          });

          groups.push({
            sector: sectorName,
            categories: categoryList
          });
        });

        console.log('處理後的分組數據:', groups);
        setCategoryGroups(groups);
      } catch (error) {
        console.error('獲取文件失敗:', error);
        setError(error instanceof Error ? error.message : '獲取文件時發生錯誤');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const getLatestFiles = (files: File[]) => {
    return files
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownload = (file: File) => {
    if (file.attachment && file.attachment.url) {
      const link = document.createElement('a');
      link.href = file.attachment.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('No attachment URL found for file:', file.name);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-semibold text-red-700 mb-4">發生錯誤</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 左側導航欄 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">快速導覽</h2>
          <nav className="space-y-2">
            {categoryGroups.map((group) => (
              <div key={group.sector} className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 px-2 py-1">
                  {group.sector}
                </h3>
                {group.categories.map((category) => (
                  <Link
                    key={category.name}
                    to={`/category/${group.sector}/${category.name}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* 主內容區 */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">財經資訊平台</h1>
        
        {/* 最新檔案 */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">最新檔案</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryGroups.flatMap(group => 
              group.categories.flatMap(category => 
                getLatestFiles(category.files)
              )
            ).slice(0, 6).map((file) => (
              <div
                key={file.name}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-800 mb-1">
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {file.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.date ? formatDate(file.date) : '無日期'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(file)}
                    className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    下載
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 分類內容 */}
        <div className="space-y-12">
          {categoryGroups.map((group) => (
            <div key={group.sector}>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">{group.sector}</h2>
              <div className="space-y-8">
                {group.categories.map((category) => (
                  <div key={category.name} className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">{category.name}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件名稱</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">標題</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {category.files.map((file) => (
                            <tr key={file.name} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {file.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {file.title}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {file.date ? formatDate(file.date) : '無日期'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => handleDownload(file)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  下載
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 