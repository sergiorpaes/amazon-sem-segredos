import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Send, Bot, Image as ImageIcon, Copy, Check, Download, RefreshCw, Upload, Save, History, Trash2, X } from 'lucide-react';
import { generateListing } from '../../services/listingGeneratorService';
import { generateListingImages } from '../../services/imageGenerationService';
import { getListings, saveListing as apiSaveListing, deleteListing as apiDeleteListing } from '../../services/listingService';
import { ListingGeneratorResult, SavedListing } from '../../types';
import { useLanguage } from '../../services/languageService';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ProductInput {
  productName: string;
  category: string;
  material: string;
  benefits: string;
  differentiators: string;
  audience: string;
  problem: string;
  usage: string;
}

export const ListingOptimizer: React.FC = () => {
  const { t, language } = useLanguage();
  const { refreshUser } = useAuth();

  // Questions with translations
  const QUESTIONS = useMemo(() => [
    { key: 'productName', label: t('lo.q.productName') },
    { key: 'category', label: t('lo.q.category') },
    { key: 'material', label: t('lo.q.material') },
    { key: 'benefits', label: t('lo.q.benefits') },
    { key: 'differentiators', label: t('lo.q.differentiators') },
    { key: 'audience', label: t('lo.q.audience') },
    { key: 'problem', label: t('lo.q.problem') },
    { key: 'usage', label: t('lo.q.usage') }
  ], [t]);

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<ProductInput>({
    productName: '', category: '', material: '', benefits: '', differentiators: '', audience: '', problem: '', usage: ''
  });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [listingResult, setListingResult] = useState<ListingGeneratorResult | null>(null);

  // Image State
  const [waitingForImage, setWaitingForImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // History State
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize Chat Language
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: '1', role: 'assistant', content: t('lo.intro') }]);
    }
  }, [t, messages.length]);

  // Load History on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getListings();
        setSavedListings(history);
      } catch (error) {
        console.error("Failed to fetch listing history", error);
      }
    };
    fetchHistory();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const currentQuestion = QUESTIONS[currentStep];
    const userResponse = inputValue.trim();

    // Add user message
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, content: userResponse }];
    setMessages(newMessages);
    setInputValue('');

    // Update inputs
    const updatedInputs = { ...inputs, [currentQuestion.key]: userResponse };
    setInputs(updatedInputs);

    // Next Step or Finish
    if (currentStep < QUESTIONS.length - 1) {
      setIsTyping(true);
      setTimeout(() => {
        const nextQ = QUESTIONS[currentStep + 1];
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: nextQ.label }]);
        setCurrentStep(prev => prev + 1);
        setIsTyping(false);
      }, 600);
    } else {
      // Finished Text Inputs -> Generate Listing
      setIsTyping(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: t('lo.processing.text') }]);

      try {
        const result = await generateListing(updatedInputs, language);
        setListingResult(result);
        refreshUser(); // Refresh credits after text generation

        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', content: t('lo.success.text') }
        ]);
        setWaitingForImage(true);
      } catch (error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: t('lo.error.text') }]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setWaitingForImage(false);
        handleGenerateImages(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImages = async (base64Image: string) => {
    setGeneratingImages(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: t('lo.processing.image') }]);

    try {
      const context = listingResult?.imagePromptContext || inputs.productName;
      const result = await generateListingImages(context, base64Image, language);
      refreshUser(); // Refresh credits after image generation

      if (result.images && result.images.length > 0) {
        setGeneratedImages(result.images);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: t('lo.success.image') }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: t('lo.error.image') }]);
        setWaitingForImage(true); // Allow retry/re-upload on failure
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: t('lo.error.image') }]);
      setWaitingForImage(true); // Allow retry/re-upload on error
    } finally {
      setGeneratingImages(false);
    }
  };

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderListingFields = (data: any, prefix: string) => {
    if (!data) return null;
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-lg border border-gray-200 dark:border-dark-700 group relative">
          <button onClick={() => copyToClipboard(data.title, `${prefix}-title`)} className="absolute top-2 right-2 text-gray-400 hover:text-brand-600">
            {copiedField === `${prefix}-title` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('lo.ui.title_label') || 'Título'}</label>
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{data.title}</p>
        </div>

        <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-lg border border-gray-200 dark:border-dark-700 group relative">
          <button onClick={() => copyToClipboard(data.bullets.join('\n'), `${prefix}-bullets`)} className="absolute top-2 right-2 text-gray-400 hover:text-brand-600">
            {copiedField === `${prefix}-bullets` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('lo.ui.bullets_label') || 'Bullet Points'}</label>
          <ul className="space-y-2">
            {data.bullets.map((bp: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                <span className="text-brand-500 font-bold">•</span> {bp}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-lg border border-gray-200 dark:border-dark-700 group relative">
          <button onClick={() => copyToClipboard(data.description, `${prefix}-desc`)} className="absolute top-2 right-2 text-gray-400 hover:text-brand-600">
            {copiedField === `${prefix}-desc` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('lo.ui.desc_label') || 'Descrição'}</label>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap h-32 overflow-y-auto custom-scrollbar">{data.description}</div>
        </div>

        <div className="bg-gray-50 dark:bg-dark-900 p-4 rounded-lg border border-gray-200 dark:border-dark-700 group relative">
          <button onClick={() => copyToClipboard(data.keywords, `${prefix}-kw`)} className="absolute top-2 right-2 text-gray-400 hover:text-brand-600">
            {copiedField === `${prefix}-kw` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('lo.ui.keywords_label') || 'Palavras-Chave'}</label>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-dark-800 p-3 rounded border border-gray-200 dark:border-dark-700">{data.keywords}</p>
        </div>
      </div>
    );
  };

  const handleSaveListing = async () => {
    if (!listingResult) return;

    const isAlreadySaved = savedListings.some(item =>
      item.createdAt === (listingResult as SavedListing).createdAt && item.productName === inputs.productName
    );

    if (isAlreadySaved) return;

    try {
      const savedItem = await apiSaveListing(
        inputs.productName || 'Sem nome',
        listingResult,
        generatedImages
      );

      setSavedListings(prev => [savedItem, ...prev]);
    } catch (error) {
      console.error("Failed to save listing", error);
      alert(t('lo.ui.save_error') || 'Erro ao salvar listing.');
    }
  };

  const handleDeleteListing = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('lo.ui.delete_confirm') || 'Tem certeza que deseja excluir?')) return;

    try {
      await apiDeleteListing(id);
      setSavedListings(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Failed to delete listing", error);
      alert(t('lo.ui.delete_error') || 'Erro ao excluir listing.');
    }
  };

  const handleLoadListing = (item: SavedListing) => {
    setListingResult(item);
    setGeneratedImages(item.generatedImages || []);
    setInputs(prev => ({ ...prev, productName: item.productName }));
    setShowHistory(false);
  };

  return (
    <div className="flex h-full gap-6 relative">
      {/* History Sidebar */}
      {showHistory && (
        <div className="absolute inset-y-0 left-0 z-50 w-80 bg-white dark:bg-dark-800 shadow-xl border-r dark:border-dark-700 transform transition-transform duration-300">
          <div className="p-4 border-b dark:border-dark-700 flex items-center justify-between bg-gray-50 dark:bg-dark-900">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-600" /> {t('lo.ui.history')}
            </h3>
            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-full pb-20 p-4 space-y-3">
            {savedListings.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-8">{t('lo.ui.history.empty')}</p>
            )}
            {savedListings.map((item) => (
              <div
                key={item.id}
                onClick={() => handleLoadListing(item)}
                className="bg-white dark:bg-dark-700 border dark:border-dark-600 hover:border-brand-300 p-3 rounded-lg shadow-sm cursor-pointer group transition-all"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-gray-800 text-sm line-clamp-1">{item.productName}</span>
                  <button
                    onClick={(e) => handleDeleteListing(item.id, e)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()} - {new Date(item.createdAt).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Column */}
      <div className="w-1/3 flex flex-col bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-dark-700 bg-gray-50 dark:bg-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand-600" />
            <span className="font-bold text-gray-700 dark:text-gray-200">{t('lo.ui.assistant')}</span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-gray-500 hover:text-brand-600 p-1 rounded hover:bg-gray-100"
            title={t('lo.ui.history')}
          >
            <History className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-br-none' : 'bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-200 rounded-bl-none shadow-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 p-3 rounded-lg rounded-bl-none shadow-sm flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t">
          {(waitingForImage || (listingResult && generatedImages.length === 0 && !generatingImages)) ? (
            <div
              onClick={() => imageInputRef.current?.click()}
              className="border-2 border-dashed border-brand-300 bg-brand-50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-100 transition-colors"
            >
              <Upload className="w-6 h-6 text-brand-600 mb-2" />
              <span className="text-sm font-medium text-brand-700">{t('lo.ui.upload')}</span>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t('lo.ui.input_placeholder')}
                className="flex-1 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                disabled={isTyping || generatingImages || (listingResult !== null && !waitingForImage && generatedImages.length > 0)}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result Column */}
      <div className="flex-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {!listingResult ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <Sparkles className="w-16 h-16 mb-4 text-gray-200" />
            <h3 className="text-xl font-semibold text-gray-500">{t('lo.ui.title')}</h3>
            <p className="max-w-md mt-2">{t('lo.ui.subtitle')}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {(listingResult.target?.title || listingResult.es?.title || listingResult.pt?.title || '').substring(0, 50)}...
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 dark:bg-dark-900 px-2 py-1 rounded inline-block mt-1">{inputs.category}</span>
              </div>
              <div className="flex items-center gap-2">
                {generatingImages && (
                  <div className="flex items-center gap-2 text-brand-600 bg-brand-50 px-3 py-1 rounded-full text-sm font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t('lo.ui.generating_images')}
                  </div>
                )}
                <button
                  onClick={handleSaveListing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" /> {t('lo.ui.save')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Images Showcase */}
              {generatedImages.length > 0 && (
                <div className="lg:col-span-2 grid grid-cols-3 gap-4 mb-4">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <img src={img} alt={`Generated ${idx}`} className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a href={img} download={`amazon-listing-${idx}.png`} className="text-white bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/40">
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Spanish Column (Left) */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b dark:border-dark-700 pb-2">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">
                    Espanhol
                  </h3>
                </div>
                {renderListingFields(listingResult.es || listingResult.target, 'es')}
              </div>

              {/* Portuguese Column (Right) */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 border-b dark:border-dark-700 pb-2">
                  <Bot className="w-5 h-5 text-brand-600" />
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">
                    Português
                  </h3>
                </div>
                {renderListingFields(listingResult.pt || listingResult.target, 'pt')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};