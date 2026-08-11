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

export interface Cliente {
  id: number;
  nome: string;
  whatsapp: string;
}

export interface Pedido {
  id: number;
  clienteId: number;
  boloId: number;
  coberturaId: number | null;
  data: string;
}

/* ------------------------------- validação ------------------------------- */

export const ingredienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do ingrediente").max(80),
  unidade: z.enum(UNIDADES),
  custoUnitario: z.coerce
    .number({ invalid_type_error: "Informe um número" })
    .positive("O custo deve ser maior que zero")
    .max(1_000_000),
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

export const pedidoSchema = z.object({
  clienteId: z.coerce.number().int().positive("Selecione um cliente"),
  boloId: z.coerce.number().int().positive("Selecione um bolo"),
  coberturaId: z.coerce.number().int().positive().nullable(),
  data: z.string().min(4, "Informe a data do pedido"),
});
export type PedidoInput = z.infer<typeof pedidoSchema>;

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
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (iso: string) => {
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
};

export const hojeISO = () => new Date().toISOString().slice(0, 10);
