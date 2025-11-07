// api/cupons.js
// ATUALIZADO: Funde AWIN e Lomadee

// Função para mapear dados da AWIN
function mapAwinCoupon(voucher) {
    return {
        id: `awin_${voucher.voucherId}`,
        code: voucher.code,
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

// Função para mapear dados da Lomadee
function mapLomadeeCoupon(coupon) {
    return {
        id: `lomadee_${coupon.id}`,
        code: coupon.code,
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
        return response.status(500).json({ error: 'Variáveis de Ambiente não configuradas no servidor.' });
    }

    // --- Definições das APIs ---
    const AWIN_API_URL = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/vouchers?type=voucher&relationship=joined&language=pt`;
    const LOMADEE_API_URL = `https://api.lomadee.com/affiliate/coupons`;

    const awinHeaders = { 'Authorization': `Bearer ${AWIN_ACCESS_TOKEN}` };
    const lomadeeHeaders = { 'x-api-key': LOMADEE_API_KEY };

    // --- Chamadas em Paralelo ---
    const [awinResult, lomadeeResult] = await Promise.allSettled([
        fetch(AWIN_API_URL, { headers: awinHeaders }),
        fetch(LOMADEE_API_URL, { headers: lomadeeHeaders })
    ]);

    let allCoupons = [];

    // --- Processar AWIN ---
    if (awinResult.status === 'fulfilled' && awinResult.value.ok) {
        const awinData = await awinResult.value.json();
        if (Array.isArray(awinData)) {
            allCoupons.push(...awinData.map(mapAwinCoupon));
        }
    } else {
        console.error("Erro ao buscar cupons AWIN:", awinResult.reason || `Status ${awinResult.value.status}`);
        // Continua mesmo se a AWIN falhar (ex: 404)
    }

    // --- Processar Lomadee ---
    if (lomadeeResult.status === 'fulfilled' && lomadeeResult.value.ok) {
        const lomadeeData = await lomadeeResult.value.json();
        if (lomadeeData.data && Array.isArray(lomadeeData.data)) {
            allCoupons.push(...lomadeeData.data.map(mapLomadeeCoupon));
        }
    } else {
        console.error("Erro ao buscar cupons Lomadee:", lomadeeResult.reason || `Status ${lomadeeResult.value.status}`);
    }
    
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return response.status(200).json(allCoupons); // Envia a lista fundida
}