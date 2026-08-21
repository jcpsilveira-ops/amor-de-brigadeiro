import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell, EmptyState } from "@/components/PageShell";
import { brl, calcularCusto, margem } from "@/lib/domain";
import { qtd, estoqueNaUnidadeDeCompra } from "@/lib/estoque";
import { useBolos, useCoberturas, useIngredientes } from "@/lib/queries";

export const Route = createFileRoute("/receita/$tipo/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes da receita | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Ficha completa da receita: ingredientes, quantidades, custo por item, custo total, margem e estimativa de preço de venda.",
      },
      { property: "og:title", content: "Detalhes da receita | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Veja ingredientes, quantidades, participação no custo, margem de lucro e sugestões de preço para cada bolo ou cobertura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DetalheReceita,
});

const MARGENS_ALVO = [40, 50, 60, 70];

function DetalheReceita() {
  const { tipo, id } = Route.useParams();
  const ehBolo = tipo === "bolo";
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const { data: ingredientes = [] } = useIngredientes();

  const lista = ehBolo ? bolos : coberturas;
  const receita = lista.find((r) => String(r.id) === id);

  if (!receita) {
    return (
      <PageShell title="Receita não encontrada" subtitle="Volte ao painel de receitas para escolher outra ficha.">
        <EmptyState message="Não encontramos esta receita. Ela pode ter sido excluída." />
        <div className="mt-4">
          <Link to="/painel-receitas" className="text-sm font-semibold text-primary underline">
            Voltar ao painel de receitas
          </Link>
        </div>
      </PageShell>
    );
  }

  const porId = new Map(ingredientes.map((i) => [i.id, i]));
  const custo = calcularCusto(receita.itens, ingredientes);
  const { lucro, percentual } = margem(receita.precoVenda, custo);

  const itens = receita.itens.map((item) => {
    const ing = porId.get(item.ingredienteId);
    const custoItem = ing ? Math.round(ing.custoUnitario * item.quantidade * 100) / 100 : 0;
    const disponivel = ing ? estoqueNaUnidadeDeCompra(ing) : 0;
    return {
      nome: ing?.nome ?? `Ingrediente #${item.ingredienteId}`,
      unidade: ing?.unidade ?? "",
      custoUnitario: ing?.custoUnitario ?? 0,
      quantidade: item.quantidade,
      custoItem,
      participacao: custo > 0 ? (custoItem / custo) * 100 : 0,
      disponivel,
      suficiente: disponivel >= item.quantidade,
    };
  });

  const maiorCusto = itens.reduce((a, b) => (b.custoItem > a.custoItem ? b : a), itens[0]);

  return (
    <PageShell
      title={receita.nome}
      subtitle={`${ehBolo ? "Bolo" : "Cobertura"} · ${receita.itens.length} ingrediente(s) na ficha técnica`}
    >
      <div className="mb-6">
        <Link
          to="/painel-receitas"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao painel de receitas
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="label-caps text-muted-foreground">Custo de produção</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl text-primary">{brl(custo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="label-caps text-muted-foreground">Preço de venda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl text-primary">{brl(receita.precoVenda)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="label-caps text-muted-foreground">Lucro por unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl text-primary">{brl(lucro)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="label-caps text-muted-foreground">Margem</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`font-display text-2xl ${percentual < 0 ? "text-destructive" : "text-primary"}`}
            >
              {percentual.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-lg text-primary">Ingredientes e quantidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {itens.map((item, idx) => (
            <div
              key={`${item.nome}-${idx}`}
              className="rounded-lg bg-secondary/40 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{item.nome}</span>
                <span className="font-semibold text-primary">{brl(item.custoItem)}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {qtd(item.quantidade)} {item.unidade}
                </span>
                <span>{brl(item.custoUnitario)} por {item.unidade || "unidade"}</span>
                <span>{item.participacao.toFixed(1)}% do custo</span>
                <span className={item.suficiente ? "" : "font-semibold text-destructive"}>
                  Estoque: {qtd(item.disponivel)} {item.unidade}
                  {item.suficiente ? "" : " (insuficiente)"}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Custo total da receita</span>
            <span className="text-primary">{brl(custo)}</span>
          </div>
          {maiorCusto ? (
            <p className="text-xs text-muted-foreground">
              Ingrediente de maior peso: {maiorCusto.nome} ({maiorCusto.participacao.toFixed(1)}% do custo).
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display text-lg text-primary">Estimativa de preço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MARGENS_ALVO.map((alvo) => {
            const sugerido = Math.round((custo / (1 - alvo / 100)) * 100) / 100;
            return (
              <div key={alvo} className="flex items-center justify-between gap-3 text-sm">
                <span>Margem de {alvo}%</span>
                <span className="font-semibold text-primary">
                  {brl(sugerido)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    lucro de {brl(Math.round((sugerido - custo) * 100) / 100)}
                  </span>
                </span>
              </div>
            );
          })}
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Preço sugerido = custo de produção ÷ (1 − margem desejada). Compare com o preço atual de{" "}
            {brl(receita.precoVenda)} para decidir reajustes.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
