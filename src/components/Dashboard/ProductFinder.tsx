import React, { useState } from 'react';
import { Search, TrendingUp, AlertCircle, Globe } from 'lucide-react';
import { analyzeProductOpportunity } from '../../services/geminiService';
import { searchProducts } from '../../services/amazonAuthService';

const mockProducts = [
  { id: '1', title: 'Kit Organizador Cozinha 4 Peças', category: 'Casa', sales: 450, revenue: 12500, score: 8.9 },
  { id: '2', title: 'Suporte Ergonômico Laptop', category: 'Eletrônicos', sales: 320, revenue: 9800, score: 9.2 },
  { id: '3', title: 'Garrafa Térmica Inteligente', category: 'Esportes', sales: 890, revenue: 22000, score: 9.5 },
];

const marketplaces = [
  { name: 'Spain', id: 'A1RKKUPIHCS9HS', code: 'ES', flag: '🇪🇸' },
  { name: 'United States', id: 'ATVPDKIKX0DER', code: 'US', flag: '🇺🇸' },
  { name: 'Brazil', id: 'A2Q3Y263D00KWC', code: 'BR', flag: '🇧🇷' },
  { name: 'United Kingdom', id: 'A1F83G8C2ARO7P', code: 'UK', flag: '🇬🇧' },
  { name: 'Germany', id: 'A1PA6795UKMFR9', code: 'DE', flag: '🇩🇪' },
  { name: 'France', id: 'A13V1IB3VIYZZH', code: 'FR', flag: '🇫🇷' },
  { name: 'Italy', id: 'APJ6JRA9NG5V4', code: 'IT', flag: '🇮🇹' },
  { name: 'Canada', id: 'A2EUQ1WTGCTBG2', code: 'CA', flag: '🇨🇦' },
  { name: 'Mexico', id: 'A1AM78C64UM0Y8', code: 'MX', flag: '🇲🇽' },
  { name: 'Australia', id: 'A39IBJ37TRP1C6', code: 'AU', flag: '🇦🇺' },
  { name: 'Japan', id: 'A1VC38T7YXB528', code: 'JP', flag: '🇯🇵' },
  { name: 'India', id: 'A21TJRUUN4KGV', code: 'IN', flag: '🇮🇳' },
  { name: 'Netherlands', id: 'A1805IZSGTT6HS', code: 'NL', flag: '🇳🇱' },
  { name: 'Sweden', id: 'A2NODRKZP88ZB9', code: 'SE', flag: '🇸🇪' },
  { name: 'Poland', id: 'A1C3SOZRARQ6R3', code: 'PL', flag: '🇵🇱' },
  { name: 'Turkey', id: 'A33AVAJ2PDY3EV', code: 'TR', flag: '🇹🇷' },
  { name: 'Saudi Arabia', id: 'A17E79C6D8DWNP', code: 'SA', flag: '🇸🇦' },
  { name: 'UAE', id: 'A2VIGQ35RCS4UG', code: 'AE', flag: '🇦🇪' },
  { name: 'Egypt', id: 'ARBP9OOSHTCHU', code: 'EG', flag: '🇪🇬' },
  { name: 'Singapore', id: 'A19VAU5U5O7RUS', code: 'SG', flag: '🇸🇬' },
];

interface ProductDisplay {
  id: string;
  title: string;
  category: string;
  sales: number | null;
  revenue: number | null;
  score: number | null;
}

export const ProductFinder: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Casa');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('A1RKKUPIHCS9HS'); // Default: Spain
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) return;
    setIsSearching(true);
    setError(null);
    setProducts([]);

    try {
      // Pass the selected marketplace ID to the service
      const result = await searchProducts(searchTerm, selectedMarketplace);
      console.log("Amazon Search Result:", result);

      if (result && result.items && result.items.length > 0) {
        // Map all items found
        const mappedProducts: ProductDisplay[] = result.items.map(item => {
          const summary = item.summaries && item.summaries.length > 0 ? item.summaries[0] : null;
          return {
            id: item.asin,
            title: summary?.itemName ? (summary.itemName.length > 60 ? summary.itemName.substring(0, 60) + '...' : summary.itemName) : 'Título Indisponível',
            category: summary?.websiteDisplayGroupName || 'Desconhecida',
            sales: null,
            revenue: null,
            score: null
          };
        });

        setProducts(mappedProducts);
      } else {
        setError('Nenhum produto encontrado.');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao buscar produto.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyzeCategory = async () => {
    setAnalyzing(true);
    const result = await analyzeProductOpportunity(selectedCategory);
    setAiAnalysis(result || "Sem análise disponível.");
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pb-8">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-4">

        {/* Marketplace & Search Row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">

          {/* Marketplace Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto min-w-[200px]">
            <Globe className="text-gray-400 w-5 h-5 hidden md:block" />
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value)}
            >
              {marketplaces.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.flag} {m.name} ({m.code})
                </option>
              ))}
            </select>
          </div>

          {/* Keyword/ASIN Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Digite palavras-chave ou ASIN..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching || !searchTerm}
            className="w-full md:w-auto bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Filters & AI Row (Optional) */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-end border-t border-gray-50 pt-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              className="flex-1 md:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="Casa">Casa & Cozinha</option>
              <option value="Eletrônicos">Eletrônicos</option>
              <option value="Esportes">Esportes</option>
            </select>
            <button
              onClick={handleAnalyzeCategory}
              disabled={analyzing}
              className="flex items-center gap-2 bg-dark-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-900 transition-colors whitespace-nowrap"
            >
              <TrendingUp className="w-4 h-4" />
              {analyzing ? '...' : 'IA'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* AI Insight Box */}
      {aiAnalysis && (
        <div className="bg-brand-50 border border-brand-200 p-6 rounded-xl relative">
          <div className="absolute top-4 left-4 bg-white p-1 rounded-full shadow-sm">
            <TrendingUp className="w-5 h-5 text-brand-600" />
          </div>
          <div className="ml-10">
            <h3 className="font-bold text-brand-800 mb-2">Insight de Mercado IA</h3>
            <div className="text-brand-900 text-sm leading-relaxed whitespace-pre-wrap">
              {aiAnalysis}
            </div>
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendas (Mês)</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receita Est.</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score IA</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && !isSearching ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Selecione o Marketplace e digite um termo/ASIN para buscar.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900" title={product.title}>{product.title}</div>
                    <div className="text-xs text-gray-400">ASIN: {product.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">-</td>
                  <td className="px-6 py-4 text-gray-400">-</td>
                  <td className="px-6 py-4 text-gray-400">-</td>
                  <td className="px-6 py-4">
                    <button className="text-brand-600 hover:text-brand-800 font-medium text-xs opacity-50 cursor-not-allowed">
                      Rastrear
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};