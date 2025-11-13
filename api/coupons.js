const axios = require('axios');

// SEUS LINKS MANUAIS
const OFERTAS_MANUAIS = [
    {
        store: "Amazon",
        logo: "https://logo.clearbit.com/amazon.com.br",
        title: "Ofertas do Dia",
        desc: "Descontos exclusivos.",
        link: "#",
        code: null,
        exclusive: true
    }
];

module.exports = async (req, res) => {
    const lomadeeToken = process.env.LOMADEE_TOKEN;
    const awinToken = process.env.AWIN_TOKEN;
    const awinPublisherId = process.env.AWIN_PUBLISHER_ID;
    const lomadeeSourceId = process.env.LOMADEE_SOURCE_ID; // Trazendo de volta caso precise

    let debugLog = [];
    let apiCoupons = [];

    // 1. TESTE LOMADEE
    if (lomadeeToken) {
        try {
            // Tentativa padrão V3
            const url = `https://api.lomadee.com/v3/${lomadeeToken}/offer/_search?size=5`;
            const resp = await axios.get(url);
            
            if (resp.data && resp.data.offers) {
                const items = resp.data.offers.map(item => ({
                    store: item.store.name, logo: item.store.thumbnail, title: item.name,
                    desc: "Oferta Lomadee", link: item.link, code: null, exclusive: false
                }));
                apiCoupons = [...apiCoupons, ...items];
            } else {
                debugLog.push({ erro: "Lomadee: Resposta vazia (sem ofertas)" });
            }
        } catch (e) {
            // Captura o erro detalhado
            const status = e.response ? e.response.status : "Sem Status";
            const msg = e.response ? JSON.stringify(e.response.data) : e.message;
            debugLog.push({ erro: `Lomadee Falhou (${status})`, detalhe: msg });
        }
    } else {
        debugLog.push({ erro: "Lomadee: Token não configurado na Vercel" });
    }

    // 2. TESTE AWIN
    if (awinToken && awinPublisherId) {
        try {
            const url = `https://api.awin.com/publishers/${awinPublisherId}/promotions`;
            const resp = await axios.get(url, { headers: { Authorization: `Bearer ${awinToken}` }});
            
            if (resp.data && Array.isArray(resp.data)) {
                const items = resp.data.slice(0, 5).map(item => ({
                    store: item.advertiser.name, logo: "https://placehold.co/80", title: item.title,
                    desc: "Oferta Awin", link: item.url, code: null, exclusive: false
                }));
                apiCoupons = [...apiCoupons, ...items];
            }
        } catch (e) {
            const status = e.response ? e.response.status : "Sem Status";
            const msg = e.response ? JSON.stringify(e.response.data) : e.message;
            debugLog.push({ erro: `Awin Falhou (${status})`, detalhe: msg });
        }
    } else {
        debugLog.push({ erro: "Awin: Token ou ID não configurado na Vercel" });
    }

    // MISTURA TUDO
    let finalResult = [...OFERTAS_MANUAIS, ...apiCoupons];

    // SE FALHOU TUDO, MOSTRA O LOG DE ERRO NO LUGAR DO CUPOM
    if (finalResult.length === 1) { // Só tem o manual
        const errorCards = debugLog.map(log => ({
            store: "ERRO API",
            logo: "https://placehold.co/80x80/FF0000/FFFFFF?text=ERRO",
            title: log.erro,
            desc: log.detalhe ? log.detalhe.substring(0, 100) + "..." : "Verifique chaves",
            link: "#",
            code: "DEBUG",
            exclusive: true
        }));
        finalResult = [...finalResult, ...errorCards];
    }

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    return res.status(200).json(finalResult);
};