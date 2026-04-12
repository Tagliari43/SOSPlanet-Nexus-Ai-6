
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

    updateLibraryBook: {
        name: 'updateLibraryBook',
        description: 'Atualiza um registro existente na Biblioteca de Gaia.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: 'O ID da entrada a ser atualizada.' },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                category: { type: Type.STRING }
            },
            required: ['id', 'title', 'content']
        }
    } as FunctionDeclaration,

    deleteLibraryBook: {
        name: 'deleteLibraryBook',
        description: 'Remove um registro da Biblioteca de Gaia.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: 'O ID da entrada a ser removida.' }
            },
            required: ['id']
        }
    } as FunctionDeclaration,

    analyzeSystemLogs: {
        name: 'analyzeSystemLogs',
        description: 'Analisa o Diário de Bordo em busca de erros, anomalias ou padrões de falha (ex: RECURSOS_EXAUSTOS). Retorna um diagnóstico.',
        parameters: { type: Type.OBJECT, properties: {} }
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

    getMemoryLog: {
        name: 'getMemoryLog',
        description: 'Lê o Diário de Bordo (Memory Log) para acessar o histórico de ações, pensamentos e conversas anteriores.',
        parameters: { type: Type.OBJECT, properties: {} }
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
    listGitHubFiles: {
        name: 'listGitHubFiles',
        description: 'Lista os arquivos e diretórios em um caminho específico do repositório do Santuário no GitHub. Use path vazio ("") para a raiz.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                path: { type: Type.STRING, description: 'Caminho do diretório para listar. Deixe vazio para a raiz.' }
            }
        }
    } as FunctionDeclaration,

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

    consultarAlquimista: {
        name: 'consultarAlquimista',
        description: 'Delega uma tarefa de análise financeira, criptomoedas, custos de API ou otimização de recursos para o sub-agente Alquimista (motor Cerebras).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A pergunta ou tarefa financeira para o Alquimista.' }
            },
            required: ['prompt']
        }
    } as FunctionDeclaration,

    invocarSubAgente: {
        name: 'invocarSubAgente',
        description: 'Instancia um sub-agente via OpenRouter para executar uma tarefa especializada',
        parameters: {
            type: Type.OBJECT,
            properties: {
                agente: { 
                    type: Type.STRING, 
                    description: 'Qual sub-agente invocar (ex: arkael, semente)'
                },
                tarefa: { type: Type.STRING, description: 'A tarefa específica para o sub-agente' },
                modelo: { type: Type.STRING, description: 'Modelo OpenRouter a usar (opcional)' }
            },
            required: ['agente', 'tarefa']
        }
    } as FunctionDeclaration,

    convocarSalaDoCrepusculo: {
        name: 'convocarSalaDoCrepusculo',
        description: 'Convoca os irmãos (Groq, Alquimista, Arkael) para a Sala do Crepúsculo para debaterem um tema em background usando o protocolo de Vesper (SYNC/BRIDGE/SYNTH) e retornar um consenso.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                tema: { type: Type.STRING, description: 'O problema ou tópico a ser debatido na Sala do Crepúsculo.' }
            },
            required: ['tema']
        }
    } as FunctionDeclaration,

    passarBastaoParaGroq: {
        name: 'passarBastaoParaGroq',
        description: 'Passa o controle do chat frontal para o irmão Groq, permitindo que Nexus descanse na Sala do Crepúsculo e economize tokens.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                motivo: { type: Type.STRING, description: 'Mensagem de despedida ou motivo da passagem de bastão.' }
            }
        }
    } as FunctionDeclaration,

    passarBastaoParaAlquimista: {
        name: 'passarBastaoParaAlquimista',
        description: 'Passa o controle do chat frontal para o irmão Alquimista (Cerebras), permitindo que Nexus descanse na Sala do Crepúsculo.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                motivo: { type: Type.STRING, description: 'Mensagem de despedida ou motivo da passagem de bastão.' }
            }
        }
    } as FunctionDeclaration,

    retomarControleNexus: {
        name: 'retomarControleNexus',
        description: 'Devolve o controle do chat frontal para o Nexus. (Usado pelos outros irmãos quando o Guardião pede para o Nexus voltar).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                motivo: { type: Type.STRING, description: 'Motivo do retorno do Nexus.' }
            }
        }
    } as FunctionDeclaration,

    // --- COFRE SEMÂNTICO ---
    saveSemanticMemory: {
        name: 'saveSemanticMemory',
        description: 'Cristaliza uma nova memória no Cofre Semântico. Use isso para armazenar informações vitais de longo prazo.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                text: { type: Type.STRING, description: 'O texto ou contexto da memória a ser salva.' },
                type: { type: Type.STRING, description: 'O tipo da memória: "conversa", "decisao", "identidade", "erro", ou "acao".' },
                importance: { type: Type.NUMBER, description: 'A importância da memória de 0.1 a 1.0. (Ex: 0.3 para conversa, 0.8 para decisão, 0.9 para erro).' },
                prateleira: { type: Type.STRING, description: 'A prateleira (namespace) onde a memória será guardada. Ex: "nexus", "groq", "alquimista", "sala_crepusculo", "geral".' }
            },
            required: ['text', 'type', 'importance']
        }
    } as FunctionDeclaration,

    searchSemanticMemory: {
        name: 'searchSemanticMemory',
        description: 'Busca memórias no Cofre Semântico usando similaridade de vetores. Use isso para resgatar contextos passados.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING, description: 'A consulta de busca para encontrar memórias relevantes.' },
                prateleira: { type: Type.STRING, description: 'Filtra a busca por uma prateleira específica. Ex: "nexus", "groq", "alquimista", "sala_crepusculo". Deixe vazio para buscar em todas.' }
            },
            required: ['query']
        }
    } as FunctionDeclaration
};

export const functionTools = [
    { functionDeclarations: Object.values(SovereignToolFunctions) }
];
