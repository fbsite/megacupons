const axios = require('axios');

module.exports = async (req, res) => {
    const awinToken = process.env.AWIN_TOKEN;
    const lomadeeToken = process.env.LOMADEE_TOKEN;

    let resultado = {
        awin: {},
        lomadee: {}
    };

    // 1. SCANNER AWIN (Descobre o ID real do Token)
    if (awinToken) {
        try {
            // Endpoint que lista TODAS as contas do usuário
            const resp = await axios.get('https://api.awin.com/accounts', {
                headers: { Authorization: `Bearer ${awinToken}` }
            });
            resultado.awin = {
                mensagem: "✅ Token Awin Válido",
                contas_encontradas: resp.data.accounts.map(acc => ({
                    tipo: acc.type,
                    id: acc.id, // ESSE É O ID QUE VOCÊ TEM QUE USAR
                    nome: acc.name
                }))
            };
        } catch (e) {
            resultado.awin = {
                mensagem: "❌ Erro na Awin",
                erro: e.response ? e.response.status : e.message,
                detalhe: "Verifique se o Token tem permissão 'Publisher Data'"
            };
        }
    }

    // 2. SCANNER LOMADEE (Testa qual endpoint funciona)
    if (lomadeeToken) {
        try {
            // Tenta pegar o perfil do afiliado (geralmente retorna o SourceID)
            // Nota: Lomadee não tem um endpoint "whoami" fácil, vamos testar a validação
            const url = `https://api.lomadee.com/v3/${lomadeeToken}/category/_all?size=1`;
            await axios.get(url);
            resultado.lomadee = {
                mensagem: "✅ Token Lomadee Válido (Endpoint de Categorias OK)",
                nota: "Se o endpoint de ofertas falhar, é bug da API deles exigindo sourceId."
            };
        } catch (e) {
             resultado.lomadee = {
                mensagem: "❌ Erro na Lomadee",
                erro: e.response ? e.response.data : e.message
            };
        }
    }

    res.json(resultado);
};