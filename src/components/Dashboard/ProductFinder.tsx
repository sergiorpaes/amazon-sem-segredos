import React, { useState, useRef, useEffect } from 'react';
import { Search, BarChart2, AlertCircle, Box, Activity, ChevronDown, ChevronUp, Check, Tag, Sparkles, Camera, Upload, Filter, DollarSign, Info } from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { useAuth } from '../../contexts/AuthContext';
import { searchProducts, getItemOffers, getBatchOffers, SUPPORTED_MARKETPLACES } from '../../services/amazonAuthService';
import { analyzeImage } from '../../services/geminiService';
import { compressImage } from '../../lib/imageUtils';
import { useSettings } from '../../contexts/SettingsContext';
import { SalesGraph } from "./SalesGraph";
import { SalesDetailModal } from "./SalesDetailModal";
import { ProductDetailModal } from "./ProductDetailModal";
import { CameraModal } from "./CameraModal";

interface ProductDisplay {
  id: string; // ASIN
  title: string;
  image?: string;
  brand?: string;
  price?: number;
  currency?: string; // Added currency field
  fallbackUsed?: boolean; // Added for falling back to lowest offer
  isListPrice?: boolean; // Added for MSRP detection
  sales: number | null;
  percentile?: string; // Added for Sales Badge
  categoryTotal?: number; // Added for Tooltip details
  salesHistory?: number[]; // Added for Graph Data
  revenue: number | null;
  bsr?: number;
  fbaFees?: number;
  fbaBreakdown?: {
    referral: number;
    fulfillment: number;
    is_estimate: boolean;
  };
  activeSellers?: number;
  reviews?: number;
  score: number | null;
  category: string;
  marketplace_id: string; // Added marketplace_id
  salesRanks?: any[]; // Added for detailed BSR display
  rawData?: any; // To store raw API data for cache updates
}





// Helper to generate simulated historical data based on current sales
const generateHistoricalData = (currentSales: number | null): number[] => {
  const baseSales = currentSales || Math.floor(Math.random() * 500) + 50; // Use random if null
  const points = 30; // 30 days
  const data: number[] = [];
  let lastValue = baseSales;

  for (let i = 0; i < points; i++) {
    // Random fluctuation between -20% and +20%
    const change = (Math.random() - 0.5) * 0.4;
    let newValue = Math.floor(lastValue * (1 + change));

    // Ensure non-negative
    if (newValue < 0) newValue = 0;

    data.push(newValue);
    lastValue = newValue;
  }
  return data.reverse();
};

const calculateFBAFeesFrontend = (price: number, rawData?: any): { total: number, referral: number, fulfillment: number, isEstimate: boolean } => {
  // 1. Referral (Dynamic: 12% tech caps or 15% standard)
  const category = rawData?.summaries?.[0]?.websiteDisplayGroupName || '';
  const normCategory = category.toLowerCase();

  const isHighValueTech =
    normCategory.includes('electrónica') ||
    normCategory.includes('electronics') ||
    normCategory.includes('grandes electrodomésticos') ||
    normCategory.includes('major appliances');

  const rate = (isHighValueTech && price > 150) ? 0.12 : 0.15;
  const referral = price * rate;

  // 2. Fulfillment (Simplified tiered logic with robust unit conversion)
  const dimensions = rawData?.attributes?.item_dimensions?.[0];
  const weight = rawData?.attributes?.item_weight?.[0];
  let fulfillment = 0;

  if (!dimensions || !weight) {
    // Fallback: 30% total estimated fees (15% fulfillment + 15% referral)
    // For high-ticket items (> 1000), we cap total estimate at 15%
    let fallbackRate = 0.15; // fulfillment part
    if (price > 1000) {
      fallbackRate = 0.05; // Cap fulfillment at 5% if price is high, since referral is always 12-15%
    }
    fulfillment = price * fallbackRate;
  } else {
    // --- Robust Unit Conversion ---
    const unitUpper = dimensions.unit?.toUpperCase() || 'CM';
    let cm_l = dimensions.length;
    let cm_w = dimensions.width;
    let cm_h = dimensions.height;

    if (unitUpper === 'INCHES') {
      cm_l *= 2.54; cm_w *= 2.54; cm_h *= 2.54;
    } else if (unitUpper === 'MILLIMETERS' || unitUpper === 'MM') {
      cm_l /= 10; cm_w /= 10; cm_h /= 10;
    }

    const weightUnitUpper = weight.unit?.toUpperCase() || 'KG';
    let kg = weight.value;

    if (weightUnitUpper.includes('POUND') || weightUnitUpper === 'LB' || weightUnitUpper === 'LBS') {
      kg *= 0.453592;
    } else if (weightUnitUpper.includes('OUNCE') || weightUnitUpper === 'OZ') {
      kg *= 0.0283495;
    } else if (weightUnitUpper.includes('GRAM') || weightUnitUpper === 'G' || weightUnitUpper === 'GR') {
      kg /= 1000;
    }

    // --- Tier Logic (Simplified but standard) ---
    if (cm_l <= 35 && cm_w <= 25 && cm_h <= 2 && kg <= 0.1) {
      fulfillment = 2.50; // Small Envelope
    } else if (cm_l <= 45 && cm_w <= 34 && cm_h <= 26 && kg <= 1) {
      fulfillment = 4.50; // Standard
    } else if (kg <= 2) {
      fulfillment = 6.50; // Standard 2kg
    } else {
      // Oversized or Heavy
      fulfillment = 9.50 + Math.max(0, (kg - 2) * 1.0);
    }

    // --- FBA Sanity Check (Toys Logic) ---
    const isToys = normCategory.includes('brinquedo') || normCategory.includes('toy');

    // If it's a toy, it should NEVER have massive fulfillment fees
    if (isToys) {
      const cap = price * 0.40;
      // If it was wrongly flagged as ultra-heavy, force a reasonable tier
      if (kg < 2 && fulfillment > 18.0) {
        fulfillment = 4.50;
      }
      if (fulfillment > cap) {
        fulfillment = cap;
      }
    }

    // Secondary Safety: Max 60% for anything standard under 5kg
    if (kg < 5 && fulfillment > (price * 0.60)) {
      fulfillment = price * 0.60;
    }
  }

  return {
    total: Math.round((referral + fulfillment) * 100) / 100,
    referral: Math.round(referral * 100) / 100,
    fulfillment: Math.round(fulfillment * 100) / 100,
    isEstimate: !dimensions || !weight
  };
};

