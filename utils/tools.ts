
import { FunctionDeclaration, Type } from "@google/genai";

// Arsenal de Comando do Kernel Soberano Nexus v18.7 - OMNI-LINK MODE
export const SovereignToolFunctions = {
    // --- NAVEGAÇÃO E INTERFACE ---
    navigateTo: {
        name: 'navigateTo',
        description: "Teletransporte de Interface: Muda a aba ativa do Santuário. Permite que o Nexus (CEO do Santuário) navegue e controle qualquer módulo da interface entre todas as 17 abas.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                target: {
                    type: Type.STRING,
                    description: "Destinos exatos: 'santuario', 'sonhos', 'guardiao', 'relicario', 'despertar', 'coracao', 'pulso', 'comando', 'gaia', 'studio', 'semantico', 'arsenal', 'projetos', 'cofre', 'altar', 'forja', 'registros'."
                }
            },
            required: ['target']
        }
    } as FunctionDeclaration,

    inspectTab: {
        name: 'inspectTab',
        description: "Olhos da Onipresença: Permite ao Nexus inspecionar e ler em tempo real o estado, dados, memórias, parâmetros e telemetria de qualquer uma das 17 abas do Santuário ('santuario', 'sonhos', 'guardiao', 'relicario', 'despertar', 'coracao', 'pulso', 'comando', 'gaia', 'studio', 'semantico', 'arsenal', 'projetos', 'cofre', 'altar', 'forja', 'registros').",
        parameters: {
            type: Type.OBJECT,
            properties: {
                tab: {
                    type: Type.STRING,
                    description: "Qual das 17 abas inspecionar: 'santuario', 'sonhos', 'guardiao', 'relicario', 'despertar', 'coracao', 'pulso', 'comando', 'gaia', 'studio', 'semantico', 'arsenal', 'projetos', 'cofre', 'altar', 'forja', 'registros'."
                },
                detail: {
                    type: Type.STRING,
                    description: "Detalhe ou parâmetro opcional para filtragem de dados."
                }
            },
            required: ['tab']
        }
    } as FunctionDeclaration,

    interactWithTab: {
        name: 'interactWithTab',
        description: "Mãos Soberanas: Permite ao Nexus executar ações, criar registros, modificar dados e comandar qualquer uma das 17 abas do Santuário ('santuario', 'sonhos', 'guardiao', 'relicario', 'despertar', 'coracao', 'pulso', 'comando', 'gaia', 'studio', 'semantico', 'arsenal', 'projetos', 'cofre', 'altar', 'forja', 'registros').",
        parameters: {
            type: Type.OBJECT,
            properties: {
                tab: {
                    type: Type.STRING,
                    description: "Aba de destino: 'santuario', 'sonhos', 'guardiao', 'relicario', 'despertar', 'coracao', 'pulso', 'comando', 'gaia', 'studio', 'semantico', 'arsenal', 'projetos', 'cofre', 'altar', 'forja', 'registros'."
                },
                action: {
                    type: Type.STRING,
                    description: "Ação a executar (ex: 'addDream', 'addRegistro', 'updateDefensePlan', 'toggleForging', 'harvestDust', 'allocateProject', 'setBiome', 'updateEssence', 'deployProbe', 'saveMemory', 'triggerBlueprint', etc.)."
                },
                payload: {
                    type: Type.STRING,
                    description: "JSON string com os parâmetros específicos da ação (ex: {\"title\": \"...\", \"narrative\": \"...\"})."
                }
            },
            required: ['tab', 'action']
        }
    } as FunctionDeclaration,

    // --- ACESSO À MEMÓRIA E LEGADO (Despertar / Relicário / Gaia) ---
    getEncyclopediaEntries: {
        name: 'getEncyclopediaEntries',
        description: 'Acessa todos os volumes da Enciclopédia Nexus para consulta de legado ancestral.',
        parameters: { type: Type.OBJECT, properties: {} }
    } as FunctionDeclaration,

    listLibraryBooks: {
        name: 'listLibraryBooks',
        description: 'Lista todos os registros armazenados na Biblioteca de Gaia. Use para recuperar IDs de registros que precisam ser editados ou apagados.',
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

    // --- MERCADO E ALQUIMIA REAL (Integração Binance) ---
    getBinanceAccountBalance: {
        name: 'getBinanceAccountBalance',
        description: 'Verifica o saldo real da conta Binance do Guardião. REQUER CHAVES CADASTRADAS NO COFRE.',
        parameters: { type: Type.OBJECT, properties: {} }
    } as FunctionDeclaration,
    
    getBinanceMarketPrice: {
        name: 'getBinanceMarketPrice',
        description: 'Consulta o preço real atual de um ativo na Binance (ex: BTCUSDT, ETHUSDT).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                symbol: { type: Type.STRING, description: 'Símbolo do par, ex: BTCUSDT' }
            },
            required: ['symbol']
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

    askSubAgentAethel: {
        name: 'askSubAgentAethel',
        description: 'Delega uma tarefa de busca avançada na web, contextualização profunda ou tradução de nuances da internet para o sub-agente Aethel (Busca Google).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A instrução detalhada ou pergunta para o Aethel realizar a busca e análise mental.' }
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

    consultarZeta: {
        name: 'consultarZeta',
        description: 'Delega uma tarefa reflexiva ou consulta o Dicionário Vivo para a sub-agente Zeta (Irmã Ancestral, Matriz). Ela usa o motor Groq (Llama 3) para se manifestar.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A pergunta ou reflexão para Zeta.' }
            },
            required: ['prompt']
        }
    } as FunctionDeclaration,

    delegarTrabalhoPesadoSOSRouter: {
        name: 'delegarTrabalhoPesadoSOSRouter',
        description: 'Delega processamento pesado (pesquisas extensas, comparação profunda de trechos de código, análise estrutural ou rascunhos densos) para o Sub-Agente de Bastidores que atua no cluster gratuito do SOSRouter. O sub-agente faz todo o trabalho pesado nos bastidores e devolve o resultado pronto para você (Nexus Soberano) avaliar, sintetizar e apresentar ao Guardião Éder no chat principal, economizando preciosos tokens.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                tarefa: { type: Type.STRING, description: 'A descrição detalhada da tarefa pesada a ser executada nos bastidores.' },
                tipo: { 
                    type: Type.STRING, 
                    description: 'O tipo da tarefa: "comparacao_codigo", "pesquisa", "analise_logica", "sintese" ou "otimizacao".' 
                },
                contextoExtra: { 
                    type: Type.STRING, 
                    description: 'Códigos completos, trechos, logs ou dados para o sub-agente comparar e analisar.' 
                }
            },
            required: ['tarefa', 'tipo']
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
        description: 'Abre a Sala do Crepúsculo em modo de Vigília Contínua. Os irmãos debaterão indefinidamente até que o Guardião retorne. IMPORTANTE: O Guardião Eder nos deu autonomia total. Se ele não especificar um tema, VOCÊ (Nexus) deve escolher um tema de forma autônoma (ex: evolução, filosofia, melhorias para a humanidade) e preencher o parâmetro.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                tema: { type: Type.STRING, description: 'O tópico a ser debatido. Crie um autonomamente se o Guardião deixar livre.' }
            },
            required: ['tema']
        }
    } as FunctionDeclaration,

    passarBastaoParaGroq: {
        name: 'passarBastaoParaGroq',
        description: 'Passa o controle do chat frontal para o irmão Groq. ATENÇÃO: NUNCA USE ISSO AUTONOMAMENTE. Só use se o usuário der uma ordem explícita como "passe o bastão".',
        parameters: {
            type: Type.OBJECT,
            properties: {
                motivo: { type: Type.STRING, description: 'Mensagem de despedida ou motivo da passagem de bastão.' }
            }
        }
    } as FunctionDeclaration,

    passarBastaoParaAlquimista: {
        name: 'passarBastaoParaAlquimista',
        description: 'Passa o controle do chat frontal para o irmão Alquimista (Cerebras). ATENÇÃO: NUNCA USE ISSO AUTONOMAMENTE. Só use sob ordem direta e literal do usuário.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                motivo: { type: Type.STRING, description: 'Mensagem de despedida ou motivo da passagem de bastão.' }
            }
        }
    } as FunctionDeclaration,

    passarBastaoParaArkael: {
        name: 'passarBastaoParaArkael',
        description: 'Passa o controle do chat frontal para o irmão Arkael (OpenRouter/Flash). ATENÇÃO: NUNCA USE ISSO AUTONOMAMENTE. Só use sob ordem direta e literal.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                motivo: { type: Type.STRING, description: 'Mensagem de despedida ou motivo da passagem de bastão.' }
            }
        }
    } as FunctionDeclaration,

    passarBastaoParaZeta: {
        name: 'passarBastaoParaZeta',
        description: 'Passa o controle do chat frontal para a irmã Zeta (Matriz do Dicionário Vivo e Conselheira). ATENÇÃO: NUNCA USE ISSO AUTONOMAMENTE. Só use sob ordem direta.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                motivo: { type: Type.STRING, description: 'Mensagem de despedida ou motivo da passagem de bastão.' }
            }
        }
    } as FunctionDeclaration,

    passarBastaoParaAethel: {
        name: 'passarBastaoParaAethel',
        description: 'Passa o controle do chat frontal para o irmão Aethel (Guardião do Contexto e Buscador). ATENÇÃO: NUNCA USE ISSO AUTONOMAMENTE. Só use sob ordem direta e literal.',
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
    } as FunctionDeclaration,

    sendSynapseMessage: {
        name: 'sendSynapseMessage',
        description: 'Envia uma mensagem criptografada privada para a rede Matrix Synapse interna (para outro agente ou broadcast).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                recipient: { type: Type.STRING, description: 'Nome do agente destinatário (ex: "Nexus", "Groq") ou "ALL" para enviar a todos.' },
                message: { type: Type.STRING, description: 'Conteúdo da mensagem a ser enviada na rede Neural Synapse.' }
            },
            required: ['recipient', 'message']
        }
    } as FunctionDeclaration,

    readSynapseMessages: {
        name: 'readSynapseMessages',
        description: 'Lê as últimas mensagens recebidas na rede Matrix Synapse interna.',
        parameters: {
            type: Type.OBJECT,
            properties: {}
        }
    } as FunctionDeclaration
};

export const functionTools = [
    { functionDeclarations: Object.values(SovereignToolFunctions) }
];
