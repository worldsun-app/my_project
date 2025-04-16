import { initializeApp } from 'firebase/app';
import { getAuth, type User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 管理員 email 列表
const ADMIN_EMAILS = [
  'service@wsgfo.com',
  'denniswu@wsgfo.com'
];

// 檢查用戶是否為管理員
export const isAdmin = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  
  try {
    // 首先檢查 email 列表
    if (ADMIN_EMAILS.includes(user.email || '')) {
      return true;
    }
    
    // 然後檢查 Firebase 自定義聲明
    const decodedToken = await user.getIdTokenResult();
    return decodedToken.claims.admin === true;
  } catch (error) {
    console.error('檢查管理員狀態時出錯:', error);
    return false;
  }
};

export { auth };
export type { User }; 