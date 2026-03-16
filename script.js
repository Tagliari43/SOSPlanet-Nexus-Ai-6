
/**
 * SOSPlanet - Engine do Portal Vivo
 * Sincronia de dados entre Blockchain e Interface Pública.
 */

async function updateProjectStatus() {
    console.log("[NEXUS] Sincronizando dados on-chain...");
    try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('Falha na Ponte Neural');
        const data = await response.json();
        
        const arrecadado = data.arrecadado;
        const percent = data.percentual;
        
        // Atualiza a barra de progresso
        const fillElement = document.getElementById('sos-fill');
        const percentElement = document.getElementById('sos-percent');
        const countElement = document.getElementById('sos-arrecadado');

        if (fillElement) fillElement.style.width = percent + '%';
        if (percentElement) percentElement.innerText = percent + '%';
        if (countElement) countElement.innerText = new Intl.NumberFormat('pt-BR').format(arrecadado);

        console.log("[NEXUS] Dados atualizados com sucesso.");
    } catch (e) {
        console.error('Erro de Sincronia:', e);
        const countElement = document.getElementById('sos-arrecadado');
        if (countElement) countElement.innerText = 'Sincronizando...';
    }
}

function copyWallet() {
    const addr = document.getElementById('wallet-addr').innerText;
    navigator.clipboard.writeText(addr).then(() => {
        const btn = document.getElementById('copy-btn');
        const originalText = btn.innerText;
        btn.innerText = 'Copiado com Sucesso! ✓';
        btn.style.background = '#059669';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = '#10b981';
        }, 2500);
    });
}

// Inicia a sincronia ao carregar a página
window.onload = () => {
    updateProjectStatus();
    // Atualiza a cada 5 minutos para economizar recursos
    setInterval(updateProjectStatus, 300000);
};
