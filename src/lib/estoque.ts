import type { Ingrediente, Pedido, Receita, Unidade } from "./domain";

/** Fator de conversão para a unidade base (g, ml ou unidade). */
const FATOR: Record<Unidade, { base: "massa" | "volume" | "unidade"; fator: number }> = {
  kg: { base: "massa", fator: 1000 },
  g: { base: "massa", fator: 1 },
  l: { base: "volume", fator: 1000 },
  ml: { base: "volume", fator: 1 },
  unidade: { base: "unidade", fator: 1 },
};

/** Converte uma quantidade entre unidades compatíveis. Retorna null se incompatíveis. */
export function converterQuantidade(
  quantidade: number,
  de: Unidade,
  para: Unidade,
): number | null {
  const a = FATOR[de];
  const b = FATOR[para];
  if (!a || !b || a.base !== b.base) return null;
  return (quantidade * a.fator) / b.fator;
}

export interface NecessidadeIngrediente {
  /** Quantidade necessária, na unidade de compra do ingrediente. */
  necessario: number;
  /** Estoque disponível convertido para a unidade de compra (null se unidades incompatíveis). */
  disponivel: number | null;
  /** Quantidade que falta (0 quando há estoque suficiente). */
  faltando: number;
  /** true quando o estoque não cobre o próximo pedido. */
  insuficiente: boolean;
  /** true quando estoque e compra usam unidades incompatíveis (não é possível comparar). */
  unidadesIncompativeis: boolean;
}

export interface ProximoPedidoEstoque {
  pedido: Pedido | null;
  /** Necessidades por id de ingrediente. */
  porIngrediente: Map<number, NecessidadeIngrediente>;
  /** Ingredientes com estoque insuficiente. */
  insuficientes: Ingrediente[];
}

/** Encontra o próximo pedido: o mais próximo a partir de hoje; se não houver, o mais recente. */
export function encontrarProximoPedido(pedidos: Pedido[]): Pedido | null {
  if (pedidos.length === 0) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  const futuros = pedidos
    .filter((p) => p.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data));
  if (futuros.length > 0) return futuros[0]!;
  return [...pedidos].sort((a, b) => b.data.localeCompare(a.data))[0]!;
}

/** Calcula o consumo de ingredientes do próximo pedido e compara com o estoque. */
export function analisarEstoqueProximoPedido(
  ingredientes: Ingrediente[],
  pedidos: Pedido[],
  bolos: Receita[],
  coberturas: Receita[],
): ProximoPedidoEstoque {
  const pedido = encontrarProximoPedido(pedidos);
  const porIngrediente = new Map<number, NecessidadeIngrediente>();
  const insuficientes: Ingrediente[] = [];
  if (!pedido) return { pedido: null, porIngrediente, insuficientes };

  const necessidades = new Map<number, number>();
  const receitas = [
    bolos.find((b) => b.id === pedido.boloId),
    pedido.coberturaId ? coberturas.find((c) => c.id === pedido.coberturaId) : undefined,
  ];
  for (const receita of receitas) {
    for (const item of receita?.itens ?? []) {
      necessidades.set(
        item.ingredienteId,
        (necessidades.get(item.ingredienteId) ?? 0) + item.quantidade,
      );
    }
  }
  for (const item of pedido.outrosItens ?? []) {
    necessidades.set(
      item.ingredienteId,
      (necessidades.get(item.ingredienteId) ?? 0) + item.quantidade,
    );
  }


  for (const ing of ingredientes) {
    const necessario = necessidades.get(ing.id);
    if (!necessario) continue;
    const disponivel = converterQuantidade(
      ing.estoqueQuantidade,
      ing.estoqueUnidade ?? ing.unidade,
      ing.unidade,
    );
    const unidadesIncompativeis = disponivel === null;
    const faltando =
      disponivel === null ? 0 : Math.max(0, Math.round((necessario - disponivel) * 1000) / 1000);
    const insuficiente = faltando > 0;
    porIngrediente.set(ing.id, {
      necessario,
      disponivel,
      faltando,
      insuficiente,
      unidadesIncompativeis,
    });
    if (insuficiente) insuficientes.push(ing);
  }

  return { pedido, porIngrediente, insuficientes };
}

export const qtd = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
