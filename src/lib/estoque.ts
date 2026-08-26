import type { Ingrediente, Pedido, Receita, Unidade } from "./domain";

export type BaseGrandeza = "massa" | "volume" | "unidade" | "cartela" | "fardo";

export const BASES: readonly BaseGrandeza[] = [
  "massa",
  "volume",
  "unidade",
  "cartela",
  "fardo",
];

export const NOME_BASE: Record<BaseGrandeza, string> = {
  massa: "Peso (g)",
  volume: "Volume (ml)",
  unidade: "Contagem (unidades)",
  cartela: "Cartela (genérica)",
  fardo: "Fardo (genérico)",
};

export interface FatorUnidade {
  base: BaseGrandeza;
  fator: number;
}

/** Fator de conversão para a unidade base (g, ml, unidade, cartela ou fardo). */
const FATOR: Record<Unidade, FatorUnidade> = {

  kg: { base: "massa", fator: 1000 },
  g: { base: "massa", fator: 1 },
  l: { base: "volume", fator: 1000 },
  ml: { base: "volume", fator: 1 },
  unidade: { base: "unidade", fator: 1 },
  dúzia: { base: "unidade", fator: 12 },
  cartela: { base: "cartela", fator: 1 },
  fardo: { base: "fardo", fator: 1 },
  "cartela de 10 unidades": { base: "unidade", fator: 10 },
  "cartela de 20 unidades": { base: "unidade", fator: 20 },
  "cartela de 30 unidades": { base: "unidade", fator: 30 },
  "fardo de 10 unidades": { base: "unidade", fator: 10 },
  "fardo de 12 unidades": { base: "unidade", fator: 12 },
  "fardo de 15 unidades": { base: "unidade", fator: 15 },
  "fardo de 20 unidades": { base: "unidade", fator: 20 },
  "embalagem de 6 unidades": { base: "unidade", fator: 6 },
  "embalagem de 10 unidades": { base: "unidade", fator: 10 },
  "embalagem de 15 unidades": { base: "unidade", fator: 15 },
  "embalagem de 20 unidades": { base: "unidade", fator: 20 },
  "caixa de 10 unidades": { base: "unidade", fator: 10 },
  "caixa de 20 unidades": { base: "unidade", fator: 20 },
  "caixa de 50 unidades": { base: "unidade", fator: 50 },
  "caixa de 100 unidades": { base: "unidade", fator: 100 },
  "caixa de 1 l": { base: "volume", fator: 1000 },
  "lata de 200 g": { base: "massa", fator: 200 },
  "lata de 400 g": { base: "massa", fator: 400 },
  "lata de 500 g": { base: "massa", fator: 500 },
  "lata de 1 kg": { base: "massa", fator: 1000 },
  "garrafa de 200 ml": { base: "volume", fator: 200 },
  "garrafa de 600 ml": { base: "volume", fator: 600 },
  "garrafa de 1 l": { base: "volume", fator: 1000 },
  "garrafa de 1,5 l": { base: "volume", fator: 1500 },
  "garrafa de 2 l": { base: "volume", fator: 2000 },
  "garrafa de 2,5 l": { base: "volume", fator: 2500 },
  "sachê de 100 ml": { base: "volume", fator: 100 },
  "sachê de 200 ml": { base: "volume", fator: 200 },
  "sachê de 500 ml": { base: "volume", fator: 500 },
  "saco de 1 l": { base: "volume", fator: 1000 },
  "saco de 1 kg": { base: "massa", fator: 1000 },
  "saco de 2 kg": { base: "massa", fator: 2000 },
  "saco de 5 kg": { base: "massa", fator: 5000 },
};

/** Fatores padrão do sistema (usados quando não há cadastro personalizado). */
export const FATORES_PADRAO: Readonly<Record<Unidade, FatorUnidade>> = FATOR;

/** Fatores cadastrados pela usuária, aplicados sobre os padrões. */
let personalizados: Partial<Record<Unidade, FatorUnidade>> = {};

/** Substitui os fatores personalizados em uso (chamado quando o cadastro carrega). */
export function aplicarFatoresPersonalizados(
  lista: { unidade: string; base: string; fator: number }[],
): void {
  const proximos: Partial<Record<Unidade, FatorUnidade>> = {};
  for (const f of lista) {
    if (!BASES.includes(f.base as BaseGrandeza)) continue;
    if (!Number.isFinite(f.fator) || f.fator <= 0) continue;
    proximos[f.unidade as Unidade] = { base: f.base as BaseGrandeza, fator: f.fator };
  }
  personalizados = proximos;
}

