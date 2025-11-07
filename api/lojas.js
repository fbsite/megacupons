// api/cupons.js
// ATUALIZADO: Versão à prova de falhas. Não "crasha" se uma chave faltar.

// Funções de mapeamento
function mapAwinCoupon(voucher) {
    return { id: `awin_${voucher.voucherId}`, code: voucher.code, description: voucher.description, link: voucher.url, store: { name: voucher.advertiserName, logoUrl: voucher.advertiserLogoUrl }, endDate: voucher.endDate, platform: 'AWIN' };
}
function mapLomadeeCoupon(coupon) {
    return { id: `lomadee_${coupon.id}`, code: coupon.code, description: coupon.description, link: coupon.link, store: { name: coupon.store.name, logoUrl: coupon.store.thumbnail }, endDate: coupon.endDate, platform: 'Lomadee' };
}

export default async function handler(request, response) {
    const { AWIN_ACCESS_TOKEN, AWIN_PUBLISHER_ID, LOMADEE_API_KEY } = process.env;

    let allCoupons = [];
    let promises = [];

    // --- Prepara a chamada Lomadee (se a chave existir) ---
    if (LOMADEE_API_KEY) {
        const lomadeeUrl = `https://api.lomadee.com/affiliate/coupons`;
        const lomadeeHeaders = { 'x-api-key': LOMADEE_API_KEY };
        promises.push(fetch(lomadeeUrl, { headers: lomadeeHeaders }).then(res => ({ source: 'lomadee', res })));
    } else {
        console.warn('LOMADEE_API_KEY não encontrada. A saltar a API Lomadee.');
    }

    // --- Prepara a chamada AWIN (se AMBAS as chaves existirem) ---
    if (AWIN_ACCESS_TOKEN && AWIN_PUBLISHER_ID) {
        const awinUrl = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/vouchers?type=voucher&relationship=joined&language=pt`;
        const awinHeaders = { 'Authorization': `Bearer ${AWIN_ACCESS_TOKEN}` };
        promises.push(fetch(awinUrl, { headers: awinHeaders }).then(res => ({ source: 'awin', res })));
    } else {
        console.warn('Chaves AWIN não encontradas. A saltar a API AWIN.');
    }

    // --- Executa todas as chamadas possíveis ---
    const results = await Promise.allSettled(promises);

    // --- Processa os resultados ---
    for (const result of results) {
        if (result.status === 'rejected') {
            console.error(`Falha ao buscar API: ${result.reason}`);
            continue;
        }

        const { source, res } = result.value;

        if (!res.ok) {
            // Não falha o site, apenas regista o erro (ex: 404 da AWIN)
            console.error(`API ${source} respondeu com erro: ${res.status}`);
            continue;
        }

        try {
            const data = await res.json();
            if (source === 'lomadee' && data.data && Array.isArray(data.data)) {
                allCoupons.push(...data.data.map(mapLomadeeCoupon));
            } else if (source === 'awin' && Array.isArray(data)) {
                allCoupons.push(...data.map(mapAwinCoupon));
            }
        } catch (e) {
            console.error(`Falha ao processar JSON da API ${source}: ${e.message}`);
        }
    }
    
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return response.status(200).json(allCoupons); // Envia o que tiver
}