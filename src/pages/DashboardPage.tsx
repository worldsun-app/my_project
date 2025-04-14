import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { File, getFilesGroupedBySector, FilesBySector } from '../services/airtable';
import { formatDate } from '../utils/dateUtils';
import { fontStyles } from '../styles/fonts';
import '@fontsource/noto-sans-tc/400.css';
import '@fontsource/noto-sans-tc/500.css';
import '@fontsource/noto-sans-tc/700.css';

// 預定義的顏色方案
const colorSchemes = [
  { bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
  { bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  { bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' },
  { bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
  { bgColor: 'bg-teal-50', textColor: 'text-teal-700', borderColor: 'border-teal-200' },
  { bgColor: 'bg-pink-50', textColor: 'text-pink-700', borderColor: 'border-pink-200' },
  { bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  { bgColor: 'bg-cyan-50', textColor: 'text-cyan-700', borderColor: 'border-cyan-200' }
];

interface CategoryGroup {
  sector: string;
  categories: {
    name: string;
    files: File[];
  }[];
}

// 獲取最新檔案
const getLatestFiles = (files: File[]) => {
  return [...files]
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 6);
};

export const DashboardPage: React.FC = () => {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true);
        const filesBySector = await getFilesGroupedBySector();
        const groups: CategoryGroup[] = [];

        // 轉換資料結構
        Object.entries(filesBySector).forEach(([sector, sectorData]) => {
          const categories = Object.entries(sectorData.categories).map(([name, files]) => ({
            name,
            files: files as File[]
          }));
          
          groups.push({
            sector,
            categories
          });
        });

        setCategoryGroups(groups);
      } catch (error) {
        console.error('獲取檔案失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    const element = document.getElementById(categoryName);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewMore = (sector: string, category: string) => {
    navigate(`/category/${encodeURIComponent(sector)}/${encodeURIComponent(category)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">財經資訊平台</h1>
        
        {/* 最新檔案 */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">最新檔案</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryGroups.flatMap(group => 
              group.categories.flatMap(category => 
                getLatestFiles(category.files)
              )
            ).slice(0, 6).map((file, index) => (
              <div
                key={file.name}
                className={`p-4 rounded-lg border ${colorSchemes[index % colorSchemes.length].borderColor} ${colorSchemes[index % colorSchemes.length].bgColor}`}
              >
                <h3 className={`font-medium ${colorSchemes[index % colorSchemes.length].textColor}`}>
                  {file.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {file.date ? formatDate(file.date) : '無日期'}
                </p>
                <button
                  onClick={() => handleDownload(file.downloadUrl, file.name)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  下載
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 分類選單 */}
        <div ref={menuRef} className="sticky top-0 bg-white shadow-sm mb-8 z-10">
          <div className="flex space-x-4 overflow-x-auto py-2 px-4">
            {categoryGroups.flatMap(group => 
              group.categories.map(category => (
                <button
                  key={`${group.sector}-${category.name}`}
                  onClick={() => scrollToCategory(`${group.sector}-${category.name}`)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === `${group.sector}-${category.name}`
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* 分類內容 */}
        <div className="space-y-8">
          {categoryGroups.map((group, groupIndex) => (
            <div key={group.sector}>
              <h2 className="text-xl font-semibold mb-4">{group.sector}</h2>
              <div className="space-y-6">
                {group.categories.map((category, categoryIndex) => (
                  <div
                    key={category.name}
                    id={`${group.sector}-${category.name}`}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{category.name}</h3>
                      <button
                        onClick={() => handleViewMore(group.sector, category.name)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        查看更多
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getLatestFiles(category.files).map((file, fileIndex) => (
                        <div
                          key={file.name}
                          className={`p-4 rounded-lg border ${
                            colorSchemes[(groupIndex + categoryIndex + fileIndex) % colorSchemes.length].borderColor
                          } ${
                            colorSchemes[(groupIndex + categoryIndex + fileIndex) % colorSchemes.length].bgColor
                          }`}
                        >
                          <h4 className={`font-medium ${
                            colorSchemes[(groupIndex + categoryIndex + fileIndex) % colorSchemes.length].textColor
                          }`}>
                            {file.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {file.date ? formatDate(file.date) : '無日期'}
                          </p>
                          <button
                            onClick={() => handleDownload(file.downloadUrl, file.name)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            下載
                          </button>
                        </div>
                      ))}
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