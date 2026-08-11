/**
 * Cliente de dados único para toda a aplicação.
 *
 * - No executável Windows, `window.AMOR_API_BASE` é injetado pelo Electron e
 *   as chamadas vão para a API Express (Node + SQLite).
 * - No navegador/preview, usa a persistência local (localStorage).
 *
 * As telas nunca conversam com o armazenamento diretamente — sempre por aqui.
 */
import {
  MAX_INGREDIENTES,
  calcularCusto,
  hojeISO,
  type Bolo,
  type Cliente,
  type Cobertura,
  type Ingrediente,
  type IngredienteInput,
  type ClienteInput,
  type Pedido,
  type PedidoInput,
  type ReceitaInput,
} from "./domain";
import { nextId, readDB, writeDB, type LocalDB } from "./local-db";

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

/* ---------------------------- helpers locais ---------------------------- */

function mutate<T>(fn: (db: LocalDB) => T): T {
  const db = readDB();
  const result = fn(db);
  writeDB(db);
  return result;
}

function assertReceita(db: LocalDB, input: ReceitaInput) {
  if (input.itens.length > MAX_INGREDIENTES) {
    throw new ApiError(`Máximo de ${MAX_INGREDIENTES} ingredientes.`);
  }
  const ids = input.itens.map((i) => i.ingredienteId);
  if (new Set(ids).size !== ids.length) throw new ApiError("Ingredientes repetidos.");
  for (const id of ids) {
    if (!db.ingredientes.some((i) => i.id === id)) {
      throw new ApiError("Ingrediente inexistente.");
    }
  }
}

/* ------------------------------ ingredientes ------------------------------ */

export const ingredientesApi = {
  list: async (): Promise<Ingrediente[]> =>
    apiBase() ? http("/ingredientes") : readDB().ingredientes,
  create: async (input: IngredienteInput): Promise<Ingrediente> =>
    apiBase()
      ? http("/ingredientes", { method: "POST", body: JSON.stringify(input) })
      : mutate((db) => {
          const item: Ingrediente = { id: nextId(db, "ingredientes"), ...input };
          db.ingredientes.push(item);
          return item;
        }),
  update: async (id: number, input: IngredienteInput): Promise<Ingrediente> =>
    apiBase()
      ? http(`/ingredientes/${id}`, { method: "PUT", body: JSON.stringify(input) })
      : mutate((db) => {
          const idx = db.ingredientes.findIndex((i) => i.id === id);
          if (idx < 0) throw new ApiError("Ingrediente não encontrado.");
          db.ingredientes[idx] = { id, ...input };
          return db.ingredientes[idx];
        }),
  remove: async (id: number): Promise<void> => {
    if (apiBase()) return http(`/ingredientes/${id}`, { method: "DELETE" });
    mutate((db) => {
      const usado = [...db.bolos, ...db.coberturas].some((r) =>
        r.itens.some((i) => i.ingredienteId === id),
      );
      if (usado) throw new ApiError("Ingrediente em uso em um bolo ou cobertura.");
      db.ingredientes = db.ingredientes.filter((i) => i.id !== id);
    });
  },
};

/* --------------------------- bolos / coberturas --------------------------- */

function receitasApi(tabela: "bolos" | "coberturas") {
  const path = `/${tabela}`;
  return {
    list: async (): Promise<Bolo[]> => (apiBase() ? http(path) : readDB()[tabela]),
    create: async (input: ReceitaInput): Promise<Bolo> =>
      apiBase()
        ? http(path, { method: "POST", body: JSON.stringify(input) })
        : mutate((db) => {
            assertReceita(db, input);
            const item: Bolo = {
              id: nextId(db, tabela),
              nome: input.nome,
              precoVenda: input.precoVenda,
              criadoEm: hojeISO(),
              itens: input.itens,
            };
            db[tabela].push(item);
            return item;
          }),
    update: async (id: number, input: ReceitaInput): Promise<Bolo> =>
      apiBase()
        ? http(`${path}/${id}`, { method: "PUT", body: JSON.stringify(input) })
        : mutate((db) => {
            assertReceita(db, input);
            const atual = db[tabela].find((r) => r.id === id);
            if (!atual) throw new ApiError("Registro não encontrado.");
            Object.assign(atual, {
              nome: input.nome,
              precoVenda: input.precoVenda,
              itens: input.itens,
            });
            return atual;
          }),
    remove: async (id: number): Promise<void> => {
      if (apiBase()) return http(`${path}/${id}`, { method: "DELETE" });
      mutate((db) => {
        const emPedido = db.pedidos.some((p) =>
          tabela === "bolos" ? p.boloId === id : p.coberturaId === id,
        );
        if (emPedido) throw new ApiError("Registro vinculado a um pedido.");
        db[tabela] = db[tabela].filter((r) => r.id !== id);
      });
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

/* -------------------------------- clientes -------------------------------- */

export const clientesApi = {
  list: async (): Promise<Cliente[]> => (apiBase() ? http("/clientes") : readDB().clientes),
  create: async (input: ClienteInput): Promise<Cliente> =>
    apiBase()
      ? http("/clientes", { method: "POST", body: JSON.stringify(input) })
      : mutate((db) => {
          const item: Cliente = { id: nextId(db, "clientes"), ...input };
          db.clientes.push(item);
          return item;
        }),
  update: async (id: number, input: ClienteInput): Promise<Cliente> =>
    apiBase()
      ? http(`/clientes/${id}`, { method: "PUT", body: JSON.stringify(input) })
      : mutate((db) => {
          const idx = db.clientes.findIndex((c) => c.id === id);
          if (idx < 0) throw new ApiError("Cliente não encontrado.");
          db.clientes[idx] = { id, ...input };
          return db.clientes[idx];
        }),
  remove: async (id: number): Promise<void> => {
    if (apiBase()) return http(`/clientes/${id}`, { method: "DELETE" });
    mutate((db) => {
      if (db.pedidos.some((p) => p.clienteId === id)) {
        throw new ApiError("Cliente possui pedidos registrados.");
      }
      db.clientes = db.clientes.filter((c) => c.id !== id);
    });
  },
};

/* --------------------------------- pedidos -------------------------------- */

export const pedidosApi = {
  list: async (): Promise<Pedido[]> => (apiBase() ? http("/pedidos") : readDB().pedidos),
  create: async (input: PedidoInput): Promise<Pedido> =>
    apiBase()
      ? http("/pedidos", { method: "POST", body: JSON.stringify(input) })
      : mutate((db) => {
          const item: Pedido = { id: nextId(db, "pedidos"), ...input };
          db.pedidos.push(item);
          return item;
        }),
  update: async (id: number, input: PedidoInput): Promise<Pedido> =>
    apiBase()
      ? http(`/pedidos/${id}`, { method: "PUT", body: JSON.stringify(input) })
      : mutate((db) => {
          const idx = db.pedidos.findIndex((p) => p.id === id);
          if (idx < 0) throw new ApiError("Pedido não encontrado.");
          db.pedidos[idx] = { id, ...input };
          return db.pedidos[idx];
        }),
  remove: async (id: number): Promise<void> => {
    if (apiBase()) return http(`/pedidos/${id}`, { method: "DELETE" });
    mutate((db) => {
      db.pedidos = db.pedidos.filter((p) => p.id !== id);
    });
  },
};

export { calcularCusto };
