import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

const TABELAS = ["ingredientes", "bolos", "coberturas", "cursos", "clientes", "pedidos", "outras_despesas", "outras_receitas", "movimentacoes_estoque", "fatores_conversao", "configuracoes"] as const;

/**
 * Mantém a tela sincronizada em tempo real: quando qualquer pessoa altera algo
 * pelo link compartilhado, as listas locais são recarregadas automaticamente.
 */
export function RealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as unknown as { AMOR_API_BASE?: string }).AMOR_API_BASE) return;

    const channel = supabase.channel("amor-de-brigadeiro-sync");
    for (const table of TABELAS) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey: [table] });
      });
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return null;
}
