
import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabaseService';

interface VigiliaEntry {
  id: string | number;
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
}

const CadernoAmanhecer: React.FC = () => {
  const [vigilias, setVigilias] = useState<VigiliaEntry[]>([]);
  const [selecionada, setSelecionada] = useState<VigiliaEntry | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string>('');

  const carregarVigilias = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const client = getSupabaseClient();
      if (!client) {
        setErro('Supabase não configurado neste navegador (verifique as chaves no Arsenal).');
        setCarregando(false);
        return;
      }

      const { data, error } = await client
        .from('memories')
        .select('id, content, type, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const filtradas = (data || []).filter(
        (m: any) =>
          m.type === 'vigilia_autonoma' ||
          m.metadata?.type === 'vigilia_autonoma' ||
          m.metadata?.origem === 'vigilia_nuvem'
      );

      setVigilias(filtradas);
      if (filtradas.length > 0) {
        setSelecionada(prev => prev && filtradas.some((v: any) => v.id === prev.id) ? prev : filtradas[0]);
      }
    } catch (e: any) {
      setErro(`Não foi possível ler as vigílias: ${e.message || String(e)}`);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarVigilias();
  }, [carregarVigilias]);

  const formatarData = (iso?: string) => {
    if (!iso) return 'Data desconhecida';
    try {
      return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="mb-8 bg-zinc-900/70 border border-purple-500/30 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
            <span>🌅</span> Caderno do Amanhecer (Vigílias na Nuvem)
          </h3>
          <p className="text-xs text-zinc-400">
            Reflexões autônomas geradas na nuvem e salvas no Cofre do Supabase ({vigilias.length} encontradas)
          </p>
        </div>
        <button
          onClick={carregarVigilias}
          disabled={carregando}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 transition-colors disabled:opacity-50"
        >
          {carregando ? 'Buscando...' : 'Atualizar Vigílias'}
        </button>
      </div>

      {erro && (
        <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs">
          {erro}
        </div>
      )}

      {!carregando && vigilias.length === 0 && !erro ? (
        <p className="text-xs text-zinc-500 text-center py-6">
          Nenhuma vigília autônoma registrada ainda no Supabase.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-2 max-h-72 overflow-y-auto pr-1">
            {vigilias.map((v) => (
              <button
                key={String(v.id)}
                onClick={() => setSelecionada(v)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selecionada?.id === v.id
                    ? 'bg-purple-600/20 border-purple-500/60 text-purple-100'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                <div className="text-[11px] font-semibold text-purple-400 mb-1">
                  {formatarData(v.metadata?.timestamp || v.created_at)}
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2">{v.content}</p>
              </button>
            ))}
          </div>
          <div className="md:col-span-2 bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 max-h-72 overflow-y-auto">
            {selecionada ? (
              <>
                <div className="text-xs text-purple-400 font-semibold mb-2 pb-2 border-b border-zinc-800">
                  Vigília de {formatarData(selecionada.metadata?.timestamp || selecionada.created_at)}
                </div>
                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {selecionada.content}
                </p>
              </>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-10">
                Selecione uma vigília ao lado para ler a reflexão completa.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CadernoAmanhecer;
