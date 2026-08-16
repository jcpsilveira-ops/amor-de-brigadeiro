import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowDownRight, Boxes } from "lucide-react";
import { brl, dataBR } from "@/lib/domain";
import { converterQuantidade, qtd } from "@/lib/estoque";
import { useIngredientes, useMovimentacoes } from "@/lib/queries";

/**
 * Resumo das movimentações de estoque exibido dentro do Painel Geral.
 * `mes` no formato "YYYY-MM" ou "todos".
 */
export function ResumoEstoque({ mes }: { mes: string }) {
  const { data: movimentacoes = [] } = useMovimentacoes();
  const { data: ingredientes = [] } = useIngredientes();

  const lista = useMemo(
    () => (mes === "todos" ? movimentacoes : movimentacoes.filter((m) => m.data.startsWith(mes))),
    [movimentacoes, mes],
  );

  const ingredientePorId = useMemo(
    () => new Map(ingredientes.map((i) => [i.id, i])),
    [ingredientes],
  );

  const valorEntradas = lista
    .filter((m) => m.tipo === "entrada")
    .reduce((a, m) => a + m.valor, 0);
  const valorSaidas = lista.filter((m) => m.tipo === "saida").reduce((a, m) => a + m.valor, 0);
  const custoReposicao = lista.reduce((a, m) => a + m.custoReposicao, 0);

  const valorEstoque = ingredientes.reduce((acc, ing) => {
    const convertido = converterQuantidade(
      ing.estoqueQuantidade,
      ing.estoqueUnidade ?? ing.unidade,
      ing.unidade,
    );
    return acc + (convertido ?? 0) * ing.custoUnitario;
  }, 0);

  const maisConsumidos = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const m of lista) {
      if (m.tipo !== "saida") continue;
      mapa.set(m.ingredienteId, (mapa.get(m.ingredienteId) ?? 0) + m.valor);
    }
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, valor]) => ({ id, valor, nome: ingredientePorId.get(id)?.nome ?? `#${id}` }));
  }, [lista, ingredientePorId]);

  const semEstoque = ingredientes.filter((i) => i.estoqueQuantidade <= 0);

  const ultimas = useMemo(
    () => [...lista].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id).slice(0, 5),
    [lista],
  );

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Boxes className="h-5 w-5 text-accent" />
          Painel de estoque
          <Link
            to="/painel-estoque"
            className="ml-auto text-sm font-semibold text-accent hover:underline"
          >
            Ver painel completo
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Bloco rotulo="Entradas (valor)" valor={brl(valorEntradas)} />
          <Bloco rotulo="Saídas (valor)" valor={brl(valorSaidas)} />
          <Bloco rotulo="Custo de reposição" valor={brl(custoReposicao)} />
          <Bloco rotulo="Valor atual em estoque" valor={brl(valorEstoque)} />
          <Bloco rotulo="Movimentações no período" valor={String(lista.length)} />
          <Bloco rotulo="Ingredientes sem estoque" valor={String(semEstoque.length)} />
        </div>

        {movimentacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma movimentação registrada ainda. Ajuste as quantidades em{" "}
            <Link to="/estoque" className="text-accent hover:underline">
              Estoque
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <ArrowDownRight className="h-4 w-4 text-accent" />
                Ingredientes que mais consomem dinheiro
              </p>
              {maisConsumidos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem saídas neste período.</p>
              ) : (
                <div className="space-y-2">
                  {maisConsumidos.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-2"
                    >
                      <p className="truncate pr-3 text-sm font-medium">{i.nome}</p>
                      <p className="shrink-0 font-display text-base text-primary">{brl(i.valor)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Últimas movimentações</p>
              {ultimas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nada no período escolhido.</p>
              ) : (
                <div className="space-y-2">
                  {ultimas.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {ingredientePorId.get(m.ingredienteId)?.nome ?? `#${m.ingredienteId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dataBR(m.data)} · {m.tipo === "entrada" ? "Entrada" : "Saída"}{" "}
                          {qtd(m.quantidade)} {m.unidade}
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-base text-primary">{brl(m.valor)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {semEstoque.length > 0 && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Sem saldo em estoque
            </p>
            <p className="text-sm text-muted-foreground">
              {semEstoque
                .slice(0, 8)
                .map((i) => i.nome)
                .join(", ")}
              {semEstoque.length > 8 ? ` e mais ${semEstoque.length - 8}` : ""} ·{" "}
              <Link to="/estoque" className="font-semibold text-accent hover:underline">
                Ajustar estoque
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Bloco({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="panel p-4">
      <p className="label-caps">{rotulo}</p>
      <p className="mt-1 font-display text-xl text-primary">{valor}</p>
    </div>
  );
}
