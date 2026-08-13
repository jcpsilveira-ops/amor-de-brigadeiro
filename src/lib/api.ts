/**
 * Cliente de dados único para toda a aplicação.
 *
 * - No executável Windows, `window.AMOR_API_BASE` é injetado pelo Electron e
 *   as chamadas vão para a API Express local (Node + SQLite).
 * - No navegador (link compartilhado), usa o banco de dados na nuvem, de forma
 *   que qualquer pessoa que acesse o link vê e edita os MESMOS dados.
 *
 * As telas nunca conversam com o armazenamento diretamente — sempre por aqui.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  MAX_INGREDIENTES,
  calcularCusto,
  type Bolo,
  type Cliente,
  type Cobertura,
  type Curso,
  type Ingrediente,
  type IngredienteInput,
  type ClienteInput,
  type Pedido,
  type PedidoInput,
  type Despesa,
  type DespesaInput,
  type MovimentacaoEstoque,
  type MovimentacaoInput,
  type ReceitaInput,
  type Unidade,
} from "./domain";

export class ApiError extends Error {}

function apiBase(): string | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { AMOR_API_BASE?: string }).AMOR_API_BASE ?? null;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBase()!;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(body.error ?? `Falha na requisição (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/* --------------------------------- helpers -------------------------------- */

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new ApiError(traduzErro(result.error.message));
  return result.data as T;
}

function traduzErro(msg: string) {
  if (/violates foreign key/i.test(msg) && /pedidos/i.test(msg)) {
    return "Registro vinculado a um pedido.";
  }
  if (/violates foreign key/i.test(msg)) return "Registro em uso em outro cadastro.";
  return msg;
}

type IngredienteRow = {
  id: number;
  nome: string;
  unidade: string;
  custo_unitario: number | string;
  estoque_quantidade?: number | string | null;
  estoque_unidade?: string | null;
};
type ReceitaRow = {
  id: number;
  nome: string;
  preco_venda: number | string;
  itens: unknown;
  criado_em: string;
};
type ClienteRow = { id: number; nome: string; whatsapp: string };
type PedidoRow = {
  id: number;
  cliente_id: number;
  bolo_id: number | null;
  cobertura_id: number | null;
  curso_id?: number | null;
  data: string;
};

const toIngrediente = (r: IngredienteRow): Ingrediente => ({
  id: r.id,
  nome: r.nome,
  unidade: r.unidade as Unidade,
  custoUnitario: Number(r.custo_unitario),
  estoqueQuantidade: Number(r.estoque_quantidade ?? 0),
  estoqueUnidade: ((r.estoque_unidade ?? r.unidade) as Unidade),
});

const toReceita = (r: ReceitaRow): Bolo => ({
  id: r.id,
  nome: r.nome,
  precoVenda: Number(r.preco_venda),
  criadoEm: r.criado_em,
  itens: (Array.isArray(r.itens) ? r.itens : []) as Bolo["itens"],
});

const toCliente = (r: ClienteRow): Cliente => ({
  id: r.id,
  nome: r.nome,
  whatsapp: r.whatsapp,
});

const toPedido = (r: PedidoRow): Pedido => ({
  id: r.id,
  clienteId: r.cliente_id,
  boloId: r.bolo_id ?? null,
  coberturaId: r.cobertura_id,
  cursoId: r.curso_id ?? null,
  data: r.data,
});

function assertReceita(input: ReceitaInput) {
  if (input.itens.length > MAX_INGREDIENTES) {
    throw new ApiError(`Máximo de ${MAX_INGREDIENTES} ingredientes.`);
  }
  const ids = input.itens.map((i) => i.ingredienteId);
  if (new Set(ids).size !== ids.length) throw new ApiError("Ingredientes repetidos.");
}

/* ------------------------------ ingredientes ------------------------------ */

