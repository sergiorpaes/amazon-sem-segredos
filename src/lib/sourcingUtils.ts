export const getSupplierLinks = (title: string, brand?: string) => {
    // Clean title for search (remove generic terms, take first 4-6 words for better results)
    const cleanQuery = title
        .replace(/[^\w\s]/gi, '')
        .split(' ')
        .slice(0, 5)
        .join(' ')
        .trim();

    const searchQuery = encodeURIComponent(brand ? `${brand} ${cleanQuery}` : cleanQuery);

    return {
        alibaba: `https://www.alibaba.com/trade/search?SearchText=${searchQuery}&f0=y&IndexArea=product_en`,
        aliexpress: `https://www.aliexpress.com/wholesale?SearchText=${searchQuery}`,
        1688: `https://s.1688.com/youyuan/index.htm?tab=imageSearch&imageAddress=&searchText=${searchQuery}`,
        googleLens: `https://www.google.com/search?q=${searchQuery}&tbm=shop`,
        zentrada: `https://www.zentrada.com/es/search/${searchQuery}?thesaurus=true`,
        bigbuy: `https://www.bigbuy.eu/en/search/results?q=${searchQuery}`
    };
};
