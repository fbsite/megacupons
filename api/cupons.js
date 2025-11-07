// api/campanhas.js
// ATUALIZADO: Funde AWIN e Lomadee

// Mapeador para o formato que o frontend espera
function mapAwinCampaign(promo) {
    return {
        id: `awin_${promo.promotionId}`,
        name: promo.title,
        link: promo.url,
        thumbnail: promo.advertiserLogoUrl || `https://placehold.co/280x150/1E1E1E/FFFFFF?text=${promo.advertiserName}&font=inter` // Usa logo como thumbnail
    };
}

function mapLomadeeCampaign(campaign) {
    return {
        id: `lomadee_${campaign.id}`,
        name: campaign.name,
        link: campaign.link,
        thumbnail: campaign.thumbnail
    };
}

export default async function handler(request, response) {
    const { AWIN_ACCESS_TOKEN, AWIN_PUBLISHER_ID, LOMADEE_API_KEY } = process.env;

    if (!AWIN_ACCESS_TOKEN || !AWIN_PUBLISHER_ID || !LOMADEE_API_KEY) {
        return response.status(500).json({ error: 'Variáveis de Ambiente não configuradas.' });
    }

    // --- Definições das APIs ---
    const AWIN_API_URL = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/promotions?relationship=joined&language=pt`;
    const LOMADEE_API_URL = `https://api.lomadee.com/affiliate/campaigns`;

    const awinHeaders = { 'Authorization': `Bearer ${AWIN_ACCESS_TOKEN}` };
    const lomadeeHeaders = { 'x-api-key': LOMADEE_API_KEY };

    // --- Chamadas em Paralelo ---
    const [awinResult, lomadeeResult] = await Promise.allSettled([
        fetch(AWIN_API_URL, { headers: awinHeaders }),
        fetch(LOMADEE_API_URL, { headers: lomadeeHeaders })
    ]);

    let allCampaigns = [];

    // --- Processar AWIN ---
    if (awinResult.status === 'fulfilled' && awinResult.value.ok) {
        const awinData = await awinResult.value.json();
        if (awinData.promotions && Array.isArray(awinData.promotions)) {
            allCampaigns.push(...awinData.promotions.map(mapAwinCampaign));
        }
    } else {
        console.error("Erro ao buscar campanhas AWIN:", awinResult.reason || `Status ${awinResult.value.status}`);
    }

    // --- Processar Lomadee ---
    if (lomadeeResult.status === 'fulfilled' && lomadeeResult.value.ok) {
        const lomadeeData = await lomadeeResult.value.json();
        if (lomadeeData.data && Array.isArray(lomadeeData.data)) {
            allCampaigns.push(...lomadeeData.data.map(mapLomadeeCampaign));
        }
    } else {
        console.error("Erro ao buscar campanhas Lomadee:", lomadeeResult.reason || `Status ${lomadeeResult.value.status}`);
    }
    
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return response.status(200).json(allCampaigns);
}