import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFilesGroupedBySector } from '../services/airtable';
import { File } from '../services/airtable';

interface CategoryGroup {
  sector: string;
  categories: Array<{
    name: string;
    files: File[];
  }>;
}

const DashboardPage: React.FC = () => {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const filesBySector = await getFilesGroupedBySector();
        const groups: CategoryGroup[] = [];

        Object.entries(filesBySector).forEach(([sector, categories]) => {
          const categoryList = Object.entries(categories).map(([name, files]) => {
            // 確保 files 是 File[] 類型
            const fileArray = Array.isArray(files) ? files : [];
            return {
              name,
              files: fileArray,
            };
          });

          groups.push({
            sector,
            categories: categoryList,
          });
        });

        setCategoryGroups(groups);
      } catch (error) {
        console.error('獲取文件失敗:', error);
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

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>載入中...</p>
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
              <div key={group.sector}>
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
        <h1 className="text-2xl font-bold text-gray-800 mb-8">最新文件</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryGroups.map((group, groupIndex) =>
            group.categories.map((category, categoryIndex) =>
              getLatestFiles(category.files).map((file, fileIndex) => (
                <div
                  key={file.name}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-800">{file.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {group.sector}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {file.date ? formatDate(file.date) : '無日期'}
                  </p>
                  <button
                    onClick={() => handleDownload(file.downloadUrl, file.name)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    下載
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 