import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 管理員 email 列表
const ADMIN_EMAILS = [
  'service@wsgfo.com',
  'denniwu@wsgfo.com'
];

// 只在沒有初始化過的情況下初始化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const functions = getFunctions(app);

// 管理員權限檢查
export const checkAdminStatus = async (user: User): Promise<boolean> => {
  try {
    // 獲取用戶的 ID Token
    const idToken = await user.getIdToken(true);
    
    // 從 ID Token 中獲取自定義聲明
    const decodedToken = await user.getIdTokenResult();
    return decodedToken.claims.admin === true;
  } catch (error) {
    console.error('檢查管理員狀態時出錯:', error);
    return false;
  }
};

// 監聽用戶認證狀態變化
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 檢查用戶是否為管理員
export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email || '');
}; 