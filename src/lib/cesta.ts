import { calcularCusto, margem, type Ingrediente, type Receita } from "./domain";
import { converterQuantidade } from "./estoque";

export type TipoCesta = "Bolo" | "Cobertura";

export interface ItemCesta {
  ingredienteId: number;
  nome: string;
  /** Quantidade usada na receita, na unidade de compra do ingrediente. */
  quantidade: number;
  unidade: string;
  /** Preço de compra por unidade cadastrada (kg, l, unidade...). */
  precoCompra: number;
  /** Custo do ingrediente dentro desta receita. */
  custo: number;
  /** Peso/volume equivalente em g/ml (null quando o item é contado por unidade). */
  gramas: number | null;
  /** Custo por grama/ml deste ingrediente (null quando contado por unidade). */
  custoPorGrama: number | null;
  /** Participação percentual no custo da receita. */
  participacao: number;
}

export interface LinhaCesta {
  id: number;
  nome: string;
  tipo: TipoCesta;
  itens: ItemCesta[];
  /** Custo total dos ingredientes (custo por receita). */
  custoReceita: number;
  /** Peso total da receita em g/ml (só itens mensuráveis). */
  gramasTotais: number;
  /** Quantidade de itens contados por unidade (ovos, velas...). */
  itensPorUnidade: number;
  /** Custo por grama/ml da receita (0 quando não há peso mensurável). */
  custoPorGrama: number;
  /** Preço de venda cadastrado (custo por bolo/cobertura vendido). */
  precoVenda: number;
  lucro: number;
  percentual: number;
}

/** Converte a quantidade para g (massa) ou ml (volume). Itens por unidade retornam null. */
function emGramas(quantidade: number, unidade: Ingrediente["unidade"]): number | null {
  if (unidade === "unidade") return null;
  return (
    converterQuantidade(quantidade, unidade, unidade === "l" || unidade === "ml" ? "ml" : "g") ??
    null
  );
}

/**
 * Cesta da produção: cruza os ingredientes das receitas e calcula
 * preço de compra → custo por receita → custo por grama → custo por
 * bolo/cobertura → margem de lucro.
 */
export function montarCesta(
  receitas: Receita[],
  tipo: TipoCesta,
  ingredientes: Ingrediente[],
): LinhaCesta[] {
  const porId = new Map(ingredientes.map((i) => [i.id, i]));

  return receitas.map((receita) => {
    const custoReceita = calcularCusto(receita.itens, ingredientes);
    let gramasTotais = 0;
    let itensPorUnidade = 0;

    const itens: ItemCesta[] = receita.itens.map((item) => {
      const ing = porId.get(item.ingredienteId);
      const custo = ing
        ? Math.round(ing.custoUnitario * item.quantidade * 100) / 100
        : 0;
      const gramas = ing ? emGramas(item.quantidade, ing.unidade) : null;
      if (gramas === null) itensPorUnidade += item.quantidade;
      else gramasTotais += gramas;

      return {
        ingredienteId: item.ingredienteId,
        nome: ing?.nome ?? `Ingrediente #${item.ingredienteId}`,
        quantidade: item.quantidade,
        unidade: ing?.unidade ?? "",
        precoCompra: ing?.custoUnitario ?? 0,
        custo,
        gramas,
        custoPorGrama: gramas && gramas > 0 ? custo / gramas : null,
        participacao: custoReceita > 0 ? (custo / custoReceita) * 100 : 0,
      };
    });

    const { lucro, percentual } = margem(receita.precoVenda, custoReceita);

    return {
      id: receita.id,
      nome: receita.nome,
      tipo,
      itens: itens.sort((a, b) => b.custo - a.custo),
      custoReceita,
      gramasTotais: Math.round(gramasTotais * 100) / 100,
      itensPorUnidade,
      custoPorGrama: gramasTotais > 0 ? custoReceita / gramasTotais : 0,
      precoVenda: receita.precoVenda,
      lucro,
      percentual,
    };
  });
}

export interface ResumoIngredienteCesta {
  ingredienteId: number;
  nome: string;
  unidade: string;
  precoCompra: number;
  /** Quantidade total consumida somando todas as receitas. */
  quantidadeTotal: number;
  /** Custo total do ingrediente somando todas as receitas. */
  custoTotal: number;
  /** Em quantas receitas o ingrediente aparece. */
  receitas: number;
}

/** Agrupa os ingredientes de todas as receitas da cesta (lista de compras). */
export function resumirIngredientes(linhas: LinhaCesta[]): ResumoIngredienteCesta[] {
  const mapa = new Map<number, ResumoIngredienteCesta>();
  for (const linha of linhas) {
    for (const item of linha.itens) {
      const atual = mapa.get(item.ingredienteId);
      if (atual) {
        atual.quantidadeTotal += item.quantidade;
        atual.custoTotal = Math.round((atual.custoTotal + item.custo) * 100) / 100;
        atual.receitas += 1;
      } else {
        mapa.set(item.ingredienteId, {
          ingredienteId: item.ingredienteId,
          nome: item.nome,
          unidade: item.unidade,
          precoCompra: item.precoCompra,
          quantidadeTotal: item.quantidade,
          custoTotal: item.custo,
          receitas: 1,
        });
      }
    }
  }
  return [...mapa.values()].sort((a, b) => b.custoTotal - a.custoTotal);
}

/** Formata quantidade com no máximo 3 decimais. */
export const qtd = (v: number) =>
  v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

/** Formata valores muito pequenos (custo por grama) com 4 decimais. */
export const brlPreciso = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
