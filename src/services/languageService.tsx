import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'pt' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    pt: {
        // General
        'app.title': 'Amazon Sem Segredos',
        'search.placeholder': 'Digite palavra-chave ou ASIN',
        'search.button': 'Pesquisar',
        'searching': 'Pesquisando...',
        'suppliers.link': 'Encontrar Fornecedores no Alibaba',
        'rows.selected': 'Linhas Selecionadas',
        'filter.results': 'Filtrar Resultados',

        // Product Finder Headers
        'col.product_details': 'Detalhes do Produto',
        'col.asin': 'ASIN',
        'col.brand': 'Marca',
        'col.price': 'Preço',
        'col.sales': 'Vendas',
        'col.sales_graph': 'Gráfico de Vendas',
        'col.revenue': 'Receita',
        'col.bsr': 'BSR',
        'col.fba_fees': 'Taxas FBA',
        'col.active_sellers': 'Vendedores Ativos',

        // Summary Cards
        'summary.search_volume': 'Volume de Busca',
        'summary.total_revenue': 'Receita Total',
        'summary.avg_revenue': 'Receita Média',
        'summary.avg_price': 'Preço Médio',
        'summary.avg_bsr': 'BSR Médio',
        'summary.avg_reviews': 'Avaliações Médias',
        'summary.success_score': 'Pontuação de Sucesso',

        // Empty States / Errors
        'error.no_products': 'Nenhum produto encontrado. Inicie uma pesquisa.',

        // Product Categories
        'category.Beauty': 'Beleza',
        'category.Electronics': 'Eletrônicos',
        'category.Home': 'Casa',
        'category.Kitchen': 'Cozinha',
        'category.Toys': 'Brinquedos',
        'category.Sports': 'Esportes',
        'category.Unknown': 'Geral',

        // Modules
        'module.dashboard': 'Visão Geral',
        'module.mentor': 'Mentor Virtual',
        'module.product_finder': 'Buscador de Produtos',
        'module.listing_optimizer': 'Otimizador de Listings',
        'module.ads_manager': 'Gerenciador de Ads',
        'module.settings': 'Configurações',
        'module.logout': 'Sair',
    },
    es: {
        // General
        'app.title': 'Amazon Sin Secretos',
        'search.placeholder': 'Ingrese palabra clave o ASIN',
        'search.button': 'Buscar',
        'searching': 'Buscando...',
        'suppliers.link': 'Encontrar Proveedores en Alibaba',
        'rows.selected': 'Filas Seleccionadas',
        'filter.results': 'Filtrar Resultados',

        // Product Finder Headers
        'col.product_details': 'Detalles del Producto',
        'col.asin': 'ASIN',
        'col.brand': 'Marca',
        'col.price': 'Precio',
        'col.sales': 'Ventas',
        'col.sales_graph': 'Gráfico de Ventas',
        'col.revenue': 'Ingresos',
        'col.bsr': 'BSR',
        'col.fba_fees': 'Tarifas FBA',
        'col.active_sellers': 'Vendedores Activos',

        // Summary Cards
        'summary.search_volume': 'Volumen de Búsqueda',
        'summary.total_revenue': 'Ingresos Totales',
        'summary.avg_revenue': 'Ingresos Promedio',
        'summary.avg_price': 'Precio Promedio',
        'summary.avg_bsr': 'BSR Promedio',
        'summary.avg_reviews': 'Reseñas Promedio',
        'summary.success_score': 'Puntuación de Éxito',

        // Empty States / Errors
        'error.no_products': 'No se encontraron productos. Inicie una búsqueda.',

        // Product Categories
        'category.Beauty': 'Belleza',
        'category.Electronics': 'Electrónica',
        'category.Home': 'Hogar',
        'category.Kitchen': 'Cocina',
        'category.Toys': 'Juguetes',
        'category.Sports': 'Deportes',
        'category.Unknown': 'General',

        // Modules
        'module.dashboard': 'Visión General',
        'module.mentor': 'Mentor Virtual',
        'module.product_finder': 'Buscador de Productos',
        'module.listing_optimizer': 'Optimizador de Listados',
        'module.ads_manager': 'Gestor de Anuncios',
        'module.settings': 'Configuración',
        'module.logout': 'Cerrar Sesión',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('pt');

    const t = (key: string): string => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
