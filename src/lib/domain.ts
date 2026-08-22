import { z } from "zod";

/** Limite de negócio: máximo de ingredientes por receita (bolo/cobertura). */
export const MAX_INGREDIENTES = 20;

export const UNIDADES = ["kg", "g", "l", "ml", "unidade"] as const;
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

/* ------------------------------- validação ------------------------------- */

export const ingredienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do ingrediente").max(80),
  unidade: z.enum(UNIDADES),
  custoUnitario: precoField({ min: "positivo", msg: "O custo deve ser maior que zero" }),
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
  precoVenda: z.coerce
    .number({ invalid_type_error: "Informe um número" })
    .nonnegative("O preço não pode ser negativo")
    .max(1_000_000),
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
    outrosPreco: z.coerce
      .number({ invalid_type_error: "Informe um número" })
      .nonnegative("O preço não pode ser negativo")
      .max(1_000_000)
      .default(0),
  })
  .refine((p) => p.boloId !== null || p.cursoId !== null || p.outrosItens.length > 0, {
    message: "Selecione um bolo, um curso ou outros itens",
    path: ["boloId"],
  });

export type PedidoInput = z.infer<typeof pedidoSchema>;

export const despesaSchema = z.object({
  data: z.string().min(4, "Informe a data da despesa"),
  descricao: z.string().trim().min(2, "Informe a descrição").max(120),
  valor: z.coerce
    .number({ invalid_type_error: "Informe um número" })
    .nonnegative("O valor não pode ser negativo")
    .max(1_000_000),
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
