import type { Ingrediente, ItemReceita, Receita } from "./domain";
import { converterQuantidade } from "./estoque";


/** Valores por 100 g: kcal, carboidratos, açúcares, gorduras, saturadas, proteínas, sódio (mg). */
export interface Nutrientes {
  kcal: number;
  carboidratos: number;
  acucares: number;
  gorduras: number;
  saturadas: number;
  proteinas: number;
  sodio: number;
}

const n = (
  kcal: number,
  carboidratos: number,
  acucares: number,
  gorduras: number,
  saturadas: number,
  proteinas: number,
  sodio: number,
): Nutrientes => ({ kcal, carboidratos, acucares, gorduras, saturadas, proteinas, sodio });

/** Texto normalizado (minúsculas, sem acento) para casar o nome cadastrado com a tabela. */
export const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Tabela de referência por 100 g (TACO/USDA e rótulos comerciais típicos).
 * A chave é um trecho do nome do ingrediente, comparado por aproximação.
 */
const TABELA: Array<{ chave: string; valores: Nutrientes }> = [
  { chave: "leite condensado", valores: n(321, 55, 54, 8.3, 5.3, 7.6, 130) },
  { chave: "chocolate em po", valores: n(400, 62, 50, 12, 7, 7, 40) },
  { chave: "chocolate branco", valores: n(539, 59, 59, 30, 18, 5.9, 90) },
  { chave: "chocolate", valores: n(500, 60, 50, 28, 17, 6, 50) },
  { chave: "cacau", valores: n(228, 58, 1.8, 14, 8.1, 20, 21) },
  { chave: "farinha de trigo", valores: n(360, 75, 0.3, 1.4, 0.3, 10, 2) },
  { chave: "farinha", valores: n(360, 75, 0.3, 1.4, 0.3, 10, 2) },
  { chave: "ovo", valores: n(143, 1.0, 0.4, 9.5, 3.1, 13, 142) },
  { chave: "margarina", valores: n(720, 0.6, 0, 80, 20, 0.2, 800) },
  { chave: "manteiga", valores: n(717, 0.1, 0.1, 81, 51, 0.9, 11) },
  { chave: "acucar", valores: n(387, 100, 100, 0, 0, 0, 1) },
  { chave: "creme de leite", valores: n(210, 4.5, 4, 20, 13, 2.5, 50) },
  { chave: "oleo", valores: n(884, 0, 0, 100, 15.7, 0, 0) },
  { chave: "fermento", valores: n(97, 46, 0, 0, 0, 0.1, 10600) },
  { chave: "essencia", valores: n(288, 12.7, 12.7, 0.1, 0, 0.1, 9) },
  { chave: "baunilha", valores: n(288, 12.7, 12.7, 0.1, 0, 0.1, 9) },
  { chave: "granulado", valores: n(460, 70, 55, 18, 11, 3, 60) },
  { chave: "leite em po", valores: n(496, 38, 38, 26, 16, 26, 371) },
  { chave: "leite integral", valores: n(61, 4.7, 4.7, 3.3, 1.9, 3.2, 43) },
  { chave: "leite", valores: n(61, 4.7, 4.7, 3.3, 1.9, 3.2, 43) },
  { chave: "fuba", valores: n(360, 79, 0.6, 1.8, 0.25, 7, 5) },
  { chave: "coco ralado", valores: n(660, 24, 7, 62, 55, 7, 37) },
  { chave: "coco", valores: n(354, 15, 6.2, 33, 30, 3.3, 20) },
  { chave: "goiabada", valores: n(270, 68, 60, 0.1, 0, 0.4, 20) },
  { chave: "doce de leite", valores: n(315, 55, 54, 7.5, 4.7, 6.8, 129) },
  { chave: "cenoura", valores: n(34, 7.7, 4.7, 0.2, 0.04, 0.9, 69) },
  { chave: "erva doce", valores: n(345, 52, 0, 15, 0.5, 16, 88) },
  { chave: "confeito", valores: n(400, 90, 75, 3, 2, 0.5, 30) },
  { chave: "chantily", valores: n(290, 25, 20, 20, 18, 1, 80) },
  { chave: "chantilly", valores: n(290, 25, 20, 20, 18, 1, 80) },
  { chave: "morango", valores: n(32, 7.7, 4.9, 0.3, 0.02, 0.7, 1) },
  { chave: "banana", valores: n(89, 23, 12, 0.3, 0.1, 1.1, 1) },
  { chave: "abacaxi", valores: n(50, 13, 9.9, 0.1, 0.01, 0.5, 1) },
  { chave: "amendoim", valores: n(567, 16, 4, 49, 6.3, 26, 18) },
  { chave: "castanha", valores: n(656, 12, 2.3, 66, 16, 14, 3) },
  { chave: "nozes", valores: n(654, 14, 2.6, 65, 6.1, 15, 2) },
  { chave: "mel", valores: n(304, 82, 82, 0, 0, 0.3, 4) },
  { chave: "canela", valores: n(247, 81, 2.2, 1.2, 0.3, 4, 10) },
  { chave: "iogurte", valores: n(61, 4.7, 4.7, 3.3, 2.1, 3.5, 46) },
  { chave: "requeijao", valores: n(257, 3, 3, 24, 15, 8, 700) },
  { chave: "cream cheese", valores: n(342, 4.1, 3.8, 34, 20, 6, 321) },
  { chave: "agua", valores: n(0, 0, 0, 0, 0, 0, 0) },
  { chave: "sal", valores: n(0, 0, 0, 0, 0, 0, 38758) },
];

