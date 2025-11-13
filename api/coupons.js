const axios = require('axios');

// --- LINKS MANUAIS (Sua garantia de que sempre haverá ofertas) ---
const OFERTAS_MANUAIS = [
    {
        store: "Amazon",
        logo: "https://logo.clearbit.com/amazon.com.br",
        title: "Ofertas do Dia",
        desc: "Eletrônicos e Casa Inteligente",
        link: "#", // COLE SEU LINK DE AFILIADO AQUI
        code: null,
        exclusive: true
    }
];

module.exports = async (req, res) => {
    // Pegando as chaves da Vercel
    const lomaToken = process.env.LOMADEE_TOKEN;
    const lomaSourceId = process.env.LOMADEE_SOURCE_ID; // OBRIGATÓRIO
    
    const awinToken = process.env.AWIN_TOKEN;
    const awinPubId = process.env.AWIN_PUBLISHER_ID;

    let apiCoupons = [];
    let debugLog = [];

    // 1. LOMADEE (Com SourceID)
    if (lomaToken && lomaSourceId) {
        try {
            // Endpoint de Busca de Ofertas (Requer SourceID)
            const url = `https://api.lomadee.com/v3/${lomaToken}/offer/_search?sourceId=${lomaSourceId}&size=10&sort=rating`;
            
            const resp = await axios.get(url);
            
            if (resp.data && resp.data.offers) {
                const items = resp.data.offers.map(item => ({
                    store: item.store.name,
                    logo: item.store.thumbnail,
                    title: item.name,
                    desc: `Oferta verificada em ${item.category.name}`,
                    link: item.link,
                    code: null,
                    exclusive: false
                }));
                apiCoupons = [...apiCoupons, ...items];
            }
        } catch (e) {
            const msg = e.response ? JSON.stringify(e.response.data) : e.message;
            console.log("Erro Lomadee:", msg);
            // Se der erro, guardamos para o log
            if (msg.includes("sourceId")) debugLog.push("Lomadee: SourceID Inválido ou Inexistente");
        }
    } else {
        debugLog.push("Lomadee: Falta configurar LOMADEE_SOURCE_ID na Vercel");
    }

    // 2. AWIN
    if (awinToken && awinPubId) {
        try {
            // Endpoint de Promoções
            const url = `https://api.awin.com/publishers/${awinPubId}/promotions`;
            const resp = await axios.get(url, {
                headers: { Authorization: `Bearer ${awinToken}` }
            });
            
            if (resp.data && Array.isArray(resp.data)) {
                const items = resp.data.slice(0, 10).map(item => ({
                    store: item.advertiser.name,
                    logo: `https://logo.clearbit.com/${getDomain(item.advertiser.url)}`,
                    title: item.title,
                    desc: item.description || "Promoção Exclusiva",
                    link: item.url,
                    code: item.voucher_code || null,
                    exclusive: false
                }));
                apiCoupons = [...apiCoupons, ...items];
            }
        } catch (e) {
            console.log("Erro Awin:", e.message);
            if (e.response && e.response.status === 404) {
                debugLog.push("Awin: ID de Publicador incorreto (Erro 404)");
            }
        }
    }

    // 3. RESULTADO FINAL
    const finalResult = [...OFERTAS_MANUAIS, ...apiCoupons];

    // Se falhar tudo, mostra card de diagnóstico
    if (finalResult.length === 1 && debugLog.length > 0) {
        finalResult.push({
            store: "Diagnóstico",
            logo: "https://placehold.co/80?text=!",
            title: "Ajuste Necessário",
            desc: debugLog.join(" | "),
            link: "#",
            code: "ERRO",
            exclusive: true
        });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(finalResult);
};

function getDomain(url) {
    try { return url.replace('http://','').replace('https://','').split('/')[0]; } catch(e){ return 'awin.com'}
}