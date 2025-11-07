// api/lojas.js
// ATUALIZADO: Versão à prova de falhas.

export default async function handler(request, response) {
    const { AWIN_ACCESS_TOKEN, AWIN_PUBLISHER_ID, LOMADEE_API_KEY } = process.env;

    const advertisersMap = new Map();
    let promises = [];

    // --- Prepara a chamada Lomadee ---
    if (LOMADEE_API_KEY) {
        const lomadeeUrl = `https://api.lomadee.com/affiliate/coupons`; // Usamos /coupons
        const lomadeeHeaders = { 'x-api-key': LOMADEE_API_KEY };
        promises.push(fetch(lomadeeUrl, { headers: lomadeeHeaders }).then(res => ({ source: 'lomadee', res })));
    } else {
        console.warn('LOMADEE_API_KEY não encontrada. A saltar a API Lomadee para /lojas.');
    }

    // --- Prepara a chamada AWIN ---
    if (AWIN_ACCESS_TOKEN && AWIN_PUBLISHER_ID) {
        const awinVouchersUrl = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/vouchers?relationship=joined&language=pt`;
        const awinPromosUrl = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/promotions?relationship=joined&language=pt`;
        const awinHeaders = { 'Authorization': `Bearer ${AWIN_ACCESS_TOKEN}` };
        
        promises.push(fetch(awinVouchersUrl, { headers: awinHeaders }).then(res => ({ source: 'awin_vouchers', res })));
        promises.push(fetch(awinPromosUrl, { headers: awinHeaders }).then(res => ({ source: 'awin_promos', res })));
    } else {
        console.warn('Chaves AWIN não encontradas. A saltar a API AWIN para /lojas.');
    }

    // --- Executa ---
    const results = await Promise.allSettled(promises);

    // --- Processa ---
    for (const result of results) {
        if (result.status === 'rejected') {
            console.error(`Falha ao buscar API (Lojas): ${result.reason}`);
            continue;
        }

        const { source, res } = result.value;

        if (!res.ok) {
            console.error(`API (Lojas) ${source} respondeu com erro: ${res.status}`);
            continue;
        }

        try {
            const data = await res.json();
            
            // Lojas da Lomadee (via cupons)
            if (source === 'lomadee' && data.data && Array.isArray(data.data)) {
                data.data.forEach(coupon => {
                    const store = coupon.store;
                    if (!store) return; 
                    const id = `lomadee_${store.id}`;
                    if (!advertisersMap.has(id)) {
                        advertisersMap.set(id, { id: id, name: store.name, link: store.link, logoUrl: store.thumbnail });
                    }
                });
            }
            // Lojas da AWIN (via vouchers)
            else if (source === 'awin_vouchers' && Array.isArray(data)) {
                data.forEach(offer => {
                    const id = `awin_${offer.advertiserId}`;
                    if (!advertisersMap.has(id)) {
                        advertisersMap.set(id, { id: id, name: offer.advertiserName, link: offer.url, logoUrl: offer.advertiserLogoUrl });
                    }
                });
            }
            // Lojas da AWIN (via promoções)
            else if (source === 'awin_promos' && data.promotions && Array.isArray(data.promotions)) {
                data.promotions.forEach(offer => {
                    const id = `awin_${offer.advertiserId}`;
                    if (!advertisersMap.has(id)) {
                        advertisersMap.set(id, { id: id, name: offer.advertiserName, link: offer.url, logoUrl: offer.advertiserLogoUrl });
                    }
                });
            }

        } catch (e) {
            console.error(`Falha ao processar JSON da API (Lojas) ${source}: ${e.message}`);
        }
    }

    const uniqueAdvertisers = Array.from(advertisersMap.values());
    uniqueAdvertisers.sort((a, b) => a.name.localeCompare(b.name));

    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 
    return response.status(200).json(uniqueAdvertisers);
}