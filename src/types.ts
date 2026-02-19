export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USERS = 'ADMIN_USERS',
  RESET_PASSWORD = 'RESET_PASSWORD'
}

export enum DashboardModule {
  HOME = 'HOME',
  MENTOR = 'MENTOR',
  LISTING_OPTIMIZER = 'LISTING_OPTIMIZER',
  PRODUCT_FINDER = 'PRODUCT_FINDER',
  SUPPLIER_FINDER = 'SUPPLIER_FINDER',
  PROFIT_CALCULATOR = 'PROFIT_CALCULATOR',
  PROFIT_ANALYTICS = 'PROFIT_ANALYTICS',
  ADS_MANAGER = 'ADS_MANAGER',
  SETTINGS = 'SETTINGS',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USERS = 'ADMIN_USERS',
  ACCOUNT = 'ACCOUNT'
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

export interface ListingGeneratorResult {
  es: {
    title: string;
    bullets: string[];
    description: string;
    keywords: string;
  };
  pt: {
    title: string;
    bullets: string[];
    description: string;
    keywords: string;
  };
  keywords?: string; // Deprecated, kept for safety
  imagePromptContext?: string;
}

export interface SavedListing extends ListingGeneratorResult {
  id: string;
  productName: string;
  createdAt: string; // ISO Date string
  generatedImages: string[]; // Base64 strings
}

export interface ProductMetadata {
  id: string;
  title: string;
  image?: string;
  brand?: string;
  category?: string;
  weight?: { value: number; unit: string };
  dimensions?: { length: number; width: number; height: number; unit: string };
  price?: number;
  currency?: string;
  bsr?: number;
  offers?: number;
}