// Este arquivo fica em: /api/coupons.js
// Ele é quem conversa com a Lomadee e Awin de verdade.

import axios from 'axios';

export default async function handler(req, res) {
    // Permite que seu site acesse a API (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 1. PEGA AS SENHAS QUE VOCÊ CADASTROU NA VERCEL
    const LOMADEE_TOKEN = process.env.LOMADEE_TOKEN;     // Ex: 123456789
    const SOURCE_ID = process.env.LOMADEE_SOURCE_ID;     // Ex: 38492
    const AWIN_TOKEN = process.env.AWIN_TOKEN;           // Token Awin
    const AWIN_ID = process.env.AWIN_PUBLISHER_ID;       // ID Awin

    // Se não tiver senhas configuradas, avisa o erro
    if (!LOMADEE_TOKEN && !AWIN_TOKEN) {
        return res.status(500).json({ 
            error: "Tokens de API não configurados no Painel da Vercel." 
        });
    }

    try {
        let allCoupons = [];

        // 2. TENTA BUSCAR NA LOMADEE (Se tiver token)
        if (LOMADEE_TOKEN) {
            try {
                const lomadeeUrl = `https://api.lomadee.com/v3/${LOMADEE_TOKEN}/coupon/_all?sourceId=${SOURCE_ID}`;
                const respLomadee = await axios.get(lomadeeUrl);
                
                if (respLomadee.data && respLomadee.data.coupons) {
                    const lomaCoupons = respLomadee.data.coupons.map(c => ({
                        store: c.store.name,
                        logo: c.store.thumbnail, // A Lomadee manda o logo
                        title: `${c.discount}% OFF`,
                        desc: c.description,
                        code: c.code,
                        link: c.link,
                        exclusive: false,
                        origin: 'lomadee'
                    }));
                    allCoupons = [...allCoupons, ...lomaCoupons];
                }
            } catch (errLoma) {
                console.error("Erro Lomadee:", errLoma.message);
            }
        }

        // 3. TENTA BUSCAR NA AWIN (Se tiver token)
        if (AWIN_TOKEN) {
            try {
                // Exemplo de endpoint AWIN (verifique a documentação atualizada deles)
                const awinUrl = `https://api.awin.com/publishers/${AWIN_ID}/promotions`;
                const respAwin = await axios.get(awinUrl, {
                    headers: { Authorization: `Bearer ${AWIN_TOKEN}` }
                });

                // AWIN geralmente retorna CSV ou JSON dependendo do endpoint
                // Aqui assumimos um JSON simplificado para exemplo
                if (respAwin.data && Array.isArray(respAwin.data)) {
                    const awinCoupons = respAwin.data.map(c => ({
                        store: c.advertiser.name,
                        logo: "https://placehold.co/70?text=Loja", // AWIN as vezes não manda logo fácil
                        title: c.title,
                        desc: c.description,
                        code: c.code,
                        link: c.clickUrl,
                        exclusive: false,
                        origin: 'awin'
                    }));
                    allCoupons = [...allCoupons, ...awinCoupons];
                }
            } catch (errAwin) {
                console.error("Erro Awin:", errAwin.message);
            }
        }

        // 4. RETORNA TUDO MISTURADO
        res.status(200).json(allCoupons);

    } catch (error) {
        console.error("Erro Geral API:", error);
        res.status(500).json({ error: 'Erro interno ao buscar ofertas.' });
    }
}