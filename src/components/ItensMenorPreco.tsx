import { brl, type Ingrediente, type ItemReceita } from "@/lib/domain";
import { qtd } from "@/lib/estoque";
import type { MenorPreco } from "@/lib/precos-mercado";

/**
 * Detalhamento por ingrediente de uma receita: quantidade, menor preço
 * unitário encontrado (estoque × supermercados), onde foi encontrado e o
 * custo do item na receita.
 */
export function ItensMenorPreco({
  itens,
  ingredientes,
  origens,
}: {
  itens: ItemReceita[];
  ingredientes: Ingrediente[];
  origens: Map<number, MenorPreco>;
}) {
  const porId = new Map(ingredientes.map((i) => [i.id, i]));

  return (
    <details className="mt-2 group">
      <summary className="cursor-pointer text-xs font-semibold text-primary hover:underline">
        Ver menor preço por ingrediente
      </summary>
      <ul className="mt-2 space-y-1">
        {itens.map((item, idx) => {
          const ing = porId.get(item.ingredienteId);
          const unitario = ing?.custoUnitario ?? 0;
          const origem = origens.get(item.ingredienteId)?.origem ?? "Estoque";
          const custoItem = Math.round(unitario * item.quantidade * 100) / 100;
          return (
            <li
              key={`${item.ingredienteId}-${idx}`}
              className="rounded-lg bg-secondary/40 px-2 py-1 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">
                  {ing?.nome ?? `Ingrediente #${item.ingredienteId}`}
                </span>
                <span className="font-semibold text-primary">{brl(custoItem)}</span>
              </div>
              <div className="text-muted-foreground">
                {qtd(item.quantidade)} {ing?.unidade ?? ""} · {brl(unitario)} por{" "}
                {ing?.unidade || "unidade"} ·{" "}
                <span className="font-semibold text-primary">{origem}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
