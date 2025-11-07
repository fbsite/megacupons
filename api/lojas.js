// api/lojas.js
// ATUALIZADO: Funde Lojas da AWIN e Lomadee

export default async function handler(request, response) {
    const { AWIN_ACCESS_TOKEN, AWIN_PUBLISHER_ID, LOMADEE_API_KEY } = process.env;

    if (!AWIN_ACCESS_TOKEN || !AWIN_PUBLISHER_ID || !LOMADEE_API_KEY) {
        return response.status(500).json({ error: 'Variáveis de Ambiente não configuradas.' });
    }

    const awinHeaders = { 'Authorization': `Bearer ${AWIN_ACCESS_TOKEN}` };
    const lomadeeHeaders = { 'x-api-key': LOMADEE_API_KEY };

    // --- Definições das APIs ---
    // AWIN: Busca anunciantes com ofertas ativas
    const awinVouchersUrl = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/vouchers?relationship=joined&language=pt`;
    const awinPromosUrl = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/promotions?relationship=joined&language=pt`;
    // Lomadee: Busca todas as lojas (a API /stores é a mais simples para isto)
    const lomadeeStoresUrl = `https://api.lomadee.com/affiliate/stores`;

    // --- Chamadas em Paralelo ---
    const [awinVouchersRes, awinPromosRes, lomadeeStoresRes] = await Promise.allSettled([
        fetch(awinVouchersUrl, { headers: awinHeaders }),
        fetch(awinPromosUrl, { headers: awinHeaders }),
        fetch(lomadeeStoresUrl, { headers: lomadeeHeaders })
    ]);

    const advertisersMap = new Map();

    // --- Processar AWIN ---
    try {
        if (awinVouchersRes.status === 'fulfilled' && awinVouchersRes.value.ok) {
            const vouchers = await awinVouchersRes.value.json();
            if(Array.isArray(vouchers)) {
                vouchers.forEach(offer => {
                    const id = `awin_${offer.advertiserId}`;
                    if (!advertisersMap.has(id)) {
                        advertisersMap.set(id, {
                            id: id,
                            name: offer.advertiserName,
                            link: offer.url, // Usa o link do cupom como link de fallback
                            logoUrl: offer.advertiserLogoUrl
                        });
                    }
                });
            }
        } else if (awinVouchersRes.status === 'rejected' || (awinVouchersRes.value && awinVouchersRes.value.status !== 404)) {
            // Loga o erro, mas não para a execução (ignora o 404 da permissão)
            console.error("Erro ao buscar vouchers AWIN para /lojas:", awinVouchersRes.reason || awinVouchersRes.value.status);
        }

        if (awinPromosRes.status === 'fulfilled' && awinPromosRes.value.ok) {
            const promoData = await awinPromosRes.value.json();
            const promotions = promoData.promotions || [];
            if(Array.isArray(promotions)) {
                 promotions.forEach(offer => {
                    const id = `awin_${offer.advertiserId}`;
                    if (!advertisersMap.has(id)) {
                        advertisersMap.set(id, {
                            id: id,
                            name: offer.advertiserName,
                            link: offer.url,
                            logoUrl: offer.advertiserLogoUrl
                        });
                    }
                });
            }
        } else if (awinPromosRes.status === 'rejected' || (awinPromosRes.value && awinPromosRes.value.status !== 404)) {
            console.error("Erro ao buscar promoções AWIN para /lojas:", awinPromosRes.reason || awinPromosRes.value.status);
        }
        
    } catch (e) {
        console.error("Erro ao processar dados da AWIN em /lojas:", e.message);
    }


    // --- Processar Lomadee ---
    try {
        if (lomadeeStoresRes.status === 'fulfilled' && lomadeeStoresRes.value.ok) {
            const lomadeeData = await lomadeeStoresRes.value.json();
            if (lomadeeData.data && Array.isArray(lomadeeData.data)) {
                lomadeeData.data.forEach(store => {
                    const id = `lomadee_${store.id}`;
                    if (!advertisersMap.has(id)) { // Só adiciona se não tivermos dados da AWIN
                        advertisersMap.set(id, {
                            id: id,
                            name: store.name,
                            link: store.link, 
                            logoUrl: store.thumbnail
                        });
                    }
                });
            }
        } else {
             console.error("Erro ao buscar lojas Lomadee:", lomadeeStoresRes.reason || `Status ${lomadeeStoresRes.value.status}`);
        }
    } catch (e) {
         console.error("Erro ao processar dados da Lomadee em /lojas:", e.message);
    }


    const uniqueAdvertisers = Array.from(advertisersMap.values());
    uniqueAdvertisers.sort((a, b) => a.name.localeCompare(b.name));

    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 
    return response.status(200).json(uniqueAdvertisers);
}