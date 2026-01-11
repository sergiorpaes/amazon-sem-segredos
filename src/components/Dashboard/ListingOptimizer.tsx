import React, { useState } from 'react';
import { Sparkles, Copy, Check, AlertCircle } from 'lucide-react';
import { optimizeListing } from '../../services/geminiService';
import { OptimizationResult } from '../../types';

export const ListingOptimizer: React.FC = () => {
  const [details, setDetails] = useState('');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!details.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await optimizeListing(details);
      setResult(data);
    } catch (e) {
      alert("Erro ao gerar otimização.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-y-auto pb-8">
      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            Listing Optimizer AI
          </h2>
          <p className="text-gray-500 text-sm mt-1">Cole os detalhes do produto, características e público-alvo.</p>
        </div>

        <textarea
          className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none text-sm"
          placeholder="Ex: Garrafa térmica de aço inoxidável 500ml, mantém gelado por 24h, quente por 12h. Cor preta fosca. Ideal para academia e escritório. Inclui escova de limpeza."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleOptimize}
            disabled={loading || !details}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white shadow-md transition-all
              ${loading || !details ? 'bg-gray-300 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 hover:shadow-lg'}
            `}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Otimizando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar Listing Otimizada
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="space-y-6">
        {!result && !loading && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center h-64">
            <Sparkles className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Os resultados da IA aparecerão aqui</p>
            <p className="text-sm text-gray-400 max-w-xs mt-2">Nossa IA analisa tendências de palavras-chave e copywriting persuasivo para aumentar conversão.</p>
          </div>
        )}

        {result && (
          <>
            {/* Title Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Título Otimizado</h3>
                <button 
                  onClick={() => copyToClipboard(result.title, 'title')}
                  className="text-gray-400 hover:text-brand-600 transition-colors"
                >
                  {copied === 'title' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-gray-800 leading-relaxed font-medium">{result.title}</p>
            </div>

            {/* Bullets Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative">
               <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Bullet Points</h3>
                <button 
                   onClick={() => copyToClipboard(result.bulletPoints.join('\n'), 'bullets')}
                   className="text-gray-400 hover:text-brand-600 transition-colors"
                >
                  {copied === 'bullets' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <ul className="space-y-3">
                {result.bulletPoints.map((bp, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{bp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Keywords Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">Backend Keywords</h3>
                 <button 
                   onClick={() => copyToClipboard(result.keywords.join(', '), 'keywords')}
                   className="text-gray-400 hover:text-brand-600 transition-colors"
                >
                  {copied === 'keywords' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};