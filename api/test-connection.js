const axios = require('axios');

module.exports = async (req, res) => {
    // 1. Verificar se as variáveis existem no ambiente da Vercel
    const statusVars = {
        LOMADEE_TOKEN: process.env.LOMADEE_TOKEN ? "✅ Carregado (Oculto)" : "❌ NÃO ENCONTRADO",
        AWIN_TOKEN: process.env.AWIN_TOKEN ? "✅ Carregado (Oculto)" : "❌ NÃO ENCONTRADO",
        AWIN_PUBLISHER_ID: process.env.AWIN_PUBLISHER_ID ? "✅ Carregado" : "❌ NÃO ENCONTRADO"
    };

    const apiResults = {};

    // 2. TESTE REAL: Tentar buscar 1 oferta na Lomadee
    if (process.env.LOMADEE_TOKEN) {
        try {
            const lomaUrl = `https://api.lomadee.com/v3/${process.env.LOMADEE_TOKEN}/offer/_search?sourceId=${process.env.LOMADEE_TOKEN}&size=1`;
            const respL = await axios.get(lomaUrl);
            apiResults.lomadee = {
                status: "✅ SUCESSO",
                http_code: respL.status,
                mensagem: "A chave está correta e a API respondeu."
            };
        } catch (error) {
            apiResults.lomadee = {
                status: "❌ ERRO",
                http_code: error.response ? error.response.status : "Desconhecido",
                erro_detalhe: error.message,
                dica: error.response && error.response.status === 403 ? "Sua SourceID (Token) pode estar errada ou a Lomadee bloqueou o acesso." : "Erro de conexão."
            };
        }
    } else {
        apiResults.lomadee = { status: "⚠️ IGNORADO", motivo: "Token não configurado." };
    }

    // 3. TESTE REAL: Tentar buscar promoções na Awin
    if (process.env.AWIN_TOKEN && process.env.AWIN_PUBLISHER_ID) {
        try {
            const awinUrl = `https://api.awin.com/publishers/${process.env.AWIN_PUBLISHER_ID}/promotions`;
            const respA = await axios.get(awinUrl, {
                headers: { Authorization: `Bearer ${process.env.AWIN_TOKEN}` }
            });
            apiResults.awin = {
                status: "✅ SUCESSO",
                http_code: respA.status,
                mensagem: "A chave está correta e a API respondeu."
            };
        } catch (error) {
            apiResults.awin = {
                status: "❌ ERRO",
                http_code: error.response ? error.response.status : "Desconhecido",
                erro_detalhe: error.message,
                dica: error.response && error.response.status === 401 ? "Token inválido ou expirado." : "Verifique o Publisher ID."
            };
        }
    } else {
        apiResults.awin = { status: "⚠️ IGNORADO", motivo: "Token ou ID não configurado." };
    }

    // Retorna o relatório JSON
    res.status(200).json({
        ambiente: statusVars,
        testes_conexao: apiResults
    });
};