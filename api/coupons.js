const axios = require('axios');

// ------------------------------------------------------------------
// ÁREA VIP: SEUS LINKS MANUAIS
// ------------------------------------------------------------------
const OFERTAS_MANUAIS = [
    {
        store: "Amazon",
        logo: "https://logo.clearbit.com/amazon.com.br",
        title: "Ofertas do Dia Amazon",
        desc: "Descontos exclusivos em eletrônicos.",
        link: "#", // COLE SEU LINK AQUI
        code: null,
        exclusive: true
    }
];

module.exports = async (req, res) => {
    // Apenas o Token principal agora
    const lomadeeToken = process.env.LOMADEE_TOKEN; 
    const awinToken = process.env.AWIN_TOKEN;
    const awinPublisherId = process.env.AWIN_PUBLISHER_ID;

    let apiCoupons = [];

    try {
        // 1. LOMADEE V3 (Simplificado: Apenas Token na URL)
        if (lomadeeToken) {
            try {
                // Documentação nova: GET /v3/{AppToken}/offer/_search
                const lomaUrl = `https://api.lomadee.com/v3/${lomadeeToken}/offer/_search?size=10&sort=rating`;
                
                const respL = await axios.get(lomaUrl);
                
                if (respL.data && respL.data.offers) {
                    const lomaItems = respL.data.offers.map(item => ({
                        store: item.store.name,
                        logo: item.store.thumbnail,
                        title: item.name,
                        desc: `Oferta verificada na ${item.store.name}`,
                        link: item.link,
                        code: null,
                        exclusive: false
                    }));
                    apiCoupons = [...apiCoupons, ...lomaItems];
                }
            } catch (errL) {
                console.log("Lomadee Error:", errL.response ? errL.response.data : errL.message);
            }
        }

        // 2. AWIN (Continua igual, verifique se o ID é numérico)
        if (awinToken && awinPublisherId) {
            try {
                const respA = await axios.get(`https://api.awin.com/publishers/${awinPublisherId}/promotions`, {
                    headers: { Authorization: `Bearer ${awinToken}` }
                });
                
                if (respA.data && Array.isArray(respA.data)) {
                    const awinItems = respA.data.slice(0, 8).map(item => ({
                        store: item.advertiser.name,
                        logo: `https://logo.clearbit.com/${getDomain(item.advertiser.url)}`,
                        title: item.title,
                        desc: item.description || "Oferta Awin",
                        link: item.url,
                        code: item.voucher_code || null,
                        exclusive: false
                    }));
                    apiCoupons = [...apiCoupons, ...awinItems];
                }
            } catch (errA) {
                console.log("Awin Error:", errA.response ? errA.response.status : errA.message);
            }
        }

        // 3. MISTURA E RETORNO
        let finalCoupons = [...OFERTAS_MANUAIS, ...apiCoupons];

        // Se falhar tudo, mostra backup para não quebrar o layout
        if (finalCoupons.length === 0 || (finalCoupons.length === 1 && finalCoupons[0].link === "#")) {
             return res.status(200).json(getBackupData());
        }

        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        return res.status(200).json(finalCoupons);

    } catch (error) {
        console.error("Erro Geral:", error.message);
        return res.status(200).json(getBackupData());
    }
};

function getDomain(url) {
    try { return url.replace('http://','').replace('https://','').split('/')[0]; } catch(e) { return 'awin.com'; }
}

function getBackupData() {
    return [
        { store: "Sistema", logo: "https://placehold.co/80x80?text=Info", title: "Aguardando Conexão", desc: "Verifique os logs da Vercel para detalhes do erro.", link: "#", code: "INFO", exclusive: true }
    ];
}