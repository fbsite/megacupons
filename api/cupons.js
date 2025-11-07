// api/cupons.js

// Usamos export default para funções serverless da Vercel
export default async function handler(request, response) {
    // 1. Puxa as chaves secretas das Variáveis de Ambiente da Vercel
    const accessToken = process.env.AWIN_ACCESS_TOKEN;
    const publisherId = process.env.AWIN_PUBLISHER_ID;

    // 2. Validação de segurança
    if (!accessToken || !publisherId) {
        return response.status(500).json({ error: 'Variáveis de Ambiente (AWIN_ACCESS_TOKEN ou AWIN_PUBLISHER_ID) não configuradas no servidor.' });
    }

    // 3. Define o endpoint real da AWIN que queremos buscar
    const AWIN_API_URL = `https://api.awin.com/publishers/${publisherId}/vouchers?type=voucher&relationship=joined&language=pt`;

    // 4. Define os headers para a chamada à AWIN
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
    };

    try {
        // 5. Faz a chamada à API da AWIN
        const apiRes = await fetch(AWIN_API_URL, { headers });
        if (!apiRes.ok) {
            const errorBody = await apiRes.text();
            console.error(`A API da AWIN respondeu com o status: ${apiRes.status}. Body: ${errorBody}`);
            throw new Error(`A API da AWIN respondeu com o status: ${apiRes.status}`);
        }
        const data = await apiRes.json();
        
        // 6. Define o cache da Vercel (1 hora) para esta resposta
        response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

        // 7. Envia os dados de volta para o frontend (index.html)
        return response.status(200).json(data);

    } catch (error) {
        console.error("Erro no proxy /api/cupons:", error.message);
        return response.status(502).json({ error: 'Falha ao buscar dados da API de cupons.' });
    }
}