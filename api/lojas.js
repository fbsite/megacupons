// Vercel Serverless Function
export default async function handler(request, response) {
    const API_KEY = process.env.LOMADEE_API_KEY;
    const API_BASE_URL = "https://api-beta.lomadee.com.br/affiliate";
    
    const apiUrl = `${API_BASE_URL}/stores?limit=100`;

    try {
        const apiResponse = await fetch(apiUrl, {
            headers: { 'x-api-key': API_KEY }
        });
        if (!apiResponse.ok) throw new Error(`Erro da API Lomadee: ${apiResponse.status}`);
        const data = await apiResponse.json();
        
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.status(200).json(data);
    } catch (error) {
        console.error("Erro no proxy /api/lojas:", error.message);
        response.status(500).json({ message: 'Erro ao buscar lojas' });
    }
}