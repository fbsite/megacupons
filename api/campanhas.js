// api/campanhas.js
// ATUALIZADO: Versão à prova de falhas.

// Funções de mapeamento (sem alteração)
function mapAwinCampaign(promo) {
    return { id: `awin_${promo.promotionId}`, name: promo.title, link: promo.url, thumbnail: promo.advertiserLogoUrl || `https://placehold.co/280x150/1E1E1E/FFFFFF?text=${promo.advertiserName}&font=inter` };
}
function mapLomadeeCampaign(campaign) {
    return { id: `lomadee_${campaign.id}`, name: campaign.name, link: campaign.link, thumbnail: campaign.thumbnail };
}

export default async function handler(request, response) {
    const { AWIN_ACCESS_TOKEN, AWIN_PUBLISHER_ID, LOMADEE_API_KEY } = process.env;

    let allCampaigns = [];
    let promises = [];

    // --- Prepara a chamada Lomadee ---
    if (LOMADEE_API_KEY) {
        const lomadeeUrl = `https://api.lomadee.com/affiliate/campaigns`;
        const lomadeeHeaders = { 'x-api-key': LOMADEE_API_KEY };
        promises.push(fetch(lomadeeUrl, { headers: lomadeeHeaders }).then(res => ({ source: 'lomadee', res })));
    } else {
        console.warn('LOMADEE_API_KEY não encontrada. A saltar a API Lomadee.');
    }

    // --- Prepara a chamada AWIN ---
    if (AWIN_ACCESS_TOKEN && AWIN_PUBLISHER_ID) {
        const awinUrl = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/promotions?relationship=joined&language=pt`;
        const awinHeaders = { 'Authorization': `Bearer ${AWIN_ACCESS_TOKEN}` };
        promises.push(fetch(awinUrl, { headers: awinHeaders }).then(res => ({ source: 'awin', res })));
    } else {
        console.warn('Chaves AWIN não encontradas. A saltar a API AWIN.');
    }

    // --- Executa ---
    const results = await Promise.allSettled(promises);

    // --- Processa ---
    for (const result of results) {
        if (result.status === 'rejected') {
            console.error(`Falha ao buscar API: ${result.reason}`);
            continue;
        }

        const { source, res } = result.value;

        if (!res.ok) {
            console.error(`API ${source} respondeu com erro: ${res.status}`);
            continue;
        }

        try {
            const data = await res.json();
            if (source === 'lomadee' && data.data && Array.isArray(data.data)) {
                allCampaigns.push(...data.data.map(mapLomadeeCampaign));
            } else if (source === 'awin' && data.promotions && Array.isArray(data.promotions)) {
                allCampaigns.push(...data.promotions.map(mapAwinCampaign));
            }
        } catch (e) {
            console.error(`Falha ao processar JSON da API ${source}: ${e.message}`);
        }
    }
    
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return response.status(200).json(allCampaigns);
}