import { z } from "zod";

/** Limite de negócio: máximo de ingredientes por receita (bolo/cobertura). */
export const MAX_INGREDIENTES = 20;

export const UNIDADES = [
  "kg",
  "g",
  "l",
  "ml",
  "unidade",
  "dúzia",
  "cartela",
  "fardo",
  "cartela de 10 unidades",
  "cartela de 20 unidades",
  "cartela de 30 unidades",
  "fardo de 10 unidades",
  "fardo de 12 unidades",
  "fardo de 15 unidades",
  "fardo de 20 unidades",
  "embalagem de 6 unidades",
  "embalagem de 10 unidades",
  "embalagem de 15 unidades",
  "embalagem de 20 unidades",
  "caixa de 10 unidades",
  "caixa de 20 unidades",
  "caixa de 50 unidades",
  "caixa de 100 unidades",
  "caixa de 1 l",
  "lata de 200 g",
  "lata de 400 g",
  "lata de 500 g",
  "lata de 1 kg",
  "garrafa de 200 ml",
  "garrafa de 600 ml",
  "garrafa de 1 l",
  "garrafa de 1,5 l",
  "garrafa de 2 l",
  "garrafa de 2,5 l",
  "sachê de 100 ml",
  "sachê de 200 ml",
  "sachê de 500 ml",
  "saco de 1 l",
  "saco de 1 kg",
  "saco de 2 kg",
  "saco de 5 kg",
] as const;

export type Unidade = (typeof UNIDADES)[number];

export interface Ingrediente {
  id: number;
  nome: string;
  unidade: Unidade;
  custoUnitario: number;
  estoqueQuantidade: number;
  estoqueUnidade: Unidade;
}


export interface ItemReceita {
  ingredienteId: number;
  quantidade: number;
}

export interface Receita {
  id: number;
  nome: string;
  precoVenda: number;
  criadoEm: string;
  itens: ItemReceita[];
}

export type Bolo = Receita;
export type Cobertura = Receita;
export type Curso = Receita;

export interface Cliente {
  id: number;
  nome: string;
  whatsapp: string;
}

export interface Despesa {
  id: number;
  data: string;
  descricao: string;
  valor: number;
}

export interface Pedido {
  id: number;
  clienteId: number;
  boloId: number | null;
  coberturaId: number | null;
  cursoId: number | null;
  data: string;
  /** Itens extras escolhidos direto do estoque (ingredientes + quantidade). */
  outrosItens: ItemReceita[];
  /** Preço de venda informado para os itens extras. */
  outrosPreco: number;
}


/* ------------------------------- dinheiro -------------------------------- */

/** Arredonda qualquer valor monetário para 2 casas decimais. */
export const dinheiro = (v: number): number =>
  Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;

/** Verifica se o valor informado tem no máximo 2 casas decimais. */
export const temNoMaximo2Casas = (v: number): boolean =>
  Number.isFinite(v) && Math.abs(v * 100 - Math.round(v * 100)) < 1e-9;

const MSG_CASAS = "Use no máximo 2 casas decimais (ex.: 12,50)";

/** Campo monetário: valida 2 casas decimais e normaliza o valor. */
const precoField = (opts: { min?: "positivo" | "naoNegativo"; msg?: string } = {}) => {
  let base = z.coerce
    .number({ invalid_type_error: "Informe um número" })
    .max(1_000_000);
  base =
    opts.min === "positivo"
      ? base.positive(opts.msg ?? "O valor deve ser maior que zero")
      : base.nonnegative(opts.msg ?? "O valor não pode ser negativo");
  return base.refine(temNoMaximo2Casas, MSG_CASAS).transform(dinheiro);
};

/** Custo unitário de ingrediente admite até 4 casas (preço por grama/ml). */
export const temNoMaximo4Casas = (v: number): boolean =>
  Number.isFinite(v) && Math.abs(v * 10000 - Math.round(v * 10000)) < 1e-7;
export const dinheiro4 = (v: number): number =>
  Number.isFinite(v) ? Math.round(v * 10000) / 10000 : 0;
const custoUnitarioField = z.coerce
  .number({ invalid_type_error: "Informe um número" })
  .max(1_000_000)
  .positive("O custo deve ser maior que zero")
  .refine(temNoMaximo4Casas, "Use no máximo 4 casas decimais (ex.: 0,0125)")
  .transform(dinheiro4);

/* ------------------------------- validação ------------------------------- */

export const ingredienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do ingrediente").max(80),
  unidade: z.enum(UNIDADES),
  custoUnitario: custoUnitarioField,
  estoqueQuantidade: z.coerce
    .number({ invalid_type_error: "Informe um número" })
    .nonnegative("O estoque não pode ser negativo")
    .max(1_000_000)
    .default(0),
  estoqueUnidade: z.enum(UNIDADES),
});
export type IngredienteInput = z.infer<typeof ingredienteSchema>;


export const itemReceitaSchema = z.object({
  ingredienteId: z.coerce.number().int().positive("Selecione um ingrediente"),
  quantidade: z.coerce
    .number({ invalid_type_error: "Informe um número" })
    .positive("A quantidade deve ser maior que zero"),
});

export const receitaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(80),
  precoVenda: precoField({ msg: "O preço não pode ser negativo" }),
  itens: z
    .array(itemReceitaSchema)
    .min(1, "Adicione pelo menos 1 ingrediente")
    .max(MAX_INGREDIENTES, `Máximo de ${MAX_INGREDIENTES} ingredientes`)
    .refine(
      (itens) => new Set(itens.map((i) => i.ingredienteId)).size === itens.length,
      "Não repita o mesmo ingrediente",
    ),
});
export type ReceitaInput = z.infer<typeof receitaSchema>;

