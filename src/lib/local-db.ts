/**
 * Camada de persistência local (navegador).
 *
 * No app web / preview os dados ficam no localStorage.
 * No executável Windows (Electron), o mesmo contrato é atendido pela API
 * Express + SQLite — ver src/lib/api.ts e desktop/README.
 */
import type { Bolo, Cliente, Cobertura, Ingrediente, Pedido } from "./domain";
import { hojeISO } from "./domain";

const KEY = "amor-de-brigadeiro:db:v1";

export interface LocalDB {
  ingredientes: Ingrediente[];
  bolos: Bolo[];
  coberturas: Cobertura[];
  clientes: Cliente[];
  pedidos: Pedido[];
  seq: Record<keyof Omit<LocalDB, "seq">, number>;
}

function seed(): LocalDB {
  const ingredientes: Ingrediente[] = [
    { id: 1, nome: "Leite condensado", unidade: "unidade", custoUnitario: 6.5 },
    { id: 2, nome: "Chocolate em pó", unidade: "kg", custoUnitario: 28 },
    { id: 3, nome: "Farinha de trigo", unidade: "kg", custoUnitario: 5.2 },
    { id: 4, nome: "Ovos", unidade: "unidade", custoUnitario: 0.85 },
    { id: 5, nome: "Manteiga", unidade: "kg", custoUnitario: 42 },
    { id: 6, nome: "Açúcar", unidade: "kg", custoUnitario: 4.4 },
    { id: 7, nome: "Creme de leite", unidade: "unidade", custoUnitario: 3.9 },
  ];
  const bolos: Bolo[] = [
    {
      id: 1,
      nome: "Bolo de Chocolate Clássico",
      precoVenda: 95,
      criadoEm: hojeISO(),
      itens: [
        { ingredienteId: 3, quantidade: 0.5 },
        { ingredienteId: 2, quantidade: 0.2 },
        { ingredienteId: 4, quantidade: 4 },
        { ingredienteId: 6, quantidade: 0.3 },
        { ingredienteId: 5, quantidade: 0.15 },
      ],
    },
  ];
  const coberturas: Cobertura[] = [
    {
      id: 1,
      nome: "Brigadeiro Cremoso",
      precoVenda: 35,
      criadoEm: hojeISO(),
      itens: [
        { ingredienteId: 1, quantidade: 2 },
        { ingredienteId: 2, quantidade: 0.1 },
        { ingredienteId: 7, quantidade: 1 },
      ],
    },
  ];
  const clientes: Cliente[] = [
    { id: 1, nome: "Marina Souza", whatsapp: "(11) 98888-1234" },
  ];
  const pedidos: Pedido[] = [
    { id: 1, clienteId: 1, boloId: 1, coberturaId: 1, data: hojeISO() },
  ];
  return {
    ingredientes,
    bolos,
    coberturas,
    clientes,
    pedidos,
    seq: { ingredientes: 7, bolos: 1, coberturas: 1, clientes: 1, pedidos: 1 },
  };
}

export function readDB(): LocalDB {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const fresh = seed();
      window.localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as LocalDB;
  } catch {
    return seed();
  }
}

export function writeDB(db: LocalDB) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(db));
}

export function nextId(db: LocalDB, table: keyof LocalDB["seq"]) {
  db.seq[table] = (db.seq[table] ?? 0) + 1;
  return db.seq[table];
}
