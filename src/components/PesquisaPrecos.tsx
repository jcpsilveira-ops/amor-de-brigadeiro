import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, Search, Trophy, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { brl, type Ingrediente } from "@/lib/domain";
import { qtd, type LinhaCesta } from "@/lib/cesta";
import { pesquisarPrecosMercados } from "@/lib/precos.functions";
import {
  compararComEstoque,
  MERCADOS,
  rankearReceitas,
  type PesquisaPrecos as Pesquisa,
} from "@/lib/precos";

const MEDALHAS = ["1º", "2º", "3º"];

export function PesquisaPrecos({
  linhas,
  ingredientes,
}: {
  linhas: LinhaCesta[];
  ingredientes: Ingrediente[];
}) {
  const pesquisar = useServerFn(pesquisarPrecosMercados);

  /** Ingredientes usados nas receitas listadas, dos mais caros para os mais baratos. */
  const usados = useMemo(() => {
    const ids = new Set(linhas.flatMap((l) => l.itens.map((i) => i.ingredienteId)));
    return ingredientes
      .filter((i) => ids.has(i.id))
      .sort((a, b) => b.custoUnitario - a.custoUnitario)
      .slice(0, 12);
  }, [linhas, ingredientes]);

  const chave = usados.map((i) => i.id).join(",");

  const { data, isFetching, refetch } = useQuery<Pesquisa>({
    queryKey: ["pesquisa-precos", chave],
    enabled: usados.length > 0,
    // Atualiza a pesquisa sempre que a Cesta da produção é aberta.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: () =>
      pesquisar({
        data: {
          ingredientes: usados.map((i) => ({
            id: i.id,
            nome: i.nome,
            unidade: i.unidade,
          })),
        },
      }),
  });

  const cotacoes = data?.cotacoes ?? [];
  const comparativo = useMemo(
    () => compararComEstoque(usados, cotacoes).filter((c) => c.melhorPreco !== null),
    [usados, cotacoes],
  );
  const rankings = useMemo(() => rankearReceitas(linhas, cotacoes), [linhas, cotacoes]);
  const comRanking = rankings.filter((r) => r.ranking.length > 0);

  const mercadosComPreco = MERCADOS.filter((m) => cotacoes.some((c) => c.mercado === m));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 font-display text-xl text-primary">
            <Search className="h-5 w-5" />
            Pesquisa de preços — Uberlândia
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Pesquisando..." : "Atualizar pesquisa"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Busca automática em Atacadão, Mart Minas, Assaí, BH, ABC, Leal e D&apos;Ville a cada
          abertura desta tela. Os valores são aproximados (encartes e lojas online) e servem
          como referência de comparação com o preço cadastrado no estoque.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {isFetching && cotacoes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Pesquisando preços nos mercados de Uberlândia...
          </p>
        ) : null}

        {data?.erro ? (
          <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {data.erro}
          </p>
        ) : null}

        {!isFetching && cotacoes.length === 0 && !data?.erro ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum preço público foi encontrado agora para estes ingredientes. Tente atualizar
            a pesquisa em alguns minutos.
          </p>
        ) : null}

        {comparativo.length > 0 ? (
          <div className="space-y-2">
            <p className="label-caps text-muted-foreground">
              Preço por ingrediente x estoque
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    {mercadosComPreco.map((m) => (
                      <TableHead key={m} className="text-right">
                        {m}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Melhor</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparativo.map((c) => (
                    <TableRow key={c.ingredienteId}>
                      <TableCell className="font-semibold">
                        {c.nome}
                        <span className="ml-1 text-xs text-muted-foreground">
                          /{c.unidade}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{brl(c.precoEstoque)}</TableCell>
                      {mercadosComPreco.map((m) => (
                        <TableCell
                          key={m}
                          className={`text-right ${
                            c.melhorMercado === m ? "font-semibold text-primary" : ""
                          }`}
                        >
                          {c.precos[m] === undefined ? "—" : brl(c.precos[m]!)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold text-primary">
                        {c.melhorMercado ?? "—"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          (c.diferenca ?? 0) < 0 ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {c.diferenca === null
                          ? "—"
                          : `${c.diferenca < 0 ? "−" : "+"}${brl(Math.abs(c.diferenca))}`}
                        {c.diferencaPercentual === null ? null : (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({c.diferencaPercentual.toFixed(0)}%)
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}

        {comRanking.length > 0 ? (
          <div className="space-y-3">
            <p className="label-caps flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4 text-primary" />
              Ranking de custo-benefício por receita
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {comRanking.map((r) => (
                <div
                  key={`${r.tipo}-${r.id}`}
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display text-lg text-primary">{r.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Custo com o estoque: {brl(r.custoEstoque)}
                    </p>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {r.ranking.slice(0, 3).map((m, i) => (
                      <li key={m.mercado} className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          {MEDALHAS[i]} {m.mercado}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {m.cobertura}/{m.totalItens} itens cotados
                          </span>
                        </span>
                        <span className="text-right">
                          {brl(m.custo)}
                          <span
                            className={`ml-2 text-xs ${
                              m.economia > 0 ? "text-primary" : "text-destructive"
                            }`}
                          >
                            {m.economia > 0 ? "economia" : "acima"} {brl(Math.abs(m.economia))}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {data?.semCotacao?.length ? (
          <p className="text-xs text-muted-foreground">
            Sem cotação pública nesta pesquisa: {data.semCotacao.join(", ")}. Para esses itens
            o ranking usa o preço cadastrado no estoque.
          </p>
        ) : null}

        {data?.atualizadoEm ? (
          <p className="text-xs text-muted-foreground">
            Pesquisa atualizada em{" "}
            {new Date(data.atualizadoEm).toLocaleString("pt-BR")} · {qtd(cotacoes.length)}{" "}
            cotações encontradas.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
