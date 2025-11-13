import axios from 'axios';

export default async function handler(req, res) {
    // 1. Configurar CORS (Permite que o site leia os dados)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Dados de Backup (Caso a API falhe, usamos isso para não dar Erro 500)
    const mockCoupons = [
        { store: "Amazon", logo: "https://logo.clearbit.com/amazon.com.br", title: "R$ 20 OFF no App", desc: "Primeira compra", link: "https://amazon.com.br", code: "APP20", exclusive: true },
        { store: "Magalu", logo: "https://logo.clearbit.com/magazineluiza.com.br", title: "10% OFF Seleção", desc: "Ofertas do dia", link: "https://magazineluiza.com.br", code: "MAGALU10", exclusive: false },
        { store: "Nike", logo: "https://logo.clearbit.com/nike.com.br", title: "Frete Grátis", desc: "Acima de R$ 199", link: "https://nike.com.br", code: null, exclusive: false }
    ];

    try {
        const coupons = [];
        const LOMADEE_TOKEN = process.env.LOMADEE_TOKEN;
        const AWIN_TOKEN = process.env.AWIN_TOKEN;

        // --- TENTATIVA LOMADEE ---
        if (LOMADEE_TOKEN) {
            try {
                // Exemplo de chamada (ajuste conforme documentação real da Lomadee)
                const lomadeeRes = await axios.get(`https://api.lomadee.com/v3/${LOMADEE_TOKEN}/offer/_store/5632`, { timeout: 4000 });
                if (lomadeeRes.data && lomadeeRes.data.offers) {
                    lomadeeRes.data.offers.forEach(offer => {
                        coupons.push({
                            store: offer.store.name,
                            logo: offer.store.thumbnail,
                            title: offer.name,
                            desc: `Por: R$ ${offer.price}`,
                            link: offer.link,
                            code: null, // Lomadee geralmente é link direto
                            exclusive: false
                        });
                    });
                }
            } catch (err) {
                console.error("Erro Lomadee (Ignorado para não quebrar site):", err.message);
            }
        }

        // --- TENTATIVA AWIN ---
        if (AWIN_TOKEN) {
            try {
                const awinRes = await axios.get('https://api.awin.com/publishers/YOUR_ID/promotions', {
                    headers: { Authorization: `Bearer ${AWIN_TOKEN}` },
                    timeout: 4000
                });
                // Lógica de parse da Awin aqui...
            } catch (err) {
                console.error("Erro Awin (Ignorado para não quebrar site):", err.message);
            }
        }

        // 3. DECISÃO FINAL
        // Se conseguimos cupons reais, retorna eles.
        // Se a lista estiver vazia (porque as APIs falharam ou não tem token), retorna o Mock.
        if (coupons.length > 0) {
            return res.status(200).json(coupons);
        } else {
            console.log("Nenhum cupom real obtido (ou chaves não configuradas). Retornando Mock Data.");
            return res.status(200).json(mockCoupons);
        }

    } catch (error) {
        // 4. REDE DE SEGURANÇA MÁXIMA
        // Se o código acima tiver um erro de sintaxe grave, cai aqui.
        // Em vez de dar Erro 500, devolvemos o Mock com status 200.
        console.error("CRITICAL SERVER ERROR:", error);
        return res.status(200).json(mockCoupons);
    }
}