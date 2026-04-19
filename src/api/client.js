import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'web') return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
  return process.env.EXPO_PUBLIC_API_URL || 'https://posomepa.onrender.com/api';
};


const BASE_URL = getBaseUrl();

const isWeb = Platform.OS === 'web';

const storage = {
  getItem: async (key) => {
    if (isWeb) {
      return sessionStorage.getItem(key) || localStorage.getItem(key);
    }
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      return null;
    }
  },
  setItem: async (key, value) => {
    if (isWeb) {
      sessionStorage.setItem(key, value);
      localStorage.setItem(key, value);
    } else {
      AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key) => {
    if (isWeb) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } else {
      AsyncStorage.removeItem(key);
    }
  },
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await storage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (phone) => api.post('/auth/resend-otp', { phone }),
  completeRegistration: (data) => api.post('/auth/complete-registration', data),
  verifyFirebaseToken: (data) => api.post('/auth/verify-firebase-token', data),
  verifyFirebasePhone: (data) => api.post('/auth/verify-firebase-phone', data),
  registerWithPhone: (data) => api.post('/auth/register-with-phone', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  sendPhoneUpdateOTP: (phone) => api.post('/auth/send-phone-update-otp', { phone }),
  verifyPhoneUpdateOTP: (phone, otp) => api.post('/auth/verify-phone-update-otp', { phone, otp }),
};

export const spacesAPI = {
  getAll: (params) => api.get('/spaces', { params }),
  getMy: (params) => api.get('/spaces/my', { params }),
  getById: (id) => api.get(`/spaces/${id}`),
  create: (data) => api.post('/spaces', data),
  update: (id, data) => api.put(`/spaces/${id}`, data),
  delete: (id) => api.delete(`/spaces/${id}`),
  getFeatured: () => api.get('/spaces/featured'),
  getByCategory: (categoryId) => api.get(`/spaces/category/${categoryId}`),
  getBlockedDates: (id) => api.get(`/spaces/${id}/blocked-dates`),
  updateBlockedDates: (id, blockedDates) => api.put(`/spaces/${id}/blocked-dates`, { blockedDates }),
};

export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMy: (params) => api.get('/bookings/my', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.delete(`/bookings/${id}`),
  getAll: (params) => api.get('/bookings/admin', { params }),
  getBySpace: (spaceId, params) => api.get(`/bookings/space/${spaceId}`, { params }),
  getHostBookings: (params) => api.get('/bookings/host', { params }),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  getStats: () => api.get('/bookings/stats'),
  requestCancellation: (id) => api.post(`/bookings/${id}/request-cancellation`),
  approveCancellation: (id) => api.post(`/bookings/${id}/approve-cancellation`),
  approveCancellationNoRefund: (id) => api.post(`/bookings/${id}/approve-cancellation-no-refund`),
  rejectCancellation: (id, reason) => api.post(`/bookings/${id}/reject-cancellation`, { reason }),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const paymentsAPI = {
  createOrder: (bookingId) => api.post('/payments/create-order', { bookingId }),
  verify: (data) => api.post('/payments/verify', data),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};

export const recommendationsAPI = {
  getContentBased: (limit = 10) => api.get('/recommendations/content', { params: { limit } }),
  getCollaborative: (limit = 10) => api.get('/recommendations/collaborative', { params: { limit } }),
  getHybrid: (limit = 10) => api.get('/recommendations/hybrid', { params: { limit } }),
};

export const reviewsAPI = {
  add: async (data) => {
    const token = await storage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    return axios.post(`${BASE_URL}/reviews`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  },
  getBySpace: (spaceId) => api.get(`/reviews/space/${spaceId}`),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

export const uploadAPI = {
  uploadImages: async (images) => {
    const formData = new FormData();
    
    images.forEach((image, index) => {
      let uri, type, name;
      
      if (typeof image === 'string') {
        uri = image;
        type = 'image/jpeg';
        name = `image_${index}.jpg`;
      } else {
        uri = image.uri;
        type = image.mimeType || image.type || 'image/jpeg';
        name = image.fileName || image.name || `image_${Date.now()}_${index}.jpg`;
      }
      
      formData.append('images', {
        uri: uri,
        type: type,
        name: name,
      });
    });

    const token = await storage.getItem('token');
    
    const response = await axios.post(`${BASE_URL}/upload/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      timeout: 60000,
    });
    
    return response;
  },
};

export const aiAPI = {
  search: (query) => api.post('/ai/search', { query }), // query is a string, wrapped as { query }
  getSuggestions: () => api.get('/ai/suggestions'),
};

export const hostApplicationAPI = {
  getMy: () => api.get('/host-applications/my'),
  submit: async (formData) => {
    const token = await storage.getItem('token');
    const response = await axios.post(`${BASE_URL}/host-applications`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      timeout: 120000,
    });
    return response;
  },
  resubmit: () => api.post('/host-applications/resubmit'),
  getRejectionInfo: () => api.get('/host-applications/rejection-info'),
};

export const messagesAPI = {
  send: (data) => api.post('/messages', data),
  getMy: () => api.get('/messages'),
  getHostMessages: () => api.get('/messages/host'),
  getUnreadCount: () => api.get('/messages/unread'),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  markAllAsRead: () => api.put('/messages/read-all'),
  reply: (id, content) => api.post(`/messages/${id}/reply`, { content }),
  delete: (id) => api.delete(`/messages/${id}`),
};

export { storage };
export default api;
