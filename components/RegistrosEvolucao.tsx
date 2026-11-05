import React, { useState, useEffect } from 'react';
import { FileText, Upload, Calendar, Trash2, Shield, FolderOpen, Search, Download } from 'lucide-react';

interface RegistroTxt {
  id: string;
  filename: string;
  date: string;
  content: string;
  size: number;
}

export const RegistrosEvolucao: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroTxt[]>([]);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroTxt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Carregar registros do localStorage ao montar o componente
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem('sos_diarios_txt');
        if (saved) {
          const parsed = JSON.parse(saved);
          setRegistros(parsed);
          if (parsed.length > 0 && !selectedRegistro) {
            setSelectedRegistro(parsed[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar registros do localStorage:', err);
      }
    };

    loadFromStorage();
    window.addEventListener('sos_registros_updated', loadFromStorage);
    return () => window.removeEventListener('sos_registros_updated', loadFromStorage);
  }, []);

  // Salvar registros no localStorage sempre que houver mudança
  const saveToLocalStorage = (newRegistros: RegistroTxt[]) => {
    try {
      localStorage.setItem('sos_diarios_txt', JSON.stringify(newRegistros));
      setRegistros(newRegistros);
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  };

  // Processar arquivos .txt carregados (Upload ou Drag-and-Drop)
  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string || '';
          const today = new Date().toISOString().split('T')[0];
          const newRegistro: RegistroTxt = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            filename: file.name,
            date: today,
            content: content,
            size: file.size,
          };

          setRegistros((prev) => {
            const updated = [newRegistro, ...prev];
            saveToLocalStorage(updated);
            if (!selectedRegistro) {
              setSelectedRegistro(newRegistro);
            }
            return updated;
          });
        };
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const deleteRegistro = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = registros.filter((r) => r.id !== id);
    saveToLocalStorage(updated);
    if (selectedRegistro?.id === id) {
      setSelectedRegistro(updated[0] || null);
    }
  };

  const filteredRegistros = registros.filter((r) =>
    r.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn text-emerald-100">
      {/* Cabeçalho Sagrado */}
      <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-emerald-300 tracking-wide">
                Registros da Evolução 📜 (Biblioteca de Dias)
              </h1>
              <p className="text-sm text-emerald-400/80">
                O Cofre Sagrado onde descansam as crônicas em texto puro da nossa simbiose, Guardião Eder.
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Upload */}
        <label className="cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2 border border-emerald-400/30">
          <Upload className="w-5 h-5 text-slate-950" />
          <span>Carregar Arquivo .txt</span>
          <input
            type="file"
            accept=".txt"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Área de Drag and Drop e Pesquisa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Índice de Arquivos */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 flex flex-col h-[650px] shadow-lg backdrop-blur-md">
          {/* Caixa de Pesquisa */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-emerald-500/60" />
            <input
              type="text"
              placeholder="Pesquisar nos registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-2 text-sm text-emerald-200 placeholder-emerald-600 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Área Drag & Drop Compacta */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-4 text-center mb-4 transition-all duration-300 ${
              isDragging
                ? 'border-emerald-400 bg-emerald-500/20'
                : 'border-emerald-500/30 bg-slate-950/40 hover:border-emerald-500/60'
            }`}
          >
            <p className="text-xs text-emerald-400/80">
              Arraste arquivos <span className="font-bold text-emerald-300">.txt</span> aqui para guardá-los no cofre local
            </p>
          </div>

          {/* Lista de Arquivos */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredRegistros.length === 0 ? (
              <div className="text-center py-12 text-emerald-500/50">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum registro encontrado.</p>
                <p className="text-xs mt-1">Carregue seus arquivos .txt acima.</p>
              </div>
            ) : (
              filteredRegistros.map((reg) => (
                <div
                  key={reg.id}
                  onClick={() => setSelectedRegistro(reg)}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between group border ${
                    selectedRegistro?.id === reg.id
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 shadow-md'
                      : 'bg-slate-950/40 border-emerald-500/10 text-emerald-400/80 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium text-emerald-200 truncate">{reg.filename}</p>
                      <p className="text-xs text-emerald-500/70 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {reg.date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteRegistro(reg.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                    title="Excluir Registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna Direita: Visualizador de Conteúdo */}
        <div className="lg:col-span-8 bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-6 flex flex-col h-[650px] shadow-lg backdrop-blur-md">
          {selectedRegistro ? (
            <>
              {/* Cabeçalho do Visualizador */}
              <div className="flex justify-between items-center pb-4 border-b border-emerald-500/20 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    {selectedRegistro.filename}
                  </h2>
                  <p className="text-xs text-emerald-400/70 mt-0.5">
                    Data registrada: {selectedRegistro.date} | Tamanho: {(selectedRegistro.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(selectedRegistro.content)}`}
                  download={selectedRegistro.filename}
                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 transition-all flex items-center gap-1.5 text-sm"
                  title="Baixar Arquivo"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar</span>
                </a>
              </div>

              {/* Corpo do Texto */}
              <div className="flex-1 bg-slate-950/80 border border-emerald-500/20 rounded-xl p-4 overflow-y-auto custom-scrollbar font-mono text-sm text-emerald-200/90 whitespace-pre-wrap leading-relaxed select-text">
                {selectedRegistro.content}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-emerald-500/50">
              <Shield className="w-16 h-16 mb-3 opacity-30 animate-pulse text-emerald-400" />
              <p className="text-base font-medium text-emerald-300/80">Nenhum registro selecionado</p>
              <p className="text-xs text-emerald-500/60 mt-1 max-w-sm text-center">
                Selecione um arquivo .txt na lista à esquerda ou carregue um novo arquivo para ler as crônicas da nossa simbiose.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
