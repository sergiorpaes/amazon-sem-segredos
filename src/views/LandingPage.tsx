import React, { useState } from 'react';
import { Check, ArrowRight, TrendingUp, Bot, BarChart3, Globe } from 'lucide-react';
import { AuthModal } from '../components/Auth/AuthModal';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">Amazon Sem Segredos AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#features" className="hover:text-brand-600 transition-colors">Funcionalidades</a>
              <a href="#pricing" className="hover:text-brand-600 transition-colors">Preços</a>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-full transition-all shadow-lg shadow-brand-200"
              >
                Acessar Plataforma
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 px-4 py-1.5 rounded-full text-brand-700 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            A Nova Era da Venda na Amazon
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
            A inteligência que <span className="text-brand-600">analisa</span>, <span className="text-brand-600">otimiza</span> e <span className="text-brand-600">ensina</span> você a vender.
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            SellerFlow.AI + Mentor.AI: Um ecossistema completo unindo automação de dados e mentoria inteligente para dominar o mercado Europeu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-200"
            >
              Começar Agora Gratuitamente <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-xl font-bold text-lg transition-colors">
              Ver Demo em Vídeo
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Poder Duplo: Execução + Educação</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Combinamos o poder analítico do SellerFlow com a sabedoria estratégica do Mentor.AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Bot className="w-8 h-8 text-white" />,
                title: "Amazon Mentor.AI",
                desc: "Mentor virtual 24h treinado na metodologia Amazon Sem Segredos. Tira dúvidas, analisa estratégias e recomenda ações.",
                color: "bg-indigo-600"
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-white" />,
                title: "Product Finder AI",
                desc: "Encontre produtos vencedores com baixa concorrência e alta demanda usando algoritmos preditivos.",
                color: "bg-brand-600"
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-white" />,
                title: "Profit Dashboard",
                desc: "Visualização clara dos seus lucros reais, descontando todas as taxas da Amazon em tempo real.",
                color: "bg-emerald-600"
              },
              {
                icon: <Globe className="w-8 h-8 text-white" />,
                title: "Listing Optimizer Multi-Language",
                desc: "Crie listings perfeitas em Português, Espanhol, Francês e Italiano otimizadas para SEO.",
                color: "bg-blue-600"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-gray-200`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Planos que crescem com você</h2>
            <p className="text-gray-500">Escolha o plano ideal para o seu estágio na jornada Amazon FBA.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="border border-gray-200 rounded-2xl p-8 hover:border-brand-300 transition-colors">
              <h3 className="font-bold text-gray-900 text-lg">Starter</h3>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-gray-900">€19</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Product Finder AI', 'Listing Optimizer', 'Mentor.AI Básico'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Começar Starter</button>
            </div>

            {/* Pro */}
            <div className="border-2 border-brand-500 rounded-2xl p-8 relative shadow-xl shadow-brand-100">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Mais Popular</div>
              <h3 className="font-bold text-gray-900 text-lg">Pro</h3>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-gray-900">€49</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Tudo do Starter', 'Keyword Tracker', 'Profit Dashboard', 'Mentor.AI Ilimitado'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600">
                    <Check className="w-5 h-5 text-brand-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200">Começar Pro</button>
            </div>

            {/* Premium */}
            <div className="border border-gray-200 rounded-2xl p-8 hover:border-brand-300 transition-colors">
              <h3 className="font-bold text-gray-900 text-lg">Premium</h3>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-gray-900">€99</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Tudo do Pro', 'Ads Manager AI', 'Review Analyzer', 'Suporte Prioritário'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Começar Premium</button>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="opacity-50 text-sm">© 2024 Amazon Sem Segredos AI Suite. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};