const mockProducts: ProductDisplay[] = [
  {
    id: 'B07QKWS61P',
    title: 'Hoson 3/4 Inch Curling Iron Professional',
    image: 'https://m.media-amazon.com/images/I/61+R5-K8gQL._AC_UL320_.jpg',
    brand: 'Hoson',
    price: 24.64,
    sales: 3548,
    revenue: 87422.72,
    score: 8.9,
    category: 'Beauty',
    bsr: 2929,
    fbaFees: 8.84,
    activeSellers: 1,
    reviews: 450,
    marketplace_id: 'ATVPDKIKX0DER'
  },
  {
    id: 'B093C2B8ZP',
    title: 'Ceramic Mini Curling Iron for Short Hair',
    image: 'https://m.media-amazon.com/images/I/61j6+1q-1EL._AC_UL320_.jpg',
    brand: 'Hoson',
    price: 25.99,
    sales: 803,
    revenue: 20869.97,
    score: 9.2,
    category: 'Beauty',
    bsr: 21217,
    fbaFees: 8.36,
    activeSellers: 1,
    reviews: 120,
    marketplace_id: 'ATVPDKIKX0DER'
  },
  {
    id: 'B09JB8XP4M',
    title: 'Curling Iron for Short Hair 3/8 Inch',
    image: 'https://m.media-amazon.com/images/I/61-d-x+s+lL._AC_UL320_.jpg',
    brand: 'YEEGOR',
    price: 29.98,
    sales: 362,
    revenue: 10852.76,
    score: 9.5,
    category: 'Beauty',
    bsr: 57318,
    fbaFees: 9.02,
    activeSellers: 1,
    reviews: 85,
    marketplace_id: 'ATVPDKIKX0DER'
  },
  {
    id: 'B001MA0QY2',
    title: 'HSI Professional Glider | Ceramic Tourmaline',
    image: 'https://m.media-amazon.com/images/I/61Logic-g+L._AC_UL320_.jpg',
    brand: 'HSI PROFESSIONAL',
    price: 39.95,
    sales: 13555,
    revenue: 541522.25,
    score: 9.8,
    category: 'Beauty',
    bsr: 618,
    fbaFees: 11.13,
    activeSellers: 2,
    reviews: 54201,
    marketplace_id: 'ATVPDKIKX0DER'
  },
];


