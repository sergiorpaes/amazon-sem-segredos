import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MoreHorizontal, Rocket, Sparkles, Youtube } from 'lucide-react';
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

      // console.log('Sending instructions to Mentor:', fullInstructions); // Debug log

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
              <p className="text-xs text-gray-400">{t('mentor.specialized_agent')}</p>
            </div>
          </div>
        </div>

        <button className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-white/50 dark:bg-dark-900/50 backdrop-blur-sm scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-20 h-20 bg-brand-50 dark:bg-dark-900 rounded-full flex items-center justify-center mb-6 shadow-xl ring-8 ring-brand-50/50 dark:ring-brand-900/20">
              <Bot className="w-10 h-10 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('mentor.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm text-lg leading-relaxed">{t('mentor.subtitle')}</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border-2 ${msg.role === 'user' ? 'bg-gray-100 dark:bg-dark-800 border-white dark:border-dark-700' : 'bg-brand-600 text-white border-brand-200 dark:border-brand-900/50'
                  }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className="space-y-2">
                  <div className={`text-[10px] font-bold uppercase tracking-widest px-1 ${msg.role === 'user' ? 'text-right text-gray-400 dark:text-gray-500' : 'text-brand-600 dark:text-brand-400'}`}>
                    {msg.role === 'user' ? t('mentor.you') : selectedAgent.name}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-premium ${msg.role === 'user'
                    ? 'bg-white dark:bg-dark-800 text-gray-800 dark:text-gray-200 rounded-tr-none border border-gray-100 dark:border-dark-700'
                    : 'bg-white dark:bg-dark-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-brand-100/50 dark:border-brand-900/20'
                    }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-p:my-1 prose-strong:text-brand-600 dark:prose-strong:text-brand-400">
                      {msg.text.split('\n').map((line, i) => {
                        // Special handling for YouTube links
                        if (line.includes('watch?v=') || line.includes('youtu.be/')) {
                          const videoId = line.includes('watch?v=') ? line.split('v=')[1]?.split('&')[0] : line.split('youtu.be/')[1]?.split('?')[0];
                          if (videoId) {
                            return (
                              <div key={i} className="my-4 bg-gray-50 dark:bg-dark-900 rounded-xl overflow-hidden border border-gray-200 dark:border-dark-700 shadow-lg group">
                                <div className="p-3 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center gap-2">
                                  <Youtube className="w-4 h-4 text-red-600" />
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('mentor.video_rec')}</span>
                                </div>
                                <div className="aspect-video relative">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                                    title="YouTube video player"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            );
                          }
                        }

                        // Special handling for internal route links
                        const routeMatch = line.match(/\[(.*?)\]\(\/dashboard\/(.*?)\)/);
                        if (routeMatch) {
                          const [fullMatch, buttonLabel, routeId] = routeMatch;
                          return (
                            <div key={i} className="my-3 flex justify-start">
                              <button
                                onClick={() => onNavigate(routeId)}
                                className="flex items-center gap-2.5 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 group"
                              >
                                <Sparkles className="w-4 h-4 opacity-70 group-hover:rotate-12 transition-transform" />
                                {t('mentor.access_tool')}: {buttonLabel}
                              </button>
                            </div>
                          );
                        }

                        return <p key={i} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        }} />;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-dark-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3 max-w-4xl mx-auto relative"
        >
          <div className="relative flex-1 group">
            <input
              type="text"
              className="w-full pl-5 pr-12 py-4 bg-gray-50 dark:bg-dark-800 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-700 text-base shadow-inner transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
              placeholder={t('mentor.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:bg-gray-400 transition-all shadow-lg shadow-brand-200 dark:shadow-none hover:scale-105 active:scale-95"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </form>
        <div className="mt-3 flex items-center justify-center gap-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-bold animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>{t('mentor.analyzing')}</span>
            </div>
          )}
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest">{t('modal.footer_disclaimer')}</span>
        </div>
      </div>
    </div>
  );
};