export const ingredientesApi = {
  list: async (): Promise<Ingrediente[]> => {
    if (apiBase()) return http("/ingredientes");
    const rows = check(
      await supabase.from("ingredientes").select("*").order("nome", { ascending: true }),
    );
    return (rows as unknown as IngredienteRow[]).map(toIngrediente);
  },
  create: async (input: IngredienteInput): Promise<Ingrediente> => {
    if (apiBase()) {
      return http("/ingredientes", { method: "POST", body: JSON.stringify(input) });
    }
    const row = check(
      await supabase
        .from("ingredientes")
        .insert({
          nome: input.nome,
          unidade: input.unidade,
          custo_unitario: input.custoUnitario,
          estoque_quantidade: input.estoqueQuantidade,
          estoque_unidade: input.estoqueUnidade,
        })
        .select("*")
        .single(),
    );
    return toIngrediente(row as unknown as IngredienteRow);
  },
  update: async (id: number, input: IngredienteInput): Promise<Ingrediente> => {
    if (apiBase()) {
      return http(`/ingredientes/${id}`, { method: "PUT", body: JSON.stringify(input) });
    }
    const row = check(
      await supabase
        .from("ingredientes")
        .update({
          nome: input.nome,
          unidade: input.unidade,
          custo_unitario: input.custoUnitario,
          estoque_quantidade: input.estoqueQuantidade,
          estoque_unidade: input.estoqueUnidade,
        })
        .eq("id", id)
        .select("*")
        .single(),
    );
    return toIngrediente(row as unknown as IngredienteRow);
  },
  remove: async (id: number): Promise<void> => {
    if (apiBase()) return http(`/ingredientes/${id}`, { method: "DELETE" });
    const [bolos, coberturas] = await Promise.all([bolosApi.list(), coberturasApi.list()]);
    const usado = [...bolos, ...coberturas].some((r) =>
      r.itens.some((i) => i.ingredienteId === id),
    );
    if (usado) throw new ApiError("Ingrediente em uso em um bolo ou cobertura.");
    const { error } = await supabase.from("ingredientes").delete().eq("id", id);
    if (error) throw new ApiError(traduzErro(error.message));
  },
};

/* ----------------------- bolos / coberturas / cursos ---------------------- */

function receitasApi(tabela: "bolos" | "coberturas" | "cursos") {
  const path = `/${tabela}`;
  return {
    list: async (): Promise<Bolo[]> => {
      if (apiBase()) return http(path);
      const rows = check(
        await supabase.from(tabela).select("*").order("nome", { ascending: true }),
      );
      return (rows as unknown as ReceitaRow[]).map(toReceita);
    },
    create: async (input: ReceitaInput): Promise<Bolo> => {
      if (apiBase()) return http(path, { method: "POST", body: JSON.stringify(input) });
      assertReceita(input);
      const row = check(
        await supabase
          .from(tabela)
          .insert({
            nome: input.nome,
            preco_venda: input.precoVenda,
            itens: input.itens,
          })
          .select("*")
          .single(),
      );
      return toReceita(row as unknown as ReceitaRow);
    },
    update: async (id: number, input: ReceitaInput): Promise<Bolo> => {
      if (apiBase()) {
        return http(`${path}/${id}`, { method: "PUT", body: JSON.stringify(input) });
      }
      assertReceita(input);
      const row = check(
        await supabase
          .from(tabela)
          .update({
            nome: input.nome,
            preco_venda: input.precoVenda,
            itens: input.itens,
          })
          .eq("id", id)
          .select("*")
          .single(),
      );
      return toReceita(row as unknown as ReceitaRow);
    },
    remove: async (id: number): Promise<void> => {
      if (apiBase()) return http(`${path}/${id}`, { method: "DELETE" });
      const { error } = await supabase.from(tabela).delete().eq("id", id);
      if (error) throw new ApiError(traduzErro(error.message));
    },
  };
}

