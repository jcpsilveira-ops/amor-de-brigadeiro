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
    converterQuantidade(quantidade, unidade, "ml") ??
    converterQuantidade(quantidade, unidade, "g") ??
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
  /** Equivalente em g/ml (null quando contado por unidade). */
  gramasTotais: number | null;
  /** Custo por g/ml do ingrediente (null quando contado por unidade). */
  custoPorGrama: number | null;
  /** Custo total do ingrediente somando todas as receitas. */
  custoTotal: number;
  /** Em quantas receitas o ingrediente aparece. */
  receitas: number;
  /** Estoque disponível cadastrado. */
  estoqueQuantidade: number;
  estoqueUnidade: string;
  /** Preço unitário do estoque, na unidade do estoque. */
  estoquePrecoUnitario: number;
  /** Quantidade consumida no mês de referência, na unidade do estoque. */
  consumoQuantidade: number;
  consumoUnidade: string;
  /** Preço unitário usado no consumo (mesmo preço informado no estoque). */
  consumoPrecoUnitario: number;
  /** Custo de reposição do consumo do mês (consumo × preço do estoque). */
  custoReposicao: number;
}

/**
 * Agrupa os ingredientes de todas as receitas da cesta (lista de compras).
 * Quando `ingredientes` é informado, todos os ingredientes cadastrados entram
 * na lista — os que não aparecem em nenhuma receita ficam com quantidade zero.
 * `consumo` traz a quantidade consumida no período de referência, na unidade de
 * compra do ingrediente (id → quantidade).
 */
export function resumirIngredientes(
  linhas: LinhaCesta[],
  ingredientes: Ingrediente[] = [],
  consumo: Map<number, number> = new Map(),
): ResumoIngredienteCesta[] {
  const mapa = new Map<number, ResumoIngredienteCesta>();

  const base = (ing: {
    id: number;
    nome: string;
    unidade: string;
    custoUnitario: number;
    estoqueQuantidade?: number;
    estoqueUnidade?: string | null;
  }): ResumoIngredienteCesta => {
    const unidadeEstoque = ing.estoqueUnidade ?? ing.unidade;
    const fator =
      converterQuantidade(1, ing.unidade as Ingrediente["unidade"], unidadeEstoque as Ingrediente["unidade"]) ?? 1;
    const precoEstoque = fator > 0 ? ing.custoUnitario / fator : ing.custoUnitario;
    const consumidoCompra = consumo.get(ing.id) ?? 0;
    const consumidoEstoque = Math.round(consumidoCompra * fator * 1000) / 1000;
    return {
      ingredienteId: ing.id,
      nome: ing.nome,
      unidade: ing.unidade,
      precoCompra: ing.custoUnitario,
      quantidadeTotal: 0,
      gramasTotais: null,
      custoPorGrama: null,
      custoTotal: 0,
      receitas: 0,
      estoqueQuantidade: ing.estoqueQuantidade ?? 0,
      estoqueUnidade: unidadeEstoque,
      estoquePrecoUnitario: precoEstoque,
      consumoQuantidade: consumidoEstoque,
      consumoUnidade: unidadeEstoque,
      consumoPrecoUnitario: precoEstoque,
      custoReposicao: Math.round(consumidoEstoque * precoEstoque * 100) / 100,
    };
  };

  for (const ing of ingredientes) mapa.set(ing.id, base(ing));

  for (const linha of linhas) {
    for (const item of linha.itens) {
      let atual = mapa.get(item.ingredienteId);
      if (!atual) {
        atual = base({
          id: item.ingredienteId,
          nome: item.nome,
          unidade: item.unidade,
          custoUnitario: item.precoCompra,
        });
        mapa.set(item.ingredienteId, atual);
      }
      atual.quantidadeTotal += item.quantidade;
      atual.custoTotal = Math.round((atual.custoTotal + item.custo) * 100) / 100;
      atual.receitas += 1;
      if (item.gramas !== null) atual.gramasTotais = (atual.gramasTotais ?? 0) + item.gramas;
    }
  }

  for (const item of mapa.values()) {
    item.quantidadeTotal = Math.round(item.quantidadeTotal * 1000) / 1000;
    if (item.gramasTotais !== null) {
      item.gramasTotais = Math.round(item.gramasTotais * 100) / 100;
      item.custoPorGrama =
        item.gramasTotais > 0 ? item.custoTotal / item.gramasTotais : null;
    }
  }

  return [...mapa.values()].sort(
    (a, b) => b.custoTotal - a.custoTotal || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}



/** Formata quantidade com no máximo 3 decimais. */
export const qtd = (v: number) =>
  v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

/** Formata valores de preço com 2 casas decimais. */
export const brlPreciso = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
