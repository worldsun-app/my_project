import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFilesGroupedBySector, type File } from '../services/airtable';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analyticsService';

// 定義類型
interface FileData {
  id: string;
  name: string;
  sector: string;
  category: string;
  files?: Array<{ url: string }>;
  attachment?: Array<{ url: string }>;
  downloadUrl?: string;
  title?: string;
  date?: string;
}

interface Category {
  name: string;
  files: FileData[];
}

interface CategoryGroup {
  sector: string;
  categories: Category[];
}

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
  const { user, logout } = useAuth();
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FileData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const navigate = useNavigate();
  const [viewStartTime, setViewStartTime] = useState<number>(0);

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
          file.title?.toLowerCase().includes(searchTermLower)
        )
      )
    );
    setSearchResults(results);
  };

  useEffect(() => {
    const startTime = Date.now();
    setViewStartTime(startTime);

    return () => {
      const duration = Date.now() - startTime;
      if (user) {
        analyticsService.logActivity({
          userId: user.uid,
          userEmail: user.email || '',
          action: 'page_exit',
          details: JSON.stringify({ category: 'dashboard', duration }),
          timestamp: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          browserInfo: navigator.userAgent
        });
      }
    };
  }, [user]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const filesBySector = await getFilesGroupedBySector();
        console.log('獲取到的原始數據:', filesBySector);

        // 轉換為 CategoryGroup[] 類型
        const categoryGroups: CategoryGroup[] = Object.entries(filesBySector).map(([sector, data]) => ({
          sector: data.sector,
          categories: Object.entries(data.categories).map(([category, files]) => ({
            name: category,
            files: files.map(file => ({
              id: file.name,
              name: file.name,
              title: file.title,
              sector: file.sector,
              category: file.category,
              date: file.date,
              files: [{
                url: file.downloadUrl
              }]
            }))
          }))
        }));

        setCategoryGroups(categoryGroups);
      } catch (error) {
        console.error('Error fetching files:', error);
        setError('獲取文件列表失敗');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const getLatestFiles = (files: FileData[]) => {
    return files
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '無日期資料';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '無效日期';
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('日期格式化錯誤:', error);
      return '無效日期';
    }
  };

  // 在新視窗中打開文件
  const openInNewWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 下載功能
  const handleDownload = async (file: FileData) => {
    const downloadUrl = file.files?.[0]?.url || file.attachment?.[0]?.url || file.downloadUrl;
    if (downloadUrl) {
      try {
        openInNewWindow(downloadUrl);

        await analyticsService.logActivity({
          userId: user?.uid || '',
          userEmail: user?.email || '',
          action: 'file_download',
          details: file.name,
          timestamp: new Date().toISOString(),
          deviceInfo: navigator.userAgent,
          browserInfo: navigator.userAgent
        }).catch(error => {
          console.error('記錄活動失敗:', error);
        });
      } catch (error) {
        console.error('下載文件時發生錯誤:', error);
      }
    } else {
      console.error('No download URL found for file:', file.name);
    }
  };

  // 修改按鈕部分
  const DownloadButtons = ({ file }: { file: FileData }) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleDownload(file)}
        className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
        title="下載文件"
      >
        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        下載文件
      </button>
    </div>
  );

  // 返回首頁
  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失敗:', error);
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
    <div className="h-screen flex overflow-hidden">
      {/* 左側導航欄 */}
      <div className="w-64 bg-slate-800 flex-shrink-0 h-full overflow-y-auto">
        <div className="p-4">
          {/* 平台標題 */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">財經資訊平台</h1>
          </div>

          {/* 用戶登入狀態 */}
          <div className="mb-6 p-3 bg-slate-700 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.email ? user.email[0].toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.displayName || '使用者'}
                </p>
                <p className="text-xs text-gray-300 truncate">
                  {user?.email || '未登入'}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleLogout}
                className="text-sm text-gray-300 hover:text-red-400 transition-colors flex items-center space-x-1"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>登出</span>
              </button>
            </div>
          </div>

          {/* 返回首頁按鈕 */}
          <div
            onClick={handleGoHome}
            className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 cursor-pointer mb-6"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">首頁</span>
          </div>

          {/* 快速導覽 */}
          <h2 className="text-lg font-semibold text-gray-300 mb-4">快速導覽</h2>
          <div className="space-y-2">
            {categoryGroups.map((group) => (
              <div key={group.sector}>
                <button
                  onClick={() => navigate(`/sector/${group.sector}`)}
                  className="w-full text-left px-4 py-2 text-gray-300 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {group.sector}
                </button>
                <div className="ml-4 space-y-1">
                  {group.categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => navigate(`/category/${category.name}`)}
                      className="w-full text-left px-4 py-1 text-sm text-gray-400 hover:bg-slate-700 rounded-lg transition-colors"
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

      {/* 主要內容區域 */}
      <div className="flex-1 flex min-w-0">
        {/* 中間文件列表 */}
        <div className="w-1/4 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            {/* 搜索框 */}
            <div className="mb-4">
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

            {/* 文件列表 */}
            <div className="space-y-2">
              {isSearching ? (
                // 搜索結果列表
                searchResults.map((file) => (
                  <div
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFile?.name === file.name ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-600 truncate mb-1">{file.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(file.date)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // 分類文件列表
                categoryGroups.map((group) => (
                  <div key={group.sector}>
                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-gray-500">{group.sector}</h3>
                    </div>
                    {group.categories.map((category) => (
                      <div key={category.name} className="ml-4 mb-4">
                        <h4 className="text-xs font-medium text-gray-400 mb-2">{category.name}</h4>
                        {category.files.map((file) => (
                          <div
                            key={file.name}
                            onClick={() => setSelectedFile(file)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedFile?.name === file.name ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-600 truncate mb-1">{file.title}</p>
                                <p className="text-xs text-gray-400">{formatDate(file.date)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右側預覽區 */}
        <div className="w-3/4 flex flex-col min-w-0 bg-white overflow-hidden">
          {selectedFile ? (
            <>
              {/* 預覽區頂部 */}
              <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedFile.name}</h2>
                    <p className="text-sm text-gray-600">{selectedFile.title}</p>
                    <p className="text-sm text-gray-500">上次更新：{formatDate(selectedFile.date)}</p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleDownload(selectedFile)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>下載文件</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* 預覽區內容 */}
              <div className="flex-1 relative overflow-hidden">
                <iframe
                  src={`${selectedFile.files?.[0]?.url}#zoom=45&view=bookmarks`}
                  className="absolute inset-0 w-full h-full border-0"
                  title={selectedFile.title}
                  style={{ maxWidth: '100%' }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>選擇一個文件以預覽</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 