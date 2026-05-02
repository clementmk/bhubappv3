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
    // This hits http://192.168.x.x:3001/api/users/leaderboard
    const response = await api.get(`/users/leaderboard?limit=${limit}`);
    return response.data;
  },
  getProfile: async (username: string) => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },
  updateMembership: async (username: string, membershipType: string, membershipExpiry: string) => {
    const response = await api.put(`/users/${username}/membership`, { membershipType, membershipExpiry });
    return response.data;
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// ROUTE API ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

export const routeAPI = {
  // Get latest routes
  getLatestRoutes: async () => {
    const response = await api.get('/routes/latest');
    // Note: your controller returns {success, routes}, so we access .routes
    return response.data.routes;
  },

  submitRouteCompletion: async (completionData: any) => {
    // Matches router.post('/completions', ...) in routeRoutes.js
    const response = await api.post('/routes/completions', completionData);
    return response.data;
  },

  getUserSends: async (username: string) => {
    // Matches router.get('/user/:username', ...) in routeRoutes.js
    const response = await api.get(`/routes/user/${username}`);
    // Since getUserSends returns 'rows' directly, response.data is the array
    return response.data;
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
  // Get community posts
  getPosts: async (page: number = 1, limit: number = 20) => {
    const response = await api.get(`/community/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Create new post
  createPost: async (postData: any) => {
    const response = await api.post('/community/posts', postData);
    return response.data;
  },

  // Like/unlike post
  togglePostLike: async (postId: string, liked: boolean) => {
    const response = await api.post(`/community/posts/${postId}/like`, { liked });
    return response.data;
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// NEWS API ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

export const newsAPI = {
  // Get latest news
  getLatestNews: async () => {
    const response = await api.get('/news/latest');
    return response.data;
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// SYNC UTILITIES
// ──────────────────────────────────────────────────────────────────────────────

export const syncAPI = {
  // Sync local changes to cloud
  syncLocalChanges: async (changes: any) => {
    const response = await api.post('/sync/changes', changes);
    return response.data;
  },
};

export default api;
