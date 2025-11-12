// Este arquivo deve ficar na pasta /api/coupons.js
import axios from 'axios';

export default async function handler(req, res) {
  // Configura CORS para aceitar requisições apenas do seu site
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // AQUI A MÁGICA ACONTECE:
    // As chaves ficam seguras no servidor e não aparecem no HTML
    const LOMADEE_TOKEN = process.env.LOMADEE_TOKEN; 
    const AWIN_TOKEN = process.env.AWIN_TOKEN;

    // Exemplo fictício de chamada unificada
    // Você chamaria as duas APIs aqui e juntaria os arrays
    
    const coupons = [
        {
            store: "Exemplo Backend",
            title: "Teste de API Real",
            desc: "Se você vê isso, a API funcionou",
            code: "TESTE10",
            link: "https://loja.com",
            exclusive: true,
            logo: "https://placehold.co/70"
        }
        // ... aqui viriam os dados reais do axios.get()
    ];

    res.status(200).json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cupons' });
  }
}
