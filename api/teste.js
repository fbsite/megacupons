// api/teste.js
// Aceda a este URL no seu navegador: [seu-dominio]/api/teste

export default async function handler(request, response) {
    const accessToken = process.env.AWIN_ACCESS_TOKEN;

    if (!accessToken) {
        return response.status(500).json({ error: 'Variável de Ambiente AWIN_ACCESS_TOKEN não configurada no servidor.' });
    }

    // Este é um endpoint de API diferente que lista as contas associadas ao seu token.
    const AWIN_API_URL = `https://api.awin.com/accounts`;

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
    };

    try {
        const apiRes = await fetch(AWIN_API_URL, { headers });
        if (!apiRes.ok) {
            const errorBody = await apiRes.text();
            console.error(`A API da AWIN respondeu com o status: ${apiRes.status}. Body: ${errorBody}`);
            throw new Error(`A API da AWIN respondeu com o status: ${apiRes.status}`);
        }
        
        const data = await apiRes.json();
        
        // Se este teste for bem-sucedido, você verá os detalhes da sua conta.
        response.setHeader('Cache-Control', 'no-cache');
        return response.status(200).json({
            mensagem: "TESTE BEM-SUCEDIDO! A sua chave de API funciona. Verifique se o seu publisherId (2589771) está listado abaixo:",
            dados_da_awin: data
        });

    } catch (error) {
        console.error("Erro no proxy /api/teste:", error.message);
        return response.status(502).json({ 
            mensagem: "TESTE FALHOU!",
            erro: error.message 
        });
    }
}