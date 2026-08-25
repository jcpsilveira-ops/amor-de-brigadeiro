import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hapticTap } from "@/hooks/use-mobile-shell";
import { Cake, Layers, Percent, Wheat } from "lucide-react";

import { brl, calcularCusto, margem, type Ingrediente, type Receita } from "@/lib/domain";
import { useBolos, useCoberturas, useIngredientes } from "@/lib/queries";
import { type MenorPreco } from "@/lib/precos-mercado";

type LinhaReceita = {
  id: number;
  nome: string;
  tipo: "Bolo" | "Cobertura";
  precoVenda: number;
  custo: number;
  lucro: number;
  percentual: number;
  itens: { nome: string; quantidade: number; unidade: string; custo: number; origem: string }[];
};

function montarLinhas(
  receitas: Receita[],
  tipo: "Bolo" | "Cobertura",
  ingredientes: Ingrediente[],
  origens: Map<number, MenorPreco>,
): LinhaReceita[] {
  const porId = new Map(ingredientes.map((i) => [i.id, i]));
  return receitas.map((r) => {
    const custo = calcularCusto(r.itens, ingredientes);
    const { lucro, percentual } = margem(r.precoVenda, custo);
    return {
      id: r.id,
      nome: r.nome,
      tipo,
      precoVenda: r.precoVenda,
      custo,
      lucro,
      percentual,
      itens: r.itens.map((item) => {
        const ing = porId.get(item.ingredienteId);
        return {
          nome: ing?.nome ?? `Ingrediente #${item.ingredienteId}`,
          quantidade: item.quantidade,
          unidade: ing?.unidade ?? "",
          custo: ing ? Math.round(ing.custoUnitario * item.quantidade * 100) / 100 : 0,
          origem: origens.get(item.ingredienteId)?.origem ?? "Estoque",
        };
      }),
    };
  });
}

const Kpi = ({
  titulo,
  valor,
  detalhe,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  icone: typeof Cake;
}) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
      <CardTitle className="label-caps text-muted-foreground">{titulo}</CardTitle>
      <Icone className="h-4 w-4 text-primary" />
    </CardHeader>
    <CardContent>
      <p className="font-display text-2xl text-primary">{valor}</p>
      {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
    </CardContent>
  </Card>
);

/** Painel analítico das receitas (bolos e coberturas): custo, preço e margem. */
export function ResumoReceitas({ tipoFiltro = "todos" }: { tipoFiltro?: "todos" | "bolos" | "coberturas" }) {
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const { data: ingredientes = [] } = useIngredientes();

  // No Painel de receitas o custo usa o custo unitário cadastrado no Estoque.
  const origens = useMemo(() => new Map<number, MenorPreco>(), []);

  const linhas = useMemo(() => {
    const todas = [
      ...montarLinhas(bolos, "Bolo", ingredientes, origens),
      ...montarLinhas(coberturas, "Cobertura", ingredientes, origens),
    ];
    const filtradas =
      tipoFiltro === "bolos"
        ? todas.filter((l) => l.tipo === "Bolo")
        : tipoFiltro === "coberturas"
          ? todas.filter((l) => l.tipo === "Cobertura")
          : todas;
    return filtradas.sort((a, b) => b.percentual - a.percentual);
  }, [bolos, coberturas, ingredientes, origens, tipoFiltro]);

  const custoMedio = linhas.length
    ? linhas.reduce((a, l) => a + l.custo, 0) / linhas.length
    : 0;
  const margemMedia = linhas.length
    ? linhas.reduce((a, l) => a + l.percentual, 0) / linhas.length
    : 0;

  const ingredientesMaisUsados = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const l of linhas) {
      for (const item of l.itens) {
        mapa.set(item.nome, (mapa.get(item.nome) ?? 0) + item.custo);
      }
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [linhas]);

  const melhores = linhas.slice(0, 5);
  const piores = [...linhas].reverse().slice(0, 5);

  if (!linhas.length) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Cadastre bolos e coberturas para ver as receitas aqui.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Bolos cadastrados" valor={String(bolos.length)} icone={Cake} />
        <Kpi titulo="Coberturas cadastradas" valor={String(coberturas.length)} icone={Layers} />
        <Kpi
          titulo="Custo médio por receita"
          valor={brl(Math.round(custoMedio * 100) / 100)}
          detalhe={`${linhas.length} receitas consideradas`}
          icone={Wheat}
        />
        <Kpi
          titulo="Margem média"
          valor={`${margemMedia.toFixed(1)}%`}
          detalhe="Preço de venda x custo de produção"
          icone={Percent}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg text-primary">Melhores margens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {melhores.map((l) => (
              <div key={`${l.tipo}-${l.id}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">
                  {l.nome} <span className="text-xs text-muted-foreground">({l.tipo})</span>
                </span>
                <span className="font-semibold text-primary">{l.percentual.toFixed(1)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg text-primary">Margens mais baixas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {piores.map((l) => (
              <div key={`${l.tipo}-${l.id}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">
                  {l.nome} <span className="text-xs text-muted-foreground">({l.tipo})</span>
                </span>
                <span className="font-semibold text-destructive">{l.percentual.toFixed(1)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg text-primary">
            Ingredientes com maior peso no custo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ingredientesMaisUsados.map(([nome, valor]) => (
            <div key={nome} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{nome}</span>
              <span className="font-semibold text-primary">{brl(valor)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {linhas.map((l) => (
          <Card key={`${l.tipo}-${l.id}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 font-display text-lg text-primary">
                <Link
                  to="/receita/$tipo/$id"
                  params={{ tipo: l.tipo === "Bolo" ? "bolo" : "cobertura", id: String(l.id) }}
                  onClick={() => hapticTap()}
                  className="hover:underline"
                >
                  {l.nome}
                  <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                    {l.tipo}
                  </span>
                </Link>
                <span className="text-sm font-semibold text-muted-foreground">
                  Custo {brl(l.custo)} · Venda {brl(l.precoVenda)} · Lucro {brl(l.lucro)} (
                  {l.percentual.toFixed(1)}%)
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {l.itens.map((item, idx) => (
                  <li
                    key={`${item.nome}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate">
                      {item.nome}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {item.quantidade} {item.unidade} · valor do Estoque
                      </span>
                    </span>
                    <span className="font-semibold">{brl(item.custo)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