/** Fator em uso para a unidade (personalizado quando houver, senão o padrão). */
export function fatorDe(u: Unidade): FatorUnidade | undefined {
  return personalizados[u] ?? FATOR[u];
}

/** true quando a unidade tem fator cadastrado manualmente. */
export function temFatorPersonalizado(u: Unidade): boolean {
  return personalizados[u] !== undefined;
}

/** Unidades genéricas de embalagem: não têm fator confiável para peso/volume/contagem. */
const UNIDADES_GENERICAS: readonly string[] = ["cartela", "fardo"];

/** Genérica apenas enquanto não houver um fator confiável cadastrado. */
function ehGenerica(u: Unidade): boolean {
  if (!UNIDADES_GENERICAS.includes(String(u))) return false;
  const p = personalizados[u];
  return !p || p.base === "cartela" || p.base === "fardo";
}

export type StatusConversao = "ok" | "ambigua" | "incompativel";

export interface AvaliacaoConversao {
  status: StatusConversao;
  motivo?: string;
}

/** Primeira palavra da unidade ("cartela de 10 unidades" -> "cartela"). */
function familia(u: Unidade): string {
  return String(u).split(" ")[0]!;
}

/**
 * Avalia se a conversão entre duas unidades tem fator confiável.
 * - "ok": mesma base física e fatores explícitos.
 * - "ambigua": mesmo nome/família mas sem fator confiável (ex.: cartela x cartela de 10 unidades)
 *   ou envolve unidade genérica de embalagem — exige ajuste manual confirmado.
 * - "incompativel": bases diferentes (ex.: kg x unidade).
 */
export function avaliarConversao(de: Unidade, para: Unidade): AvaliacaoConversao {
  if (de === para) return { status: "ok" };
  const a = fatorDe(de);
  const b = fatorDe(para);
  if (!a || !b) return { status: "incompativel", motivo: "Unidade sem mapeamento conhecido." };

  if (ehGenerica(de) || ehGenerica(para)) {
    return {
      status: "ambigua",
      motivo: `“${ehGenerica(de) ? de : para}” é uma embalagem genérica, sem quantidade definida. Cadastre o fator de conversão para usá-la.`,
    };
  }

  if (a.base !== b.base) {
    // Mesmo nome de família (ex.: cartela x cartela de 10 unidades) indica ambiguidade, não incompatibilidade.
    if (familia(de) === familia(para)) {
      return {
        status: "ambigua",
        motivo: "Unidades com o mesmo nome, mas sem fator de conversão confiável.",
      };
    }
    return { status: "incompativel", motivo: "Unidades de grandezas diferentes (peso, volume ou contagem)." };
  }

  return { status: "ok" };
}

/** Converte uma quantidade entre unidades compatíveis. Retorna null se incompatíveis ou ambíguas. */
export function converterQuantidade(
  quantidade: number,
  de: Unidade,
  para: Unidade,
): number | null {
  if (avaliarConversao(de, para).status !== "ok") return null;
  const a = fatorDe(de);
  const b = fatorDe(para);
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

/** Estoque atual convertido para a unidade de compra do ingrediente. */
export function estoqueNaUnidadeDeCompra(ing: Ingrediente): number {
  return (
    converterQuantidade(ing.estoqueQuantidade, ing.estoqueUnidade ?? ing.unidade, ing.unidade) ?? 0
  );
}

/**
 * Parte do estoque atual que NÃO vem das movimentações consideradas — ou seja, o
 * saldo que já existia antes delas. Evita contar duas vezes um ingrediente cujas
 * entradas já estão registradas no histórico.
 *
 * inicial = estoque atual - entradas do período + saídas do período (nunca negativo)
 */
export function estoqueExistenteComoEntrada(
  ing: Ingrediente,
  movimentacoes: { ingredienteId: number; tipo: string; quantidade: number; unidade: Unidade }[],
): number {
  let saldo = estoqueNaUnidadeDeCompra(ing);
  for (const m of movimentacoes) {
    if (m.ingredienteId !== ing.id) continue;
    const q = converterQuantidade(m.quantidade, m.unidade, ing.unidade) ?? m.quantidade;
    saldo += m.tipo === "entrada" ? -q : q;
  }
  return Math.max(0, Math.round(saldo * 1000) / 1000);
}

