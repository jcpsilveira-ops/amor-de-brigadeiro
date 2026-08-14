import { hojeISO, type Ingrediente, type Receita } from "./domain";
import { converterQuantidade } from "./estoque";
import { ingredientesApi, movimentacoesApi } from "./api";

/** Soma as quantidades (na unidade de compra) consumidas pelas receitas do pedido. */
export function consumoDoPedido(receitas: (Receita | undefined | null)[]) {
  const porIngrediente = new Map<number, number>();
  for (const receita of receitas) {
    for (const item of receita?.itens ?? []) {
      porIngrediente.set(
        item.ingredienteId,
        (porIngrediente.get(item.ingredienteId) ?? 0) + item.quantidade,
      );
    }
  }
  return porIngrediente;
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r2 = (v: number) => Math.round(v * 100) / 100;

interface MovimentoOpts {
  data: string;
  descricao: string;
  /** Ignorado: o estoque é sempre relido do banco para evitar valores desatualizados. */
  ingredientes?: Ingrediente[];
  receitas: (Receita | undefined | null)[];
}

/**
 * Aplica uma movimentação de estoque (saída na produção ou entrada no estorno)
 * relendo sempre o estoque atual do banco, para não gravar quantidades
 * desatualizadas quando vários pedidos são salvos em sequência.
 */
async function aplicarMovimento(opts: MovimentoOpts, sinal: -1 | 1) {
  const consumo = consumoDoPedido(opts.receitas);
  if (consumo.size === 0) return 0;

  const atuais = await ingredientesApi.list();
  const porId = new Map(atuais.map((i) => [i.id, i]));
  let registradas = 0;

  // Na saída, garante que o estoque cobre o pedido antes de gravar qualquer coisa.
  if (sinal === -1) {
    const faltantes: string[] = [];
    for (const [ingredienteId, quantidadeCompra] of consumo) {
      const ing = porId.get(ingredienteId);
      if (!ing || quantidadeCompra <= 0) continue;
      const unidadeEstoque = ing.estoqueUnidade ?? ing.unidade;
      const noEstoque = converterQuantidade(quantidadeCompra, ing.unidade, unidadeEstoque);
      if (noEstoque === null) continue;
      if (r3(ing.estoqueQuantidade - noEstoque) < 0) {
        faltantes.push(
          `${ing.nome} (precisa ${r3(noEstoque)} ${unidadeEstoque}, tem ${r3(ing.estoqueQuantidade)})`,
        );
      }
    }
    if (faltantes.length > 0) {
      throw new Error(`Estoque insuficiente para: ${faltantes.join("; ")}`);
    }
  }

  for (const [ingredienteId, quantidadeCompra] of consumo) {
    const ing = porId.get(ingredienteId);
    if (!ing || quantidadeCompra <= 0) continue;
    const unidadeEstoque = ing.estoqueUnidade ?? ing.unidade;
    const noEstoque = converterQuantidade(quantidadeCompra, ing.unidade, unidadeEstoque);
    if (noEstoque === null) continue;

    const anterior = ing.estoqueQuantidade;
    const nova = r3(anterior + sinal * noEstoque);
    const valor = r2(quantidadeCompra * ing.custoUnitario);

    await ingredientesApi.update(ing.id, {
      nome: ing.nome,
      unidade: ing.unidade,
      custoUnitario: ing.custoUnitario,
      estoqueQuantidade: nova,
      estoqueUnidade: unidadeEstoque,
    });
    await movimentacoesApi.create({
      ingredienteId: ing.id,
      data: opts.data || hojeISO(),
      tipo: sinal === -1 ? "saida" : "entrada",
      quantidade: r3(noEstoque),
      unidade: unidadeEstoque,
      quantidadeAnterior: r3(anterior),
      quantidadeNova: nova,
      custoUnitario: ing.custoUnitario,
      valor,
      custoReposicao: sinal === -1 ? valor : 0,
      observacao: opts.descricao,
    });
    registradas += 1;
  }
  return registradas;
}

/**
 * Dá baixa no estoque dos ingredientes usados na produção de um pedido
 * e registra uma movimentação de saída para cada ingrediente consumido.
 */
export function registrarConsumoDoPedido(opts: MovimentoOpts) {
  return aplicarMovimento(opts, -1);
}

/** Devolve ao estoque o que havia sido baixado por um pedido (edição ou exclusão). */
export function estornarConsumoDoPedido(opts: MovimentoOpts) {
  return aplicarMovimento(opts, 1);
}
