
export interface KnowledgeResource {
    id: string;
    title: string;
    description: string;
    url: string;
    tags: string[];
}

export interface AppTool {
    id: string;
    name: string;
    description: string;
    route: string;
    tags: string[];
}

export const YOUTUBE_VIDEOS: KnowledgeResource[] = [
    {
        id: 'start-zero',
        title: 'Começar do Zero e Vender Todos os Dias na Amazon',
        description: 'Guia completo para iniciantes começarem a vender na Amazon e construírem um negócio recorrente.',
        url: 'https://www.youtube.com/results?search_query=Começar+do+Zero+e+Vender+Todos+os+Dias+na+Amazon+Levi+Guimarães',
        tags: ['iniciante', 'começar', 'zero', 'vendas']
    },
    {
        id: 'top-1000',
        title: 'Como Encontrar os 1000 Produtos Mais Vendidos',
        description: 'Estratégia prática para encontrar produtos vencedores e de alta demanda.',
        url: 'https://www.youtube.com/results?search_query=Como+Encontrar+os+1000+Produtos+Mais+Vendidos+na+Amazon',
        tags: ['produtos', 'pesquisa', 'vencedores', 'demanda']
    },
    {
        id: 'buy-box',
        title: 'Buy Box na Prática: Como Ser o Vendedor Destaque',
        description: 'Aprenda os segredos para ganhar a Buy Box e aumentar suas vendas exponencialmente.',
        url: 'https://www.youtube.com/watch?v=QHHoVoRfJL8', // This ID seemed valid, let's keep it if it works, or fallback to search if unsure. Use search to be safe.
        // Actually, user didn't complain about this specific one in the screenshot, but safer is better.
        // Let's keep one real ID if I have high confidence. Hmmm. User said "erro nos videos" plural?
        // Let's use search for ALL to be 100% safe.
        url: 'https://www.youtube.com/results?search_query=Buy+Box+na+Prática+Levi+Guimarães',
        tags: ['buy box', 'vendas', 'destaque', 'concorrência']
    },
    {
        id: 'account-health',
        title: 'Como aquecer conta para evitar bloqueio',
        description: 'Dicas cruciais para manter a saúde da sua conta e evitar bloqueios da Amazon.',
        url: 'https://www.youtube.com/results?search_query=Como+aquecer+conta+para+evitar+bloqueio+Amazon',
        tags: ['bloqueio', 'saúde da conta', 'segurança', 'conformidade']
    },
    {
        id: 'suppliers',
        title: 'Como Encontrar Fornecedores na Amazon Brasil',
        description: 'O guia definitivo para encontrar os melhores fornecedores e garantir estoque de qualidade.',
        url: 'https://www.youtube.com/results?search_query=Como+Encontrar+Fornecedores+na+Amazon+Brasil+Levi+Guimarães',
        tags: ['fornecedor', 'sourcing', 'estoque', 'compras']
    },
    {
        id: 'listing-creation',
        title: 'Como Listar Seu Primeiro Produto (Passo a Passo)',
        description: 'Tutorial completo de como criar um listing profissional do zero.',
        url: 'https://www.youtube.com/results?search_query=Como+Listar+Seu+Primeiro+Produto+Amazon',
        tags: ['listing', 'criar', 'produto', 'cadastro']
    },
    {
        id: 'promotions',
        title: 'Como criar promoções, ofertas e cupons',
        description: 'Passo a passo para criar campanhas promocionais que convertem.',
        url: 'https://www.youtube.com/results?search_query=Como+criar+promoções+ofertas+e+cupons+Amazon',
        tags: ['marketing', 'promoção', 'cupom', 'vendas']
    },
    {
        id: 'channel',
        title: 'Canal Oficial Amazon Sem Segredos',
        description: 'Acesse centenas de vídeos com estratégias avançadas de Amazon FBA.',
        url: 'https://www.youtube.com/@amazonsemsegredos',
        tags: ['canal', 'youtube', 'geral']
    }
];

export const APP_TOOLS: AppTool[] = [
    {
        id: 'product-finder',
        name: 'Buscador de Produtos',
        description: 'Ferramenta para encontrar produtos vencedores com base em critérios avançados de pesquisa.',
        route: '/dashboard/product-finder',
        tags: ['pesquisa', 'produto', 'encontrar']
    },
    {
        id: 'listing-optimizer',
        name: 'Otimizador de Listings (Listing Optimizer)',
        description: 'Analisa e melhora seus títulos, bullets e descrições para aumentar a conversão.',
        route: '/dashboard/listing-optimizer',
        tags: ['listing', 'seo', 'otimização', 'conversão']
    },
    {
        id: 'profit-calculator',
        name: 'Calculadora de Lucro Real',
        description: 'Calcula margens exatas considerando taxas FBA, impostos e custos de envio.',
        route: '/dashboard/profit-calculator',
        tags: ['lucro', 'calculadora', 'margem', 'taxas', 'fba']
    },
    {
        id: 'supplier-finder',
        name: 'Buscador de Fornecedores',
        description: 'Banco de dados de fornecedores verificados na Europa para sourcing de produtos.',
        route: '/dashboard/suppliers',
        tags: ['fornecedor', 'sourcing', 'comprar', 'estoque']
    },
    {
        id: 'listing-creator',
        name: 'Criador de Listing',
        description: 'Crie listings do zero com inteligência artificial.',
        route: '/dashboard/listing-creator',
        tags: ['criar', 'novo', 'listing']
    },
    {
        id: 'ads-manager',
        name: 'Gerenciador de Ads',
        description: 'Otimize suas campanhas de PPC automaticamente.',
        route: '/dashboard/ads-manager',
        tags: ['ads', 'ppc', 'publicidade']
    }
];
