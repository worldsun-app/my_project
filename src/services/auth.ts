import { 
  getAuth, 
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';

// 登入函數
export const login = async (email: string, password: string): Promise<void> => {
  try {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// 匯出 User 類型
export type { User };

// 身份驗證服務
export const authService = {
  // 登入方法
  login: async (email: string, password: string) => {
    return login(email, password);
  },
  
  // 登出方法
  logout: async () => {
    return firebaseAuth.signOut();
  },
  
  // 獲取當前用戶
  getCurrentUser: () => {
    return firebaseAuth.currentUser;
  }
}; 