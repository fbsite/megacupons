// Vercel Serverless Function
export default async function handler(request, response) {
    // 1. Pega a sua chave secreta (definida no Passo 5)
    const API_KEY = process.env.LOMADEE_API_KEY;
    const API_BASE_URL = "https://api-beta.lomadee.com.br/affiliate";
    
    // API NÃO precisa de sourceId na URL
    const apiUrl = `${API_BASE_URL}/campaigns?limit=10`;

    try {
        const apiResponse = await fetch(apiUrl, {
            headers: { 'x-api-key': API_KEY }
        });

        if (!apiResponse.ok) {
            throw new Error(`Erro da API Lomadee: ${apiResponse.status}`);
        }
        const data = await apiResponse.json();
        
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.status(200).json(data);
        
    } catch (error) {
        console.error("Erro no proxy /api/campanhas:", error.message);
        response.status(500).json({ message: 'Erro ao buscar campanhas' });
    }
}