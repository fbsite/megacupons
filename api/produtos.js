// api/lojas.js
// Versão final com language=pt e relationship=joined

export default async function handler(request, response) {
    const accessToken = process.env.AWIN_ACCESS_TOKEN;
    const publisherId = process.env.AWIN_PUBLISHER_ID;

    if (!accessToken || !publisherId) {
        return response.status(500).json({ error: 'Variáveis de Ambiente não configuradas.' });
    }

    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // Parâmetros corretos em ambas as URLs
    const vouchersUrl = `https://api.awin.com/publishers/${publisherId}/vouchers?relationship=joined&language=pt`;
    const promotionsUrl = `https://api.awin.com/publishers/${publisherId}/promotions?relationship=joined&language=pt`;

    try {
        const [vouchersRes, promotionsRes] = await Promise.all([
            fetch(vouchersUrl, { headers }),
            fetch(promotionsUrl, { headers })
        ]);

        // Tratamento de erro: se um der 404 (ex: sem promoções) e o outro der 200, deve continuar.
        if (vouchersRes.status === 404 && promotionsRes.status === 404) {
             console.warn("AWIN retornou 404 para vouchers e promotions. (Provavelmente permissão pendente)");
             // Retorna array vazio, mas sem erro
             return response.status(200).json([]);
        }

        // Se algum deu um erro que não seja 404, falha.
        if ((!vouchersRes.ok && vouchersRes.status !== 404) || (!promotionsRes.ok && promotionsRes.status !== 404)) {
             throw new Error(`Erro real da AWIN: Vouchers status ${vouchersRes.status}, Promotions status ${promotionsRes.status}`);
        }

        const vouchers = vouchersRes.ok ? await vouchersRes.json() : [];
        const promotionsData = promotionsRes.ok ? await promotionsRes.json() : { promotions: [] };
        const promotions = promotionsData.promotions || [];

        const allOffers = [
            ...(Array.isArray(vouchers) ? vouchers : []),
            ...(Array.isArray(promotions) ? promotions : [])
        ];

        const advertisersMap = new Map();

        allOffers.forEach(offer => {
            const id = offer.advertiserId;
            if (!id || !offer.advertiserName) return; 

            if (!advertisersMap.has(id)) {
                advertisersMap.set(id, {
                    id: id,
                    name: offer.advertiserName,
                    link: offer.url, 
                    logoUrl: offer.advertiserLogoUrl 
                });
            } else if (!advertisersMap.get(id).logoUrl && offer.advertiserLogoUrl) {
                // Tenta preencher o logo se ele estava em falta
                advertisersMap.get(id).logoUrl = offer.advertiserLogoUrl;
            }
        });

        const uniqueAdvertisers = Array.from(advertisersMap.values());
        uniqueAdvertisers.sort((a, b) => a.name.localeCompare(b.name));

        response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 
        return response.status(200).json(uniqueAdvertisers);

    } catch (error) {
        console.error("Erro no proxy /api/lojas:", error.message);
        return response.status(502).json({ error: 'Falha ao buscar dados da API de lojas.' });
    }
}