/** Itens não alimentares: ficam fora do cálculo nutricional. */
const NAO_ALIMENTARES = [
  "embalagem",
  "caixa",
  "fita",
  "etiqueta",
  "forminha",
  "saco",
  "bico",
  "colher",
  "papel",
  "vela",
  "sacola",
  "tampa",
  "pote",
];

/** Peso médio em gramas de 1 "unidade" de alguns ingredientes. */
const GRAMAS_POR_UNIDADE: Array<{ chave: string; gramas: number }> = [
  { chave: "leite condensado", gramas: 395 },
  { chave: "creme de leite", gramas: 200 },
  { chave: "ovo", gramas: 50 },
  { chave: "goiabada", gramas: 300 },
  { chave: "chocolate", gramas: 100 },
  { chave: "cenoura", gramas: 90 },
  { chave: "banana", gramas: 100 },
  { chave: "limao", gramas: 80 },
  { chave: "laranja", gramas: 180 },
];

/** Densidade (g por litro) para ingredientes líquidos. */
const DENSIDADE_POR_LITRO: Array<{ chave: string; gramas: number }> = [
  { chave: "oleo", gramas: 920 },
  { chave: "leite", gramas: 1030 },
  { chave: "creme de leite", gramas: 1010 },
  { chave: "essencia", gramas: 1000 },
  { chave: "baunilha", gramas: 1000 },
  { chave: "chantily", gramas: 1000 },
  { chave: "chantilly", gramas: 1000 },
  { chave: "mel", gramas: 1420 },
];

const buscar = <T extends { chave: string }>(lista: T[], nome: string) =>
  lista.find((item) => normalizar(nome).includes(item.chave));

export const ehNaoAlimentar = (nome: string) =>
  NAO_ALIMENTARES.some((termo) => normalizar(nome).includes(termo));

export const nutrientesDoIngrediente = (nome: string): Nutrientes | undefined =>
  buscar(TABELA, nome)?.valores;

/**
 * Converte a quantidade cadastrada (na unidade do ingrediente) para gramas,
 * usando os fatores de conversão do sistema/cadastro: peso direto, volume pela
 * densidade do ingrediente e contagem pelo peso médio da unidade.
 */
export function paraGramas(ingrediente: Ingrediente, quantidade: number): number {
  const emGramas = converterQuantidade(quantidade, ingrediente.unidade, "g");
  if (emGramas !== null) return emGramas;

  const emMl = converterQuantidade(quantidade, ingrediente.unidade, "ml");
  if (emMl !== null) {
    const densidade = buscar(DENSIDADE_POR_LITRO, ingrediente.nome)?.gramas ?? 1000;
    return (emMl * densidade) / 1000;
  }

  const emUnidades = converterQuantidade(quantidade, ingrediente.unidade, "unidade");
  if (emUnidades !== null) {
    return emUnidades * (buscar(GRAMAS_POR_UNIDADE, ingrediente.nome)?.gramas ?? 0);
  }

  return 0;
}


export interface CalculoNutricional {
  pesoTotal: number;
  total: Nutrientes;
  por100g: Nutrientes;
  ignorados: string[];
  semReferencia: string[];
}

const zero = (): Nutrientes => n(0, 0, 0, 0, 0, 0, 0);

const CAMPOS = [
  "kcal",
  "carboidratos",
  "acucares",
  "gorduras",
  "saturadas",
  "proteinas",
  "sodio",
] as const;

/** Soma os nutrientes de uma receita a partir dos ingredientes cadastrados. */
export function calcularNutricional(
  itens: ItemReceita[],
  ingredientes: Ingrediente[],
): CalculoNutricional {
  const total = zero();
  let pesoTotal = 0;
  const ignorados: string[] = [];
  const semReferencia: string[] = [];

  for (const item of itens) {
    const ing = ingredientes.find((i) => i.id === item.ingredienteId);
    if (!ing) continue;
    if (ehNaoAlimentar(ing.nome)) {
      ignorados.push(ing.nome);
      continue;
    }
    const valores = nutrientesDoIngrediente(ing.nome);
    const gramas = paraGramas(ing, item.quantidade);
    if (!valores || gramas <= 0) {
      semReferencia.push(ing.nome);
      continue;
    }
    pesoTotal += gramas;
    for (const campo of CAMPOS) {
      total[campo] += (valores[campo] * gramas) / 100;
    }
  }

  const por100g = zero();
  if (pesoTotal > 0) {
    for (const campo of CAMPOS) {
      por100g[campo] = (total[campo] * 100) / pesoTotal;
    }
  }

  return {
    pesoTotal,
    total,
    por100g,
    ignorados: Array.from(new Set(ignorados)).sort(),
    semReferencia: Array.from(new Set(semReferencia)).sort(),
  };
}

export interface ReceitaNutricional extends CalculoNutricional {
  id: number;
  nome: string;
  tipo: "Bolo" | "Cobertura";
}

export function calcularReceitas(
  receitas: Receita[],
  ingredientes: Ingrediente[],
  tipo: "Bolo" | "Cobertura",
): ReceitaNutricional[] {
  return [...receitas]
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((r) => ({
      id: r.id,
      nome: r.nome,
      tipo,
      ...calcularNutricional(r.itens, ingredientes),
    }));
}
