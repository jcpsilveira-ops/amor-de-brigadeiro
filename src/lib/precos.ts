/**
 * Pesquisa de preços nos mercados de Uberlândia e ranking de custo-benefício.
 * Helpers puros (usados no servidor e na tela).
 */
import type { Ingrediente } from "./domain";
import type { LinhaCesta } from "./cesta";

export const MERCADOS = [
  "Atacadão",
  "Mart Minas",
  "Assaí",
  "BH",
  "ABC",
  "Leal",
  "D'Ville",
] as const;

export type Mercado = (typeof MERCADOS)[number];

/** Palavras que identificam cada rede no título/URL/texto do resultado. */
export const APELIDOS: Record<Mercado, string[]> = {
  "Atacadão": ["atacadao", "atacadão"],
  "Mart Minas": ["mart minas", "martminas", "mart-minas"],
  "Assaí": ["assai", "assaí"],
  "BH": ["supermercados bh", "supermercado bh", "bh supermercados", "superbh"],
  "ABC": ["abc supermercado", "supermercado abc", "abc uberlandia", "abc uberlândia"],
  "Leal": ["leal supermercado", "supermercado leal", "leal uberlandia", "supermercadosleal"],
  "D'Ville": ["d'ville", "dville", "d ville", "d’ville"],
};

export interface Cotacao {
  ingredienteId: number;
  ingrediente: string;
  mercado: Mercado;
  /** Preço encontrado, por unidade cadastrada do ingrediente (aproximado). */
  preco: number;
  /** Trecho da página que originou o preço. */
  trecho: string;
  fonte: string;
}

export interface PesquisaPrecos {
  atualizadoEm: string;
  cotacoes: Cotacao[];
  /** Ingredientes sem nenhuma cotação encontrada. */
  semCotacao: string[];
  erro?: string;
}

/** Extrai valores em reais de um texto (R$ 12,90 / R$ 5.99). */
export function extrairPrecos(texto: string): number[] {
  const achados: number[] = [];
  const re = /R\$\s*([0-9]{1,3}(?:[.,][0-9]{2,3})*(?:[.,][0-9]{1,2})?)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const bruto = m[1]!;
    const normal = bruto.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    const valor = Number(normal);
    if (Number.isFinite(valor) && valor > 0.5 && valor < 500) achados.push(valor);
  }
  return achados;
}

/** Identifica a rede citada em um texto/URL, se houver. */
export function identificarMercado(texto: string): Mercado | null {
  const alvo = texto.toLowerCase();
  for (const mercado of MERCADOS) {
    if (APELIDOS[mercado].some((a) => alvo.includes(a))) return mercado;
  }
  return null;
}

/** Melhor (menor) cotação por mercado para um ingrediente. */
export function cotacoesPorMercado(
  cotacoes: Cotacao[],
  ingredienteId: number,
): Partial<Record<Mercado, Cotacao>> {
  const mapa: Partial<Record<Mercado, Cotacao>> = {};
  for (const c of cotacoes) {
    if (c.ingredienteId !== ingredienteId) continue;
    const atual = mapa[c.mercado];
    if (!atual || c.preco < atual.preco) mapa[c.mercado] = c;
  }
  return mapa;
}

export interface ComparativoIngrediente {
  ingredienteId: number;
  nome: string;
  unidade: string;
  /** Preço cadastrado no estoque. */
  precoEstoque: number;
  precos: Partial<Record<Mercado, number>>;
  melhorMercado: Mercado | null;
  melhorPreco: number | null;
  /** Diferença (melhor preço − estoque). Negativo = economia. */
  diferenca: number | null;
  /** Diferença percentual em relação ao estoque. */
  diferencaPercentual: number | null;
}

export function compararComEstoque(
  ingredientes: Ingrediente[],
  cotacoes: Cotacao[],
): ComparativoIngrediente[] {
  return ingredientes.map((ing) => {
    const porMercado = cotacoesPorMercado(cotacoes, ing.id);
    const precos: Partial<Record<Mercado, number>> = {};
    let melhorMercado: Mercado | null = null;
    let melhorPreco: number | null = null;

    for (const mercado of MERCADOS) {
      const cot = porMercado[mercado];
      if (!cot) continue;
      precos[mercado] = cot.preco;
      if (melhorPreco === null || cot.preco < melhorPreco) {
        melhorPreco = cot.preco;
        melhorMercado = mercado;
      }
    }

    const diferenca =
      melhorPreco === null ? null : Math.round((melhorPreco - ing.custoUnitario) * 100) / 100;

    return {
      ingredienteId: ing.id,
      nome: ing.nome,
      unidade: ing.unidade,
      precoEstoque: ing.custoUnitario,
      precos,
      melhorMercado,
      melhorPreco,
      diferenca,
      diferencaPercentual:
        diferenca === null || ing.custoUnitario <= 0
          ? null
          : (diferenca / ing.custoUnitario) * 100,
    };
  });
}

export interface RankingMercado {
  mercado: Mercado;
  /** Custo da receita usando os preços deste mercado (estoque como reserva). */
  custo: number;
  /** Quantos ingredientes da receita têm preço nesta rede. */
  cobertura: number;
  totalItens: number;
  /** Economia em relação ao custo atual do estoque (positivo = economia). */
  economia: number;
}

export interface RankingReceita {
  id: number;
  nome: string;
  tipo: LinhaCesta["tipo"];
  custoEstoque: number;
  ranking: RankingMercado[];
  melhor: RankingMercado | null;
}

/**
 * Ranking de custo-benefício por receita: recalcula o custo de produção
 * com os preços de cada mercado e compara com o custo do estoque.
 */
export function rankearReceitas(
  linhas: LinhaCesta[],
  cotacoes: Cotacao[],
): RankingReceita[] {
  return linhas.map((linha) => {
    const ranking: RankingMercado[] = [];

    for (const mercado of MERCADOS) {
      let custo = 0;
      let cobertura = 0;
      for (const item of linha.itens) {
        const cot = cotacoesPorMercado(cotacoes, item.ingredienteId)[mercado];
        const preco = cot?.preco;
        if (preco !== undefined) cobertura += 1;
        custo += (preco ?? item.precoCompra) * item.quantidade;
      }
      if (cobertura === 0) continue;
      const arredondado = Math.round(custo * 100) / 100;
      ranking.push({
        mercado,
        custo: arredondado,
        cobertura,
        totalItens: linha.itens.length,
        economia: Math.round((linha.custoReceita - arredondado) * 100) / 100,
      });
    }

    ranking.sort((a, b) => a.custo - b.custo || b.cobertura - a.cobertura);

    return {
      id: linha.id,
      nome: linha.nome,
      tipo: linha.tipo,
      custoEstoque: linha.custoReceita,
      ranking,
      melhor: ranking[0] ?? null,
    };
  });
}
