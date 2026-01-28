import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'pt' | 'es' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

export const translations = {
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
        // Modal
        'modal.est_sales': 'Vendas Est.',
        'modal.est_revenue': 'Receita Est.',
        'modal.price': 'Preço',
        'modal.sellers': 'Vendedores',
        'modal.reviews': 'Avaliações',
        'modal.score': 'Score',
        'modal.fba_fees': 'Taxas FBA',
        'modal.view_amazon': 'Ver na Amazon',
        'modal.units_month': 'Unid. / Mês',
        'modal.footer_disclaimer': 'Dados fornecidos pela Amazon SP-API • Estimativas baseadas na categoria',
        'modal.unknown_brand': 'Marca Desconhecida',
        'mentor.title': 'Conheça nossos 9 Agentes Especializados',
        'mentor.subtitle': 'Cada um é preparado para lidar com desafios específicos.',
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

        // Modal
        'modal.est_sales': 'Ventas Est.',
        'modal.est_revenue': 'Ingresos Est.',
        'modal.price': 'Precio',
        'modal.sellers': 'Vendedores',
        'modal.reviews': 'Reseñas',
        'modal.score': 'Puntuación',
        'modal.fba_fees': 'Tarifas FBA',
        'modal.view_amazon': 'Ver en Amazon',
        'modal.units_month': 'Unid. / Mes',
        'modal.footer_disclaimer': 'Datos proporcionados por Amazon SP-API • Estimaciones basadas en la categoría',
        'modal.unknown_brand': 'Marca Desconocida',
        'mentor.title': 'Conozca nuestros 9 Agentes Especializados',
        'mentor.subtitle': 'Cada uno está preparado para enfrentar desafíos específicos.',
    },
    en: {
        // General
        'app.title': 'Amazon Secrets Revealed',
        'search.placeholder': 'Enter keyword or ASIN',
        'search.button': 'Search',
        'searching': 'Searching...',
        'suppliers.link': 'Find Suppliers on Alibaba',
        'rows.selected': 'Rows Selected',
        'filter.results': 'Filter Results',

        // Product Finder Headers
        'col.product_details': 'Product Details',
        'col.asin': 'ASIN',
        'col.brand': 'Brand',
        'col.price': 'Price',
        'col.sales': 'Sales',
        'col.sales_graph': 'Sales Graph',
        'col.revenue': 'Revenue',
        'col.bsr': 'BSR',
        'col.fba_fees': 'FBA Fees',
        'col.active_sellers': 'Active Sellers',

        // Summary Cards
        'summary.search_volume': 'Search Volume',
        'summary.total_revenue': 'Total Revenue',
        'summary.avg_revenue': 'Avg Revenue',
        'summary.avg_price': 'Avg Price',
        'summary.avg_bsr': 'Avg BSR',
        'summary.avg_reviews': 'Avg Reviews',
        'summary.success_score': 'Success Score',

        // Empty States / Errors
        'error.no_products': 'No products found. Start a search.',

        // Product Categories
        'category.Beauty': 'Beauty',
        'category.Electronics': 'Electronics',
        'category.Home': 'Home',
        'category.Kitchen': 'Kitchen',
        'category.Toys': 'Toys',
        'category.Sports': 'Sports',
        'category.Unknown': 'General',

        // Modules
        'module.dashboard': 'Overview',
        'module.mentor': 'Virtual Mentor',
        'module.product_finder': 'Product Finder',
        'module.listing_optimizer': 'Listing Optimizer',
        'module.ads_manager': 'Ads Manager',
        'module.settings': 'Settings',
        'module.logout': 'Logout',

        // Modal
        'modal.est_sales': 'Est. Sales',
        'modal.est_revenue': 'Est. Revenue',
        'modal.price': 'Price',
        'modal.sellers': 'Sellers',
        'modal.reviews': 'Reviews',
        'modal.score': 'Score',
        'modal.fba_fees': 'FBA Fees',
        'modal.view_amazon': 'View on Amazon',
        'modal.units_month': 'Units / Month',
        'modal.footer_disclaimer': 'Data provided by Amazon SP-API • Estimates based on category',
        'modal.unknown_brand': 'Unknown Brand',
        'mentor.title': 'Our 9 Specialized Agents',
        'mentor.subtitle': 'Each agent is trained to solve specific business challenges.',
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
