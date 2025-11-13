export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Retorna lojas básicas
    res.status(200).json([
        { name: "Amazon", logoUrl: "https://logo.clearbit.com/amazon.com.br", link: "#" },
        { name: "Magalu", logoUrl: "https://logo.clearbit.com/magazineluiza.com.br", link: "#" },
        { name: "Americanas", logoUrl: "https://logo.clearbit.com/americanas.com.br", link: "#" },
        { name: "Shopee", logoUrl: "https://logo.clearbit.com/shopee.com.br", link: "#" }
    ]);
}