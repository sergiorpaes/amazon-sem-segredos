import React, { useState, useMemo } from 'react';
import { SUPPLIERS, SupplierCategory } from '../../data/suppliers';
import { Search, ExternalLink, Filter, MapPin, Tag } from 'lucide-react';
import { useLanguage } from '../../services/languageService';

export const SupplierFinder: React.FC = () => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<SupplierCategory | 'Todas'>('Todas');

    const categories: { id: SupplierCategory | 'Todas', label: string }[] = [
        { id: 'Todas', label: t('cat.all') },
        { id: 'Geral', label: t('cat.general') },
        { id: 'Casa & Cozinha', label: t('cat.home_kitchen') },
        { id: 'Brinquedos & Geek', label: t('cat.toys_geek') },
        { id: 'Eletrônicos', label: t('cat.electronics') },
        { id: 'Beleza & Saúde', label: t('cat.beauty_health') },
        { id: 'Moda & Infantil', label: t('cat.fashion_kids') },
        { id: 'Festas', label: t('cat.parties') },
        { id: 'Ferramentas & Bricolagem', label: t('cat.tools_diy') },
        { id: 'Bebê', label: t('cat.baby') },
        { id: 'Decoração', label: t('cat.decor') }
    ];

    const getCategoryLabel = (cat: string) => {
        const found = categories.find(c => c.id === cat);
        return found ? found.label : cat;
    };

    const filteredSuppliers = useMemo(() => {
        return SUPPLIERS.filter(supplier => {
            const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = selectedCategory === 'Todas' || supplier.categories.includes(selectedCategory);

            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('sup.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('sup.subtitle')}</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-dark-700 rounded-xl leading-5 bg-gray-50 dark:bg-dark-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-dark-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        placeholder={t('sup.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 pb-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${selectedCategory === cat.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                            : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 hover:border-gray-300'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto pr-2 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSuppliers.map((supplier, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 hover:shadow-md transition-all duration-300 flex flex-col group relative overflow-hidden"
                        >
                            {/* Featured Badge */}
                            {supplier.featured && (
                                <div className="absolute -right-12 top-6 bg-yellow-400 text-yellow-900 text-xs font-bold py-1 px-12 rotate-45 shadow-sm">
                                    TOP
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    {supplier.name.substring(0, 1)}
                                </div>
                                {supplier.country && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-dark-900 text-xs font-medium text-gray-600 dark:text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        {supplier.country}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 truncate" title={supplier.name}>
                                {supplier.name}
                            </h3>

                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
                                {supplier.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {supplier.categories.slice(0, 2).map((cat, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800">
                                        <Tag className="w-3 h-3" />
                                        {getCategoryLabel(cat)}
                                    </span>
                                ))}
                                {supplier.categories.length > 2 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 dark:bg-dark-900 text-gray-500 dark:text-gray-400 text-xs font-medium border border-gray-100 dark:border-dark-700">
                                        +{supplier.categories.length - 2}
                                    </span>
                                )}
                            </div>

                            <a
                                href={supplier.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-dark-900 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300 font-medium text-sm group/btn"
                            >
                                {t('sup.visit_site')}
                                <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    ))}
                </div>

                {filteredSuppliers.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="h-16 w-16 bg-gray-100 dark:bg-dark-900 rounded-full flex items-center justify-center mb-4">
                            <Filter className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('sup.empty_title')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                            {t('sup.empty_desc')}
                        </p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('Todas'); }}
                            className="mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                            {t('sup.clear_filters')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
