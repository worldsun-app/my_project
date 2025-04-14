import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

// 定義分類顏色
const sectorColors: Record<string, { from: string; to: string; border: string; bg: string; text: string }> = {
  '保險': {
    from: 'from-blue-50',
    to: 'to-white',
    border: 'border-blue-100',
    bg: 'bg-blue-100',
    text: 'text-blue-800'
  },
  '投資': {
    from: 'from-emerald-50',
    to: 'to-white',
    border: 'border-emerald-100',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800'
  }
};

const DashboardPage: React.FC = () => {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<File[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // 搜索功能
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === '') {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const searchTermLower = term.toLowerCase();
    const results = categoryGroups.flatMap(group =>
      group.categories.flatMap(category =>
        category.files.filter(file =>
          file.name.toLowerCase().includes(searchTermLower) ||
          file.title.toLowerCase().includes(searchTermLower)
        )
      )
    );
    setSearchResults(results);
  };

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

  // 下載功能
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

  // 在新分頁開啟
  const handleOpenInNewTab = (file: File) => {
    if (file.attachment && file.attachment.url) {
      window.open(file.attachment.url, '_blank');
    }
  };

  // 修改搜索結果表格中的下載按鈕部分
  const DownloadButtons = ({ file }: { file: File }) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleDownload(file)}
        className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
        title="直接下載"
      >
        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        下載
      </button>
      <button
        onClick={() => handleOpenInNewTab(file)}
        className="text-gray-600 hover:text-gray-900 font-medium flex items-center"
        title="在新分頁開啟"
      >
        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        開啟
      </button>
    </div>
  );

  // 返回首頁
  const handleGoHome = () => {
    navigate('/');
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
          <div 
            onClick={handleGoHome}
            className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 cursor-pointer mb-6"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">返回首頁</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">快速導覽</h2>
          <div className="space-y-2">
            {categoryGroups.map((group) => (
              <div key={group.sector}>
                <button
                  onClick={() => navigate(`/sector/${group.sector}`)}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {group.sector}
                </button>
                <div className="ml-4 space-y-1">
                  {group.categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => navigate(`/category/${category.name}`)}
                      className="w-full text-left px-4 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主內容區 */}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <div 
            onClick={handleGoHome}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <h1 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              財經資訊平台
            </h1>
            <svg 
              className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索文件名稱或標題..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-2.5 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 搜索結果 */}
        {isSearching && (
          <div className="mb-12 bg-gradient-to-r from-gray-50 to-white p-6 rounded-lg border border-gray-100">
            <div className="flex items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">搜索結果</h2>
              <div className="ml-4 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-800">
                找到 {searchResults.length} 個文件
              </div>
              {searchResults.length > 0 && (
                <div className="ml-4 text-sm text-gray-500">
                  （搜索範圍：文件名稱和標題）
                </div>
              )}
            </div>
            {searchResults.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件名稱</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">標題</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分類</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {searchResults.map((file) => (
                        <tr key={file.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {file.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.sector} / {file.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.date ? formatDate(file.date) : '無日期'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <DownloadButtons file={file} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg">
                <p className="text-gray-500">沒有找到相關文件</p>
              </div>
            )}
          </div>
        )}

        {/* 最新檔案（當不在搜索時顯示） */}
        {!isSearching && (
          <>
            <div className="mb-12 bg-gradient-to-r from-purple-50 to-white p-6 rounded-lg border border-purple-100">
              <div className="flex items-center mb-8">
                <h2 className="text-2xl font-bold text-purple-900">最新檔案</h2>
                <div className="ml-4 px-3 py-1 bg-purple-100 rounded-full text-sm text-purple-800">
                  最近更新
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件名稱</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">標題</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分類</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {categoryGroups.flatMap(group => 
                        group.categories.flatMap(category => 
                          getLatestFiles(category.files)
                        )
                      ).slice(0, 6).map((file) => (
                        <tr key={file.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {file.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.sector} / {file.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.date ? formatDate(file.date) : '無日期'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <DownloadButtons file={file} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 分類內容（當不在搜索時顯示） */}
        {!isSearching && (
          <>
            <div className="space-y-12">
              {categoryGroups.map((group) => {
                const colors = sectorColors[group.sector] || sectorColors['保險'];
                return (
                  <div key={group.sector} className={`bg-gradient-to-r ${colors.from} ${colors.to} p-6 rounded-lg border ${colors.border}`}>
                    <div className="flex items-center mb-8">
                      <h2 className={`text-2xl font-bold ${colors.text.replace('text-', 'text-').replace('-800', '-900')}`}>
                        {group.sector}
                      </h2>
                      <div className={`ml-4 px-3 py-1 ${colors.bg} rounded-full text-sm ${colors.text}`}>
                        {group.categories.reduce((total, category) => total + category.files.length, 0)} 個文件
                      </div>
                    </div>
                    <div className="space-y-8">
                      {group.categories.map((category) => (
                        <div key={category.name} className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-800">{category.name}</h3>
                            <span className="text-sm text-gray-500">{category.files.length} 個文件</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
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
                                      <DownloadButtons file={file} />
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
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 