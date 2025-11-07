// api/produtos.js
// ATUALIZADO: Funde AWIN (Deals) e Lomadee (Cupons sem código)

// Função para mapear dados da AWIN (type=deal)
function mapAwinDeal(voucher) {
    return {
        id: `awin_deal_${voucher.voucherId}`,
        code: null, // Deals não têm código
        description: voucher.description,
        link: voucher.url,
        store: {
            name: voucher.advertiserName,
            logoUrl: voucher.advertiserLogoUrl
        },
        endDate: voucher.endDate,
        platform: 'AWIN'
    };
}

// Função para mapear dados da Lomadee (cupons sem código)
function mapLomadeeDeal(coupon) {
    return {
        id: `lomadee_deal_${coupon.id}`,
        code: null,
        description: coupon.description,
        link: coupon.link,
        store: {
            name: coupon.store.name,
            logoUrl: coupon.store.thumbnail
        },
        endDate: coupon.endDate,
        platform: 'Lomadee'
    };
}

export default async function handler(request, response) {
    const { AWIN_ACCESS_TOKEN, AWIN_PUBLISHER_ID, LOMADEE_API_KEY } = process.env;

    if (!AWIN_ACCESS_TOKEN || !AWIN_PUBLISHER_ID || !LOMADEE_API_KEY) {
        return response.status(500).json({ error: 'Variáveis de Ambiente não configuradas.' });
    }

    // --- Definições das APIs ---
    // AWIN: Busca vouchers "type=deal"
    const AWIN_API_URL = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/vouchers?type=deal&relationship=joined&language=pt`;
    // Lomadee: Busca cupons (vamos filtrar os sem código)
    const LOMADEE_API_URL = `https://api.lomadee.com/affiliate/coupons`;

    const awinHeaders = { 'Authorization': `Bearer ${AWIN_ACCESS_TOKEN}` };
    const lomadeeHeaders = { 'x-api-key': LOMADEE_API_KEY };

    // --- Chamadas em Paralelo ---
    const [awinResult, lomadeeResult] = await Promise.allSettled([
        fetch(AWIN_API_URL, { headers: awinHeaders }),
        fetch(LOMADEE_API_URL, { headers: lomadeeHeaders })
    ]);

    let allDeals = [];

    // --- Processar AWIN ---
    if (awinResult.status === 'fulfilled' && awinResult.value.ok) {
        const awinData = await awinResult.value.json();
        if (Array.isArray(awinData)) {
            allDeals.push(...awinData.map(mapAwinDeal));
        }
    } else {
        console.error("Erro ao buscar 'deals' AWIN:", awinResult.reason || `Status ${awinResult.value.status}`);
    }

    // --- Processar Lomadee ---
    if (lomadeeResult.status === 'fulfilled' && lomadeeResult.value.ok) {
        const lomadeeData = await lomadeeResult.value.json();
        if (lomadeeData.data && Array.isArray(lomadeeData.data)) {
            // Filtra apenas cupons que NÃO têm código (considerados "deals")
            const lomadeeDeals = lomadeeData.data.filter(coupon => !coupon.code);
            allDeals.push(...lomadeeDeals.map(mapLomadeeDeal));
        }
    } else {
        console.error("Erro ao buscar 'deals' Lomadee:", lomadeeResult.reason || `Status ${lomadeeResult.value.status}`);
    }
    
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return response.status(200).json(allDeals); // Envia a lista fundida
}