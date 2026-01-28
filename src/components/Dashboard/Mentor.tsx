import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { chatWithMentor } from '../../services/geminiService';
import { ChatMessage } from '../../types';
import { AGENTS, Agent } from '../../data/agents';
import { useLanguage } from '../../services/languageService';

export const Mentor: React.FC = () => {
  const { language, t } = useLanguage();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
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
      const fullInstructions = selectedAgent.systemPrompt + langInstruction;

      const responseText = await chatWithMentor(textToSend, messages, fullInstructions);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Não consegui entender, pode repetir?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
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

  // -- RENDER: AGENT SELECTION GRID --
  if (!selectedAgent) {
    return (
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('mentor.title')}</h2>
          <p className="text-gray-500">{t('mentor.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            return (
              <button
                key={agent.id}
                onClick={() => !agent.isComingSoon && setSelectedAgent(agent)}
                disabled={agent.isComingSoon}
                className={`
                  relative flex flex-col p-6 rounded-2xl border text-left transition-all duration-300 group
                  ${agent.isComingSoon
                    ? 'bg-gray-900/5 border-gray-200 cursor-not-allowed opacity-70'
                    : 'bg-dark-900 border-dark-700 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-900/10 hover:-translate-y-1'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <Icon className={`w-8 h-8 ${agent.isComingSoon ? 'text-gray-500' : agent.color}`} />
                  {agent.isComingSoon && (
                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>

                <h3 className={`text-xl font-bold mb-2 ${agent.isComingSoon ? 'text-gray-400' : 'text-white'}`}>
                  {agent.name}
                </h3>

                <p className={`text-sm leading-relaxed ${agent.isComingSoon ? 'text-gray-500' : 'text-gray-400'}`}>
                  {agent.description[language] || agent.description['en']}
                </p>

                {!agent.isComingSoon && (
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-brand-500/50 transition-all pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // -- RENDER: CHAT INTERFACE --
  const AgentIcon = selectedAgent.icon;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl shadow-2xl border border-dark-700 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-dark-700 bg-dark-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedAgent(null)}
            className="p-2 hover:bg-dark-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-dark-800 border border-dark-700 ${selectedAgent.color}`}>
              <AgentIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{selectedAgent.name}</h3>
              <p className="text-xs text-gray-400">Specialized Agent</p>
            </div>
          </div>
        </div>

        <button className="p-2 hover:bg-dark-800 rounded-lg text-gray-400 hover:text-white transition-colors">
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
                : 'bg-dark-800 text-gray-100 border border-dark-700 rounded-tl-none'
                }`}
            >
              <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest font-bold opacity-70">
                {msg.role === 'user' ? (
                  <span className="flex items-center gap-1">Você <User className="w-3 h-3" /></span>
                ) : (
                  <span className="flex items-center gap-1 text-brand-400"><Bot className="w-3 h-3" /> {selectedAgent.name}</span>
                )}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-dark-800 rounded-2xl rounded-tl-none p-4 border border-dark-700 shadow-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-500 border-t-transparent"></div>
              <span className="text-sm text-gray-400 font-medium animate-pulse">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-dark-900 border-t border-dark-700 shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Ask ${selectedAgent.name}...`}
            className="flex-1 px-5 py-3 bg-dark-800 border border-dark-700 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-medium"
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