export const ProductFinder: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { refreshUser } = useAuth();
  const { enabledMarketplaces } = useSettings();

  // Filter marketplaces based on settings
  const availableMarketplaces = SUPPORTED_MARKETPLACES.filter(m => enabledMarketplaces.includes(m.id));

  // Default to US if available, then Brazil, otherwise first available, otherwise fallback to BR ID (shouldn't happen if logic prevents empty)
  const defaultMarketplace = availableMarketplaces.find(m => m.id === 'ATVPDKIKX0DER')?.id || availableMarketplaces.find(m => m.id === 'A2Q3Y263D00KWC')?.id || availableMarketplaces[0]?.id || 'ATVPDKIKX0DER';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>(defaultMarketplace);

  // Effect to ensure selected marketplace is valid when settings change
  useEffect(() => {
    if (!enabledMarketplaces.includes(selectedMarketplace)) {
      const fallback = availableMarketplaces.find(m => m.id === 'ATVPDKIKX0DER')?.id || availableMarketplaces.find(m => m.id === 'A2Q3Y263D00KWC')?.id || availableMarketplaces[0]?.id || 'ATVPDKIKX0DER';
      setSelectedMarketplace(fallback);
    }
  }, [enabledMarketplaces, selectedMarketplace, availableMarketplaces]);

  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [showLoadMore, setShowLoadMore] = useState(false);

  // Custom Dropdown States
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const marketplaceRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        try {
          // Compress large photos to avoid 504 errors on serverless functions 
          const compressedBase64 = await compressImage(base64Image, 800, 800, 0.7);
          const analysis = await analyzeImage(compressedBase64);
          if (analysis && analysis.amazon_optimized_query) {
            setSearchTerm(analysis.amazon_optimized_query);
            handleSearch(false, analysis.amazon_optimized_query);
          }
        } catch (err: any) {
          setError(err.message || "Erro ao analisar imagem");
        } finally {
          setIsAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File reading error:", err);
      setIsAnalyzingImage(false);
      setError("Erro ao ler arquivo de imagem");
    }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (marketplaceRef.current && !marketplaceRef.current.contains(event.target as Node)) {
        setIsMarketplaceOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [selectedProductForGraph, setSelectedProductForGraph] = useState<ProductDisplay | null>(null); // Modal State
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<ProductDisplay | null>(null); // Detail Modal State

  // Filter States
  const [brandFilter, setBrandFilter] = useState('');
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  // Sorting
  type SortConfig = {
    key: keyof ProductDisplay;
    direction: 'asc' | 'desc';
  } | null;
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const handleSort = (key: keyof ProductDisplay) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 1. First, apply filters (Brand, Price)
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      const matchBrand = !brandFilter || p.brand.toLowerCase().includes(brandFilter.toLowerCase());
      const matchMin = minPrice === null || (p.price || 0) >= minPrice;
      const matchMax = maxPrice === null || (p.price || 0) <= maxPrice;
      const hasValidPrice = p.price && p.price > 0;
      return matchBrand && matchMin && matchMax && hasValidPrice;
    });
  }, [products, brandFilter, minPrice, maxPrice]);

  // 2. Sorting based on filtered results
  const sortedProducts = React.useMemo(() => {
    let sortableItems = [...filteredProducts];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  // 3. Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProductIds(newSelected);
  };

  // 4. Analyzed Products (Used for Summary Metrics)
  // Logic: Use selected items if any, otherwise use all filtered items.
  const analyzedProducts = React.useMemo(() => {
    if (selectedProductIds.size > 0) {
      return products.filter(p => selectedProductIds.has(p.id));
    }
    return filteredProducts;
  }, [products, filteredProducts, selectedProductIds]);

  // Summary Metrics Calculation
  const totalNicheSales = analyzedProducts.reduce((acc, curr) => acc + (curr.sales || 0), 0);
  const avgNetMargin = analyzedProducts.length > 0
    ? analyzedProducts.reduce((acc, curr) => acc + ((curr.price || 0) - (curr.fbaFees || 0)), 0) / analyzedProducts.length
    : 0;
  const avgCompetition = analyzedProducts.length > 0
    ? analyzedProducts.reduce((acc, curr) => acc + (curr.activeSellers || 0), 0) / analyzedProducts.length
    : 0;
  const topPerformers = analyzedProducts.filter(p => p.percentile === '1%' || p.percentile === '3%').length;
  const opportunityScore = analyzedProducts.length > 0 ? (topPerformers / analyzedProducts.length) * 100 : 0;


  /* Helper to map API items to display items */
  const mapItemsToDisplay = (items: any[]): ProductDisplay[] => {
    return items.map(item => {
      const summary = item.summaries && item.summaries.length > 0 ? item.summaries[0] : null;
      // Determine generic category key for translation if possible, or use raw value
      let categoryKey = 'category.Unknown';
      const rawCategory = summary?.websiteDisplayGroupName || '';

      if (rawCategory.includes('Beauty')) categoryKey = 'category.Beauty';
      else if (rawCategory.includes('Electronics')) categoryKey = 'category.Electronics';
      else if (rawCategory.includes('Home')) categoryKey = 'category.Home';
      else if (rawCategory.includes('Kitchen')) categoryKey = 'category.Kitchen';
      else if (rawCategory.includes('Toy')) categoryKey = 'category.Toys';
      else if (rawCategory.includes('Sport')) categoryKey = 'category.Sports';

      // Extract MAIN Image
      let mainImage = null;
      if (item.images && item.images.length > 0) {
        // Flatten images from all marketplaces or pick the first marketplace's images
        const allImages = item.images.flatMap((m: any) => m.images || []);
        const mainImgObj = allImages.find((img: any) => img.variant === 'MAIN');
        mainImage = mainImgObj ? mainImgObj.link : null;
      }

      return {
        id: item.asin,
        title: summary?.itemName ? (summary.itemName.length > 120 ? summary.itemName.substring(0, 120) + '...' : summary.itemName) : 'Título Indisponível',
        image: mainImage,
        category: categoryKey !== 'category.Unknown' ? categoryKey : (rawCategory || 'category.Unknown'), // Store key or raw if no match
        brand: summary?.brand || summary?.brandName || '-',
        price: summary?.price?.amount || item.attributes?.list_price?.[0]?.value_with_tax || 0,
        currency: summary?.price?.currencyCode || item.attributes?.list_price?.[0]?.currency || 'USD',
        isListPrice: item.is_list_price,

        sales: item.estimated_sales || null, // Using backend estimated sales
        percentile: item.sales_percentile, // Using backend percentile (including NEW_RISING)
        categoryTotal: item.category_total, // For Enterprise tooltips
        salesHistory: generateHistoricalData(item.estimated_sales || 10), // Generate Graph Data
        revenue: item.estimated_revenue || null,
        score: null,
        bsr: item.salesRanks?.[0]?.displayGroupRanks?.[0]?.rank || null,
        fbaFees: item.fba_fees || null,
        fbaBreakdown: item.fba_breakdown,
        activeSellers: (item.active_sellers !== undefined && item.active_sellers !== null) ? item.active_sellers : null,
        reviews: null,
        marketplace_id: item.marketplace_id || selectedMarketplace, // Include marketplace_id
        salesRanks: item.salesRanks || [], // Pass full salesRanks data
        rawData: item // Store raw data for cache sync
      };
    });
  }

  const handleSearch = async (isLoadMore: boolean = false, overrideQuery?: string) => {
    const query = overrideQuery || searchTerm;
    if (!query) return;
    setIsSearching(true);
    setError(null);

    try {
      // Use nextToken if loading more, otherwise undefined for new search
      const tokenToUse = isLoadMore ? nextToken : undefined;

      const result = await searchProducts(query, selectedMarketplace, tokenToUse);
      // console.log("Amazon Search Result:", result);

      // Refresh credit balance since searching consumes credits
      refreshUser();

      if (result && result.items && result.items.length > 0) {
        // Map items but DO NOT filter by price > 0 immediately. 
        // The detailed Batch Pricing call will fill the price next.
        const mappedProducts = mapItemsToDisplay(result.items); // removed .filter(p => p.price && p.price > 0)

        if (isLoadMore) {
          setProducts(prev => [...prev, ...mappedProducts]);
        } else {
          setProducts(mappedProducts);
        }

        if (mappedProducts.length === 0 && !isLoadMore) {
          setError(t('error.no_products'));
        }

        // Handle Pagination
        if (result.pagination && result.pagination.nextToken) {
          setNextToken(result.pagination.nextToken);
          setShowLoadMore(true);
        } else {
          setNextToken(undefined);
          setShowLoadMore(false);
        }

        // --- Background Batch Fetch for Pricing and Offers ---
        const fetchPricing = async () => {
          const asins = mappedProducts.map(p => p.id);
          if (asins.length === 0) return;

          // console.log(`Starting Batch Pricing Fetch for ${asins.length} ASINs`);
          const batchResults = await getBatchOffers(asins, selectedMarketplace);

          if (Object.keys(batchResults).length > 0) {
            setProducts(currentProducts => {
              return currentProducts.map(p => {
                const offers = batchResults[p.id];
                if (offers) {
                  // Re-calculate fees and revenue if price changed (especially if it was 0)
                  const newPrice = offers.price > 0 ? offers.price : p.price;
                  const newFees = calculateFBAFeesFrontend(newPrice || 0, p.rawData);
                  const newRevenue = (p.sales && newPrice && p.fbaFees !== null) ? (p.sales * (newPrice - p.fbaFees)) : (p.revenue || null);

                  // Trigger Cache Update in backend if price changed from initial search
                  if (offers.price > 0 && (p.price !== newPrice || !p.price)) {
                    fetch('/.netlify/functions/amazon-proxy', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        intent: 'update_cache',
                        asin: p.id,
                        price: Math.round(newPrice * 100),
                        currency: offers.currency,
                        title: p.title,
                        image: p.image,
                        category: p.category,
                        brand: p.brand,
                        bsr: p.bsr,
                        estimated_sales: p.sales,
                        estimated_revenue: newRevenue ? Math.round(newRevenue * 100) : 0,
                        fba_fees: Math.round(newFees.total * 100),
                        referral_fee: Math.round(newFees.referral * 100),
                        fulfillment_fee: Math.round(newFees.fulfillment * 100),
                        net_profit: Math.round((newPrice - newFees.total) * 100),
                        sales_percentile: p.percentile,
                        is_list_price: false,
                        raw_data: p.rawData,
                        access_token: 'internal',
                        marketplaceId: selectedMarketplace
                      })
                    }).catch(err => console.error("Cache sync failed:", err));
                  }

                  return {
                    ...p,
                    price: newPrice,
                    activeSellers: offers.activeSellers,
                    currency: offers.currency,
                    fallbackUsed: offers.fallbackUsed,
                    isListPrice: offers.price > 0 ? false : p.isListPrice,
                    fbaFees: newFees.total,
                    fbaBreakdown: {
                      referral: newFees.referral,
                      fulfillment: newFees.fulfillment,
                      is_estimate: newFees.isEstimate
                    },
                    revenue: newRevenue
                  };
                }
                return p;
              });
            });
          }
        };
        fetchPricing();
        // -----------------------------------------------

      } else {
        if (!isLoadMore) {
          setProducts([]); // Clear if new search has no results
          setError(t('error.no_products'));
        }
        setShowLoadMore(false);
      }

    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || 'Error';
      if (errorMessage === 'Insufficient credits' || errorMessage.includes('Insufficient active credits in ledger')) {
        errorMessage = t('error.insufficient_credits');
      } else if (errorMessage === 'Internal Server Error' || errorMessage.includes('500')) {
        errorMessage = t('error.internal_server');
      } else if (errorMessage.includes('Erro ao buscar produto na Amazon')) {
        errorMessage = t('error.search_failed');
      }
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const onSearchClick = () => {
    setNextToken(undefined); // Reset token for new search
    handleSearch(false);
  }

  const selectedFlag = availableMarketplaces.find(m => m.id === selectedMarketplace)?.flag;
  const selectedCode = availableMarketplaces.find(m => m.id === selectedMarketplace)?.code;

  return (

    <div className="space-y-4 h-full bg-gray-50 dark:bg-dark-900 transition-colors duration-200 relative"> {/* Compact spacing, relative for modal */}
      {/* Sales Graph Modal */}
      <SalesDetailModal
        isOpen={!!selectedProductForGraph}
        onClose={() => setSelectedProductForGraph(null)}
        productTitle={selectedProductForGraph?.title || ''}
        data={selectedProductForGraph?.salesHistory || []}
        currentSales={selectedProductForGraph?.sales || 0}
        currentPrice={selectedProductForGraph?.price || 0}
        currency={selectedProductForGraph?.currency || 'USD'}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        product={selectedProductForDetail}
      />

      {/* Removed Top Header with Local Language Selector */}

      {/* Search Header - Compacted */}
      <div className="flex flex-col gap-6 items-center bg-white dark:bg-dark-800 p-5 md:p-8 rounded-3xl border border-gray-100 dark:border-dark-700 shadow-sm transition-all hover:shadow-md mx-2 sm:mx-0">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-brand-500" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className="w-full pl-12 pr-24 py-4 bg-gray-50 dark:bg-dark-700 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-600 text-sm md:text-base shadow-inner transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => setIsCameraModalOpen(true)}
                  disabled={isAnalyzingImage}
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all relative group/tooltip"
                  title={t('search.camera_tooltip')}
                >
                  <Camera className="w-5 h-5" />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {t('search.camera_tooltip')}
                  </span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzingImage}
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all relative group/tooltip"
                  title={t('search.image_tooltip')}
                >
                  {isAnalyzingImage ? (
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {t('search.image_tooltip')}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {/* Custom Marketplace Dropdown */}
              <div className="relative flex-1 md:flex-none" ref={marketplaceRef}>
                <button
                  onClick={() => setIsMarketplaceOpen(!isMarketplaceOpen)}
                  className="flex justify-center items-center gap-2 w-full h-[54px] md:h-[58px] px-4 bg-gray-50 dark:bg-dark-700 border-none rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-600 transition-all md:min-w-[120px]"
                >
                  <span className="text-xl">{selectedFlag}</span>
                  <span className="flex-1 md:flex-none text-left">{selectedCode}</span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${isMarketplaceOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMarketplaceOpen && (
                  <div className="absolute top-full right-0 mt-3 w-full md:w-64 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-700 z-50 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 grid gap-1">
                      {availableMarketplaces.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMarketplace(m.id);
                            setIsMarketplaceOpen(false);
                          }}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
                            ${selectedMarketplace === m.id ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' : 'hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300'}
                          `}
                        >
                          <span className="text-xl">{m.flag}</span>
                          <span className="flex-1 text-left truncate">{m.name}</span>
                          {selectedMarketplace === m.id && <Check size={14} className="text-brand-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onSearchClick}
                disabled={isSearching || isAnalyzingImage}
                className="bg-brand-600 flex-1 md:flex-none justify-center text-white px-6 md:px-10 h-[54px] md:h-[58px] rounded-2xl font-bold hover:bg-brand-700 transition-all text-sm md:text-base shadow-lg shadow-brand-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">{t('searching')}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('search.button')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full max-w-4xl">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('search.sources_title')}:</div>
          <div className="flex items-center justify-center sm:justify-start gap-4 flex-wrap w-full">
            {Object.entries({
              'Alibaba': `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(searchTerm)}`,
              '1688': `https://s.1688.com/youyuan/index.htm?tab=imageSearch&searchText=${encodeURIComponent(searchTerm)}`,
              'Zentrada': `https://www.zentrada.com/es/search/${encodeURIComponent(searchTerm)}?thesaurus=true`,
              'BigBuy': `https://www.bigbuy.eu/en/?query=${encodeURIComponent(searchTerm)}`,
              'Google Lens': `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}&tbm=shop`
            }).map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-brand-600 text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedProductIds.size > 0 && (
          <div className="lg:col-span-4 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 rounded-xl px-4 py-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-brand-700 font-bold text-xs uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              {t('pf.selected_analysis')} ({selectedProductIds.size})
            </div>
            <button
              onClick={() => setSelectedProductIds(new Set())}
              className="text-[10px] font-bold text-brand-600 hover:text-brand-800 underline underline-offset-2"
            >
              {t('pf.clear_filters')}
            </button>
          </div>
        )}
        {/* Total Niche Sales */}
        <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('summary.search_volume')}</div>
            <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter">
              {t('summary.feb_2026')}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{totalNicheSales.toLocaleString()}</span>
            <Search className="w-5 h-5 text-brand-500 mb-1.5" />
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{t('pf.est_sales_month')}</div>
        </div>

        {/* Avg Net Margin */}
        <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('pf.avg_net_margin')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {new Intl.NumberFormat(undefined, { style: 'currency', currency: products[0]?.currency || 'USD' }).format(avgNetMargin)}
          </div>
          <div className="h-1.5 w-full bg-green-50 dark:bg-green-900/20 mt-2 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-[65%]"></div>
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{t('pf.price_fba_fees')}</div>
        </div>

        {/* Competition Level */}
        <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('pf.comp_level')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{avgCompetition.toFixed(1)}</div>
          <div className="flex items-center gap-1 mt-2">
            <Activity className={`w-4 h-4 ${avgCompetition > 10 ? 'text-red-500' : 'text-green-500'}`} />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{t('pf.active_sellers_per_listing')}</span>
          </div>
        </div>

        {/* Opportunity Score */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-5 rounded-2xl shadow-lg shadow-brand-200 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-brand-100 uppercase tracking-widest mb-2">{t('pf.opportunity_score')}</div>
            <div className="text-3xl font-bold mb-1">{opportunityScore.toFixed(0)}%</div>
            <div className="text-[10px] text-brand-100 font-medium">{t('pf.opportunity_score_desc')}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold border border-white/30">
            {Math.min(10, Math.floor(opportunityScore / 10))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Product Table or Empty State */}
      {products.length === 0 && !isSearching && !error ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 shadow-sm mt-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-brand-50/50 dark:ring-brand-900/10">
            <Search className="w-10 h-10 text-brand-600 dark:text-brand-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('pf.empty_title')}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm text-center text-lg mb-8">{t('pf.empty_desc')}</p>
          <button
            onClick={() => {
              setSearchTerm('Curling Iron');
              onSearchClick();
            }}
            className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
          >
            {t('pf.first_search')}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden mt-4">
          <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex flex-wrap justify-between items-center bg-gray-50/50 dark:bg-dark-900/50 gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {t('rows.selected')}: <span className="text-gray-900 dark:text-white font-bold">{selectedProductIds.size}</span>
              </div>

              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showFilter || brandFilter || minPrice || maxPrice
                  ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-400'
                  : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
              >
                <Filter size={14} />
                {t('pf.filter')}
                {(brandFilter || minPrice || maxPrice) && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 ml-0.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Any other action buttons can go here */}
            </div>
          </div>

          {/* Collapsible Filter Bar */}
          {showFilter && (
            <div className="p-4 bg-white dark:bg-dark-800 border-b border-gray-100 dark:border-dark-700 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('pf.brand')}</label>
                  <input
                    type="text"
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    placeholder="..."
                    className="px-3 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-100 dark:border-dark-600 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 outline-none w-48 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('pf.min_price')}</label>
                  <input
                    type="number"
                    value={minPrice || ''}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : null)}
                    placeholder="0.00"
                    className="px-3 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-100 dark:border-dark-600 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 outline-none w-28 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('pf.max_price')}</label>
                  <input
                    type="number"
                    value={maxPrice || ''}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                    placeholder="999..."
                    className="px-3 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-100 dark:border-dark-600 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 outline-none w-28 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-end h-full pt-5">
                  {(brandFilter || minPrice || maxPrice) && (
                    <button
                      onClick={() => {
                        setBrandFilter('');
                        setMinPrice(null);
                        setMaxPrice(null);
                      }}
                      className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                    >
                      {t('pf.clear_filters')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white dark:bg-dark-800 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-5 py-4 border-b border-gray-100 dark:border-dark-700 w-12 text-center">#</th>

                  <th className="px-5 py-4 border-b border-gray-100 dark:border-dark-700 min-w-[320px] cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group/head" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-1">
                      {t('col.product_details')}
                      {sortConfig?.key === 'title' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />
                      )}
                    </div>
                  </th>

                  <th className="px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">
                      {t('col.asin')}
                      {sortConfig?.key === 'id' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />
                      )}
                    </div>
                  </th>

                  <th className="px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('brand')}>
                    <div className="flex items-center gap-1">
                      {t('col.brand')}
                      {sortConfig?.key === 'brand' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />
                      )}
                    </div>
                  </th>

                  <th className="px-5 py-4 border-b border-gray-100 text-right cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('price')}>
                    <div className="flex items-center justify-end gap-1">
                      {t('col.price')}
                      {sortConfig?.key === 'price' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />
                      )}
                    </div>
                  </th>

                  <th className="px-5 py-4 border-b border-gray-100 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('sales')}>
                    <div className="flex items-center justify-center gap-1">
                      {t('col.sales')}
                      {sortConfig?.key === 'sales' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />
                      )}
                    </div>
                  </th>

                  <th className="py-4 pr-5 pl-0 border-b border-gray-100 text-left min-w-[300px]">{t('col.ranking_bsr') || "Ranking (BSR)"}</th>

                  <th className="px-5 py-4 border-b border-gray-100 text-right cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors" onClick={() => handleSort('revenue')}>
                    <div className="flex items-center justify-end gap-1">
                      {t('col.revenue')}
                      {sortConfig?.key === 'revenue' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />
                      )}
                    </div>
                  </th>

                  <th className="px-5 py-4 border-b border-gray-100 text-right cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('fbaFees')}>
                    <div className="flex items-center justify-end gap-1">
                      {t('col.fba_fees')}
                      {sortConfig?.key === 'fbaFees' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />
                      )}
                    </div>
                  </th>

                  <th className="px-5 py-4 border-b border-gray-100 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('activeSellers')}>
                    <div className="flex items-center justify-center gap-1">
                      {t('col.active_sellers')}
                      {sortConfig?.key === 'activeSellers' && (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50/30 dark:bg-dark-900/30">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        <p>{t('error.no_products')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((product, index) => (
                    <tr key={product.id} className="hover:bg-blue-50/50 dark:hover:bg-brand-900/10 transition-colors group">
                      <td className="px-5 py-4 text-center text-gray-400 dark:text-gray-500 bg-gray-50/30 dark:bg-dark-900/30 border-r border-gray-100 dark:border-dark-700 font-mono text-xs">
                        <div className="mb-2">{index + 1}</div>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          checked={selectedProductIds.has(product.id)}
                          onChange={() => handleSelectRow(product.id)}
                        />
                      </td>
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 flex-shrink-0 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-1 shadow-sm">
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-gray-300 dark:text-gray-600">
                                <Box size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <button
                              onClick={() => setSelectedProductForDetail(product)}
                              className="font-medium text-brand-700 dark:text-brand-400 line-clamp-2 mb-1.5 hover:underline cursor-pointer text-base text-left w-full max-w-[400px]"
                              title={product.title}
                            >
                              {product.title}
                            </button>
                            <div className="flex items-center gap-2">
                              {product.category && (
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                  {t(product.category.startsWith('category.') ? product.category : product.category)}
                                </span>
                              )}
                              <button
                                onClick={() => setSelectedProductForDetail(product)}
                                className="text-brand-600 hover:text-brand-800 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                title={t('analyze.button')}
                              >
                                <Sparkles className="w-3 h-3" /> {t('analyze.button')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-gray-900 dark:text-gray-200 font-mono text-xs bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded w-fit select-all">
                          {product.id}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300 font-medium truncate max-w-[150px]" title={product.brand || ''}>
                        {product.brand || '-'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900 dark:text-white">
                        <div className="flex items-center justify-end gap-1.5">
                          {product.price ? new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : (product.currency === 'EUR' ? 'es-ES' : 'en-US'), {
                            style: 'currency',
                            currency: product.currency || 'USD'
                          }).format(product.price) : '-'}
                          {product.fallbackUsed && (
                            <Tag
                              size={14}
                              className="text-amber-500 cursor-help"
                              title={t('pf.price_fallback_tip')}
                            />
                          )}
                          {product.isListPrice && (
                            <Tag
                              size={14}
                              className="text-red-500 cursor-help"
                              title={t('pf.msrp_tip')}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          {product.percentile && product.percentile !== 'NEW_RISING' && (
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-tighter shadow-sm border ${product.percentile === '1%' ? 'bg-green-800 text-white border-green-900' :
                                product.percentile === '3%' ? 'bg-green-100 text-green-800 border-green-200' :
                                  'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-dark-600'
                                }`}
                              title={t('pf.top_percentile_tip').replace('{total}', product.categoryTotal?.toLocaleString() || '').replace('{category}', t(product.category))}
                            >
                              Top {product.percentile}
                            </span>
                          )}
                          {product.percentile === 'NEW_RISING' && (
                            <span
                              className="text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-tighter bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 shadow-sm"
                              title={t('pf.bsr_tool_tip')}
                            >
                              New/Rising
                            </span>
                          )}
                          <span className="text-gray-900 dark:text-white font-bold text-base leading-none" title={product.percentile === 'NEW_RISING' ? t('pf.bsr_unavailable_tip') : t('pf.sales_census_tip').replace('{category}', t(product.category))}>
                            {product.sales ? (product.sales < 10 ? '< 10' : product.sales.toLocaleString()) : (product.percentile === 'NEW_RISING' ? t('pf.emerging') : '-')}
                          </span>
                          {product.sales && <span className="text-[11px] text-gray-400 font-medium leading-none">{t('pf.units_month')}</span>}
                        </div>
                      </td>
                      <td className="py-4 pr-5 pl-0 text-left align-top min-w-[300px]">
                        <div className="flex flex-col gap-2 text-xs">
                          {product.salesRanks && product.salesRanks.length > 0 ? (
                            product.salesRanks.map((sr: any, idx: number) => (
                              <div key={idx} className="flex flex-col gap-1.5">
                                {sr.displayGroupRanks?.map((dgr: any, i: number) => (
                                  <div key={`dgr-${i}`} className="text-gray-900 dark:text-gray-100 leading-snug">
                                    <span className="font-bold whitespace-nowrap">Nº {dgr.rank.toLocaleString()}</span> em <a href={dgr.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">{dgr.title}</a>
                                  </div>
                                ))}
                                {sr.classificationRanks?.map((cr: any, i: number) => (
                                  <div key={`cr-${i}`} className="text-gray-900 dark:text-gray-100 leading-snug">
                                    <span className="font-bold text-gray-700 dark:text-gray-400 whitespace-nowrap">Nº {cr.rank.toLocaleString()}</span> em <a href={cr.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">{cr.title}</a>
                                  </div>
                                ))}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {product.revenue ? new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : 'de-DE', {
                          style: 'currency',
                          currency: product.currency || 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(product.revenue) : '-'}
                      </td>

                      <td className="px-5 py-4 text-right text-red-600 font-bold">
                        {product.fbaFees ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span
                              className="cursor-help"
                              title={t('pf.fba_breakdown_tip')
                                .replace('{rate}', Math.round((product.fbaBreakdown?.referral || 0) / (product.price || 1) * 100).toString())
                                .replace('{referral}', new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : (product.currency === 'EUR' ? 'es-ES' : 'en-US'), { style: 'currency', currency: product.currency || 'USD' }).format(product.fbaBreakdown?.referral || 0))
                                .replace('{fulfillment}', new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : (product.currency === 'EUR' ? 'es-ES' : 'en-US'), { style: 'currency', currency: product.currency || 'USD' }).format(product.fbaBreakdown?.fulfillment || 0))
                                .replace('{estimate}', product.fbaBreakdown?.is_estimate ? ' (Estimado 30% Fallback)' : '')}
                            >
                              -{new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : (product.currency === 'EUR' ? 'es-ES' : 'en-US'), { style: 'currency', currency: product.currency || 'USD' }).format(product.fbaFees)}{product.fbaBreakdown?.is_estimate ? '*' : ''}
                            </span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-4 text-center text-gray-600 dark:text-gray-400">
                        {(product.activeSellers !== undefined && product.activeSellers !== null) ? product.activeSellers : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden flex flex-col gap-4 p-4 bg-gray-50/50 dark:bg-dark-900/50">
            {products.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-sm flex flex-col items-center gap-2">
                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                <p>{t('error.no_products')}</p>
              </div>
            ) : (
              sortedProducts.map((product, index) => (
                <div key={product.id} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 shadow-sm relative flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-dark-700 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 flex-shrink-0 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg p-1">
                        {product.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center text-gray-300 dark:text-gray-600">
                            <Box size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <button onClick={() => setSelectedProductForDetail(product)} className="font-medium text-brand-700 dark:text-brand-400 line-clamp-2 text-sm text-left leading-tight hover:underline">
                          {product.title}
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-dark-700 px-1 rounded">{product.id}</span>
                          {product.percentile && product.percentile !== 'NEW_RISING' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                              Top {product.percentile}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer flex-shrink-0"
                      checked={selectedProductIds.has(product.id)}
                      onChange={() => handleSelectRow(product.id)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">{t('col.price')}</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {product.price ? new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency: product.currency || 'USD' }).format(product.price) : '-'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">{t('col.sales')}</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {product.sales ? product.sales.toLocaleString() : '-'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">{t('col.revenue')}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {product.revenue ? new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency: product.currency || 'USD', maximumFractionDigits: 0 }).format(product.revenue) : '-'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">{t('col.active_sellers')}</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {product.activeSellers ?? '-'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProductForDetail(product)}
                    className="w-full mt-2 py-2.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" /> {t('analyze.button')}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Load More Button */}
          {products.length > 0 && (
            <div className="px-6 py-12 text-center bg-gray-50/50 dark:bg-dark-900/50 border-t border-gray-100 dark:border-dark-700">
              {showLoadMore ? (
                <button
                  onClick={() => handleSearch(true)}
                  disabled={isSearching}
                  className="px-8 py-3 bg-white dark:bg-dark-800 border-2 border-brand-200 dark:border-brand-900/50 text-brand-700 dark:text-brand-400 rounded-2xl font-bold hover:bg-brand-50 dark:hover:bg-dark-700 transition-all shadow-sm flex items-center gap-2 mx-auto"
                >
                  {isSearching ? <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /> : <ChevronDown className="w-5 h-5" />}
                  {isSearching ? t('pf.loading_more') : t('pf.load_more')}
                </button>
              ) : (
                <div className="text-sm text-gray-400 dark:text-gray-500 font-medium">{t('pf.no_more')}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={async (base64Image) => {
          setIsAnalyzingImage(true);
          try {
            const analysis = await analyzeImage(base64Image);
            if (analysis && analysis.amazon_optimized_query) {
              setSearchTerm(analysis.amazon_optimized_query);
              handleSearch(false, analysis.amazon_optimized_query);
            }
          } catch (err: any) {
            setError(err.message || 'Erro ao analisar imagem');
          } finally {
            setIsAnalyzingImage(false);
          }
        }}
      />
    </div>
  );
};
