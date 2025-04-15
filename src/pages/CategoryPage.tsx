import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFilesGroupedBySector, type File } from '../services/airtable';
import { useAuth } from '../contexts/AuthContext';

type Category = {
  name: string;
  files: File[];
};

type CategoryGroup = {
  sector: string;
  categories: Category[];
};

const CategoryPage: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setError(null);
        const filesBySector = await getFilesGroupedBySector();
        const groups: CategoryGroup[] = [];

        Object.entries(filesBySector).forEach(([sectorName, sectorData]) => {
          const categoryList: Category[] = [];
          Object.entries(sectorData.categories).forEach(([catName, files]) => {
            categoryList.push({
              name: catName,
              files: files
            });
          });
          groups.push({
            sector: sectorName,
            categories: categoryList
          });
        });

        setCategoryGroups(groups);

        // 篩選當前分類的文件
        const files = groups.flatMap(group =>
          group.categories
            .filter(cat => cat.name === categoryName)
            .flatMap(cat => cat.files)
        );
        setFilteredFiles(files);
        setIsLoading(false);
      } catch (error) {
        console.error('獲取文件失敗:', error);
        setError(error instanceof Error ? error.message : '獲取文件時發生錯誤');
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [categoryName]);

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
    <div className="h-screen flex">
      {/* 左側導航欄 */}
      <div className="w-64 bg-slate-800 flex-shrink-0">
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
            <span className="font-medium">返回首頁</span>
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
                      className={`w-full text-left px-4 py-1 text-sm ${
                        category.name === categoryName 
                          ? 'text-blue-400 bg-slate-700' 
                          : 'text-gray-400 hover:bg-slate-700'
                      } rounded-lg transition-colors`}
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
      <div className="flex-1 flex">
        {/* 中間文件列表 */}
        <div className="w-[200px] flex-shrink-0 bg-white border-r border-gray-200">
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{categoryName}</h2>
              <div className="space-y-2">
                {filteredFiles.map((file) => (
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
                        <p className="text-xs text-gray-400">{file.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右側預覽區 */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedFile ? (
            <>
              {/* 預覽區頂部 */}
              <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedFile.name}</h2>
                  <p className="text-sm text-gray-600">{selectedFile.title}</p>
                  <p className="text-sm text-gray-500">上次更新：{selectedFile.date}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.open(selectedFile.downloadUrl, '_blank')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>下載文件</span>
                  </button>
                </div>
              </div>
              {/* 預覽區內容 */}
              <div className="flex-1 relative">
                <iframe
                  src={selectedFile.downloadUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  title={selectedFile.title}
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

export default CategoryPage; 