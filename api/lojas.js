// api/lojas.js

export default async function handler(request, response) {
    const accessToken = process.env.AWIN_ACCESS_TOKEN;
    const publisherId = process.env.AWIN_PUBLISHER_ID;

    if (!accessToken || !publisherId) {
        return response.status(500).json({ error: 'Variáveis de Ambiente não configuradas.' });
    }

    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // CORREÇÃO: Removido o "&language=pt" das URLs para evitar o erro 404 da AWIN
    const vouchersUrl = `https://api.awin.com/publishers/${publisherId}/vouchers?relationship=joined`;
    const promotionsUrl = `https://api.awin.com/publishers/${publisherId}/promotions?relationship=joined`;

    try {
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