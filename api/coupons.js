const axios = require('axios');

module.exports = async (req, res) => {
    // 1. Configurar CORS (Permite que o site leia os dados)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Tratamento de Pre-flight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 2. Dados de Backup (Mock Data)
    // Estes dados aparecerão se as chaves de API não estiverem configuradas ou falharem
    const mockCoupons = [
        { store: "Amazon", logo: "https://logo.clearbit.com/amazon.com.br", title: "Ofertas do Dia", desc: "Até 50% OFF", link: "https://amazon.com.br", code: "AMZ50", exclusive: true },
        { store: "Magalu", logo: "https://logo.clearbit.com/magazineluiza.com.br", title: "Cupom App", desc: "10% de desconto", link: "https://magazineluiza.com.br", code: "APP10", exclusive: false },
        { store: "Nike", logo: "https://logo.clearbit.com/nike.com.br", title: "Lançamentos", desc: "Frete Grátis", link: "https://nike.com.br", code: null, exclusive: false },
        { store: "Samsung", logo: "https://logo.clearbit.com/samsung.com.br", title: "Galaxy Week", desc: "Troca Smart", link: "https://samsung.com.br", code: "GALAXY", exclusive: true }
    ];

    try {
        const coupons = [];
        const LOMADEE_TOKEN = process.env.LOMADEE_TOKEN;
        const AWIN_TOKEN = process.env.AWIN_TOKEN;

        // Se não tiver tokens configurados, retorna Mock imediatamente para não gastar tempo
        if (!LOMADEE_TOKEN && !AWIN_TOKEN) {
            console.log("⚠️ Sem chaves de API configuradas (Env Vars). Retornando Mock Data.");
            return res.status(200).json(mockCoupons);
        }

        // --- TENTATIVA LOMADEE ---
        if (LOMADEE_TOKEN) {
            try {
                console.log("Tentando conectar Lomadee...");
                const lomadeeRes = await axios.get(`https://api.lomadee.com/v3/${LOMADEE_TOKEN}/offer/_store/5632?sourceId=35964357`, { timeout: 5000 });
                
                if (lomadeeRes.data && lomadeeRes.data.offers) {
                    lomadeeRes.data.offers.forEach(offer => {
                        coupons.push({
                            store: offer.store.name,
                            logo: offer.store.thumbnail,
                            title: offer.name,
                            desc: `Por: R$ ${offer.price}`,
                            link: offer.link,
                            code: null,
                            exclusive: false
                        });
                    });
                }
            } catch (err) {
                console.error("Erro Lomadee:", err.message);
                // Não damos 'throw' aqui para permitir que o código continue para a AWIN ou Mock
            }
        }

        // --- TENTATIVA AWIN ---
        if (AWIN_TOKEN) {
            try {
                // Nota: Substitua 'YOUR_ID' pelo seu ID de Publisher real nas variáveis de ambiente se necessário
                // A Awin geralmente requer autenticação Bearer Token
                console.log("Tentando conectar Awin...");
                // Exemplo genérico (ajuste conforme documentação específica da Awin para cupons)
                // const awinRes = await axios.get(...) 
            } catch (err) {
                console.error("Erro Awin:", err.message);
            }
        }

        // 3. RESPOSTA FINAL
        if (coupons.length > 0) {
            return res.status(200).json(coupons);
        } else {
            // Se as APIs falharam, retornamos o Mock para o site não ficar vazio
            return res.status(200).json(mockCoupons);
        }

    } catch (error) {
        console.error("❌ ERRO CRÍTICO NO SERVIDOR:", error);
        // Mesmo no pior cenário, retornamos 200 com Mock para o usuário não ver tela de erro
        return res.status(200).json(mockCoupons);
    }
};