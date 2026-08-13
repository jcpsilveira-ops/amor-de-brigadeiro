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

/**
 * Dá baixa no estoque dos ingredientes usados na produção de um pedido
 * e registra uma movimentação de saída para cada ingrediente consumido.
 */
export async function registrarConsumoDoPedido(opts: {
  data: string;
  descricao: string;
  ingredientes: Ingrediente[];
  receitas: (Receita | undefined | null)[];
}) {
  const consumo = consumoDoPedido(opts.receitas);
  if (consumo.size === 0) return 0;
  const porId = new Map(opts.ingredientes.map((i) => [i.id, i]));
  let registradas = 0;

  for (const [ingredienteId, quantidadeCompra] of consumo) {
    const ing = porId.get(ingredienteId);
    if (!ing || quantidadeCompra <= 0) continue;
    const unidadeEstoque = ing.estoqueUnidade ?? ing.unidade;
    const noEstoque = converterQuantidade(quantidadeCompra, ing.unidade, unidadeEstoque);
    if (noEstoque === null) continue;

    const anterior = ing.estoqueQuantidade;
    const nova = r3(anterior - noEstoque);
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
      tipo: "saida",
      quantidade: r3(noEstoque),
      unidade: unidadeEstoque,
      quantidadeAnterior: r3(anterior),
      quantidadeNova: nova,
      custoUnitario: ing.custoUnitario,
      valor,
      custoReposicao: valor,
      observacao: opts.descricao,
    });
    registradas += 1;
  }
  return registradas;
}
