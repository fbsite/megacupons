const axios = require('axios');

// ------------------------------------------------------------------
// 1. SUAS OFERTAS MANUAIS (Links Reais - Coloque os seus aqui)
// ------------------------------------------------------------------
const OFERTAS_MANUAIS = [
    {
        store: "Amazon",
        logo: "https://logo.clearbit.com/amazon.com.br",
        title: "Ofertas do Dia",
        desc: "Eletrônicos e Casa com descontos reais.",
        link: "https://www.amazon.com.br/deals?_encoding=UTF8&tag=SEU_TAG_AQUI", // Mude isso
        code: null,
        exclusive: true
    },
    {
        store: "AliExpress",
        logo: "https://logo.clearbit.com/aliexpress.com",
        title: "Choice Day",
        desc: "Frete Grátis em compras acima de R$99",
        link: "#", // Coloque seu link
        code: "BR15",
        exclusive: false
    }
];

// ------------------------------------------------------------------
// 2. OFERTAS DE BACKUP (Para o site nunca ficar vazio se a API falhar)
// ------------------------------------------------------------------
const BACKUP_OFFERS = [
    { store: "Magalu", logo: "https://logo.clearbit.com/magazineluiza.com.br", title: "Saldão de Smartphones", desc: "Até 30% OFF no PIX", link: "#", code: null, exclusive: false },
    { store: "Shopee", logo: "https://logo.clearbit.com/shopee.com.br", title: "Cupom de Frete Grátis", desc: "Válido no App", link: "#", code: "FRETEOFF", exclusive: true },
    { store: "Nike", logo: "https://logo.clearbit.com/nike.com.br", title: "Lançamentos Jordan", desc: "Novas cores disponíveis", link: "#", code: null, exclusive: false },
    { store: "Casas Bahia", logo: "https://logo.clearbit.com/casasbahia.com.br", title: "Móveis e Eletro", desc: "Saldão de Estoque", link: "#", code: "CASA10", exclusive: false }
];

module.exports = async (req, res) => {
    const lomaToken = process.env.LOMADEE_TOKEN;
    const lomaSource = process.env.LOMADEE_SOURCE_ID;
    const awinToken = process.env.AWIN_TOKEN;
    const awinPubId = process.env.AWIN_PUBLISHER_ID;

    let apiCoupons = [];

    // Tenta conectar LOMADEE (Silencioso se falhar)
    if (lomaToken && lomaSource) {
        try {
            const url = `https://api.lomadee.com/v3/${lomaToken}/offer/_search?sourceId=${lomaSource}&size=6`;
            const resp = await axios.get(url, { timeout: 3000 }); // Timeout curto para não travar
            if (resp.data?.offers) {
                apiCoupons.push(...resp.data.offers.map(i => ({
                    store: i.store.name, logo: i.store.thumbnail, title: i.name,
                    desc: `Oferta verificada`, link: i.link, code: null, exclusive: false
                })));
            }
        } catch (e) { console.log("Lomadee Off"); }
    }

    // Tenta conectar AWIN (Silencioso se falhar)
    if (awinToken && awinPubId) {
        try {
            const url = `https://api.awin.com/publishers/${awinPubId}/promotions`;
            const resp = await axios.get(url, { headers: { Authorization: `Bearer ${awinToken}` }, timeout: 3000 });
            if (resp.data && Array.isArray(resp.data)) {
                apiCoupons.push(...resp.data.slice(0, 6).map(i => ({
                    store: i.advertiser.name, logo: `https://logo.clearbit.com/${getDomain(i.advertiser.url)}`, title: i.title,
                    desc: i.description || "Promoção", link: i.url, code: i.voucher_code || null, exclusive: false
                })));
            }
        } catch (e) { console.log("Awin Off"); }
    }

    // 3. LÓGICA FINAL: Manual + API + Backup (se precisar)
    let final = [...OFERTAS_MANUAIS, ...apiCoupons];
    
    // Se a API falhou (não trouxe nada), completa com Backup para o site ficar bonito
    if (apiCoupons.length === 0) {
        final = [...final, ...BACKUP_OFFERS];
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json(final);
};

function getDomain(u) { try { return u.replace('http://','').replace('https://','').split('/')[0]; } catch(e){return 'awin.com'} }