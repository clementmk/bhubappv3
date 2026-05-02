import axios from 'axios';
import { REACT_APP_API_BASE_URL } from '@env';
// Base API configuration
// Environment detection for different platforms:
// 1. If running on Android emulator: 10.0.2.2:3001 (emulator's gateway to host)
// 2. If running on iOS simulator: localhost:3001
// 3. If running on physical device: use your PC's local IP (e.g., 192.168.x.x)
//
// CHANGE THIS to your local PC IP address or backend URL:
const API_BASE_URL = 'http://10.0.2.2:3001/api';
// For physical device on WiFi, replace above with: 'http://YOUR_PC_IP:3001/api'
// Example: 'http://192.168.1.6:3001/api'

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = await AsyncStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('API Timeout Error: Request took longer than 10 seconds');
    } else if (error.message === 'Network Error') {
      console.error('API Network Error: Cannot connect to server. Check API_BASE_URL and ensure backend is running.');
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// USER API ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

export const userAPI = {
  getLeaderboard: async (limit: number) => {
    try {
      const response = await api.get(`/users/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('getLeaderboard error:', error?.response?.data || error.message);
      throw error;
    }
  },

  getProfile: async (username: string) => {
    try {
      const response = await api.get(`/users/${username}`);
      return response.data;
    } catch (error: any) {
      console.error('getProfile error:', error?.response?.data || error.message);
      throw error;
    }
  },

  updateMembership: async (username: string, membershipType: string, membershipExpiry: string) => {
    try {
      const response = await api.put(`/users/${username}/membership`, {
        membershipType,
        membershipExpiry,
      });
      return response.data;
    } catch (error: any) {
      console.error('updateMembership error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// ROUTE API ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

export const routeAPI = {
  getLatestRoutes: async () => {
    try {
      const response = await api.get('/routes/latest');
      return response.data.routes;
    } catch (error: any) {
      console.error('getLatestRoutes error:', error?.response?.data || error.message);
      throw error;
    }
  },

  submitRouteCompletion: async (completionData: any) => {
    try {
      const response = await api.post('/routes/completions', completionData);
      return response.data;
    } catch (error: any) {
      console.error('submitRouteCompletion error:', error?.response?.data || error.message);
      throw error;
    }
  },

  getUserSends: async (username: string) => {
    try {
      const response = await api.get(`/routes/user/${username}`);
      return response.data;
    } catch (error: any) {
      console.error('getUserSends error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// BETA API ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

export const betaAPI = {
  // Upload beta video to cloud
  uploadBetaVideo: async (videoData: FormData) => {
    const response = await api.post('/betas/upload', videoData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get beta videos for route
  getBetasForRoute: async (routeId: number) => {
    const response = await api.get(`/betas/route/${routeId}`);
    return response.data;
  },

  // Like/unlike beta
  toggleBetaLike: async (betaId: number, liked: boolean) => {
    const response = await api.post(`/betas/${betaId}/like`, { liked });
    return response.data;
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// COMMUNITY API ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

export const communityAPI = {
  getPosts: async (page: number = 1, limit: number = 20) => {
    try {
      const response = await api.get(`/community/posts?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('getPosts error:', error?.response?.data || error.message);
      throw error;
    }
  },

  createPost: async (postData: any) => {
    try {
      const response = await api.post('/community/posts', postData);
      return response.data;
    } catch (error: any) {
      console.error('createPost error:', error?.response?.data || error.message);
      throw error;
    }
  },

  togglePostLike: async (postId: string, liked: boolean) => {
    try {
      const response = await api.post(`/community/posts/${postId}/like`, { liked });
      return response.data;
    } catch (error: any) {
      console.error('togglePostLike error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// NEWS API ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

export const newsAPI = {
  getLatestNews: async () => {
    try {
      const response = await api.get('/news/latest');
      return response.data;
    } catch (error: any) {
      console.error('getLatestNews error:', error?.response?.data || error.message);
      throw error;
    }
  },
};
// ──────────────────────────────────────────────────────────────────────────────
// SYNC UTILITIES
// ──────────────────────────────────────────────────────────────────────────────

export const syncAPI = {
  syncLocalChanges: async (changes: any) => {
    try {
      const response = await api.post('/sync/changes', changes);
      return response.data;
    } catch (error: any) {
      console.error('syncLocalChanges error:', error?.response?.data || error.message);
      throw error;
    }
  },
};

export default api;

