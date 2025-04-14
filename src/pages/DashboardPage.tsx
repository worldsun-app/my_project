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

interface Props {
  files: File[];
}

export const DashboardPage: React.FC<Props> = ({ files }) => {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 使用 useMemo 來計算 filesBySector
  const filesBySector = useMemo(() => {
    return files.reduce((acc, file) => {
      const sector = file.sector || '未分類';
      if (!acc[sector]) {
        acc[sector] = [];
      }
      acc[sector].push(file);
      return acc;
    }, {} as Record<string, File[]>);
  }, [files]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const filesBySector = await getFilesGroupedBySector();
        const allFiles: File[] = [];
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

          // 收集所有檔案
          categories.forEach(category => {
            allFiles.push(...category.files);
          });
        });

        setCategoryGroups(groups);
      } catch (error) {
        console.error('獲取檔案失敗:', error);
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
    const element = document.getElementById(`category-${categoryName}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewMore = (sector: string, category: string) => {
    navigate(`/category/${encodeURIComponent(sector)}/${encodeURIComponent(category)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左側導航欄 */}
        <div className="w-full lg:w-72">
          <div className="sticky top-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700">
                <h2 className={`${fontStyles.title} text-lg text-white`}>快速導覽</h2>
              </div>
              <div ref={menuRef} className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {categoryGroups.map((group) => (
                  <div key={group.sector} className="border-b last:border-b-0">
                    <div className={`${fontStyles.subtitle} px-4 py-3 text-sm text-gray-700 bg-gray-50 border-b border-gray-200`}>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        {group.sector}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {group.categories.map((category) => (
                        <button
                          key={category.name}
                          onClick={() => scrollToCategory(category.name)}
                          className={`${fontStyles.body} block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 ${
                            selectedCategory === category.name ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                              <span>{category.name}</span>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                              {category.files.length}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 主要內容區域 */}
        <div className="flex-1">
          {/* 最新資訊區域 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`${fontStyles.title} text-3xl text-gray-800`}>財經資訊平台</h1>
                <p className={`${fontStyles.body} text-gray-600 mt-2`}>提供最新財經資訊與投資報告</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  最新更新
                </span>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h2 className={`${fontStyles.subtitle} text-xl text-gray-800 mb-4 flex items-center`}>
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                最新檔案
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getLatestFiles(files).map((file, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`${fontStyles.subtitle} text-gray-800`}>{file.name}</h3>
                        {file.title && (
                          <p className={`${fontStyles.body} text-sm text-gray-600 mt-1`}>{file.title}</p>
                        )}
                        {file.date && (
                          <p className={`${fontStyles.body} text-xs text-gray-500 mt-2 flex items-center`}>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(file.date)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDownload(file.downloadUrl, file.name)}
                        className="ml-4 inline-flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        title="下載檔案"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 按 Sector 組織內容 */}
          {categoryGroups.map((group) => (
            <div key={group.sector} className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
                <h2 className={`${fontStyles.title} text-2xl text-gray-800 flex items-center`}>
                  <svg className="w-6 h-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {group.sector}
                </h2>
              </div>
              {group.categories.map((category) => (
                <div key={category.name} id={`category-${category.name}`} className="border-b last:border-b-0">
                  <div className="p-6 bg-gray-50">
                    <h3 className={`${fontStyles.subtitle} text-xl text-gray-800 flex items-center`}>
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {category.name}
                      <span className="ml-3 px-3 py-1 text-sm font-normal bg-white rounded-full border border-gray-200">
                        {category.files.length} 份報告
                      </span>
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {category.files.slice(0, 6).map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="p-6 hover:bg-gray-50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div className="flex flex-col flex-1">
                          <span className={`${fontStyles.subtitle} text-gray-800`}>{file.name}</span>
                          {file.title && (
                            <span className={`${fontStyles.body} text-sm text-gray-600 mt-1`}>
                              {file.title}
                            </span>
                          )}
                          {file.date && (
                            <span className={`${fontStyles.body} text-sm text-gray-500 mt-2 flex items-center`}>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              更新日期: {formatDate(file.date)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDownload(file.downloadUrl, file.name)}
                          className="inline-flex items-center justify-center bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 w-full sm:w-auto"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          下載報告
                        </button>
                      </div>
                    ))}
                    {category.files.length > 6 && (
                      <div className="p-6 text-center">
                        <button
                          onClick={() => handleViewMore(group.sector, category.name)}
                          className="inline-flex items-center text-blue-500 hover:text-blue-700 font-medium transition-colors duration-200"
                        >
                          查看更多 ({category.files.length - 6} 份報告)
                          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {categoryGroups.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 text-lg">目前沒有可下載的報告</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 