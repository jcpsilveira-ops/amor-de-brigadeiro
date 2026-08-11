/**
 * Importa os dados que ficaram salvos no dispositivo (versão antiga, localStorage)
 * para o banco compartilhado no Lovable Cloud.
 *
 * Regras:
 * - Nada é duplicado: registros com o mesmo nome já existentes na nuvem são reaproveitados.
 * - Os vínculos (ingredientes das receitas, cliente/bolo/cobertura dos pedidos)
 *   são remapeados para os novos identificadores da nuvem.
 */
import { readDB, type LocalDB } from "./local-db";
import {
  bolosApi,
  clientesApi,
  coberturasApi,
  ingredientesApi,
  pedidosApi,
} from "./api";

const KEY = "amor-de-brigadeiro:db:v1";

export interface ResumoImportacao {
  ingredientes: number;
  bolos: number;
  coberturas: number;
  clientes: number;
  pedidos: number;
}

/** Existe base local (do dispositivo) para importar? */
export function temDadosLocais(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) !== null;
}

export function contarDadosLocais(): ResumoImportacao | null {
  if (!temDadosLocais()) return null;
  const db = readDB();
  return {
    ingredientes: db.ingredientes?.length ?? 0,
    bolos: db.bolos?.length ?? 0,
    coberturas: db.coberturas?.length ?? 0,
    clientes: db.clientes?.length ?? 0,
    pedidos: db.pedidos?.length ?? 0,
  };
}

const norm = (v: string) => v.trim().toLowerCase();

export async function importarDadosLocais(): Promise<ResumoImportacao> {
  const db: LocalDB = readDB();
  const resumo: ResumoImportacao = {
    ingredientes: 0,
    bolos: 0,
    coberturas: 0,
    clientes: 0,
    pedidos: 0,
  };

  /* ------------------------------ ingredientes ------------------------------ */
  const nuvemIngredientes = await ingredientesApi.list();
  const mapaIngrediente = new Map<number, number>();
  const porNomeIng = new Map(nuvemIngredientes.map((i) => [norm(i.nome), i.id]));

  for (const ing of db.ingredientes ?? []) {
    const existente = porNomeIng.get(norm(ing.nome));
    if (existente) {
      mapaIngrediente.set(ing.id, existente);
      continue;
    }
    const criado = await ingredientesApi.create({
      nome: ing.nome,
      unidade: ing.unidade,
      custoUnitario: Number(ing.custoUnitario) || 0.01,
      estoqueQuantidade: Number(ing.estoqueQuantidade) || 0,
      estoqueUnidade: ing.estoqueUnidade ?? ing.unidade,
    });
    porNomeIng.set(norm(criado.nome), criado.id);
    mapaIngrediente.set(ing.id, criado.id);
    resumo.ingredientes += 1;
  }

  /* --------------------------- bolos e coberturas --------------------------- */
  async function importarReceitas(
    locais: LocalDB["bolos"],
    api: typeof bolosApi,
    tipo: "bolos" | "coberturas",
  ) {
    const naNuvem = await api.list();
    const porNome = new Map(naNuvem.map((r) => [norm(r.nome), r.id]));
    const mapa = new Map<number, number>();

    for (const receita of locais ?? []) {
      const existente = porNome.get(norm(receita.nome));
      if (existente) {
        mapa.set(receita.id, existente);
        continue;
      }
      const itens = (receita.itens ?? [])
        .map((item) => ({
          ingredienteId: mapaIngrediente.get(item.ingredienteId) ?? 0,
          quantidade: Number(item.quantidade) || 0,
        }))
        .filter((item) => item.ingredienteId > 0 && item.quantidade > 0);
      if (itens.length === 0) continue;

      const criado = await api.create({
        nome: receita.nome,
        precoVenda: Number(receita.precoVenda) || 0,
        itens,
      });
      porNome.set(norm(criado.nome), criado.id);
      mapa.set(receita.id, criado.id);
      resumo[tipo] += 1;
    }
    return mapa;
  }

  const mapaBolo = await importarReceitas(db.bolos, bolosApi, "bolos");
  const mapaCobertura = await importarReceitas(
    db.coberturas,
    coberturasApi as unknown as typeof bolosApi,
    "coberturas",
  );

  /* -------------------------------- clientes -------------------------------- */
  const nuvemClientes = await clientesApi.list();
  const porNomeCliente = new Map(nuvemClientes.map((c) => [norm(c.nome), c.id]));
  const mapaCliente = new Map<number, number>();

  for (const cliente of db.clientes ?? []) {
    const existente = porNomeCliente.get(norm(cliente.nome));
    if (existente) {
      mapaCliente.set(cliente.id, existente);
      continue;
    }
    const criado = await clientesApi.create({
      nome: cliente.nome,
      whatsapp: cliente.whatsapp,
    });
    porNomeCliente.set(norm(criado.nome), criado.id);
    mapaCliente.set(cliente.id, criado.id);
    resumo.clientes += 1;
  }

  /* -------------------------------- pedidos --------------------------------- */
  const nuvemPedidos = await pedidosApi.list();
  const assinaturas = new Set(
    nuvemPedidos.map((p) => `${p.clienteId}|${p.boloId}|${p.coberturaId ?? 0}|${p.data}`),
  );

  for (const pedido of db.pedidos ?? []) {
    const clienteId = mapaCliente.get(pedido.clienteId);
    const boloId = mapaBolo.get(pedido.boloId);
    const coberturaId = pedido.coberturaId
      ? mapaCobertura.get(pedido.coberturaId) ?? null
      : null;
    if (!clienteId || !boloId) continue;

    const assinatura = `${clienteId}|${boloId}|${coberturaId ?? 0}|${pedido.data}`;
    if (assinaturas.has(assinatura)) continue;

    await pedidosApi.create({ clienteId, boloId, coberturaId, data: pedido.data });
    assinaturas.add(assinatura);
    resumo.pedidos += 1;
  }

  return resumo;
}

/** Marca a base local como já enviada, para o aviso não voltar a aparecer. */
export function marcarImportacaoConcluida() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("amor-de-brigadeiro:importado", "1");
}

export function importacaoJaFeita(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem("amor-de-brigadeiro:importado") === "1";
}
