export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD'
}

export enum DashboardModule {
  HOME = 'HOME',
  MENTOR = 'MENTOR',
  LISTING_OPTIMIZER = 'LISTING_OPTIMIZER',
  PRODUCT_FINDER = 'PRODUCT_FINDER',
  PROFIT_ANALYTICS = 'PROFIT_ANALYTICS',
  ADS_MANAGER = 'ADS_MANAGER',
  SETTINGS = 'SETTINGS'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ProductData {
  id: string;
  title: string;
  asin: string;
  price: number;
  rating: number;
  reviews: number;
  monthlySales: number;
  revenue: number;
  category: string;
}

export interface OptimizationResult {
  title: string;
  bulletPoints: string[];
  description: string;
  keywords: string[];
}