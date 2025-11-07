<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todas as Lojas | MegaCupons</title>
    <meta name="description" content="Encontre cupons e ofertas de todas as nossas lojas parceiras.">
    
    <!-- Metatags e Links (Mesma base do index.html) -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔥</text></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    
    <!-- CSS (O mesmo do index.html) -->
    <style>
        :root {
            --color-primary: #FF3B80;
            --color-secondary: #00BFA6;
            --color-warning: #FFA726;
            --color-background: #121212;
            --color-surface: #1E1E1E;
            --color-text-primary: #FFFFFF;
            --color-text-secondary: #B0B0B0;
            --font-main: 'Inter', sans-serif;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
            font-family: var(--font-main);
            background-color: var(--color-background);
            color: var(--color-text-primary);
            line-height: 1.6;
            padding-bottom: 100px; 
        }
        .container { width: 90%; max-width: 1100px; margin: 0 auto; padding: 20px 0; }
        .section-title { font-size: 2rem; font-weight: 900; text-align: center; margin-bottom: 30px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .loading-spinner { width: 60px; height: 60px; border: 8px solid var(--color-surface); border-top-color: var(--color-primary); border-radius: 50%; margin: 40px auto; animation: spin 1s linear infinite; display: block; }
        .api-error { display: none; background-color: var(--color-surface); border: 2px solid var(--color-warning); border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0; }
        .api-error h3 { color: var(--color-warning); font-size: 1.5rem; margin-bottom: 10px; }
        .api-error p { color: var(--color-text-secondary); font-size: 1rem; }
        .header { background-color: var(--color-surface); border-bottom: 2px solid var(--color-primary); padding: 15px 0; }
        .header .container { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
        .logo { font-size: 1.8rem; font-weight: 900; color: var(--color-primary); text-decoration: none; }
        .logo i { margin-right: 5px; }
        .navbar { display: flex; gap: 20px; }
        .navbar a { color: var(--color-text-secondary); text-decoration: none; font-weight: 700; font-size: 1rem; }
        .navbar a:hover, .navbar a.active { color: var(--color-text-primary); }
        .stores-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; justify-items: center; }
        .store-item { text-decoration: none; color: var(--color-text-secondary); transition: transform 0.3s ease; display: block; background-color: var(--color-surface); border-radius: 12px; border: 1px solid #333; overflow: hidden; }
        .store-item:hover { transform: translateY(-5px); }
        .store-item figure { width: 100%; height: 120px; background-color: #fff; display: flex; justify-content: center; align-items: center; border-bottom: 1px solid #333; }
        .store-item img { width: 60%; height: auto; object-fit: contain; }
        .store-item p { font-size: 0.9rem; font-weight: 700; text-align: center; padding: 15px; }
        .footer { background-color: var(--color-surface); text-align: center; padding: 30px 0; margin-top: 40px; border-top: 1px solid #333; }
        .footer p { color: var(--color-text-secondary); font-size: 0.9rem; }
        .footer p:first-child { font-weight: 700; color: var(--color-text-primary); margin-bottom: 5px; }
        
        @media (min-width: 768px) {
            .stores-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1024px) {
            .stores-grid { grid-template-columns: repeat(6, 1fr); }
        }
    </style>
</head>
<body>

    <header class="header">
        <div class="container">
            <a href="index.html" class="logo" title="MegaCupons - Página Inicial"><i class="fa-solid fa-rocket"></i> MegaCupons</a>
            <nav class="navbar">
                <a href="index.html">Home</a>
                <a href="stores.html" class="active">Lojas</a>
            </nav>
        </div>
    </header>

    <main>
        <section class="stores-section" style="padding: 40px 0;">
            <div class="container">
                <h2 class="section-title"><i class="fa-solid fa-store" style="color: var(--color-secondary);"></i> Todas as Lojas Parceiras</h2>
                <p style="text-align: center; color: var(--color-text-secondary); margin-bottom: 30px;">
                    Lojas com cupons ou ofertas ativas no momento.
                </p>

                <div class="loading-spinner" id="stores-loading"></div>
                <div class="api-error" id="stores-error"></div>
                <div class="stores-grid" id="stores-grid">
                    <!-- Lojas carregadas via API -->
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>MegaCupons &copy; <span id="current-year"></span> - Todos os direitos reservados.</p>
            <p>Economia real, 100% grátis e verificada para você.</p>
        </div>
    </footer>

<script>
document.addEventListener('DOMContentLoaded', () => {

    const storesGrid = document.getElementById('stores-grid');
    const storesLoading = document.getElementById('stores-loading');
    const storesError = document.getElementById('stores-error');
    const yearEl = document.getElementById('current-year');

    // Atualiza o ano no footer
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    /**
     * Carrega a lista de lojas (anunciantes)
     */
    async function loadStores() {
        if (storesLoading) storesLoading.style.display = 'block';
        if (storesError) storesError.style.display = 'none';

        // Chama o novo proxy /api/lojas
        const apiUrl = "/api/lojas";

        try {
            const response = await fetch(apiUrl); 
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            
            const stores = await response.json(); 
            
            if (stores && stores.length > 0) {
                generateStoreCards(stores); 
            } else {
                showApiError(false, "Nenhuma loja com ofertas ativas encontrada.");
            }
        } catch (error) {
            console.error("Falha ao buscar lojas:", error);
            showApiError(false, "Erro ao carregar a lista de lojas.");
        } finally {
            if (storesLoading) storesLoading.style.display = 'none';
        }
    }

    /**
     * Gera os cards de Loja
     */
    function generateStoreCards(stores) {
        if (!storesGrid) return;
        storesGrid.innerHTML = ''; 

        stores.forEach(store => {
            const logoPlaceholder = `https://placehold.co/100x70/FFFFFF/000000?text=${store.name.split(' ')[0]}&font=inter`;
            
            // A API de Lojas que criei usa o link de cupom/oferta mais recente como o link principal da loja
            const affiliateLink = store.link; 

            const cardHTML = `
                <a href="${affiliateLink}" target="_blank" class="store-item" title="Ver ofertas de ${store.name}">
                    <figure>
                        <img src="${store.logoUrl}" alt="Logo ${store.name}" 
                             onerror="this.onerror=null; this.src='${logoPlaceholder}';">
                    </figure>
                    <p>${store.name}</p>
                </a>
            `;
            storesGrid.innerHTML += cardHTML;
        });
    }

    /**
     * Exibe a mensagem de erro da API
     */
    function showApiError(isConfigError = false, customMessage = "") {
        if (!storesError) return;
        storesError.style.display = 'block';
        
        if (customMessage) {
             storesError.innerHTML = `<h3><i class="fa-solid fa-face-sad-tear"></i> ${customMessage}</h3>`;
        } else {
            storesError.innerHTML = `<h3><i class="fa-solid fa-triangle-exclamation"></i> Erro inesperado.</h3>
                                      <p>Não foi possível carregar as lojas. Tente novamente mais tarde.</p>`;
        }
    }

    // --- INICIALIZAÇÃO DA PÁGINA ---
    loadStores();

});
</script>

</body>
</html>