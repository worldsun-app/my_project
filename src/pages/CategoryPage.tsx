import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFilesGroupedBySector, type File } from '../services/airtable';
import { formatDate } from '../utils/dateUtils';
import { fontStyles } from '../styles/fonts';

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

const CategoryPage: React.FC = () => {
  const { sector, category } = useParams<{ sector: string; category: string }>();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryStyle, setCategoryStyle] = useState<{ bgColor: string; textColor: string; borderColor: string }>({
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200'
  });

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const filesBySector = await getFilesGroupedBySector();
        const sectorData = filesBySector[sector || ''];
        if (sectorData) {
          const categoryFiles = sectorData.categories[category || ''] || [];
          setFiles(categoryFiles);

          // 設置分類樣式
          const categoryIndex = Object.keys(sectorData.categories).indexOf(category || '');
          if (categoryIndex !== -1) {
            const colorIndex = categoryIndex % colorSchemes.length;
            setCategoryStyle(colorSchemes[colorIndex]);
          }
        } else {
          setFiles([]);
        }
      } catch (err) {
        setError('無法載入檔案列表');
        console.error('載入檔案列表失敗:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [sector, category]);

  const handleDownload = (url: string, name: string) => {
    if (!url) {
      console.error('下載 URL 為空');
      alert('下載連結無效');
      return;
    }
    console.log('開始下載:', { name, url });
    
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className={`p-6 ${categoryStyle.bgColor} border-b ${categoryStyle.borderColor}`}>
          <h1 className={`${fontStyles.title} text-2xl ${categoryStyle.textColor}`}>
            {sector} - {category}
          </h1>
          <p className={`${fontStyles.body} text-gray-600 mt-2`}>
            共 {files.length} 份報告
          </p>
        </div>
        <div className="divide-y">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="p-6 hover:bg-gray-50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex flex-col">
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
        </div>
      </div>
    </div>
  );
};

export default CategoryPage; 