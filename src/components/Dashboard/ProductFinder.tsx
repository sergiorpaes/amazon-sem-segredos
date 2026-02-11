import React, { useState, useRef, useEffect } from 'react';
import { Search, BarChart2, AlertCircle, Box, Activity, ChevronDown, ChevronUp, Check, Tag } from 'lucide-react';
import { useLanguage } from '../../services/languageService';
import { useAuth } from '../../contexts/AuthContext';
import { searchProducts, getItemOffers, getBatchOffers } from '../../services/amazonAuthService';
import { SalesGraph } from "./SalesGraph";
import { SalesDetailModal } from "./SalesDetailModal";
import { ProductDetailModal } from "./ProductDetailModal";

interface ProductDisplay {
  id: string; // ASIN
  title: string;
  image?: string;
  brand?: string;
  price?: number;
  currency?: string; // Added currency field
  fallbackUsed?: boolean; // Added for falling back to lowest offer
  sales: number | null;
  percentile?: string; // Added for Sales Badge
  categoryTotal?: number; // Added for Tooltip details
  salesGraph?: string;
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
  const isHighValueTech = category && (
    category.includes('Electrónica') ||
    category.includes('Electronics') ||
    category.includes('Grandes electrodomésticos') ||
    category.includes('Major Appliances')
  );

  const rate = (isHighValueTech && price > 150) ? 0.12 : 0.15;
  const referral = price * rate;

  // 2. Fulfillment (Simplified tiered logic)
  const dimensions = rawData?.attributes?.item_dimensions?.[0];
  const weight = rawData?.attributes?.item_weight?.[0];
  let fulfillment = 0;

