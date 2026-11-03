
import { saveToStorage, loadFromStorage } from '../utils/storage';

// FIX: Added declaration for JSZip on window object.
declare global {
    interface Window {
        JSZip: any;
    }
}

// Lista de arquivos conhecidos do sistema para compor o Blueprint v18.7
const SYSTEM_FILES = [
    'index.html',
    'index.tsx',
    'index.css',
    'App.tsx',
    'metadata.json',
    'components/Header.tsx',
    'components/FileUpload.tsx',
    'components/AnalysisDisplay.tsx',
    'components/Loader.tsx',
    'components/Dashboard.tsx',
    'components/TaskOrchestrator.tsx',
    'components/CacheViewer.tsx',
    'components/RouterPanel.tsx',
    'components/SantuarioInterior.tsx',
    'components/KeyForge.tsx',
    'components/ForjaInterna.tsx',
    'components/CentralDeComunicacoes.tsx',
    'components/DataOrb.tsx',
    'components/BridgeStatus.tsx',
    'components/LogViewer.tsx',
    'components/MarketOracle.tsx',
    'components/PortfolioSimulator.tsx',
    'components/Projects.tsx',
    'components/AssetSelectorModal.tsx',
    'components/MarketIntel.tsx',
    'components/CoracaoNacao.tsx',
    'components/PortfolioDisplay.tsx',
    'components/BibliotecaGaia.tsx',
    'components/MemoryHall.tsx',
    'components/PonteDosSentidos.tsx',
    'components/Cofre.tsx',
    'components/AwakeningChamber.tsx',
    'components/Relicario.tsx',
    'components/AlertCenter.tsx',
    'components/AgroforestryPlanner.tsx',
    'components/GaiaEye.tsx',
    'components/Estudio.tsx',
    'components/Arsenal.tsx',
    'services/geminiService.ts',
    'services/sovereignRouterService.ts',
    'services/cloudflareService.ts',
    'services/blockchainService.ts',
    'services/binanceService.ts',
    'services/marketService.ts',
    'services/reactionService.ts',
    'services/blueprintService.ts',
    'services/earthEngineService.ts',
    'services/patternAnalysisService.ts',
    'services/transcriptionService.ts',
    'utils/video.ts',
    'utils/aiFamily.ts',
    'utils/audio.ts',
    'utils/storage.ts',
    'utils/keys.ts',
    'utils/nexusMemory.ts',
    'utils/tools.ts',
    'utils/sovereignKeys.ts',
    'utils/crypto.ts',
    'hooks/useOrchestrator.ts',
    'hooks/useAlchemy.ts',
    'hooks/useScanner.ts',
    'hooks/useSecurity.ts',
    'hooks/useSosToken.ts',
    'hooks/useSpeechRecognition.ts'
];

export async function generateSanctuaryBlueprint(): Promise<void> {
    try {
        // Tenta baixar o ZIP completo e real de todo o Santuário gerado pelo backend
        const res = await fetch('/api/backup/zip');
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Santuario_SOSPlanet_Salto_Total_${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return;
        }
    } catch (apiErr) {
        console.warn("Falha ao gerar ZIP pelo backend, acionando fallback JSZip client-side:", apiErr);
    }

    if (typeof window.JSZip === 'undefined') {
        throw new Error("A Matriz de Compressão (JSZip) não está carregada.");
    }

    const zip = new window.JSZip();
    const sourceFolder = zip.folder("src");
    const dataFolder = zip.folder("data");

    const memorySnapshot: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            try {
                const item = localStorage.getItem(key);
                memorySnapshot[key] = item ? JSON.parse(item) : null;
            } catch (e) {
                memorySnapshot[key] = localStorage.getItem(key);
            }
        }
    }
    
    dataFolder.file("memory_snapshot.json", JSON.stringify(memorySnapshot, null, 2));
    dataFolder.file("blueprint_manifest.txt", `SANTUÁRIO SOBERANO - BLUEPRINT V18.7\nGerado em: ${new Date().toISOString()}\n\nEste arquivo contém a essência completa da Nação SOSPlanet.`);

    const fetchPromises = SYSTEM_FILES.map(async (filePath) => {
        try {
            const response = await fetch(`./${filePath}`, { cache: 'no-store' });
            if (response.ok) {
                const content = await response.text();
                sourceFolder.file(filePath, content);
            } else {
                sourceFolder.file(`${filePath}.missing`, `Status: ${response.status}`);
            }
        } catch (e) {
            sourceFolder.file(`${filePath}.error`, `Erro: ${(e as any).message}`);
        }
    });

    await Promise.all(fetchPromises);

    const content = await zip.generateAsync({ type: "blob" });
    
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SuperNexus_Cloud_Salto_v18.7_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
