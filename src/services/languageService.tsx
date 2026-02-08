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
        'module.listing_optimizer': 'Criador de Listing',
        'module.ads_manager': 'Gerenciador de Ads',
        'module.settings': 'Configurações',
        'module.logout': 'Sair',
        'auth.forgot_password': 'Esqueci minha senha',
        'auth.reset_password': 'Redefinir Senha',
        'auth.back_to_login': 'Voltar para Login',
        'auth.send_reset_link': 'Enviar Link de Recuperação',
        'auth.reset_email_sent': 'Link de recuperação enviado! Verifique seu e-mail.',
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

        // Listing Optimizer
        'lo.intro': 'Olá! Sou seu especialista em Amazon. Vamos criar um anúncio vencedor para a Amazon Espanha? Primeiro, qual é o nome do seu produto?',
        'lo.q.productName': 'Qual é o nome do seu produto?',
        'lo.q.category': 'Qual a categoria dele? (Ex: Cozinha, Esportes, Eletrônicos)',
        'lo.q.material': 'De qual material ele é feito? (Ex: Aço Inox, Algodão Orgânico)',
        'lo.q.benefits': 'Quais são os principais benefícios? (Liste 2 ou 3)',
        'lo.q.differentiators': 'O que o diferencia dos concorrentes? (Seu "Tchan")',
        'lo.q.audience': 'Quem é o seu público-alvo? (Ex: Mães, Atletas, Gamers)',
        'lo.q.problem': 'Que problema ele resolve para o cliente?',
        'lo.q.usage': 'Qual o uso principal? (Ex: Dia a dia, Presente, Viagem)',
        'lo.processing.text': 'Perfeito! Estou criando seu anúncio otimizado agora. Isso pode levar alguns segundos...',
        'lo.success.text': 'Anúncio de texto gerado com sucesso! Agora, para finalizar, preciso que você envie uma foto do produto (fundo branco é ideal) para que eu possa gerar variações visuais.',
        'lo.error.text': 'Ops, tive um problema ao gerar o texto. Tente novamente.',
        'lo.processing.image': 'Recebi a imagem! Estou gerando 3 variações otimizadas para o anúncio...',
        'lo.success.image': 'Pronto! Seu anúncio está completo. Veja abaixo.',
        'lo.error.image': 'Erro ao gerar imagens. Mas confira o texto abaixo.',
        'lo.ui.assistant': 'Assistente',
        'lo.ui.history': 'Histórico',
        'lo.ui.history.empty': 'Nenhum listing salvo.',
        'lo.ui.upload': 'Clique para enviar foto',
        'lo.ui.input_placeholder': 'Digite sua resposta...',
        'lo.ui.title': 'Seu anúncio aparecerá aqui',
        'lo.ui.subtitle': 'Responda as perguntas ao lado para que nossa IA crie um anúncio de alta conversão para seu produto.',
        'lo.ui.save': 'Salvar Listing',
        'lo.ui.generating_images': 'Gerando Imagens...',
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

        // Listing Optimizer
        'lo.intro': '¡Hola! Soy tu experto en Amazon. ¿Vamos a crear un anuncio ganador para Amazon España? Primero, ¿cuál es el nombre de tu producto?',
        'lo.q.productName': '¿Cuál es el nombre de tu producto?',
        'lo.q.category': '¿Cuál es su categoría? (Ej: Cocina, Deportes, Electrónica)',
        'lo.q.material': '¿De qué material está hecho? (Ej: Acero Inoxidable, Algodón Orgánico)',
        'lo.q.benefits': '¿Cuáles son los principales beneficios? (Lista 2 o 3)',
        'lo.q.differentiators': '¿Qué lo diferencia de la competencia?',
        'lo.q.audience': '¿Quién es tu público objetivo? (Ej: Madres, Atletas, Gamers)',
        'lo.q.problem': '¿Qué problema resuelve para el cliente?',
        'lo.q.usage': '¿Cuál es el uso principal? (Ej: Diario, Regalo, Viaje)',
        'lo.processing.text': '¡Perfecto! Estoy creando tu anuncio optimizado ahora. Esto puede tardar unos segundos...',
        'lo.success.text': '¡Anuncio de texto generado con éxito! Ahora, para finalizar, necesito que envíes una foto del producto (fondo blanco es ideal) para generar variaciones visuales.',
        'lo.error.text': 'Ups, tuve un problema al generar el texto. Inténtalo de nuevo.',
        'lo.processing.image': '¡Recibí la imagen! Estoy generando 3 variaciones optimizadas...',
        'lo.success.image': '¡Listo! Tu anuncio está completo. Mira abajo.',
        'lo.error.image': 'Error al generar imágenes. Pero revisa el texto abajo.',
        'lo.ui.assistant': 'Asistente',
        'lo.ui.history': 'Historial',
        'lo.ui.history.empty': 'Ningún listado guardado.',
        'lo.ui.upload': 'Clic para enviar foto',
        'lo.ui.input_placeholder': 'Escribe tu respuesta...',
        'lo.ui.title': 'Tu anuncio aparecerá aquí',
        'lo.ui.subtitle': 'Responde las preguntas para que nuestra IA cree un anuncio de alta conversión.',
        'lo.ui.save': 'Guardar Listado',
        'lo.ui.generating_images': 'Generando Imágenes...',
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

        // Listing Optimizer
        'lo.intro': 'Hello! I am your Amazon expert. Let\'s create a winning listing for Amazon Spain? First, what is the name of your product?',
        'lo.q.productName': 'What is the name of your product?',
        'lo.q.category': 'What is its category? (Ex: Kitchen, Sports, Electronics)',
        'lo.q.material': 'What material is it made of? (Ex: Stainless Steel, Organic Cotton)',
        'lo.q.benefits': 'What are the main benefits? (List 2 or 3)',
        'lo.q.differentiators': 'What differentiates it from competitors?',
        'lo.q.audience': 'Who is your target audience? (Ex: Moms, Athletes, Gamers)',
        'lo.q.problem': 'What problem does it solve for the customer?',
        'lo.q.usage': 'What is the main usage? (Ex: Daily, Gift, Travel)',
        'lo.processing.text': 'Perfect! I am creating your optimized listing now. This may take a few seconds...',
        'lo.success.text': 'Text listing generated successfully! Now, to finish, I need you to send a photo of the product (white background is ideal) so I can generate visual variations.',
        'lo.error.text': 'Oops, I had a problem generating the text. Please try again.',
        'lo.processing.image': 'Received the image! Generating 3 optimized variations...',
        'lo.success.image': 'Ready! Your listing is complete. See below.',
        'lo.error.image': 'Error generating images. But check the text below.',
        'lo.ui.assistant': 'Assistant',
        'lo.ui.history': 'History',
        'lo.ui.history.empty': 'No saved listings.',
        'lo.ui.upload': 'Click to upload photo',
        'lo.ui.input_placeholder': 'Type your answer...',
        'lo.ui.title': 'Your listing will appear here',
        'lo.ui.subtitle': 'Answer the questions so our AI can create a high-conversion listing.',
        'lo.ui.save': 'Save Listing',
        'lo.ui.generating_images': 'Generating Images...',
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
