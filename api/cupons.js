// api/cupons.js
// Versão final com language=pt e relationship=joined

export default async function handler(request, response) {
    const accessToken = process.env.AWIN_ACCESS_TOKEN;
    const publisherId = process.env.AWIN_PUBLISHER_ID;

    if (!accessToken || !publisherId) {
        return response.status(500).json({ error: 'Variáveis de Ambiente não configuradas no servidor.' });
    }

    // Parâmetros corretos: type=voucher, relationship=joined, language=pt
    const AWIN_API_URL = `https://api.awin.com/publishers/${publisherId}/vouchers?type=voucher&relationship=joined&language=pt`;

    const headers = { 'Authorization': `Bearer ${accessToken}` };

    try {
        const apiRes = await fetch(AWIN_API_URL, { headers });
        if (!apiRes.ok) {
            const errorBody = await apiRes.text();
            // Este é o erro 404 que você está vendo e que a AWIN precisa corrigir:
            console.error(`A API da AWIN respondeu com o status: ${apiRes.status}. Body: ${errorBody}`);
            throw new Error(`A API da AWIN respondeu com o status: ${apiRes.status}`);
        }
        const data = await apiRes.json();
        
        response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        return response.status(200).json(data);

    } catch (error) {
        console.error("Erro no proxy /api/cupons:", error.message);
        return response.status(502).json({ error: 'Falha ao buscar dados da API de cupons.' });
    }
}