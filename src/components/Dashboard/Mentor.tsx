import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MoreHorizontal, Rocket } from 'lucide-react';
import { chatWithMentor } from '../../services/geminiService';
import { ChatMessage } from '../../types';
import { AGENTS, Agent } from '../../data/agents';
import { useLanguage } from '../../services/languageService';
import { useAuth } from '../../contexts/AuthContext';

interface MentorProps {
  onNavigate?: (module: any) => void;
}

export const Mentor: React.FC<MentorProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const { refreshUser } = useAuth();
  const [selectedAgent] = useState<Agent | null>(AGENTS.find(a => a.id === 'mentor-virtual') || AGENTS[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      let greeting = '';
      const description = selectedAgent.description[language] || selectedAgent.description['en'];

      if (language === 'pt') {
        greeting = `Olá! Eu sou o ${selectedAgent.name}. \n\n${description}. Como posso ajudar você hoje?`;
      } else if (language === 'es') {
        greeting = `¡Hola! Soy ${selectedAgent.name}. \n\n${description}. ¿Cómo puedo ayudarte hoy?`;
      } else {
        greeting = `Hello! I am ${selectedAgent.name}. \n\n${description}. How can I assist you today?`;
      }

      setMessages([
        {
          id: 'system-welcome',
          role: 'model',
          text: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [selectedAgent, language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || input;
    if (!textToSend.trim() || !selectedAgent) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Append language instruction to system prompt
      const langInstruction = `\n\nIMPORTANT: ALWAYS Answer in ${language === 'pt' ? 'Portuguese' : language === 'es' ? 'Spanish' : 'English'}.`;

      // Get the latest prompt builder result (if it's a function or just the string)
      // We need to ensure we are using the detailed prompt from AGENTS
      const agentPrompt = selectedAgent.systemPrompt;
      const fullInstructions = agentPrompt + langInstruction;

      console.log('Sending instructions to Mentor:', fullInstructions); // Debug log

      const responseText = await chatWithMentor(textToSend, messages, fullInstructions);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Não consegui entender, pode repetir?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      refreshUser(); // Refresh credits after mentor response
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // -- RENDER: CHAT INTERFACE --
  if (!selectedAgent) return null;
  const AgentIcon = selectedAgent.icon;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl shadow-2xl border border-dark-700 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-800 border border-gray-300 dark:border-dark-700 ${selectedAgent.color}`}>
              <AgentIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{selectedAgent.name}</h3>
              <p className="text-xs text-gray-400">Specialized Agent</p>
            </div>
          </div>
        </div>

        <button className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-tr-none font-medium'
                : 'bg-gray-100 dark:bg-dark-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-dark-700 rounded-tl-none'
                }`}
            >
              <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest font-bold opacity-70">
                {msg.role === 'user' ? (
                  <span className="flex items-center gap-1">Você <User className="w-3 h-3" /></span>
                ) : (
                  <span className="flex items-center gap-1 text-brand-400"><Bot className="w-3 h-3" /> {selectedAgent.name}</span>
                )}
              </div>

              {/* Message Content with Rich Media Support */}
              <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {msg.text.split(/(https?:\/\/[^\s]+|Route: \/[^\s]+)/g).map((part, i) => {
                  // 1. YouTube Video Embed
                  // Match robustly: looks for youtube.com or youtu.be followed by exactly 11 ID chars
                  const ytMatch = part.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);

                  if (ytMatch && ytMatch[1]) {
                    const videoId = ytMatch[1];
                    return (
                      <div key={i} className="my-3 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-900 bg-black">
                        <iframe
                          width="100%"
                          className="w-full aspect-video h-80 md:h-[500px]"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        <div className="p-2 bg-gray-900 text-center text-xs text-gray-400">
                          Vídeo Recomendado pelo Mentor
                        </div>
                      </div>
                    );
                  }

                  // 2. Internal Tool Route Button
                  if (part.startsWith('Route: ')) {
                    const route = part.replace('Route: ', '').trim();
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (onNavigate) {
                            if (route.includes('product-finder')) onNavigate('PRODUCT_FINDER');
                            else if (route.includes('listing-optimizer')) onNavigate('LISTING_OPTIMIZER');
                            else if (route.includes('suppliers')) onNavigate('SUPPLIER_FINDER');
                            else if (route.includes('profit-calculator')) onNavigate('PROFIT_CALCULATOR');
                            else if (route.includes('ads-manager')) onNavigate('ADS_MANAGER');
                            else if (route.includes('settings')) onNavigate('SETTINGS');
                            else if (route.includes('account')) onNavigate('ACCOUNT');
                          } else {
                            window.location.href = route;
                          }
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 mt-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all shadow-lg hover:shadow-brand-500/30 transform hover:-translate-y-0.5 font-bold text-sm tracking-wide"
                      >
                        <Rocket className="w-5 h-5" />
                        Acessar Ferramenta
                      </button>
                    );
                  }

                  // 3. Standard Links (including non-embeddable YouTube links)
                  if (part.match(/^https?:\/\//)) {
                    return (
                      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline break-all">
                        {part}
                      </a>
                    );
                  }

                  return part;
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-dark-800 rounded-2xl rounded-tl-none p-4 border border-gray-300 dark:border-dark-700 shadow-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-500 border-t-transparent"></div>
              <span className="text-sm text-gray-400 font-medium animate-pulse">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-50 dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700 shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t('mentor.placeholder')}
            className="flex-1 px-5 py-3 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-medium"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-xl transition-all shadow-lg shadow-brand-900/20 active:scale-95 flex items-center justify-center min-w-[3.5rem]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};