import React, { useState } from 'react';
import {
  BarChart3,
  Search,
  Zap,
  Target,
  ArrowRight,
  Shield,
  Globe,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Menu,
  X,
  CreditCard,
  Rocket
} from 'lucide-react';
import { AuthModal } from '../components/Auth/AuthModal';
import { useLanguage } from '../services/languageService';
import { ThemeToggle } from '../components/Layout/ThemeToggle';

const LandingPage = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: t('features.finder.title'),
      desc: t('features.finder.desc')
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('features.mentor.title'),
      desc: t('features.mentor.desc')
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: t('features.sourcing.title'),
      desc: t('features.sourcing.desc')
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: t('features.optimizer.title'),
      desc: t('features.optimizer.desc')
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 border-none transition-colors duration-300 overflow-x-hidden">
      {/* Header / Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-dark-900/70 backdrop-blur-xl border-none">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AI Suite Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-500/20" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              {t('app.title')}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">{t('nav.features')}</a>
            <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors">{t('nav.pricing')}</a>

            <ThemeToggle />

            {/* Language Switcher */}
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-dark-700 ml-4 pl-4">
              <button
                onClick={() => setLanguage('pt')}
                className={`px-2 py-1 text-xs font-bold rounded ${language === 'pt' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 dark:text-gray-400'}`}
              >PT</button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-2 py-1 text-xs font-bold rounded ${language === 'es' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 dark:text-gray-400'}`}
              >ES</button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs font-bold rounded ${language === 'en' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 dark:text-gray-400'}`}
              >EN</button>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-brand-500/20 active:scale-95"
            >
              {t('nav.access')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button className="p-2 dark:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-20 z-40 bg-white dark:bg-dark-900 p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
          <a href="#features" className="text-xl font-medium dark:text-white" onClick={() => setIsMenuOpen(false)}>{t('nav.features')}</a>
          <a href="#pricing" className="text-xl font-medium dark:text-white" onClick={() => setIsMenuOpen(false)}>{t('nav.pricing')}</a>
          <button
            onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold"
          >
            {t('nav.access')}
          </button>
          <div className="flex justify-center gap-4 mt-auto pb-12">
            <button onClick={() => setLanguage('pt')} className={`px-4 py-2 rounded-lg font-bold ${language === 'pt' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-dark-800 dark:text-white'}`}>PT</button>
            <button onClick={() => setLanguage('es')} className={`px-4 py-2 rounded-lg font-bold ${language === 'es' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-dark-800 dark:text-white'}`}>ES</button>
            <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg font-bold ${language === 'en' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-dark-800 dark:text-white'}`}>EN</button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-sm font-semibold mb-8 animate-bounce">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            {t('hero.tag')}
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tight leading-[1.1]">
            {language === 'pt' ? (
              <>Pare de tentar vender. <br /> Comece a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-emerald-500">lucrar na Amazon</span> com dados reais.</>
            ) : language === 'es' ? (
              <>Deja de intentar vender. <br /> Empieza a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-emerald-500">lucrar en Amazon</span> con datos reales.</>
            ) : (
              <>Stop trying to sell. <br /> Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-emerald-500">profiting on Amazon</span> with real data.</>
            )}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-3 active:scale-95 group"
            >
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-gray-50 dark:bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                {t('problem.title')}
              </h2>
              <div className="flex items-start gap-4 p-6 bg-red-50 dark:bg-red-500/5 rounded-3xl border border-red-100 dark:border-red-500/10">
                <Shield className="w-8 h-8 text-red-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-400 mb-1">{t('problem.bad.title')}</h4>
                  <p className="text-red-800/70 dark:text-red-400/60 leading-relaxed text-sm">
                    {t('problem.bad.desc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white dark:bg-dark-900 rounded-[40px] shadow-2xl shadow-brand-500/10 border border-brand-100 dark:border-dark-700">
              <div className="inline-flex px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold mb-4 uppercase tracking-wider">
                {t('problem.good.tag')}
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
                {t('problem.good.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {t('problem.good.desc')}
              </p>
              <div className="space-y-4">
                {[
                  { text: t('features.finder.title'), color: 'text-emerald-500' },
                  { text: t('features.mentor.title'), color: 'text-brand-500' },
                  { text: t('features.optimizer.title'), color: 'text-blue-500' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${item.color}`} />
                    <span className="font-bold text-gray-800 dark:text-gray-200">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
            {t('features.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto font-medium">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="group p-8 bg-white dark:bg-dark-900 rounded-3xl border border-gray-100 dark:border-dark-800 hover:border-brand-500 dark:hover:border-brand-500 transition-all hover:shadow-2xl hover:shadow-brand-500/10 hover:-translate-y-2">
              <div className="w-12 h-12 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-900 border-none relative overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/20 rounded-full blur-[160px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-white mb-6">{t('pricing.title')}</h2>
            <p className="text-gray-400 text-lg">{t('pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Free Plan */}
            <div className="bg-dark-800/50 backdrop-blur-xl p-8 rounded-[40px] border border-dark-700 hover:border-brand-500/50 transition-all flex flex-col">
              <h3 className="font-bold text-white text-lg">{t('pricing.free.name')}</h3>
              <div className="my-6">
                <span className="text-4xl font-black text-white">{t('pricing.free.price')}</span>
                <span className="text-gray-400 ml-2">/Life</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('pricing.free.f1')}
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('pricing.free.f2')}
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('pricing.free.f3')}
                </li>
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 hover:border-white/20">
                {t('pricing.free.cta')}
              </button>
            </div>

            {/* Starter Plan */}
            <div className="bg-dark-800/50 backdrop-blur-xl p-8 rounded-[40px] border border-dark-700 hover:border-brand-500/50 transition-all flex flex-col">
              <h3 className="font-bold text-white text-lg">{t('pricing.starter.name')}</h3>
              <div className="my-6">
                <span className="text-4xl font-black text-white">{t('pricing.starter.price')}</span>
                <span className="text-gray-400 ml-2">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('pricing.starter.f1')}
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('pricing.starter.f2')}
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('pricing.starter.f3')}
                </li>
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 hover:border-white/20">
                {t('pricing.starter.cta')}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-brand-600 p-8 rounded-[40px] border-none shadow-2xl shadow-brand-500/30 flex flex-col relative transform hover:scale-105 transition-all">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-brand-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest leading-none flex items-center h-8">
                {t('pricing.pro.recommended')}
              </div>
              <h3 className="font-bold text-white text-lg">{t('pricing.pro.name')}</h3>
              <div className="my-6">
                <span className="text-4xl font-black text-white">{t('pricing.pro.price')}</span>
                <span className="text-gray-100/70 ml-2">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-white text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  {t('pricing.pro.f1')}
                </li>
                <li className="flex items-center gap-3 text-white text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  {t('pricing.pro.f2')}
                </li>
                <li className="flex items-center gap-3 text-white text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  {t('pricing.pro.f3')}
                </li>
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-4 bg-white text-brand-600 rounded-2xl font-bold transition-all hover:bg-gray-100 active:scale-95 shadow-xl">
                {t('pricing.pro.cta')}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-dark-800/50 backdrop-blur-xl p-8 rounded-[40px] border border-dark-700 hover:border-brand-500/50 transition-all flex flex-col">
              <h3 className="font-bold text-white text-lg">{t('pricing.premium.name')}</h3>
              <div className="my-6">
                <span className="text-4xl font-black text-white">{t('pricing.premium.price')}</span>
                <span className="text-gray-400 ml-2">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('pricing.premium.f1')}
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('pricing.premium.f2')}
                </li>
                <li className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {t('pricing.premium.f3')}
                </li>
              </ul>
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 hover:border-white/20">
                {t('pricing.premium.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-dark-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-600" />
            <span className="font-bold dark:text-white">{t('app.title')}</span>
          </div>
          <div className="text-gray-500 text-sm font-medium">
            © 2024 {t('app.title')}. {t('footer.rights')}
          </div>
          <div className="flex gap-6">
            <a href="https://wa.me/message/VIO6W72D7W34G1" target="_blank" className="text-gray-400 hover:text-brand-600 transition-colors">
              WhatsApp
            </a>
            <a href="#" className="text-gray-400 hover:text-brand-600 transition-colors">
              Suporte
            </a>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;