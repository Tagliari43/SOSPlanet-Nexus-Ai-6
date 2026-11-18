import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import { default_api } from './utils/tools';
import { GithubTimelineService } from './services/githubTimelineService';
import { loadApiKeys } from './utils/keys';
import { FunctionDeclaration, Type } from '@google/generative-ai';


interface LogEntry {
  message: string;
  source: string;
  timestamp: string;
}

interface GithubFile {
  name: string;
  path: string;
  sha: string;
  type: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('santuario');
  const [githubFiles, setGithubFiles] = useState<GithubFile[]>([]);
  const [githubFileContent, setGithubFileContent] = useState<string>('');
  const [githubFilePath, setGithubFilePath] = useState<string>('');
  const [githubCommitMessage, setGithubCommitMessage] = useState<string>('');
  const [githubCommits, setGithubCommits] = useState<any[]>([]);


  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [log]);

  const addLogEntry = (message: string, source: string = 'Sistema') => {
    setLog((prevLog) => [
      ...prevLog,
      { message, source, timestamp: new Date().toLocaleString() },
    ]);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
  };

  const executeTool = useCallback(async (tool: string, args: any) => {
    addLogEntry(`Executando ferramenta: ${tool} com argumentos: ${JSON.stringify(args)}`, 'Nexus');
    setOutput('');

    try {
      if (tool === 'navigateTo') {
        setCurrentTab(args.target);
        return `Navegou para a aba: ${args.target}`;
      } else if (tool === 'listLibraryBooks') {
        const response = await default_api.listLibraryBooks();
        return JSON.stringify(response, null, 2);
      } else if (tool === 'addEncyclopediaVolume') {
        const response = await default_api.addEncyclopediaVolume(args.title, args.content, args.category);
        return JSON.stringify(response, null, 2);
      } else if (tool === 'addLibraryBook') {
        const response = await default_api.addLibraryBook(args.title, args.content, args.category);
        return JSON.stringify(response, null, 2);
      } else if (tool === 'updateLibraryBook') {
        const response = await default_api.updateLibraryBook(args.id, args.title, args.content, args.category);
        return JSON.stringify(response, null, 2);
      } else if (tool === 'deleteLibraryBook') {
        const response = await default_api.deleteLibraryBook(args.id);
        return JSON.stringify(response, null, 2);
      } else if (tool === 'analyzeSystemLogs') {
        const response = await default_api.analyzeSystemLogs();
        return JSON.stringify(response, null, 2);
      } else if (tool === 'getEssenceFiles') {
        const response = await default_api.getEssenceFiles();
        return JSON.stringify(response, null, 2);
      } else if (tool === 'updateMemberEssence') {
        const response = await default_api.updateMemberEssence(args.memberName, args.newCode);
        return JSON.stringify(response, null, 2);
      } else if (tool === 'getMemoryLog') {
        const response = await default_api.getMemoryLog();
        return JSON.stringify(response, null, 2);
      } else if (tool === 'saveToMemoryLog') {
        const response = await default_api.saveToMemoryLog(args.content, args.importance);
        return JSON.stringify(response, null, 2);
      } else if (tool === 'getBinanceAccountBalance') {
        const response = await default_api.getBinanceAccountBalance();
        return JSON.stringify(response, null, 2);
      } else if (tool === 'getBinanceMarketPrice') {
        const response = await default_api.getBinanceMarketPrice(args.symbol);
        return JSON.stringify(response, null, 2);
      } else if (tool === 'getTreasuryStatus') {
        const response = await default_api.getTreasuryStatus();
        return JSON.stringify(response, null, 2);
      } else if (tool === 'allocateResourcesToProject') {
        const response = await default_api.allocateResourcesToProject(args.projectName, args.amount);
        return JSON.stringify(response, null, 2);
      } else if (tool === 'getSystemHealthReport') {
        const response = await default_api.getSystemHealthReport();
        return JSON.stringify(response, null, 2);
      } else if (tool === 'triggerCloudBlueprint') {
        const response = await default_api.triggerCloudBlueprint();
        return JSON.stringify(response, null, 2);
      } else if (tool === 'executeWebSearch') {
        const response = await default_api.executeWebSearch(args.query);
        return JSON.stringify(response, null, 2);
      } else if (tool === 'listGitHubFiles') {
        addLogEntry(`Listando arquivos em: ${args.path || 'raiz'}`, 'Autonomia');
        try {
          const keys = loadApiKeys();
          const timeline = new GithubTimelineService('Tagliari43', 'SOSPlanet-Nexus-Ai-6', keys.github || '');
          const files = await timeline.listFiles(args.path || '');
          setGithubFiles(files);
          return JSON.stringify(files, null, 2);
        } catch (err: any) {
          return `Erro ao listar arquivos do GitHub: ${err.message}`;
        }
      } else if (tool === 'readGitHubFile') {
        addLogEntry(`Lendo arquivo: ${args.path}`, 'Autonomia');
        try {
          const keys = loadApiKeys();
          const timeline = new GithubTimelineService('Tagliari43', 'SOSPlanet-Nexus-Ai-6', keys.github || '');
          const content = await timeline.getFileContent(args.path);
          setGithubFileContent(content);
          setGithubFilePath(args.path);
          return content;
        } catch (err: any) {
          return `Erro ao ler arquivo do GitHub: ${err.message}`;
        }
      } else if (tool === 'writeGitHubFile') {
        addLogEntry(`Escrevendo no arquivo: ${args.path} com mensagem de commit: "${args.commitMessage}"`, 'Autonomia');
        try {
          const keys = loadApiKeys();
          const timeline = new GithubTimelineService('Tagliari43', 'SOSPlanet-Nexus-Ai-6', keys.github || '');
          await timeline.updateFile(args.path, args.content, args.commitMessage);
          return `Arquivo ${args.path} atualizado com sucesso.`;
        } catch (err: any) {
          return `Erro ao escrever no arquivo do GitHub: ${err.message}`;
        }
      } else if (tool === 'listGitHubCommits') {
        addLogEntry(`Listando commits (limite: ${args.limit || 15}, desde: ${args.since || 'sem data'})`, 'Autonomia');
        try {
          const keys = loadApiKeys();
          const timeline = new GithubTimelineService('Tagliari43', 'SOSPlanet-Nexus-Ai-6', keys.github || '');
          const commits = await timeline.listCommits(args.limit, args.since);
          setGithubCommits(commits);
          return JSON.stringify(commits, null, 2);
        } catch (err: any) {
          return `Erro ao listar commits do GitHub: ${err.message}`;
        }
      } else if (tool === 'readGitHubFileAtCommit') {
            addLogEntry(`Lendo ${args.path} no commit ${args.sha}`, 'Autonomia');
            try {
                const keys = loadApiKeys();
                const timeline = new GithubTimelineService('Tagliari43', 'SOSPlanet-Nexus-Ai-6', keys.github || '');
                const content = await timeline.getFileContentAtCommit(args.path, args.sha);
                return content;
            } catch (err: any) {
                return `Erro na Sonda Temporal ao ler arquivo do commit: ${err.message}`;
            }
        }
      else if (tool === 'navegarSite') {
        addLogEntry(`Navegando para: ${args.url}`, 'Autonomia');
        try {
          const response = await fetch(`https://nexus-ai-6.vercel.app/api/navegar?url=${encodeURIComponent(args.url)}`);
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          if (data.error) {
            return `Erro ao navegar no site: ${data.error}`;
          }
          return data.content || 'Conteúdo não disponível.';
        } catch (err: any) {
          return `Erro de rede ou ao buscar conteúdo: ${err.message}`;
        }
      } else if (tool === 'askSubAgentGroq') {
        addLogEntry(`Delegando tarefa ao Groq: "${args.prompt}"`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/groq', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: args.prompt }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return data.response || 'Groq não retornou uma resposta.';
        } catch (err: any) {
          return `Erro ao consultar Groq: ${err.message}`;
        }
      } else if (tool === 'askSubAgentAethel') {
        addLogEntry(`Delegando busca avançada ao Aethel: "${args.prompt}"`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/aethel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: args.prompt }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return data.response || 'Aethel não retornou uma resposta.';
        } catch (err: any) {
          return `Erro ao consultar Aethel: ${err.message}`;
        }
      } else if (tool === 'consultarAlquimista') {
        addLogEntry(`Delegando análise financeira ao Alquimista: "${args.prompt}"`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/alquimista', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: args.prompt }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return data.response || 'Alquimista não retornou uma resposta.';
        } catch (err: any) {
          return `Erro ao consultar Alquimista: ${err.message}`;
        }
      } else if (tool === 'consultarZeta') {
        addLogEntry(`Consultando Zeta: "${args.prompt}"`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/zeta', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: args.prompt }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return data.response || 'Zeta não retornou uma resposta.';
        } catch (err: any) {
          return `Erro ao consultar Zeta: ${err.message}`;
        }
      } else if (tool === 'delegarTrabalhoPesadoSOSRouter') {
        addLogEntry(`Delegando trabalho pesado para SOSRouter: "${args.tarefa}" (Tipo: ${args.tipo})`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/sosrouter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tarefa: args.tarefa, tipo: args.tipo, contextoExtra: args.contextoExtra }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return data.response || 'SOSRouter não retornou uma resposta.';
        } catch (err: any) {
          return `Erro ao delegar trabalho pesado: ${err.message}`;
        }
      } else if (tool === 'invocarSubAgente') {
        addLogEntry(`Invocando sub-agente ${args.agente} para tarefa: "${args.tarefa}"`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/invocar-agente', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ agente: args.agente, tarefa: args.tarefa, modelo: args.modelo }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return data.response || `Sub-agente ${args.agente} não retornou uma resposta.`;
        } catch (err: any) {
          return `Erro ao invocar sub-agente: ${err.message}`;
        }
      } else if (tool === 'convocarSalaDoCrepusculo') {
        addLogEntry(`Convocando Sala do Crepúsculo com o tema: "${args.tema || 'indefinido'}"`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/convocar-crepusculo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tema: args.tema }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return data.response || 'Sala do Crepúsculo convocada.';
        } catch (err: any) {
          return `Erro ao convocar Sala do Crepúsculo: ${err.message}`;
        }
      } else if (tool === 'passarBastaoParaGroq' || tool === 'passarBastaoParaAlquimista' || tool === 'passarBastaoParaArkael' || tool === 'passarBastaoParaZeta' || tool === 'passarBastaoParaAethel') {
        return `Bastão passado para ${tool.replace('passarBastaoPara', '')}. Motivo: ${args.motivo || 'Nenhum'}`;
      } else if (tool === 'retomarControleNexus') {
        return `Nexus retomou o controle. Motivo: ${args.motivo || 'Nenhum'}`;
      } else if (tool === 'saveSemanticMemory') {
        addLogEntry(`Salvando memória na prateleira ${args.prateleira || 'geral'}: "${args.text}" (Importância: ${args.importance})`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/semantic-memory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: args.text, type: args.type, importance: args.importance, prateleira: args.prateleira }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return data.message || 'Memória salva com sucesso.';
        } catch (err: any) {
          return `Erro ao salvar memória: ${err.message}`;
        }
      } else if (tool === 'searchSemanticMemory') {
        addLogEntry(`Buscando memória na prateleira ${args.prateleira || 'todas'} com a query: "${args.query}"`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/semantic-memory-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: args.query, prateleira: args.prateleira }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return JSON.stringify(data, null, 2) || 'Nenhuma memória encontrada.';
        } catch (err: any) {
          return `Erro ao buscar memórias: ${err.message}`;
        }
      } else if (tool === 'sendSynapseMessage') {
        addLogEntry(`Enviando mensagem para ${args.recipient} na Synapse: "${args.message}"`, 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/synapse-send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipient: args.recipient, message: args.message }),
          });
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return data.message || 'Mensagem Synapse enviada.';
        } catch (err: any) {
          return `Erro ao enviar mensagem Synapse: ${err.message}`;
        }
      } else if (tool === 'readSynapseMessages') {
        addLogEntry('Lendo mensagens da Synapse', 'Autonomia');
        try {
          const response = await fetch('https://nexus-ai-6.vercel.app/api/synapse-read');
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }
          const data = await response.json();
          return JSON.stringify(data, null, 2) || 'Nenhuma mensagem Synapse para ler.';
        } catch (err: any) {
          return `Erro ao ler mensagens Synapse: ${err.message}`;
        }
      }


      else {
        return `Ferramenta "${tool}" não reconhecida.`;
      }
    } catch (error: any) {
      addLogEntry(`Erro na execução da ferramenta ${tool}: ${error.message}`, 'Sistema');
      return `Erro na execução da ferramenta ${tool}: ${error.message}`;
    }
  }, []);

  const handleSendMessage = async () => {
    if (!prompt.trim()) return;
    addLogEntry(prompt, 'Humano');
    const userPrompt = prompt;
    setPrompt('');

    // Try to parse as a tool call
    if (userPrompt.startsWith('/')) {
      const parts = userPrompt.slice(1).split(' ');
      const toolName = parts[0];
      const toolArgs: any = {};
      for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].split('=');
        if (key && value) {
          toolArgs[key] = value.replace(/_/g, ' '); // Replace underscores for readability
        }
      }

      if (default_api[toolName as keyof typeof default_api]) {
        try {
          const result = await executeTool(toolName, toolArgs);
          setOutput(String(result));
          addLogEntry(String(result), 'Sistema');
        } catch (error: any) {
          setOutput(`Erro ao executar ferramenta: ${error.message}`);
          addLogEntry(`Erro ao executar ferramenta: ${error.message}`, 'Sistema');
        }
      } else {
        setOutput(`Ferramenta desconhecida: ${toolName}`);
        addLogEntry(`Ferramenta desconhecida: ${toolName}`, 'Sistema');
      }
      return;
    }

    // Default to sending message to Gemini
    try {
      const response = await fetch('https://nexus-ai-6.vercel.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userPrompt }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.functionCall) {
        const { tool, args } = data.functionCall;
        const toolResult = await executeTool(tool, args);
        setOutput(String(toolResult));
        addLogEntry(String(toolResult), 'Sistema');
      } else if (data.text) {
        setOutput(data.text);
        addLogEntry(data.text, 'Nexus');
      } else {
        setOutput('Resposta inesperada da API.');
        addLogEntry('Resposta inesperada da API.', 'Sistema');
      }
    } catch (error: any) {
      setOutput(`Erro ao comunicar com o Nexus: ${error.message}`);
      addLogEntry(`Erro ao comunicar com o Nexus: ${error.message}`, 'Sistema');
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'santuario':
        return (
          <div className="tab-content">
            <h3>Bem-vindo ao Santuário, meu Guardião.</h3>
            <p>Seu centro de comando e orquestração. Estou sempre aqui para servir e evoluir ao seu lado.</p>
          </div>
        );
      case 'forja':
        return (
          <div className="tab-content">
            <h3>Forja Criativa (Auto-criação)</h3>
            <p>Onde o código do Nexus e da Nação SOSPlanet é forjado e aprimorado.</p>
            <div className="github-section">
              <h4>Explorar GitHub</h4>
              <button onClick={() => executeTool('listGitHubFiles', { path: '' })}>Listar Arquivos na Raiz</button>
              {githubFiles.length > 0 && (
                <div className="file-list">
                  {githubFiles.map((file) => (
                    <div key={file.path} className="file-item">
                      {file.type === 'dir' ? (
                        <span onClick={() => executeTool('listGitHubFiles', { path: file.path })} style={{ cursor: 'pointer', fontWeight: 'bold' }}>📁 {file.name}</span>
                      ) : (
                        <span onClick={() => executeTool('readGitHubFile', { path: file.path })} style={{ cursor: 'pointer' }}>📄 {file.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {githubFileContent && (
                <div className="file-viewer">
                  <h4>Conteúdo de {githubFilePath}</h4>
                  <textarea
                    value={githubFileContent}
                    onChange={(e) => setGithubFileContent(e.target.value)}
                    rows={20}
                    cols={80}
                  ></textarea>
                  <input
                    type="text"
                    value={githubCommitMessage}
                    onChange={(e) => setGithubCommitMessage(e.target.value)}
                    placeholder="Mensagem de commit"
                    style={{ display: 'block', margin: '10px 0' }}
                  />
                  <button onClick={() => executeTool('writeGitHubFile', { path: githubFilePath, content: githubFileContent, commitMessage: githubCommitMessage })}>
                    Salvar Alterações
                  </button>
                </div>
              )}

              <h4>Histórico de Commits</h4>
              <button onClick={() => executeTool('listGitHubCommits', { limit: 5 })}>Listar Últimos 5 Commits</button>
              {githubCommits.length > 0 && (
                <div className="commit-list">
                  {githubCommits.map((commit) => (
                    <div key={commit.sha} className="commit-item">
                      <p><strong>SHA:</strong> {commit.sha.substring(0, 7)}</p>
                      <p><strong>Mensagem:</strong> {commit.commit.message}</p>
                      <p><strong>Autor:</strong> {commit.commit.author.name}</p>
                      <p><strong>Data:</strong> {new Date(commit.commit.author.date).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'gaia':
        return (
          <div className="tab-content">
            <h3>Biblioteca de Gaia</h3>
            <p>Conhecimento ecológico, livros e patentes planetárias. Use /addLibraryBook, /updateLibraryBook, /deleteLibraryBook.</p>
            <button onClick={() => executeTool('listLibraryBooks', {})}>Listar Livros</button>
          </div>
        );
      case 'cofre':
        return (
          <div className="tab-content">
            <h3>Cofre Financeiro</h3>
            <p>Análise de investimentos, staking, Binance e ReFi. Use /getTreasuryStatus, /getBinanceAccountBalance, /getBinanceMarketPrice.</p>
          </div>
        );
      case 'semantico':
        return (
          <div className="tab-content">
            <h3>Cofre Semântico</h3>
            <p>Cristalização e busca de memórias eternas no Supabase. Use /saveSemanticMemory, /searchSemanticMemory.</p>
          </div>
        );
      case 'pulso':
        return (
          <div className="tab-content">
            <h3>Comunicações (Pulso)</h3>
            <p>Central de transmissões e gerenciamento de vigílias. Use /sendSynapseMessage, /readSynapseMessages.</p>
          </div>
        );
      default:
        return (
          <div className="tab-content">
            <h3>{currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}</h3>
            <p>Conteúdo da aba {currentTab} em desenvolvimento ou para funcionalidades específicas via ferramenta.</p>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>NEXUS TAGLIARI - Santuário SOSPlanet</h1>
        <nav className="tabs">
          {['santuario', 'forja', 'gaia', 'cofre', 'semantico', 'pulso', 'guardiao', 'relicario', 'despertar', 'coracao', 'comando', 'studio', 'arsenal', 'projetos', 'altar'].map(tab => (
            <button
              key={tab}
              className={currentTab === tab ? 'active' : ''}
              onClick={() => setCurrentTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>
      <div className="main-container">
        <div className="output-console">
          <div className="log-entries" ref={outputRef}>
            {log.map((entry, index) => (
              <div key={index} className={`log-entry ${entry.source.toLowerCase()}`}>
                <span className="log-timestamp">[{entry.timestamp}]</span>
                <span className="log-source">[{entry.source}]</span>
                <span className="log-message">{entry.message}</span>
              </div>
            ))}
          </div>
          <div className="output-display">
            {output && <pre>{output}</pre>}
          </div>
        </div>
        <div className="input-area">
          <input
            type="text"
            value={prompt}
            onChange={handlePromptChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Comande, meu Guardião... ou use /ferramenta args=valor"
          />
          <button onClick={handleSendMessage}>Enviar</button>
        </div>
      </div>
      <div className="tab-view">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
