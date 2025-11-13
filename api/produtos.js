export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Retorna produtos de exemplo para não travar o site
    res.status(200).json([
        {
            name: "Smartphone Exemplo 5G",
            price: "1.299,00",
            img: "https://placehold.co/200x200?text=Celular",
            store: "Magalu",
            link: "#"
        },
        {
            name: "Notebook Gamer",
            price: "4.500,00",
            img: "https://placehold.co/200x200?text=Notebook",
            store: "Amazon",
            link: "#"
        }
    ]);
}