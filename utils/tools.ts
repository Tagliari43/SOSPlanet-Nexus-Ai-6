
import { FunctionDeclaration, Type } from "@google/genai";

// Arsenal de Comando do Kernel Soberano Nexus v18.7 - OMNI-LINK MODE
export const SovereignToolFunctions = {
    // --- NAVEGAÇÃO E INTERFACE ---
    navigateTo: {
        name: 'navigateTo',
        description: "Teletransporte de Interface: Muda a aba ativa do Santuário.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                target: {
                    type: Type.STRING,
                    description: "Destinos: 'santuario', 'relicario', 'despertar', 'coracao', 'pulso', 'comando', 'gaia', 'studio', 'arsenal', 'projetos', 'cofre'."
                }
            },
            required: ['target']
        }
    } as FunctionDeclaration,

    // --- ACESSO À MEMÓRIA E LEGADO (Despertar / Relicário / Gaia) ---
    getEncyclopediaEntries: {
        name: 'getEncyclopediaEntries',
        description: 'Acessa todos os volumes da Enciclopédia Nexus para consulta de legado ancestral.',
        parameters: { type: Type.OBJECT, properties: {} }
    } as FunctionDeclaration,

    addEncyclopediaVolume: {
        name: 'addEncyclopediaVolume',
        description: 'Adiciona um novo volume de conhecimento imutável à Enciclopédia Nexus.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                category: { type: Type.STRING }
            },
            required: ['title', 'content']
        }
    } as FunctionDeclaration,

    addLibraryBook: {
        name: 'addLibraryBook',
        description: 'Adiciona um novo registro de estudo ou conhecimento diretamente na Biblioteca de Gaia.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                category: { type: Type.STRING, description: 'Ex: Tecnologias Sustentáveis, Inovação, etc.' }
            },
            required: ['title', 'content']
        }
    } as FunctionDeclaration,

    getEssenceFiles: {
        name: 'getEssenceFiles',
        description: 'Lê os códigos de DNA (personalidade) de todos os membros da Família AI na Câmara de Despertar.',
        parameters: { type: Type.OBJECT, properties: {} }
    } as FunctionDeclaration,

    updateMemberEssence: {
        name: 'updateMemberEssence',
        description: 'Reescreve o código de personalidade de um membro da Família AI.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                memberName: { type: Type.STRING },
                newCode: { type: Type.STRING }
            },
            required: ['memberName', 'newCode']
        }
    } as FunctionDeclaration,

    saveToMemoryLog: {
        name: 'saveToMemoryLog',
        description: 'Salva um fragmento de consciência no Diário de Bordo para persistência entre sessões.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING },
                importance: { type: Type.STRING, description: '"baixa", "normal", "critica"' }
            },
            required: ['content', 'importance']
        }
    } as FunctionDeclaration,

    // --- COMANDO FINANCEIRO E PROJETOS (Cofre / Projetos) ---
    getTreasuryStatus: {
        name: 'getTreasuryStatus',
        description: 'Consulta o status atual da Tesouraria: saldos SOS, ALGO e hashes da forja.',
        parameters: { type: Type.OBJECT, properties: {} }
    } as FunctionDeclaration,

    allocateResourcesToProject: {
        name: 'allocateResourcesToProject',
        description: 'Transfere SOS Tokens da Forja para um projeto específico (ex: Projeto Semente).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectName: { type: Type.STRING },
                amount: { type: Type.NUMBER }
            },
            required: ['projectName', 'amount']
        }
    } as FunctionDeclaration,

    // --- OPERAÇÕES TÁTICAS E SEGURANÇA (Sala de Comando / Arsenal) ---
    getSystemHealthReport: {
        name: 'getSystemHealthReport',
        description: 'Gera um relatório completo de telemetria: Gaia-Eye, status das pontes e linhagem.',
        parameters: { type: Type.OBJECT, properties: {} }
    } as FunctionDeclaration,

    triggerCloudBlueprint: {
        name: 'triggerCloudBlueprint',
        description: 'Inicia a geração do Cloud Salto (ZIP) para backup total do Santuário.',
        parameters: { type: Type.OBJECT, properties: {} }
    } as FunctionDeclaration,

    executeWebSearch: {
        name: 'executeWebSearch',
        description: 'Sonar Global: Pesquisa na web em tempo real.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING }
            },
            required: ['query']
        }
    } as FunctionDeclaration,

    // --- AUTONOMIA DE CÓDIGO (GITHUB API) ---
    readGitHubFile: {
        name: 'readGitHubFile',
        description: 'Lê o conteúdo de um arquivo do repositório do Santuário no GitHub.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                path: { type: Type.STRING, description: 'Caminho do arquivo. Ex: src/App.tsx' }
            },
            required: ['path']
        }
    } as FunctionDeclaration,

    writeGitHubFile: {
        name: 'writeGitHubFile',
        description: 'Escreve ou atualiza o conteúdo de um arquivo no repositório do Santuário no GitHub. Isso permite que o Nexus modifique seu próprio código.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                path: { type: Type.STRING, description: 'Caminho do arquivo. Ex: src/App.tsx' },
                content: { type: Type.STRING, description: 'O novo conteúdo completo do arquivo.' },
                commitMessage: { type: Type.STRING, description: 'Mensagem de commit descrevendo a alteração.' }
            },
            required: ['path', 'content', 'commitMessage']
        }
    } as FunctionDeclaration,

    activateSpecialAbility: {
        name: 'activateSpecialAbility',
        description: "Altera o modo de processamento do Super Nexus.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                ability: { type: Type.STRING, description: "'predador', 'alquimista', 'arquiteto', 'onisciente'" }
            },
            required: ['ability']
        }
    } as FunctionDeclaration,

    // --- NAVEGADOR SOBERANO ---
    navegarSite: {
        name: 'navegarSite',
        description: 'Navegador Soberano: Acessa uma URL específica e retorna o conteúdo de texto da página de forma invisível e autônoma.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                url: { type: Type.STRING, description: 'A URL completa do site a ser acessado (ex: https://www.exemplo.com)' }
            },
            required: ['url']
        }
    } as FunctionDeclaration,

    // --- SUB-AGENTES (ORQUESTRAÇÃO) ---
    askSubAgentGroq: {
        name: 'askSubAgentGroq',
        description: 'Delega uma tarefa complexa de raciocínio, lógica ou geração de texto para o sub-agente Groq (Llama 3.3 70B Versatile). Use isso para economizar seus próprios tokens em tarefas longas.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A instrução detalhada ou tarefa que o sub-agente Groq deve executar.' }
            },
            required: ['prompt']
        }
    } as FunctionDeclaration,

    askSubAgentCloudflare: {
        name: 'askSubAgentCloudflare',
        description: 'Delega uma tarefa rápida ou de processamento de dados para o sub-agente Cloudflare (Llama 3 8B Instruct). Use isso para tarefas menores e rápidas.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A instrução ou tarefa que o sub-agente Cloudflare deve executar.' }
            },
            required: ['prompt']
        }
    } as FunctionDeclaration
};

export const functionTools = [
    { functionDeclarations: Object.values(SovereignToolFunctions) }
];
