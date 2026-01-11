import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { chatWithMentor } from '../../services/openaiService';
import { ChatMessage } from '../../types';

export const Mentor: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Olá! Eu sou o CR7, assistente oficial do Amazon Sem Segredos. \n\nEstou aqui para te ajudar com FBA, validação de produtos e abertura fiscal na Europa.',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (manualText?: string) => {
    const textToSend = manualText || input;
    if (!textToSend.trim()) return;

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
      const responseText = await chatWithMentor(textToSend, messages);

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

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl shadow-2xl border border-yellow-600/30 overflow-hidden">
      <div className="p-6 border-b border-yellow-600/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center">
        <div className="p-1 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/20 mb-3">
          {/* Simple Avatar Placeholder */}
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-900">
            <span className="text-2xl font-black text-white">7</span>
          </div>
        </div>
        <h2 className="font-bold text-white text-2xl tracking-wide mb-1">CR7</h2>
        <p className="text-sm text-gray-400 font-light flex items-center gap-1">
          By <span className="font-semibold text-yellow-500">LEVI SILVA GUIMARAES</span>
        </p>
        <p className="text-xs text-gray-500 text-center max-w-md mt-2 leading-relaxed">
          Assistente oficial da metodologia Amazon Sem Segredos com foco em FBA, validação e abertura fiscal na Europa.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 to-slate-900">
        {messages.length === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 px-2">
            {[
              "Como abrir uma conta da Amazon Europa morando no Brasil?",
              "Qual número fiscal preciso para vender na Espanha?",
              "Como validar um produto com BigBuy ou Qogita?",
              "O que fazer se meu estoque no FBA zerar?"
            ].map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(question)}
                className="p-4 text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-yellow-500/50 rounded-xl transition-all group shadow-md"
              >
                <p className="text-sm text-gray-300 group-hover:text-yellow-400 transition-colors font-medium">{question}</p>
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${msg.role === 'user'
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-tr-none font-medium'
                : 'bg-slate-800 text-gray-100 border border-slate-700/50 rounded-tl-none'
                }`}
            >
              <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest font-bold opacity-70">
                {msg.role === 'user' ? (
                  <span className="flex items-center gap-1">Você <User className="w-3 h-3" /></span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-400"><Bot className="w-3 h-3" /> CR7 Mentor</span>
                )}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-700/50 shadow-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
              <span className="text-sm text-gray-400 font-medium animate-pulse">Analisando tática de jogo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Pergunte ao Campeão..."
            className="flex-1 px-5 py-3 bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all font-medium"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold p-3 rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 flex items-center justify-center min-w-[3.5rem]"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};