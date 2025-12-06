import axios from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest, WeatherForecast, Product } from '../types';

// Get API URL from environment (Aspire passes this via services__api-gateway__http__0)
const API_BASE_URL = import.meta.env.VITE_API_URL ||
                     (typeof window !== 'undefined' && (window as Record<string, string>).__API_URL__) ||
                     'http://localhost:5050';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },
};

// Weather API
export const weatherApi = {
  getForecasts: async (): Promise<WeatherForecast[]> => {
    const response = await api.get<WeatherForecast[]>('/api/weather/weatherforecast');
    return response.data;
  },
};

// Product API
export const productApi = {
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/api/products/product-list');
    return response.data;
  },
};

export default api;
