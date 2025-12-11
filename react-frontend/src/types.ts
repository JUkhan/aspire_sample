export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  username: string;
  roles: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}

export interface Product {
  name: string;
  price: number;
}

// Order types
export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  status: string;
  statusUrl: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  processedBy?: string;
  completedAt?: string;
  processingTime?: number;
  error?: string;
}
