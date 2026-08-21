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

/** Chaves em `configuracoes` usadas pela pesquisa de preços. */
export const CONFIG_MERCADOS = "pesquisa_precos_mercados";
export const CONFIG_INTERVALO = "pesquisa_precos_intervalo_min";

/** Intervalos disponíveis para a atualização automática (em minutos; 0 = desligado). */
export const INTERVALOS = [0, 5, 15, 30, 60, 180] as const;

/** Lê a lista de fornecedores configurada (na ordem de prioridade escolhida). */
export function lerMercadosConfigurados(valor: string | undefined): Mercado[] {
  if (!valor) return [...MERCADOS];
  try {
    const bruto = JSON.parse(valor) as unknown;
    if (!Array.isArray(bruto)) return [...MERCADOS];
    const lista = bruto.filter((m): m is Mercado =>
      MERCADOS.includes(m as Mercado),
    );
    return lista.length > 0 ? lista : [...MERCADOS];
  } catch {
    return [...MERCADOS];
  }
}

/** Lê o intervalo de atualização automática em minutos (0 = desligado). */
export function lerIntervaloConfigurado(valor: string | undefined): number {
  const n = Number(valor);
  return INTERVALOS.includes(n as (typeof INTERVALOS)[number]) ? n : 0;
}

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

/** Quantos g/ml existem em uma unidade cadastrada (null = item contado). */
export function medidaPorUnidade(unidade: string): number | null {
  const fator: Record<string, number> = { kg: 1000, l: 1000, g: 1, ml: 1 };
  return fator[unidade] ?? null;
}

/** Converte um preço por unidade cadastrada em preço por g/ml. */
export function precoPorMedida(preco: number, unidade: string): number | null {
  const fator = medidaPorUnidade(unidade);
  return fator ? preco / fator : null;
}

/** Rótulo da medida usada nas comparações (g para massa, ml para volume). */
export function rotuloMedida(unidade: string): string {
  return unidade === "l" || unidade === "ml" ? "ml" : "g";
}

/** Extrai o tamanho da embalagem citado em um texto, em g/ml. */
export function extrairEmbalagem(texto: string): number | null {
  const re = /([0-9]{1,4}(?:[.,][0-9]{1,3})?)\s*(kg|kilo?s?|quilos?|g|gr|gramas?|l|lt|litros?|ml)\b/i;
  const m = re.exec(texto);
  if (!m) return null;
  const valor = Number(m[1]!.replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) return null;
  const un = m[2]!.toLowerCase();
  const gramas = /^(kg|kilo|kilos|quilo|quilos|l|lt|litro|litros)/.test(un)
    ? valor * 1000
    : valor;
  return gramas >= 5 && gramas <= 30_000 ? gramas : null;
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

/**
 * Preços por g/ml encontrados em um texto: cada preço é dividido pelo
 * tamanho da embalagem citado por perto (ex.: "Leite condensado 395g R$ 6,99").
 */
export function precosPorMedidaDoTexto(texto: string): number[] {
  const achados: number[] = [];
  const re = /R\$\s*([0-9]{1,3}(?:[.,][0-9]{2,3})*(?:[.,][0-9]{1,2})?)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    const normal = m[1]!.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    const preco = Number(normal);
    if (!Number.isFinite(preco) || preco <= 0.5 || preco >= 500) continue;
    const inicio = Math.max(0, m.index - 80);
    const janela = `${texto.slice(inicio, m.index)} ${texto.slice(
      m.index,
      m.index + 80,
    )}`;
    const embalagem = extrairEmbalagem(janela);
    if (embalagem === null) continue;
    const porMedida = preco / embalagem;
    if (porMedida > 0 && porMedida < 5) achados.push(porMedida);
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
  mercados: readonly Mercado[] = MERCADOS,
): ComparativoIngrediente[] {
  return ingredientes.map((ing) => {
    const porMercado = cotacoesPorMercado(cotacoes, ing.id);
    const precos: Partial<Record<Mercado, number>> = {};
    let melhorMercado: Mercado | null = null;
    let melhorPreco: number | null = null;

    for (const mercado of mercados) {
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
  mercados: readonly Mercado[] = MERCADOS,
): RankingReceita[] {
  return linhas.map((linha) => {
    const ranking: RankingMercado[] = [];

    for (const mercado of mercados) {
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

    // Empate no custo: vence quem tem mais itens cotados e, depois, a
    // prioridade de fornecedor configurada pelo usuário.
    ranking.sort(
      (a, b) =>
        a.custo - b.custo ||
        b.cobertura - a.cobertura ||
        mercados.indexOf(a.mercado) - mercados.indexOf(b.mercado),
    );

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

export interface VariacaoPreco {
  ingredienteId: number;
  ingrediente: string;
  mercado: string;
  precoAtual: number;
  precoAnterior: number | null;
  variacao: number | null;
  variacaoPercentual: number | null;
  atualizadoEm: string;
  medicoes: number;
  menor: number;
  maior: number;
}

/**
 * Compara a cotação mais recente de cada ingrediente/fornecedor com a
 * anterior, para acompanhar as variações ao longo do tempo.
 */
export function variacoesDoHistorico(
  historico: {
    ingredienteId: number;
    ingredienteNome: string;
    mercado: string;
    preco: number;
    criadoEm: string;
  }[],
): VariacaoPreco[] {
  const grupos = new Map<string, typeof historico>();
  for (const h of historico) {
    const chave = `${h.ingredienteId}|${h.mercado}`;
    const lista = grupos.get(chave);
    if (lista) lista.push(h);
    else grupos.set(chave, [h]);
  }

  const saida: VariacaoPreco[] = [];
  for (const lista of grupos.values()) {
    const ordenada = [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    const atual = ordenada[0]!;
    const anterior = ordenada.find((h) => h.preco !== atual.preco) ?? null;
    const variacao =
      anterior === null ? null : Math.round((atual.preco - anterior.preco) * 100) / 100;
    const precos = ordenada.map((h) => h.preco);
    saida.push({
      ingredienteId: atual.ingredienteId,
      ingrediente: atual.ingredienteNome,
      mercado: atual.mercado,
      precoAtual: atual.preco,
      precoAnterior: anterior?.preco ?? null,
      variacao,
      variacaoPercentual:
        variacao === null || !anterior || anterior.preco <= 0
          ? null
          : (variacao / anterior.preco) * 100,
      atualizadoEm: atual.criadoEm,
      medicoes: ordenada.length,
      menor: Math.min(...precos),
      maior: Math.max(...precos),
    });
  }

  return saida.sort(
    (a, b) =>
      Math.abs(b.variacaoPercentual ?? 0) - Math.abs(a.variacaoPercentual ?? 0) ||
      a.ingrediente.localeCompare(b.ingrediente),
  );
}
