const axios = require('axios');

// SEUS LINKS MANUAIS (Sempre funcionam)
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
    const lomaToken = process.env.LOMADEE_TOKEN;
    // Se não tiver sourceId na Vercel, usa string vazia para tentar burlar ou 'null'
    const lomaSource = process.env.LOMADEE_SOURCE_ID || ""; 
    
    const awinToken = process.env.AWIN_TOKEN;
    const awinPubId = process.env.AWIN_PUBLISHER_ID;

    let apiCoupons = [];

    // 1. LOMADEE (Tenta estratégia mista)
    if (lomaToken) {
        try {
            // Tenta a chamada padrão. Se lomaSource for vazio, a API pode aceitar ou reclamar.
            // Adicionei &sourceId=${lomaSource} apenas se ele existir, caso contrário não envia.
            let lomaUrl = `https://api.lomadee.com/v3/${lomaToken}/offer/_search?size=10&sort=rating`;
            if (lomaSource) {
                lomaUrl += `&sourceId=${lomaSource}`;
            }

            const respL = await axios.get(lomaUrl);
            if (respL.data && respL.data.offers) {
                apiCoupons.push(...formatLomadee(respL.data.offers));
            }
        } catch (e) {
            // Se falhar, tenta o "truque" de enviar sourceId genérico se o erro for sourceId
            const errData = e.response ? JSON.stringify(e.response.data) : "";
            if (errData.includes("sourceId") && !lomaSource) {
                try {
                    console.log("Tentando bypass de SourceID...");
                    // Tenta um ID genérico ou endpoint de categorias para pegar ao menos algo? 
                    // Infelizmente ofertas exige sourceId. Vamos logar apenas.
                } catch (e2) {}
            }
            console.log("Lomadee Error:", e.message);
        }
    }

    // 2. AWIN
    if (awinToken && awinPubId) {
        try {
            const respA = await axios.get(`https://api.awin.com/publishers/${awinPubId}/promotions`, {
                headers: { Authorization: `Bearer ${awinToken}` }
            });
            if (respA.data && Array.isArray(respA.data)) {
                 apiCoupons.push(...formatAwin(respA.data));
            }
        } catch (e) {
            console.log("Awin Error:", e.response ? e.response.status : e.message);
        }
    }

    // Mistura
    const final = [...OFERTAS_MANUAIS, ...apiCoupons];
    
    // Cache
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json(final);
};

// Formatadores para limpar o código principal
function formatLomadee(offers) {
    return offers.map(i => ({
        store: i.store.name,
        logo: i.store.thumbnail,
        title: i.name,
        desc: `Oferta verificada: ${i.category.name}`,
        link: i.link,
        code: null,
        exclusive: false
    }));
}

function formatAwin(promos) {
    return promos.slice(0, 10).map(i => ({
        store: i.advertiser.name,
        logo: `https://logo.clearbit.com/${getDomain(i.advertiser.url)}`,
        title: i.title,
        desc: i.description || "Oferta Awin",
        link: i.url,
        code: i.voucher_code || null,
        exclusive: false
    }));
}

function getDomain(url) {
    try { return url.replace('http://','').replace('https://','').split('/')[0]; } catch(e){ return 'awin.com'}
}