import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';

// Firebase 配置
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 登入函數
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('登入失敗:', error);
    throw error;
  }
};

// 匯出 User 類型
export type { User };

// 身份驗證服務
export const authService = {
  // 登入方法
  login: async (email: string, password: string) => {
    // 待實現
  },
  
  // 登出方法
  logout: async () => {
    // 待實現
  },
  
  // 獲取當前用戶
  getCurrentUser: () => {
    // 待實現
  }
}; 