export const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do cliente").max(80),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Informe o WhatsApp com DDD")
    .max(20)
    .regex(/^[0-9()+\-\s]+$/, "Use apenas números, espaços, ( ) + -"),
});
export type ClienteInput = z.infer<typeof clienteSchema>;

/* --------------------------- fatores de conversão -------------------------- */

export interface FatorConversao {
  id: number;
  unidade: Unidade;
  base: string;
  fator: number;
  observacao: string | null;
}

export const fatorConversaoSchema = z.object({
  unidade: z.enum(UNIDADES, { errorMap: () => ({ message: "Selecione a unidade" }) }),
  base: z.enum(["massa", "volume", "unidade", "cartela", "fardo"], {
    errorMap: () => ({ message: "Selecione a grandeza de referência" }),
  }),
  fator: z.coerce
    .number({ invalid_type_error: "Informe um número" })
    .positive("O fator deve ser maior que zero")
    .max(1_000_000),
  observacao: z.string().trim().max(200).nullable().default(null),
});
export type FatorConversaoInput = z.infer<typeof fatorConversaoSchema>;

/** Uma versão registrada do fator de conversão (auditoria). */
export interface HistoricoFator {
  id: number;
  fatorId: number | null;
  unidade: Unidade;
  base: string;
  fator: number;
  observacao: string | null;
  acao: "criado" | "alterado" | "removido";
  versao: number;
  autor: string;
  criadoEm: string;
}


export const pedidoSchema = z
  .object({
    clienteId: z.coerce.number().int().positive("Selecione um cliente"),
    boloId: z.coerce.number().int().positive().nullable(),
    coberturaId: z.coerce.number().int().positive().nullable(),
    cursoId: z.coerce.number().int().positive().nullable(),
    data: z.string().min(4, "Informe a data do pedido"),
    outrosItens: z
      .array(itemReceitaSchema)
      .max(MAX_INGREDIENTES, `Máximo de ${MAX_INGREDIENTES} itens`)
      .refine(
        (itens) => new Set(itens.map((i) => i.ingredienteId)).size === itens.length,
        "Não repita o mesmo item",
      )
      .default([]),
    outrosPreco: precoField({ msg: "O preço não pode ser negativo" }).default(0),
  })
  .refine((p) => p.boloId !== null || p.cursoId !== null || p.outrosItens.length > 0, {
    message: "Selecione um bolo, um curso ou outros itens",
    path: ["boloId"],
  });

export type PedidoInput = z.infer<typeof pedidoSchema>;

export const despesaSchema = z.object({
  data: z.string().min(4, "Informe a data da despesa"),
  descricao: z.string().trim().min(2, "Informe a descrição").max(120),
  valor: precoField({ msg: "O valor não pode ser negativo" }),
});
export type DespesaInput = z.infer<typeof despesaSchema>;

/* ------------------------------- cálculos ------------------------------- */

/** Custo de produção = soma(quantidade × custo unitário do ingrediente). */
export function calcularCusto(itens: ItemReceita[], ingredientes: Ingrediente[]): number {
  const porId = new Map(ingredientes.map((i) => [i.id, i]));
  const total = itens.reduce((acc, item) => {
    const ing = porId.get(item.ingredienteId);
    return acc + (ing ? ing.custoUnitario * item.quantidade : 0);
  }, 0);
  return Math.round(total * 100) / 100;
}

export function margem(precoVenda: number, custo: number) {
  const lucro = Math.round((precoVenda - custo) * 100) / 100;
  const percentual = precoVenda > 0 ? (lucro / precoVenda) * 100 : 0;
  return { lucro, percentual };
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const dataBR = (iso: string) => {
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
};

export const hojeISO = () => new Date().toISOString().slice(0, 10);

/* --------------------------- movimentações de estoque --------------------------- */

export type TipoMovimentacao = "entrada" | "saida" | "ajuste";

export interface MovimentacaoEstoque {
  id: number;
  ingredienteId: number;
  data: string;
  tipo: TipoMovimentacao;
  /** Variação em módulo, na unidade registrada. */
  quantidade: number;
  unidade: Unidade;
  quantidadeAnterior: number;
  quantidadeNova: number;
  custoUnitario: number;
  /** Valor financeiro da variação (quantidade × custo unitário). */
  valor: number;
  /** Quanto custaria repor o estoque ao nível anterior (só em diminuição). */
  custoReposicao: number;
  observacao: string | null;
}

export interface MovimentacaoInput {
  ingredienteId: number;
  data: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  unidade: Unidade;
  quantidadeAnterior: number;
  quantidadeNova: number;
  custoUnitario: number;
  valor: number;
  custoReposicao: number;
  observacao?: string | null;
}

/* --------------------------- configurações do sistema --------------------------- */

export const CONFIG_DASHBOARD_URL = "dashboard_externo_url";

export type Configuracoes = Record<string, string>;

export const dashboardUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .max(500, "URL muito longa")
    .refine(
      (v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v),
      "Informe uma URL completa começando com https://",
    ),
});

/** Normaliza a digitação de um preço: vírgula → ponto e no máximo 2 casas. */
export const limitarPreco = (texto: string): string => {
  const limpo = texto.replace(",", ".").replace(/[^\d.]/g, "");
  const [inteiro, ...resto] = limpo.split(".");
  if (resto.length === 0) return inteiro ?? "";
  return `${inteiro}.${resto.join("").slice(0, 2)}`;
};

/** Como limitarPreco, mas admite 4 casas (custo unitário por grama/ml). */
export const limitarPreco4 = (texto: string): string => {
  const limpo = texto.replace(",", ".").replace(/[^\d.]/g, "");
  const [inteiro, ...resto] = limpo.split(".");
  if (resto.length === 0) return inteiro ?? "";
  return `${inteiro}.${resto.join("").slice(0, 4)}`;
};
