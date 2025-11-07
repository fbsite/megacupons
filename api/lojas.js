// api/lojas.js

export default async function handler(request, response) {
    const accessToken = process.env.AWIN_ACCESS_TOKEN;
    const publisherId = process.env.AWIN_PUBLISHER_ID;

    if (!accessToken || !publisherId) {
        return response.status(500).json({ error: 'Variáveis de Ambiente não configuradas.' });
    }

    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // URLs da AWIN para buscar ofertas
    const vouchersUrl = `https://api.awin.com/publishers/${publisherId}/vouchers?relationship=joined&language=pt`;
    const promotionsUrl = `https://api.awin.com/publishers/${publisherId}/promotions?relationship=joined&language=pt`;

    try {
        // 1. Faz as duas chamadas à API em paralelo
        const [vouchersRes, promotionsRes] = await Promise.all([
            fetch(vouchersUrl, { headers }),
            fetch(promotionsUrl, { headers })
        ]);

        if (!vouchersRes.ok || !promotionsRes.ok) {
            console.error("Erro ao buscar dados da AWIN (vouchers ou promotions)");
            throw new Error('Falha ao buscar dados primários da AWIN.');
        }

        const vouchers = await vouchersRes.json();
        const { promotions } = await promotionsRes.json();

        // 2. Processa e unifica os dados
        const allOffers = [
            ...(Array.isArray(vouchers) ? vouchers : []),
            ...(Array.isArray(promotions) ? promotions : [])
        ];

        // 3. Cria um mapa para deduplicar as lojas (anunciantes)
        const advertisersMap = new Map();

        allOffers.forEach(offer => {
            const id = offer.advertiserId;
            if (!id || !offer.advertiserName) return; // Ignora se não tiver ID ou nome

            // A API de promoções não fornece logo, então priorizamos o logo dos vouchers
            if (!advertisersMap.has(id)) {
                advertisersMap.set(id, {
                    id: id,
                    name: offer.advertiserName,
                    // O link da loja será o link da primeira oferta encontrada
                    link: offer.url, 
                    // O logo pode não vir em 'promotions', por isso verificamos
                    logoUrl: offer.advertiserLogoUrl 
                });
            } else if (!advertisersMap.get(id).logoUrl && offer.advertiserLogoUrl) {
                // Se a loja já existe (veio de uma promoção sem logo), 
                // e esta oferta (um voucher) tem o logo, atualizamos.
                advertisersMap.get(id).logoUrl = offer.advertiserLogoUrl;
            }
        });

        // 4. Converte o mapa de volta para um array
        const uniqueAdvertisers = Array.from(advertisersMap.values());
        
        // 5. Ordena por nome
        uniqueAdvertisers.sort((a, b) => a.name.localeCompare(b.name));

        // 6. Define o cache e envia a resposta
        response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // 1 hora de cache
        return response.status(200).json(uniqueAdvertisers);

    } catch (error) {
        console.error("Erro no proxy /api/lojas:", error.message);
        return response.status(502).json({ error: 'Falha ao buscar dados da API de lojas.' });
    }
}