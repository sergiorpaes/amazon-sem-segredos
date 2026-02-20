import React, { useState } from 'react';
import { Check, ArrowRight, TrendingUp, Bot, BarChart3, Globe, Search, Sparkles, Megaphone } from 'lucide-react';
import { AuthModal } from '../components/Auth/AuthModal';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/Layout/ThemeToggle';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 dark:bg-dark-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="AI Suite Logo" className="w-10 h-10 rounded-lg object-cover" />
              <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight hidden sm:block">Amazon Sem Segredos IA Suite</span>
            </div>

            <div className="flex items-center gap-6">
              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
                <a href="#features" className="hover:text-brand-600 transition-colors">Funcionalidades</a>
                <a href="#pricing" className="hover:text-brand-600 transition-colors">Preços</a>
                <ThemeToggle />
              </div>

              {/* Always Visible Call to Action */}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all shadow-brand-200 font-bold text-sm sm:text-base whitespace-nowrap"
              >
                Acessar Plataforma
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
        {/* Background glow for dark mode */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none hidden dark:block"></div>

        <div className="text-center max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 shadow-sm px-4 py-1.5 rounded-full text-brand-700 dark:text-brand-400 text-sm font-semibold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Nova Ferramenta de Análise Inteligente
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8 leading-tight">
            Pare de tentar vender. <br /> Comece a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-emerald-500">lucrar na Amazon</span> com dados reais.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Analise produtos, calcule taxas FBA com precisão cirúrgica e monitore a concorrência em segundos. Sem achismos, apenas lucro líquido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-premium"
            >
              Começar análise gratuita agora <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="py-20 bg-white dark:bg-dark-800 border-y border-gray-200 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12">
            Taxas escondidas roubando seu lucro?
          </h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-2xl border border-red-100 dark:border-red-900/30">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-800/30 rounded-xl flex items-center justify-center mb-6 mx-auto text-red-600 dark:text-red-400 font-bold text-xl">✕</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Planilhas complexas que quebram</h3>
              <p className="text-gray-600 dark:text-gray-400">Horas perdidas atualizando taxas de FBA manualmente e torcendo para a fórmula estar certa.</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 relative">
              <div className="absolute -top-4 -right-4 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full transform rotate-12 shadow-lg">A Solução</div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800/30 rounded-xl flex items-center justify-center mb-6 mx-auto text-emerald-600 dark:text-emerald-400"><Check className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Amazon Sem Segredos IA Suite</h3>
              <p className="text-gray-600 dark:text-gray-400">Cálculo reverso em tempo real. Cole um ASIN e veja seu ROI e lucro líquido instantaneamente.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="py-24 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Tudo o que você precisa para dominar a Buy Box</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">De pesquisa de produto à análise de variação, centralizado em uma única ferramenta premium.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-soft hover:shadow-premium transition-shadow group">
              <div className="w-14 h-14 bg-brand-100 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mb-6 text-brand-600 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Calculadora Reversa de ROI</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Descubra o custo máximo de compra (Max Cost) para atingir sua meta de ROI. Todas as taxas FBA, impostos e custos de envio já calculados.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-soft hover:shadow-premium transition-shadow group">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Variações Campeãs</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Pare de chutar qual cor ou tamanho vende mais. Analisamos histórico de reviews para te dizer exatamente onde investir seu capital.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-soft hover:shadow-premium transition-shadow group">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Monitor de Buy Box</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Saiba instantaneamente se a Amazon está na listagem ou se é dominada por FBM. Identifique oportunidades onde você pode ganhar a Buy Box fácil.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-dark-800 p-8 rounded-3xl border border-gray-200 dark:border-dark-700 shadow-soft hover:shadow-premium transition-shadow group">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Histórico de BSR e Preços</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Acesse dados históricos cruciais para entender se a demanda é sazonal e se o preço atual inflacionou artificialmente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="py-24 bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Planos que crescem com você</h2>
            <p className="text-gray-500 dark:text-gray-400">Escolha o plano ideal para o seu estágio na jornada Amazon FBA.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {/* Free */}
            <div className="border border-gray-200 dark:border-dark-700 rounded-2xl p-4 bg-white dark:bg-dark-900 hover:border-brand-300 transition-colors">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Free</h3>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">€0</span>
                <span className="text-gray-500 dark:text-gray-400">/mês</span>
              </div>
              <ul className="space-y-2 mb-4">
                {['30 créditos iniciais', 'Análise básica', 'Suporte por email'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 border border-gray-200 dark:border-dark-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors text-gray-900 dark:text-white">Começar Grátis</button>
            </div>

            {/* Starter */}
            <div className="border border-gray-200 dark:border-dark-700 rounded-2xl p-4 bg-white dark:bg-dark-900 hover:border-brand-300 transition-colors">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Starter</h3>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">€19</span>
                <span className="text-gray-500 dark:text-gray-400">/mês</span>
              </div>
              <ul className="space-y-2 mb-4">
                {['50 créditos/mês', 'Acesso a Mentor', 'Suporte por e-mail'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 border border-gray-200 dark:border-dark-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors text-gray-900 dark:text-white">Selecionar Plano</button>
            </div>

            {/* Pro */}
            <div className="border-2 border-brand-500 rounded-2xl p-4 relative shadow-xl shadow-brand-100 bg-white dark:bg-dark-900">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Recomendado</div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Pro</h3>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">€49</span>
                <span className="text-gray-500 dark:text-gray-400">/mês</span>
              </div>
              <ul className="space-y-2 mb-4">
                {['200 créditos/mês', 'Acesso a tudo do Starter', 'Análise de ROI'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Check className="w-5 h-5 text-brand-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200">Selecionar Plano</button>
            </div>

            {/* Premium */}
            <div className="border border-gray-200 dark:border-dark-700 rounded-2xl p-4 bg-white dark:bg-dark-900 hover:border-brand-300 transition-colors">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Premium</h3>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">€99</span>
                <span className="text-gray-500 dark:text-gray-400">/mês</span>
              </div>
              <ul className="space-y-2 mb-4">
                {['600 créditos/mês', 'Tudo ilimitado', 'Mentoria VIP'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 border border-gray-200 dark:border-dark-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors text-gray-900 dark:text-white">Selecionar Plano</button>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 dark:bg-black text-white py-12 border-t border-gray-800 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="opacity-50 text-sm">© {new Date().getFullYear()} Amazon Sem Segredos IA Suite. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};