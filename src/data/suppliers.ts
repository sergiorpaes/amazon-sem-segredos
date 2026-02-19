
export type SupplierCategory =
    | 'Geral'
    | 'Casa & Cozinha'
    | 'Brinquedos & Geek'
    | 'Eletrônicos'
    | 'Beleza & Saúde'
    | 'Moda & Infantil'
    | 'Festas'
    | 'Ferramentas & Bricolagem'
    | 'Bebê'
    | 'Decoração';

export interface Supplier {
    name: string;
    url: string;
    categories: SupplierCategory[];
    description: string;
    country?: string;
    featured?: boolean;
}

export const SUPPLIERS: Supplier[] = [
    {
        name: 'BTS Wholesaler',
        url: 'https://www.btswholesaler.com/',
        categories: ['Beleza & Saúde'],
        description: 'Distribuidor especializado em perfumaria e cosméticos de grandes marcas.',
        country: 'ES'
    },
    {
        name: 'TCG Factory',
        url: 'https://tcgfactory.com/pt/',
        categories: ['Brinquedos & Geek'],
        description: 'Especialista em jogos de cartas, tabuleiro e merchandising geek.',
        country: 'ES'
    },
    {
        name: 'Qogita',
        url: 'https://www.qogita.com/',
        categories: ['Beleza & Saúde'],
        description: 'Plataforma B2B focada em saúde e beleza com preços competitivos.',
        country: 'NL'
    },
    {
        name: 'BigBuy',
        url: 'https://www.bigbuy.eu/',
        categories: ['Geral', 'Casa & Cozinha', 'Eletrônicos'],
        description: 'Um dos maiores dropshippers da Europa com catálogo imenso.',
        country: 'ES',
        featured: true
    },
    {
        name: 'Amscan Europe',
        url: 'https://www.amscan-europe.com/',
        categories: ['Festas'],
        description: 'Líder mundial em artigos para festas e celebrações.',
        country: 'DE'
    },
    {
        name: 'Kiddy Stores',
        url: 'https://www.kiddystores.fr/',
        categories: ['Moda & Infantil'],
        description: 'Roupas infantis e acessórios licenciados (Disney, Marvel, etc).',
        country: 'FR'
    },
    {
        name: 'Zentrada',
        url: 'https://www.zentrada.com/eu/',
        categories: ['Geral'],
        description: 'Marketplace atacadista líder na Europa conectando compradores e fornecedores.',
        country: 'EU'
    },
    {
        name: 'Interbaby',
        url: 'https://www.interbaby.es/',
        categories: ['Bebê'],
        description: 'Fabricante e distribuidor de produtos têxteis e acessórios para bebês.',
        country: 'ES'
    },
    {
        name: 'Coriex',
        url: 'https://www.coriex.it/',
        categories: ['Brinquedos & Geek', 'Moda & Infantil'],
        description: 'Acessórios de moda e brinquedos licenciados para crianças.',
        country: 'IT'
    },
    {
        name: 'Cartoon Group',
        url: 'https://www.cartoongroupitalia.com/',
        categories: ['Moda & Infantil'],
        description: 'Roupas e acessórios de personagens famosos.',
        country: 'IT'
    },
    {
        name: 'New Import',
        url: 'https://tienda.newimport.es/',
        categories: ['Geral', 'Casa & Cozinha', 'Brinquedos & Geek'],
        description: 'Importador de produtos licenciados e bazar.',
        country: 'ES'
    },
    {
        name: 'AFT Grupo',
        url: 'https://www.aftgrupo.com/',
        categories: ['Ferramentas & Bricolagem'],
        description: 'Focados em ferragens, bricolagem e jardinagem.',
        country: 'ES'
    },
    {
        name: 'Dernier (DLA)',
        url: 'https://www.dlasl.es/',
        categories: ['Casa & Cozinha', 'Beleza & Saúde'],
        description: 'Produtos de limpeza, higiene e utilidades domésticas.',
        country: 'ES'
    },
    {
        name: 'Supreminox',
        url: 'https://www.supreminox.com/',
        categories: ['Casa & Cozinha'],
        description: 'Equipamentos profissionais para cozinha e hotelaria.',
        country: 'ES'
    },
    {
        name: 'Exma',
        url: 'https://www.exma.es/',
        categories: ['Casa & Cozinha', 'Geral'],
        description: 'Variedade em utilidades domésticas e bazar.',
        country: 'ES'
    },
    {
        name: 'Wedom Group',
        url: 'https://wedomgroup.com/grupo/',
        categories: ['Casa & Cozinha'],
        description: 'Especialistas em cama, mesa e banho.',
        country: 'ES'
    },
    {
        name: 'IMC Toys',
        url: 'https://imctoys.com/es',
        categories: ['Brinquedos & Geek'],
        description: 'Fabricante de brinquedos inovadores e populares.',
        country: 'ES'
    },
    {
        name: 'Ubesol',
        url: 'https://ubesol.es/e',
        categories: ['Bebê', 'Beleza & Saúde', 'Casa & Cozinha'],
        description: 'Produtos de higiene pessoal e limpeza doméstica.',
        country: 'ES'
    },
    {
        name: 'Vileda Professional',
        url: 'https://www.vileda.es/',
        categories: ['Casa & Cozinha'],
        description: 'Marca renomada em produtos de limpeza duráveis.',
        country: 'ES'
    },
    {
        name: 'Rhino Distribuciones',
        url: 'https://rhinodist.com/',
        categories: ['Ferramentas & Bricolagem'],
        description: 'Ferramentas de pintura, proteção e bricolagem.',
        country: 'ES'
    },
    {
        name: 'Jumboplay',
        url: 'https://jumboplay.com/',
        categories: ['Brinquedos & Geek'],
        description: 'Atacadista de brinquedos e jogos educativos.',
        country: 'ES'
    },
    {
        name: 'Kids Licensing',
        url: 'https://kidslicensing.com/',
        categories: ['Brinquedos & Geek', 'Moda & Infantil'],
        description: 'Ampla gama de produtos licenciados para crianças.',
        country: 'ES'
    },
    {
        name: 'Ibili Menaje',
        url: 'https://www.ibilimenaje.com/en',
        categories: ['Casa & Cozinha'],
        description: 'Utensílios de cozinha práticos e modernos.',
        country: 'ES'
    },
    {
        name: 'Phoneoke',
        url: 'https://phoneoke.es/es/',
        categories: ['Eletrônicos'],
        description: 'Acessórios para celulares e gadgets.',
        country: 'ES'
    },
    {
        name: 'New More',
        url: 'https://newmore.es/',
        categories: ['Eletrônicos'],
        description: 'Eletrônicos de consumo e acessórios.',
        country: 'ES'
    },
    {
        name: 'Arteregal',
        url: 'https://www.arteregal.com/',
        categories: ['Casa & Cozinha', 'Decoração'],
        description: 'Artigos de presente, decoração e utilidades.',
        country: 'ES'
    },
    {
        name: 'Maxell Power',
        url: 'https://maxellpower.es/',
        categories: ['Casa & Cozinha', 'Eletrônicos'],
        description: 'Pequenos eletrodomésticos e eletrônicos para o lar.',
        country: 'ES'
    },
    {
        name: 'Cronos SL',
        url: 'https://cronossl.com/',
        categories: ['Geral'],
        description: 'Importação e exportação de produtos variados.',
        country: 'ES'
    },
    {
        name: 'Disgru',
        url: 'https://02166disgru.ntv.es/',
        categories: ['Geral'],
        description: 'Distribuidora multiproduto.',
        country: 'ES'
    },
    {
        name: 'AW Artisan',
        url: 'https://www.awartisan.es/',
        categories: ['Decoração', 'Beleza & Saúde'],
        description: 'Produtos artesanais, aromaterapia e presentes.',
        country: 'ES'
    },
    {
        name: 'Almacenes Al Por Mayor',
        url: 'https://almacenesalpormayor.es',
        categories: ['Geral'],
        description: 'Diretório e distribuidor de diversos segmentos.',
        country: 'ES'
    },
    {
        name: 'Gerimport',
        url: 'https://gerimport.com/pt/inicio',
        categories: ['Geral', 'Casa & Cozinha', 'Decoração'],
        description: 'Importador de vidro, menage, brinquedos e decoração.',
        country: 'ES'
    },
    {
        name: 'Tiendas China Center',
        url: 'https://tiendaschinacenter.es/',
        categories: ['Geral'],
        description: 'Atacadista multiproduto estilo bazar.',
        country: 'ES'
    },
    {
        name: 'Ankorstore',
        url: 'https://es.ankorstore.com/',
        categories: ['Geral'],
        description: 'Marketplace B2B conectando marcas e varejistas independentes.',
        country: 'EU'
    },
    {
        name: 'Europages',
        url: 'https://www.europages.es/',
        categories: ['Geral'],
        description: 'Diretório B2B europeu massivo.',
        country: 'EU'
    },
    {
        name: 'VEVOR',
        url: 'https://vevor.es',
        categories: ['Ferramentas & Bricolagem', 'Casa & Cozinha'],
        description: 'Equipamentos e ferramentas robustas com preços acessíveis.',
        country: 'CN/EU'
    },
    {
        name: 'Ortrade',
        url: 'https://www.ortrade.es',
        categories: ['Beleza & Saúde'],
        description: 'Distribuidor de cosmética e maquiagem.',
        country: 'ES'
    },
    {
        name: 'OcioStock',
        url: 'https://ociostock.com/',
        categories: ['Brinquedos & Geek', 'Moda & Infantil'],
        description: 'Venda por atacado de produtos licenciados.',
        country: 'ES'
    },
    {
        name: 'Gem Supplies',
        url: 'https://gemsupplies.es/',
        categories: ['Geral'],
        description: 'Fornecedor geral de suprimentos.',
        country: 'ES'
    },
    {
        name: 'Merkandi',
        url: 'https://merkandi.es/',
        categories: ['Geral'],
        description: 'Plataforma para estoques, saldos e liquidações.',
        country: 'EU'
    }
];
