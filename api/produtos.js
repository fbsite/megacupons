// api/produtos.js
// ATUALIZADO: Versão à prova de falhas.

// Funções de mapeamento (sem alteração)
function mapAwinDeal(voucher) {
    return { id: `awin_deal_${voucher.voucherId}`, code: null, description: voucher.description, link: voucher.url, store: { name: voucher.advertiserName, logoUrl: voucher.advertiserLogoUrl }, endDate: voucher.endDate, platform: 'AWIN' };
}
function mapLomadeeDeal(coupon) {
    return { id: `lomadee_deal_${coupon.id}`, code: null, description: coupon.description, link: coupon.link, store: { name: coupon.store.name, logoUrl: coupon.store.thumbnail }, endDate: coupon.endDate, platform: 'Lomadee' };
}

export default async function handler(request, response) {
    const { AWIN_ACCESS_TOKEN, AWIN_PUBLISHER_ID, LOMADEE_API_KEY } = process.env;

    let allDeals = [];
    let promises = [];

    // --- Prepara a chamada Lomadee ---
    if (LOMADEE_API_KEY) {
        const lomadeeUrl = `https://api.lomadee.com/affiliate/coupons`; // Busca cupons para filtrar
        const lomadeeHeaders = { 'x-api-key': LOMADEE_API_KEY };
        promises.push(fetch(lomadeeUrl, { headers: lomadeeHeaders }).then(res => ({ source: 'lomadee', res })));
    } else {
        console.warn('LOMADEE_API_KEY não encontrada. A saltar a API Lomadee.');
    }

    // --- Prepara a chamada AWIN ---
    if (AWIN_ACCESS_TOKEN && AWIN_PUBLISHER_ID) {
        const awinUrl = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/vouchers?type=deal&relationship=joined&language=pt`;
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
                const lomadeeDeals = data.data.filter(coupon => !coupon.code); // Filtra só "deals"
                allDeals.push(...lomadeeDeals.map(mapLomadeeDeal));
            } else if (source === 'awin' && Array.isArray(data)) {
                allDeals.push(...data.map(mapAwinDeal));
            }
        } catch (e) {
            console.error(`Falha ao processar JSON da API ${source}: ${e.message}`);
        }
    }
    
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return response.status(200).json(allDeals);
}