  if (!dimensions || !weight) {
    fulfillment = price * 0.15; // Rough estimate for total being 30%
  } else {
    const unitUpper = dimensions.unit?.toUpperCase() || '';
    const cm_l = unitUpper === 'INCHES' ? dimensions.length * 2.54 : dimensions.length;
    const cm_w = unitUpper === 'INCHES' ? dimensions.width * 2.54 : dimensions.width;
    const cm_h = unitUpper === 'INCHES' ? dimensions.height * 2.54 : dimensions.height;

    const weightUnitUpper = weight.unit?.toUpperCase() || '';
    const kg = weightUnitUpper === 'POUNDS' ? weight.value * 0.453592 : weight.value;

    if (cm_l <= 35 && cm_w <= 25 && cm_h <= 2 && kg <= 0.1) {
      fulfillment = 2.50;
    } else if (cm_l <= 45 && cm_w <= 34 && cm_h <= 26 && kg <= 1) {
      fulfillment = 4.50;
    } else if (kg <= 2) {
      fulfillment = 6.50;
    } else {
      fulfillment = 7.50 + (kg * 0.50);
    }

    // --- FBA Sanity Check (Toys Logic) ---
    const isToys = category && (category.includes('Brinquedos') || category.includes('Toys'));
    if (isToys && kg < 2) {
      const cap = price * 0.40;
      if (fulfillment > cap) {
        fulfillment = cap;
      }
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
    reviews: 450
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
    reviews: 120
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
    reviews: 85
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
    reviews: 54201
  },
];

const marketplaces = [
  // North America
  { name: 'United States', id: 'ATVPDKIKX0DER', code: 'US', flag: '🇺🇸' },
  { name: 'Canada', id: 'A2EUQ1WTGCTBG2', code: 'CA', flag: '🇨🇦' },
  { name: 'Mexico', id: 'A1AM78C64UM0Y8', code: 'MX', flag: '🇲🇽' },
  { name: 'Brazil', id: 'A2Q3Y263D00KWC', code: 'BR', flag: '🇧🇷' },
  // Europe
  { name: 'Spain', id: 'A1RKKUPIHCS9HS', code: 'ES', flag: '🇪🇸' },
  { name: 'United Kingdom', id: 'A1F83G8C2ARO7P', code: 'UK', flag: '🇬🇧' },
  { name: 'Germany', id: 'A1PA6795UKMFR9', code: 'DE', flag: '🇩🇪' },
  { name: 'France', id: 'A13V1IB3VIYZZH', code: 'FR', flag: '🇫🇷' },
  { name: 'Italy', id: 'APJ6JRA9NG5V4', code: 'IT', flag: '🇮🇹' },
  { name: 'Netherlands', id: 'A1805IZSGTT6HS', code: 'NL', flag: '🇳🇱' },
  { name: 'Sweden', id: 'A2NODRKZP88ZB9', code: 'SE', flag: '🇸🇪' },
  { name: 'Poland', id: 'A1C3SOZRARQ6R3', code: 'PL', flag: '🇵🇱' },
  { name: 'Turkey', id: 'A33AVAJ2PDY3EV', code: 'TR', flag: '🇹🇷' },
  // Middle East
  { name: 'UAE', id: 'A2VIGQ35RCS4UG', code: 'AE', flag: '🇦🇪' },
  { name: 'Saudi Arabia', id: 'A17E79C6D8DWNP', code: 'SA', flag: '🇸🇦' },
  // Asia Pacific
  { name: 'India', id: 'A21TJRUUN4KGV', code: 'IN', flag: '🇮🇳' },
  { name: 'Japan', id: 'A1VC38T7YXB528', code: 'JP', flag: '🇯🇵' },
  { name: 'Australia', id: 'A39IBJ37TRP1C6', code: 'AU', flag: '🇦🇺' },
  { name: 'Singapore', id: 'A19VAU5U5O7RUS', code: 'SG', flag: '🇸🇬' },
];

export const ProductFinder: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { refreshUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('A2Q3Y263D00KWC');
  const [isSearching, setIsSearching] = useState(false);
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [showLoadMore, setShowLoadMore] = useState(false);

  // Custom Dropdown States
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const marketplaceRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

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

  const sortedProducts = React.useMemo(() => {
    let sortableItems = [...products];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // Handle nested or special cases if needed, but simple key access works for top-level
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Push null/undefined to the bottom
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [products, sortConfig]);

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(new Set(products.map(p => p.id)));
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

  // Summary Metrics Calculation (based on current products)
  const totalNicheSales = products.reduce((acc, curr) => acc + (curr.sales || 0), 0);
  const avgNetMargin = products.length > 0
    ? products.reduce((acc, curr) => acc + ((curr.price || 0) - (curr.fbaFees || 0)), 0) / products.length
    : 0;
  const avgCompetition = products.length > 0
    ? products.reduce((acc, curr) => acc + (curr.activeSellers || 0), 0) / products.length
    : 0;
  const topPerformers = products.filter(p => p.percentile === '1%' || p.percentile === '3%').length;
  const opportunityScore = products.length > 0 ? (topPerformers / products.length) * 100 : 0;


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
        price: item.attributes?.list_price?.[0]?.value_with_tax || summary?.price?.amount || 0,
        currency: item.attributes?.list_price?.[0]?.currency || summary?.price?.currencyCode || 'USD',

        sales: item.estimated_sales || null, // Using backend estimated sales
        percentile: item.sales_percentile, // Using backend percentile (including NEW_RISING)
        categoryTotal: item.category_total, // For Enterprise tooltips
        salesHistory: generateHistoricalData(item.estimated_sales || 10), // Generate Graph Data
        revenue: item.estimated_revenue || null, // Using backend automated revenue
        score: null,
        bsr: item.salesRanks?.[0]?.displayGroupRanks?.[0]?.rank || null,
        fbaFees: item.fba_fees || null,
        fbaBreakdown: item.fba_breakdown,
        activeSellers: null,
        reviews: null,
        rawData: item // Store raw data for cache sync
      };
    });
  }

  const handleSearch = async (isLoadMore: boolean = false) => {
    if (!searchTerm) return;
    setIsSearching(true);
    setError(null);

    try {
      // Use nextToken if loading more, otherwise undefined for new search
      const tokenToUse = isLoadMore ? nextToken : undefined;

      const result = await searchProducts(searchTerm, selectedMarketplace, tokenToUse);
      console.log("Amazon Search Result:", result);

      // Refresh credit balance since searching consumes credits
      refreshUser();

      if (result && result.items && result.items.length > 0) {
        const mappedProducts = mapItemsToDisplay(result.items);

        if (isLoadMore) {
          setProducts(prev => [...prev, ...mappedProducts]);
        } else {
          setProducts(mappedProducts);
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

          console.log(`Starting Batch Pricing Fetch for ${asins.length} ASINs`);
          const batchResults = await getBatchOffers(asins, selectedMarketplace);

          if (Object.keys(batchResults).length > 0) {
            setProducts(currentProducts => {
              return currentProducts.map(p => {
                const offers = batchResults[p.id];
                if (offers && offers.price > 0) {
                  // Re-calculate fees and revenue if price changed (especially if it was 0)
                  const newPrice = offers.price;
                  const newFees = calculateFBAFeesFrontend(newPrice, p.rawData);
                  const newRevenue = p.sales ? newPrice * p.sales : (p.revenue || null);

                  // Trigger Cache Update in backend if this product was missing price
                  if (!p.price || p.price === 0) {
                    fetch('/.netlify/functions/amazon-proxy', {
                      method: 'POST',
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
                        raw_data: p.rawData,
                        access_token: 'internal', // Proxy will handle
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
      setError(err.message || 'Error');
    } finally {
      setIsSearching(false);
    }
  };

  const onSearchClick = () => {
    setNextToken(undefined); // Reset token for new search
    handleSearch(false);
  }

  const selectedFlag = marketplaces.find(m => m.id === selectedMarketplace)?.flag;
  const selectedCode = marketplaces.find(m => m.id === selectedMarketplace)?.code;

  return (

    <div className="space-y-4 h-full bg-gray-50 relative"> {/* Compact spacing, relative for modal */}
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
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm shadow-sm transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchClick()}
            />
          </div>

          {/* Custom Marketplace Dropdown */}
          <div className="relative" ref={marketplaceRef}>
            <button
              onClick={() => setIsMarketplaceOpen(!isMarketplaceOpen)}
              className="flex items-center gap-2 h-[46px] px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-brand-300 hover:ring-2 hover:ring-brand-100 transition-all shadow-sm min-w-[120px]"
            >
              <span className="text-xl">{selectedFlag}</span>
              <span className="flex-1 text-left">{selectedCode}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isMarketplaceOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMarketplaceOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="p-2 grid gap-1">
                  {marketplaces.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMarketplace(m.id);
                        setIsMarketplaceOpen(false);
                      }}
                      className={`
                                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                                        ${selectedMarketplace === m.id ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-700'}
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
            disabled={isSearching}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all text-sm shadow-lg shadow-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSearching ? t('searching') : t('search.button')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="text-brand-600 font-medium text-sm flex items-center gap-1 hover:text-brand-700 hover:underline transition-colors">
            {t('suppliers.link')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Niche Sales */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vendas Totais do Nicho</div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{totalNicheSales.toLocaleString()}</span>
            <BarChart2 className="w-5 h-5 text-brand-500 mb-1.5" />
          </div>
          <div className="text-[10px] text-gray-500 mt-1">unidades estimadas / mês</div>
        </div>

        {/* Avg Net Margin */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Margem Líquida Média</div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            {new Intl.NumberFormat(undefined, { style: 'currency', currency: products[0]?.currency || 'USD' }).format(avgNetMargin)}
          </div>
          <div className="h-1.5 w-full bg-green-50 mt-2 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-[65%]"></div>
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Preço - Taxas FBA</div>
        </div>

        {/* Competition Level */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nível de Competição</div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">{avgCompetition.toFixed(1)}</div>
          <div className="flex items-center gap-1 mt-2">
            <Activity className={`w-4 h-4 ${avgCompetition > 10 ? 'text-red-500' : 'text-green-500'}`} />
            <span className="text-[10px] text-gray-500 font-medium">sellers ativos por listing</span>
          </div>
        </div>

        {/* Opportunity Score */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-5 rounded-2xl shadow-lg shadow-brand-200 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-brand-100 uppercase tracking-widest mb-2">Opportunity Score</div>
            <div className="text-3xl font-bold mb-1">{opportunityScore.toFixed(0)}%</div>
            <div className="text-[10px] text-brand-100 font-medium">% de produtos Top 1% ou 3%</div>
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

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="text-sm text-gray-600 font-medium">
            {t('rows.selected')}: <span className="text-gray-900 font-bold">{selectedProductIds.size}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`text-brand-600 text-sm font-semibold hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors ${showFilter ? 'bg-brand-50' : ''}`}
            >
              {t('filter.results')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-gray-500 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4 border-b border-gray-100 w-12 text-center">#</th>

                <th className="px-5 py-4 border-b border-gray-100 min-w-[320px] cursor-pointer hover:bg-gray-50 transition-colors group/head" onClick={() => handleSort('title')}>
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

                <th className="px-5 py-4 border-b border-gray-100 text-center">{t('col.sales_graph') || "Sales Graph"}</th>

                <th className="px-5 py-4 border-b border-gray-100 text-right cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('revenue')}>
                  <div className="flex items-center justify-end gap-1">
                    {t('col.revenue')}
                    {sortConfig?.key === 'revenue' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />
                    )}
                  </div>
                </th>

                <th className="px-5 py-4 border-b border-gray-100 text-right cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleSort('bsr')}>
                  <div className="flex items-center justify-end gap-1">
                    {t('col.bsr')}
                    {sortConfig?.key === 'bsr' && (
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
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500 bg-gray-50/30">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p>{t('error.no_products')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-5 py-4 text-center text-gray-400 bg-gray-50/30 border-r border-gray-100 font-mono text-xs">
                      <div className="mb-2">{index + 1}</div>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        checked={selectedProductIds.has(product.id)}
                        onChange={() => handleSelectRow(product.id)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                          {product.image ? (
                            <img src={product.image} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                              <Box size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <button
                            onClick={() => setSelectedProductForDetail(product)}
                            className="font-medium text-brand-700 line-clamp-2 mb-1.5 hover:underline cursor-pointer text-base text-left w-full max-w-[400px]"
                            title={product.title}
                          >
                            {product.title}
                          </button>
                          <div className="flex items-center gap-2">
                            {product.category && (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                {t(product.category.startsWith('category.') ? product.category : product.category)}
                              </span>
                            )}
                            {/* Add rating stars later */}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded w-fit select-all">
                        {product.id}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700 font-medium truncate max-w-[150px]" title={product.brand || ''}>
                      {product.brand || '-'}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">
                      <div className="flex items-center justify-end gap-1.5">
                        {product.price ? new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : (product.currency === 'EUR' ? 'es-ES' : 'en-US'), {
                          style: 'currency',
                          currency: product.currency || 'USD'
                        }).format(product.price) : '-'}
                        {product.fallbackUsed && (
                          <Tag
                            size={14}
                            className="text-amber-500 cursor-help"
                            title="Preço baseado na menor oferta disponível (Professional Seller)"
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
                                'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            title={`Este produto está entre os top ${product.categoryTotal?.toLocaleString()} itens da categoria ${t(product.category)} (Baseado no Censo 2025).`}
                          >
                            Top {product.percentile}
                          </span>
                        )}
                        {product.percentile === 'NEW_RISING' && (
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-tighter bg-blue-100 text-blue-800 border border-blue-200 shadow-sm"
                            title="BSR não disponível no momento. Interesse de mercado estimado via volume de busca mensal."
                          >
                            New/Rising
                          </span>
                        )}
                        <span className="text-gray-900 font-bold text-base leading-none" title={product.percentile === 'NEW_RISING' ? 'BSR indisponível. Vendas estimadas baseadas no interesse de mercado.' : `Vendas estimadas nos últimos 30 dias baseadas no Censo BSR 2025 para ${t(product.category)}.`}>
                          {product.sales ? (product.sales < 10 ? '< 10' : product.sales.toLocaleString()) : (product.percentile === 'NEW_RISING' ? 'Emergente' : '-')}
                        </span>
                        {product.sales && <span className="text-[11px] text-gray-400 font-medium leading-none">unidades/mês</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <SalesGraph
                        data={product.salesHistory || []}
                        onClick={() => setSelectedProductForGraph(product)}
                      />
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900 tabular-nums">
                      {product.revenue ? new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : 'de-DE', {
                        style: 'currency',
                        currency: product.currency || 'USD',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(product.revenue) : '-'}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600 font-medium">
                      {product.bsr ? product.bsr.toLocaleString() : '-'}
                    </td>
                    <td className="px-5 py-4 text-right text-red-600 font-bold">
                      {product.fbaFees ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className="cursor-help"
                            title={`Referral (${Math.round((product.fbaBreakdown?.referral || 0) / (product.price || 1) * 100)}%): ${new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : (product.currency === 'EUR' ? 'es-ES' : 'en-US'), { style: 'currency', currency: product.currency || 'USD' }).format(product.fbaBreakdown?.referral || 0)} | Fulfillment: ${new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : (product.currency === 'EUR' ? 'es-ES' : 'en-US'), { style: 'currency', currency: product.currency || 'USD' }).format(product.fbaBreakdown?.fulfillment || 0)}${product.fbaBreakdown?.is_estimate ? ' (Estimado 30% Fallback)' : ''}`}
                          >
                            -{new Intl.NumberFormat(product.currency === 'BRL' ? 'pt-BR' : (product.currency === 'EUR' ? 'es-ES' : 'en-US'), { style: 'currency', currency: product.currency || 'USD' }).format(product.fbaFees)}{product.fbaBreakdown?.is_estimate ? '*' : ''}
                          </span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-5 py-4 text-center text-gray-600">
                      {product.activeSellers || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Load More Button */}
          {products.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex flex-col items-center gap-2 bg-gray-50">
              <button
                onClick={() => handleSearch(true)}
                disabled={isSearching || !nextToken}
                className="px-6 py-2 bg-white border border-gray-300 shadow-sm text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Loading...' : (nextToken ? 'Load More Results' : 'No More Results')}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