export const bolosApi = receitasApi("bolos");
export const coberturasApi = receitasApi("coberturas") as {
  list: () => Promise<Cobertura[]>;
  create: (input: ReceitaInput) => Promise<Cobertura>;
  update: (id: number, input: ReceitaInput) => Promise<Cobertura>;
  remove: (id: number) => Promise<void>;
};
export const cursosApi = receitasApi("cursos") as {
  list: () => Promise<Curso[]>;
  create: (input: ReceitaInput) => Promise<Curso>;
  update: (id: number, input: ReceitaInput) => Promise<Curso>;
  remove: (id: number) => Promise<void>;
};

/* -------------------------------- clientes -------------------------------- */

export const clientesApi = {
  list: async (): Promise<Cliente[]> => {
    if (apiBase()) return http("/clientes");
    const rows = check(
      await supabase.from("clientes").select("*").order("nome", { ascending: true }),
    );
    return (rows as unknown as ClienteRow[]).map(toCliente);
  },
  create: async (input: ClienteInput): Promise<Cliente> => {
    if (apiBase()) return http("/clientes", { method: "POST", body: JSON.stringify(input) });
    const row = check(await supabase.from("clientes").insert(input).select("*").single());
    return toCliente(row as unknown as ClienteRow);
  },
  update: async (id: number, input: ClienteInput): Promise<Cliente> => {
    if (apiBase()) {
      return http(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(input) });
    }
    const row = check(
      await supabase.from("clientes").update(input).eq("id", id).select("*").single(),
    );
    return toCliente(row as unknown as ClienteRow);
  },
  remove: async (id: number): Promise<void> => {
    if (apiBase()) return http(`/clientes/${id}`, { method: "DELETE" });
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) {
      throw new ApiError(
        /violates foreign key/i.test(error.message)
          ? "Cliente possui pedidos registrados."
          : error.message,
      );
    }
  },
};

/* --------------------------------- pedidos -------------------------------- */

const pedidoPayload = (input: PedidoInput) => ({
  cliente_id: input.clienteId,
  bolo_id: input.boloId,
  cobertura_id: input.coberturaId,
  curso_id: input.cursoId,
  data: input.data,
});

export const pedidosApi = {
  list: async (): Promise<Pedido[]> => {
    if (apiBase()) return http("/pedidos");
    const rows = check(
      await supabase.from("pedidos").select("*").order("data", { ascending: false }),
    );
    return (rows as unknown as PedidoRow[]).map(toPedido);
  },
  create: async (input: PedidoInput): Promise<Pedido> => {
    if (apiBase()) return http("/pedidos", { method: "POST", body: JSON.stringify(input) });
    const row = check(
      await supabase.from("pedidos").insert(pedidoPayload(input)).select("*").single(),
    );
    return toPedido(row as unknown as PedidoRow);
  },
  update: async (id: number, input: PedidoInput): Promise<Pedido> => {
    if (apiBase()) {
      return http(`/pedidos/${id}`, { method: "PUT", body: JSON.stringify(input) });
    }
    const row = check(
      await supabase
        .from("pedidos")
        .update(pedidoPayload(input))
        .eq("id", id)
        .select("*")
        .single(),
    );
    return toPedido(row as unknown as PedidoRow);
  },
  remove: async (id: number): Promise<void> => {
    if (apiBase()) return http(`/pedidos/${id}`, { method: "DELETE" });
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) throw new ApiError(traduzErro(error.message));
  },
};

export { calcularCusto };


/* ---------------------------- outras despesas ----------------------------- */

interface DespesaRow {
  id: number;
  data: string;
  descricao: string;
  valor: number | string;
}

const toDespesa = (row: DespesaRow): Despesa => ({
  id: row.id,
  data: String(row.data).slice(0, 10),
  descricao: row.descricao,
  valor: Number(row.valor),
});

