/**
 * Pesquisa de preços por supermercado (cadastro dinâmico de mercados).
 * Helpers puros usados no servidor e na tela.
 */
import { extrairEmbalagem, medidaPorUnidade } from "./precos";

export interface MercadoCadastro {
  id: number;
  nome: string;
  urlBusca: string | null;
  origem: "manual" | "automatico";
}

export interface MercadoInput {
  nome: string;
  urlBusca?: string | null;
}

export interface PrecoMercado {
  id: number;
  ingredienteId: number;
  mercadoId: number;
  /** Nome do produto como aparece no site do mercado (em branco se não achado). */
  nomeProduto: string | null;
  /** Preço da embalagem (em branco se não achado). */
  preco: number | null;
  /** Peso/volume da embalagem, como texto (ex.: "395 g"). */
  peso: string | null;
  fonte: string | null;
  origem: "manual" | "automatico";
  atualizadoEm: string;
}

/** Resultado bruto de uma busca (um par ingrediente × mercado). */
export interface AchadoPreco {
  ingredienteId: number;
  mercadoId: number;
  nomeProduto: string | null;
  preco: number | null;
  peso: string | null;
  fonte: string | null;
}

/** Sugestão de mercado descoberta na internet. */
export interface SugestaoMercado {
  nome: string;
  urlBusca: string;
}

/** Peso/volume em g/ml a partir do texto informado (null quando não dá para ler). */
export function pesoEmMedida(peso: string | null): number | null {
  return peso ? extrairEmbalagem(peso) : null;
}

/** Preço por g/ml de um registro (null quando falta preço ou peso). */
export function precoPorMedidaDoRegistro(p: PrecoMercado): number | null {
  const medida = pesoEmMedida(p.peso);
  if (p.preco === null || medida === null || medida <= 0) return null;
  return p.preco / medida;
}

/** Índice rápido: `${ingredienteId}|${mercadoId}` → registro. */
export function indexarPrecos(precos: PrecoMercado[]): Map<string, PrecoMercado> {
  const mapa = new Map<string, PrecoMercado>();
  for (const p of precos) mapa.set(`${p.ingredienteId}|${p.mercadoId}`, p);
  return mapa;
}

/**
 * Regra crítica de atualização: só substitui o valor existente quando o campo
 * anterior está em branco OU quando o novo preço é MENOR que o anterior.
 */
export function deveAtualizar(
  anterior: PrecoMercado | undefined,
  achado: AchadoPreco,
): boolean {
  if (achado.preco === null && achado.nomeProduto === null && achado.peso === null) {
    return false;
  }
  if (!anterior) return true;
  if (anterior.preco === null) return true;
  if (achado.preco === null) return false;
  return achado.preco < anterior.preco;
}

/** Mescla o achado com o registro anterior, preservando o que estava preenchido. */
export function mesclarAchado(
  anterior: PrecoMercado | undefined,
  achado: AchadoPreco,
): { nomeProduto: string | null; preco: number | null; peso: string | null; fonte: string | null } {
  return {
    nomeProduto: achado.nomeProduto ?? anterior?.nomeProduto ?? null,
    preco: achado.preco ?? anterior?.preco ?? null,
    peso: achado.peso ?? anterior?.peso ?? null,
    fonte: achado.fonte ?? anterior?.fonte ?? null,
  };
}

/** Melhor (menor) preço por g/ml de um ingrediente entre os mercados. */
export function melhorMercadoDoIngrediente(
  precos: PrecoMercado[],
  ingredienteId: number,
): { mercadoId: number; porMedida: number | null; preco: number } | null {
  let melhor: { mercadoId: number; porMedida: number | null; preco: number } | null = null;
  for (const p of precos) {
    if (p.ingredienteId !== ingredienteId || p.preco === null) continue;
    const porMedida = precoPorMedidaDoRegistro(p);
    const chaveNovo = porMedida ?? p.preco;
    const chaveAtual = melhor ? (melhor.porMedida ?? melhor.preco) : Infinity;
    if (chaveNovo < chaveAtual) melhor = { mercadoId: p.mercadoId, porMedida, preco: p.preco };
  }
  return melhor;
}

/**
 * Menor preço encontrado para o ingrediente, na unidade cadastrada dele,
 * comparando o preço de compra do estoque com os preços dos supermercados.
 */
export interface MenorPreco {
  /** Preço por unidade cadastrada do ingrediente (ex.: por kg, por un.). */
  valor: number;
  /** Onde foi encontrado: "Estoque" ou o nome do mercado. */
  origem: string;
}

export function menorPrecoDoIngrediente(
  ingrediente: { id: number; unidade: string; custoUnitario: number },
  precos: PrecoMercado[],
  mercados: { id: number; nome: string }[],
): MenorPreco {
  const fator = medidaPorUnidade(ingrediente.unidade);
  let melhor: MenorPreco = { valor: ingrediente.custoUnitario, origem: "Estoque" };
  for (const p of precos) {
    if (p.ingredienteId !== ingrediente.id || p.preco === null) continue;
    const porMedida = precoPorMedidaDoRegistro(p);
    // Massa/volume: converte o preço por g/ml para a unidade cadastrada.
    // Itens por unidade: usa o preço da embalagem direto.
    const valor = fator !== null ? (porMedida === null ? null : porMedida * fator) : p.preco;
    if (valor === null || !Number.isFinite(valor) || valor <= 0) continue;
    if (melhor.valor <= 0 || valor < melhor.valor) {
      melhor = { valor, origem: mercados.find((m) => m.id === p.mercadoId)?.nome ?? "Mercado" };
    }
  }
  return melhor;
}

/** Mapa ingredienteId → menor preço, e lista de ingredientes com custo ajustado. */
export function aplicarMenoresPrecos<T extends { id: number; unidade: string; custoUnitario: number }>(
  ingredientes: T[],
  precos: PrecoMercado[],
  mercados: { id: number; nome: string }[],
): { ingredientes: T[]; origens: Map<number, MenorPreco> } {
  const origens = new Map<number, MenorPreco>();
  const lista = ingredientes.map((ing) => {
    const menor = menorPrecoDoIngrediente(ing, precos, mercados);
    origens.set(ing.id, menor);
    return { ...ing, custoUnitario: Math.round(menor.valor * 10000) / 10000 };
  });
  return { ingredientes: lista, origens };
}
