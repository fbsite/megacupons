export default function handler(req, res) {
    // Configuração padrão para evitar erro de CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Retorna um array vazio (ou dados de teste) para o site não quebrar
    // Futuramente você conecta isso na API da Awin/Lomadee igual fez no coupons.js
    res.status(200).json([
        {
            title: "Semana do Cliente",
            img: "https://placehold.co/280x150/FF3B80/FFF?text=Ofertas&font=inter",
            link: "#",
            description: "Descontos progressivos em todo site"
        },
        {
            title: "Frete Grátis",
            img: "https://placehold.co/280x150/00BFA6/FFF?text=Frete+Free&font=inter",
            link: "#",
            description: "Para compras acima de R$ 99"
        }
    ]);
}