
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
        description: 'O que ninguém te conta sobre começar na Amazon.',
        url: 'https://youtu.be/3ZzKyxgtgU8',
        tags: ['iniciante', 'começar', 'zero', 'vendas']
    },
    {
        id: 'company-eu',
        title: 'Preciso Abrir Empresa para Vender na Amazon Europa?',
        description: 'Orientações com advogada sobre abertura de empresa na Europa.',
        url: 'https://youtu.be/UlTDUwG2gcY',
        tags: ['empresa', 'europa', 'jurídico', 'advogada', 'cnpj']
    },
    {
        id: 'start-2025',
        title: 'Como começar a vender na Amazon ainda em 2025',
        description: 'Passo a passo para viver de Amazon e faturar em euro.',
        url: 'https://youtu.be/cC_XSA6k3ww',
        tags: ['2025', 'começar', 'passo a passo', 'euro']
    },
    {
        id: 'top-1000',
        title: 'Como Encontrar os 1000 Produtos Mais Vendidos',
        description: 'Guia prático para encontrar produtos vencedores.',
        url: 'https://youtu.be/a50--U08gLE',
        tags: ['produtos', 'top 1000', 'vencedores', 'pesquisa']
    },
    {
        id: 'insights',
        title: 'Além do Óbvio: 5 Insights Cruciais',
        description: 'Dicas fundamentais sobre vender na Amazon Brasil.',
        url: 'https://youtu.be/4mCWF9-oYLI',
        tags: ['dicas', 'insights', 'brasil', 'estratégia']
    },
    {
        id: 'product-analysis',
        title: 'Análise de Produtos Começando do Zero',
        description: 'Como analisar viabilidade de produtos.',
        url: 'https://youtu.be/9svk8Nv9Mxc',
        tags: ['análise', 'produtos', 'viabilidade']
    },
    {
        id: 'niche-electronics',
        title: 'Nicho de Eletrônicos - Segredo Revelado',
        description: 'Aprenda a lucrar com eletrônicos na Amazon.',
        url: 'https://youtu.be/KuYibhLVa-Y',
        tags: ['eletrônicos', 'nicho', 'lucro']
    },
    {
        id: 'niche-kitchen',
        title: 'Nicho de Cozinha - Aprenda a Lucrar Alto',
        description: 'Estratégias para o nicho de cozinha.',
        url: 'https://youtu.be/9dWydhHrCqE',
        tags: ['cozinha', 'nicho', 'lucro']
    },
    {
        id: 'niche-furniture',
        title: 'Nicho de Móveis na Amazon',
        description: 'Segredos para ganhar dinheiro com móveis.',
        url: 'https://youtu.be/b_UTiGQVTj0',
        tags: ['móveis', 'nicho', 'lucro']
    },
    {
        id: 'niche-fashion',
        title: 'Moda na Amazon - Desvendando Mistérios',
        description: 'Itens incríveis revelados no nicho de moda.',
        url: 'https://youtu.be/CXI_VojJG8k',
        tags: ['moda', 'roupas', 'nicho']
    },
    {
        id: 'buy-box-practice',
        title: 'Buy Box na Prática',
        description: 'Como ser o vendedor destaque na Amazon Brasil!',
        url: 'https://youtu.be/o1O9ad-acCM',
        tags: ['buy box', 'destaque', 'vendas']
    },
    {
        id: 'buy-box-theory',
        title: 'Entendendo a Buy Box',
        description: 'Como funciona a Buy Box na Amazon Brasil?',
        url: 'https://youtu.be/24br8iXuOR8',
        tags: ['buy box', 'teoria', 'funcionamento']
    },
    {
        id: 'used-books',
        title: 'Ganhe Dinheiro Vendendo Livros Usados',
        description: 'Estratégia para venda de livros usados.',
        url: 'https://youtu.be/yHOlJfXnS9M',
        tags: ['livros', 'usados', 'sebo']
    },
    {
        id: 'amazon-vs-ml',
        title: 'Amazon vs Mercado Livre',
        description: 'Por que vender na Amazon é melhor?',
        url: 'https://youtu.be/EoDUkXDCUWw',
        tags: ['comparativo', 'mercado livre', 'plataforma']
    },
    {
        id: 'payments',
        title: 'Como Funciona o Pagamento aos Vendedores',
        description: 'Entenda os ciclos de pagamento da Amazon.',
        url: 'https://youtu.be/hcoFrjQA_XY',
        tags: ['pagamento', 'financeiro', 'recebimento']
    },
    {
        id: 'prep-center',
        title: 'Centro de Preparação com Mensalidade Grátis',
        description: 'Dica de logística e preparação.',
        url: 'https://youtu.be/s_rFS2MLmiE',
        tags: ['logística', 'preparação', 'fba']
    },
    {
        id: 'suppliers-sites',
        title: 'Sites com Fornecedores para Amazon Brasil',
        description: 'Onde encontrar fornecedores online.',
        url: 'https://youtu.be/wea0QkqEYTc',
        tags: ['fornecedores', 'sites', 'sourcing']
    },
    {
        id: 'google-suppliers',
        title: 'Como Usar o Google para Encontrar Fornecedores',
        description: 'Técnicas de busca de fornecedores no Google.',
        url: 'https://youtu.be/nshGthBPYVk',
        tags: ['google', 'busca', 'fornecedores']
    },
    {
        id: 'local-suppliers',
        title: 'Como Encontrar Fornecedores na Sua Cidade',
        description: 'Sourcing local para Amazon Brasil.',
        url: 'https://youtu.be/DlxtU9bdBVo',
        tags: ['local', 'cidade', 'fornecedores']
    },
    {
        id: 'retail-arbitrage',
        title: 'Comprar de Lojas Famosas e Vender na Amazon?',
        description: 'Sobre arbitragem e revenda de grandes marcas.',
        url: 'https://youtu.be/3bAFYGJftEA',
        tags: ['lojas', 'marcas', 'arbitragem']
    },
    {
        id: 'best-product-start',
        title: 'Qual Melhor Produto para Começar?',
        description: 'Dicas de escolha de produto para iniciantes.',
        url: 'https://youtu.be/k06Os877TjY',
        tags: ['produto', 'escolha', 'iniciante']
    },
    {
        id: 'dropshipping-block',
        title: 'Como Não Ser Bloqueado por Dropshipping',
        description: 'Riscos e cuidados com dropshipping.',
        url: 'https://youtu.be/fhXvgnARYJ8',
        tags: ['dropshipping', 'bloqueio', 'riscos']
    },
    {
        id: 'dropshipping-possibility',
        title: 'É Possível Fazer Dropshipping na Amazon?',
        description: 'Análise sobre a viabilidade do modelo.',
        url: 'https://youtu.be/Ya3UjqRrwIE',
        tags: ['dropshipping', 'viabilidade']
    },
    {
        id: 'policies-block',
        title: 'Sua Conta Será Bloqueada se Não Souber Disso',
        description: 'Políticas essenciais da Amazon.',
        url: 'https://youtu.be/tl9BDB0ML-M',
        tags: ['políticas', 'regras', 'bloqueio', 'conta']
    }
];

export const APP_TOOLS: AppTool[] = [
    {
        id: 'product-finder',
        name: 'Buscador de Produtos',
        description: 'Ferramenta para encontrar produtos vencedores com base em critérios avançados de pesquisa.',
        route: '/dashboard/product-finder',
        tags: ['pesquisa', 'produto', 'encontrar', 'busca']
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
        tags: ['lucro', 'calculadora', 'margem', 'taxas', 'fba', 'financeiro']
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
        tags: ['ads', 'ppc', 'publicidade', 'anúncio']
    },
    {
        id: 'settings',
        name: 'Configurações',
        description: 'Ajuste suas preferências e configurações da conta.',
        route: '/dashboard/settings',
        tags: ['configuração', 'ajustes', 'conta']
    }
];
