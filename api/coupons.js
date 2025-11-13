const axios = require('axios');

// ------------------------------------------------------------------
// 1. OFERTAS MANUAIS (O "Filé Mignon")
// Coloque aqui os links que você quer garantir que apareçam no topo.
// ------------------------------------------------------------------
const OFERTAS_MANUAIS = [
    {
        store: "Amazon",
        logo: "https://logo.clearbit.com/amazon.com.br",
        title: "Ofertas Relâmpago",
        desc: "Eletrônicos com até 40% OFF",
        link: "https://www.amazon.com.br/deals?tag=SEU_TAG_AQUI", // <--- COLE SEU LINK AQUI
        code: null,
        exclusive: true
    },
    {
        store: "AliExpress",
        logo: "https://logo.clearbit.com/aliexpress.com",
        title: "Choice Day",
        desc: "Frete Grátis acima de R$99",
        link: "#", // <--- COLE SEU LINK AQUI
        code: "BR15",
        exclusive: false
    }
];

// ------------------------------------------------------------------
// 2. OFERTAS DE BACKUP (Para o site nunca ficar vazio/feio)
// ------------------------------------------------------------------
const BACKUP_OFFERS = [
    { store: "Magalu", logo: "https://logo.clearbit.com/magazineluiza.com.br", title: "Smartphones no PIX", desc: "Ofertas selecionadas", link: "#", code: null, exclusive: false },
    { store: "Shopee", logo: "https://logo.clearbit.com/shopee.com.br", title: "Cupons de Frete", desc: "Válido no App", link: "#", code: "FRETEOFF", exclusive: true },
    { store: "Nike", logo: "https://logo.clearbit.com/nike.com.br", title: "Lançamentos", desc: "Novas cores Jordan", link: "#", code: null, exclusive: false },
    { store: "Casas Bahia", logo: "https://logo.clearbit.com/casasbahia.com.br", title: "Saldão", desc: "Móveis e Eletro", link: "#", code: "CASA10", exclusive: false }
];

module.exports = async (req, res) => {
    // Configurações da Vercel
    const lomaToken = process.env.LOMADEE_TOKEN;
    const lomaSource = process.env.LOMADEE_SOURCE_ID;
    const awinToken = process.env.AWIN_TOKEN;
    const awinPubId = process.env.AWIN_PUBLISHER_ID;

    let apiCoupons = [];

    // --- TENTATIVA LOMADEE ---
    if (lomaToken && lomaSource) {
        try {
            // Usamos SourceId porque o servidor exigiu no log de erro
            const url = `https://api.lomadee.com/v3/${lomaToken}/offer/_search?sourceId=${lomaSource}&size=6&sort=rating`;
            const resp = await axios.get(url, { timeout: 4000 }); // Timeout para não travar
            
            if (resp.data && resp.data.offers) {
                apiCoupons.push(...resp.data.offers.map(i => ({
                    store: i.store.name,
                    logo: i.store.thumbnail,
                    title: i.name,
                    desc: "Oferta Verificada",
                    link: i.link,
                    code: null,
                    exclusive: false
                })));
            }
        } catch (e) {
            console.log("Lomadee Off (Usando Backup)");
        }
    }

    // --- TENTATIVA AWIN ---
    if (awinToken && awinPubId) {
        try {
            const url = `https://api.awin.com/publishers/${awinPubId}/promotions`;
            const resp = await axios.get(url, { 
                headers: { Authorization: `Bearer ${awinToken}` },
                timeout: 4000 
            });

            if (resp.data && Array.isArray(resp.data)) {
                apiCoupons.push(...resp.data.slice(0, 6).map(i => ({
                    store: i.advertiser.name,
                    logo: `https://logo.clearbit.com/${getDomain(i.advertiser.url)}`,
                    title: i.title,
                    desc: i.description || "Promoção",
                    link: i.url,
                    code: i.voucher_code || null,
                    exclusive: false
                })));
            }
        } catch (e) {
            console.log("Awin Off (Usando Backup)");
        }
    }

    // --- MONTAGEM FINAL ---
    // 1. Manuais Primeiro + 2. API no Meio
    let finalResult = [...OFERTAS_MANUAIS, ...apiCoupons];

    // 3. Se a API falhou e só temos os manuais (ou nem isso), preenche com Backup
    if (apiCoupons.length === 0) {
        finalResult = [...finalResult, ...BACKUP_OFFERS];
    }

    // Cache para o site ser rápido
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(finalResult);
};

function getDomain(u) { try { return u.replace('http://','').replace('https://','').split('/')[0]; } catch(e){return 'awin.com'} }