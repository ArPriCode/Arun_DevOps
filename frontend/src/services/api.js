import axios from 'axios';

// const API_BASE_URL = process.env.VITE_API_URL; 
const API_BASE_URL = import.meta.env.VITE_API_URL;


// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});
console.log(api)
// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data)
};

// Series API
export const seriesAPI = {
  getSeries: (params) => api.get('/series', { params }),
  getSeriesById: (id, params) => api.get(`/series/${id}`, { params })
};

// Reviews API
export const reviewsAPI = {
  getReviews: (params) => api.get('/reviews', { params }),
  createReview: (data) => api.post('/reviews', data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`)
};

// Favorites API
export const favoritesAPI = {
  addFavorite: (data) => api.post('/favorites', data),
  removeFavorite: (id) => api.delete(`/favorites/${id}`),
  getUserFavorites: (params) => api.get('/user/favorites', { params })
};

// User API
export const userAPI = {
  getUserProfile: (id) => api.get(`/users/${id}`),
  updateUserProfile: (id, data) => api.put(`/users/${id}`, data),
  getUserReviews: (params) => api.get('/user/reviews', { params })
};

// Admin Series API
export const adminSeriesAPI = {
  createSeries: (data) => api.post('/admin/series', data),
  updateSeries: (id, data) => api.put(`/admin/series/${id}`, data),
  deleteSeries: (id) => api.delete(`/admin/series/${id}`)
};

export default api;

