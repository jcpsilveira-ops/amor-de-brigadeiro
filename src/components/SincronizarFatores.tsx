import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { aplicarFatoresPersonalizados } from "@/lib/estoque";
import { keys, useFatoresConversao } from "@/lib/queries";

/**
 * Aplica os fatores de conversão cadastrados às contas de estoque, receitas e
 * cesta da produção. Ao mudar, força o recálculo das telas abertas.
 */
export function SincronizarFatores() {
  const { data: fatores } = useFatoresConversao();
  const qc = useQueryClient();

  useEffect(() => {
    if (!fatores) return;
    aplicarFatoresPersonalizados(
      fatores.map((f) => ({ unidade: f.unidade, base: f.base, fator: f.fator })),
    );
    for (const key of [keys.ingredientes, keys.movimentacoes, keys.precosMercado]) {
      qc.invalidateQueries({ queryKey: key });
    }
  }, [fatores, qc]);

  return null;
}