export const despesasApi = {
  list: async (): Promise<Despesa[]> => {
    if (apiBase()) return http("/despesas");
    const rows = check(
      await supabase
        .from("outras_despesas")
        .select("*")
        .order("data", { ascending: false })
        .order("id", { ascending: false }),
    );
    return (rows as unknown as DespesaRow[]).map(toDespesa);
  },
  create: async (input: DespesaInput): Promise<Despesa> => {
    if (apiBase()) return http("/despesas", { method: "POST", body: JSON.stringify(input) });
    const row = check(
      await supabase.from("outras_despesas").insert(input).select("*").single(),
    );
    return toDespesa(row as unknown as DespesaRow);
  },
  update: async (id: number, input: DespesaInput): Promise<Despesa> => {
    if (apiBase()) {
      return http(`/despesas/${id}`, { method: "PUT", body: JSON.stringify(input) });
    }
    const row = check(
      await supabase.from("outras_despesas").update(input).eq("id", id).select("*").single(),
    );
    return toDespesa(row as unknown as DespesaRow);
  },
  remove: async (id: number): Promise<void> => {
    if (apiBase()) return http(`/despesas/${id}`, { method: "DELETE" });
    const { error } = await supabase.from("outras_despesas").delete().eq("id", id);
    if (error) throw new ApiError(error.message);
  },
};

/* ----------------------- movimentações de estoque ------------------------- */

interface MovimentacaoRow {
  id: number;
  ingrediente_id: number;
  data: string;
  tipo: string;
  quantidade: number | string;
  unidade: string;
  quantidade_anterior: number | string;
  quantidade_nova: number | string;
  custo_unitario: number | string;
  valor: number | string;
  custo_reposicao: number | string;
  observacao: string | null;
}

const toMovimentacao = (r: MovimentacaoRow): MovimentacaoEstoque => ({
  id: r.id,
  ingredienteId: r.ingrediente_id,
  data: String(r.data).slice(0, 10),
  tipo: r.tipo as MovimentacaoEstoque["tipo"],
  quantidade: Number(r.quantidade),
  unidade: r.unidade as Unidade,
  quantidadeAnterior: Number(r.quantidade_anterior),
  quantidadeNova: Number(r.quantidade_nova),
  custoUnitario: Number(r.custo_unitario),
  valor: Number(r.valor),
  custoReposicao: Number(r.custo_reposicao),
  observacao: r.observacao ?? null,
});

export const movimentacoesApi = {
  list: async (): Promise<MovimentacaoEstoque[]> => {
    if (apiBase()) return http("/movimentacoes");
    const rows = check(
      await supabase
        .from("movimentacoes_estoque")
        .select("*")
        .order("data", { ascending: false })
        .order("id", { ascending: false }),
    );
    return (rows as unknown as MovimentacaoRow[]).map(toMovimentacao);
  },
  create: async (input: MovimentacaoInput): Promise<MovimentacaoEstoque> => {
    if (apiBase()) {
      return http("/movimentacoes", { method: "POST", body: JSON.stringify(input) });
    }
    const row = check(
      await supabase
        .from("movimentacoes_estoque")
        .insert({
          ingrediente_id: input.ingredienteId,
          data: input.data,
          tipo: input.tipo,
          quantidade: input.quantidade,
          unidade: input.unidade,
          quantidade_anterior: input.quantidadeAnterior,
          quantidade_nova: input.quantidadeNova,
          custo_unitario: input.custoUnitario,
          valor: input.valor,
          custo_reposicao: input.custoReposicao,
          observacao: input.observacao ?? null,
        })
        .select("*")
        .single(),
    );
    return toMovimentacao(row as unknown as MovimentacaoRow);
  },
  remove: async (id: number): Promise<void> => {
    if (apiBase()) return http(`/movimentacoes/${id}`, { method: "DELETE" });
    const { error } = await supabase.from("movimentacoes_estoque").delete().eq("id", id);
    if (error) throw new ApiError(error.message);
  },
};
