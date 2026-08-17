import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, EmptyState } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  PackageSearch,
  RefreshCcw,
} from "lucide-react";
import { brl, dataBR } from "@/lib/domain";
import { converterQuantidade, qtd } from "@/lib/estoque";
import { useIngredientes, useMovimentacoes } from "@/lib/queries";

export const Route = createFileRoute("/painel-estoque")({
  head: () => ({
    meta: [
      { title: "Painel de estoque | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Análise das movimentações de estoque da confeitaria: entradas, saídas, custo de reposição, giro por ingrediente e alertas de saldo baixo.",
      },
      { property: "og:title", content: "Painel de estoque | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Indicadores de entradas e saídas, giro de ingredientes, evolução mensal e alertas de estoque da Amor de Brigadeiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelEstoque,
});

const TODOS = "todos";

const mesLabel = (mes: string) => {
  const [ano, m] = mes.split("-");
  const rotulo = new Date(Number(ano), Number(m) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
};

function PainelEstoque() {
  const { data: movimentacoes = [], isLoading } = useMovimentacoes();
  const { data: ingredientes = [] } = useIngredientes();
  const [mes, setMes] = useState<string>(TODOS);

  const meses = useMemo(
    () => [...new Set(movimentacoes.map((m) => m.data.slice(0, 7)))].sort().reverse(),
    [movimentacoes],
  );

  const lista = useMemo(
    () => (mes === TODOS ? movimentacoes : movimentacoes.filter((m) => m.data.startsWith(mes))),
    [movimentacoes, mes],
  );

  const entradas = lista.filter((m) => m.tipo === "entrada");
  const saidas = lista.filter((m) => m.tipo === "saida");
  const valorEntradasMov = entradas.reduce((a, m) => a + m.valor, 0);
  const valorSaidas = saidas.reduce((a, m) => a + m.valor, 0);
  const custoReposicao = lista.reduce((a, m) => a + m.custoReposicao, 0);

  const ingredientePorId = useMemo(
    () => new Map(ingredientes.map((i) => [i.id, i])),
    [ingredientes],
  );

  /** Valor atual parado em estoque, na unidade de compra. */
  const valorEstoque = ingredientes.reduce(
    (acc, ing) => acc + estoqueNaUnidadeDeCompra(ing) * ing.custoUnitario,
    0,
  );

  /** Saldo anterior às movimentações do período, contado como entrada (sem duplicar). */
  const valorEstoqueInicial = ingredientes.reduce(
    (acc, ing) => acc + estoqueExistenteComoEntrada(ing, lista) * ing.custoUnitario,
    0,
  );

  /** O estoque existente é contado como entrada. */
  const valorEntradas = valorEntradasMov + valorEstoqueInicial;
  const saldoFinanceiro = valorEntradas - valorSaidas;



  const porIngrediente = useMemo(() => {
    type Linha = {
      entradaQtd: number;
      saidaQtd: number;
      valorEntrada: number;
      valorSaida: number;
      reposicao: number;
      movimentos: number;
      ultima: string;
    };
    const vazio = (data: string): Linha => ({
      entradaQtd: 0,
      saidaQtd: 0,
      valorEntrada: 0,
      valorSaida: 0,
      reposicao: 0,
      movimentos: 0,
      ultima: data,
    });
    const mapa = new Map<number, Linha>();

    /** O estoque existente entra como entrada de cada ingrediente. */
    for (const ing of ingredientes) {
      const convertido = converterQuantidade(
        ing.estoqueQuantidade,
        ing.estoqueUnidade ?? ing.unidade,
        ing.unidade,
      );
      if (!convertido || convertido <= 0) continue;
      const linha = vazio("");
      linha.entradaQtd += convertido;
      linha.valorEntrada += convertido * ing.custoUnitario;
      mapa.set(ing.id, linha);
    }

    for (const m of lista) {
      const atual = mapa.get(m.ingredienteId) ?? vazio(m.data);
      if (m.tipo === "entrada") {
        atual.entradaQtd += m.quantidade;
        atual.valorEntrada += m.valor;
      } else {
        atual.saidaQtd += m.quantidade;
        atual.valorSaida += m.valor;
      }
      atual.reposicao += m.custoReposicao;
      atual.movimentos += 1;
      if (m.data > atual.ultima) atual.ultima = m.data;
      mapa.set(m.ingredienteId, atual);
    }
    return [...mapa.entries()].map(([id, v]) => ({
      id,
      nome: ingredientePorId.get(id)?.nome ?? `#${id}`,
      unidade: ingredientePorId.get(id)?.unidade ?? "",
      ...v,
    }));
  }, [lista, ingredientes, ingredientePorId]);


  const maisConsumidos = [...porIngrediente]
    .filter((i) => i.valorSaida > 0)
    .sort((a, b) => b.valorSaida - a.valorSaida)
    .slice(0, 8);

  const maiorSaida = maisConsumidos[0]?.valorSaida ?? 0;

  const evolucao = useMemo(() => {
    const mapa = new Map<string, { entrada: number; saida: number; movimentos: number }>();
    for (const m of movimentacoes) {
      const chave = m.data.slice(0, 7);
      const atual = mapa.get(chave) ?? { entrada: 0, saida: 0, movimentos: 0 };
      if (m.tipo === "entrada") atual.entrada += m.valor;
      else atual.saida += m.valor;
      atual.movimentos += 1;
      mapa.set(chave, atual);
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  }, [movimentacoes]);

  const maiorBarra = Math.max(1, ...evolucao.map(([, v]) => Math.max(v.entrada, v.saida)));

  const semMovimento = useMemo(
    () =>
      ingredientes.filter(
        (i) => !porIngrediente.some((p) => p.id === i.id && p.movimentos > 0),
      ),
    [ingredientes, porIngrediente],
  );


  const saldoBaixo = useMemo(
    () =>
      ingredientes
        .filter((i) => i.estoqueQuantidade <= 0)
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [ingredientes],
  );

  const ultimas = useMemo(
    () => [...lista].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id).slice(0, 10),
    [lista],
  );

  return (
    <PageShell
      title="Painel de estoque"
      subtitle="Indicadores das movimentações: quanto entrou, quanto saiu, o que mais consome dinheiro e onde o saldo pede atenção."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3 panel p-4">
        <Label htmlFor="filtro-mes-estoque" className="label-caps">
          Mês de referência
        </Label>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger id="filtro-mes-estoque" className="w-full sm:w-[240px]">
            <SelectValue placeholder="Escolha o mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os meses</SelectItem>
            {meses.map((m) => (
              <SelectItem key={m} value={m}>
                {mesLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <EmptyState message="Carregando movimentações..." />
      ) : movimentacoes.length === 0 ? (
        <EmptyState message="Nenhuma movimentação registrada ainda. Ajuste o estoque na tela de Estoque ou registre pedidos para gerar baixas automáticas." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metrica rotulo="Movimentações no período" valor={String(lista.length)} />
            <Metrica
              rotulo="Entradas (valor) — inclui estoque existente"
              valor={brl(valorEntradas)}
            />
            <Metrica rotulo="Entradas registradas no período" valor={brl(valorEntradasMov)} />
            <Metrica rotulo="Saídas (valor)" valor={brl(valorSaidas)} />
            <Metrica rotulo="Saldo financeiro do período" valor={brl(saldoFinanceiro)} />
            <Metrica rotulo="Custo de reposição das baixas" valor={brl(custoReposicao)} />
            <Metrica rotulo="Valor atual em estoque" valor={brl(valorEstoque)} />
            <Metrica
              rotulo="Ingredientes movimentados"
              valor={String(porIngrediente.filter((i) => i.movimentos > 0).length)}
            />

            <Metrica rotulo="Ingredientes sem estoque" valor={String(saldoBaixo.length)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-accent" />
                    Evolução mensal (últimos 6 meses)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evolucao.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
                  ) : (
                    evolucao.map(([chave, v]) => (
                      <div key={chave} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">{mesLabel(chave)}</span>
                          <span className="text-muted-foreground">
                            {v.movimentos} mov. · entrada {brl(v.entrada)} · saída {brl(v.saida)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <Barra valor={v.entrada} maximo={maiorBarra} tom="bg-accent" />
                          <Barra valor={v.saida} maximo={maiorBarra} tom="bg-primary" />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-accent" />
                    Ingredientes que mais consomem dinheiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {maisConsumidos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma saída registrada neste período.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {maisConsumidos.map((i) => (
                        <div key={i.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold">{i.nome}</span>
                            <span className="text-muted-foreground">
                              {qtd(i.saidaQtd)} {i.unidade} · {brl(i.valorSaida)}
                            </span>
                          </div>
                          <Barra valor={i.valorSaida} maximo={maiorSaida} tom="bg-primary" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCcw className="h-5 w-5 text-accent" />
                    Giro por ingrediente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {porIngrediente.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem movimentações no período.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ingrediente</TableHead>
                            <TableHead className="text-right">Entradas</TableHead>
                            <TableHead className="text-right">Saídas</TableHead>
                            <TableHead className="text-right">Saldo (valor)</TableHead>
                            <TableHead className="text-right">Reposição</TableHead>
                            <TableHead className="text-right">Última</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...porIngrediente]
                            .sort((a, b) => b.movimentos - a.movimentos)
                            .map((i) => (
                              <TableRow key={i.id}>
                                <TableCell className="font-medium">{i.nome}</TableCell>
                                <TableCell className="text-right">
                                  {qtd(i.entradaQtd)} {i.unidade}
                                </TableCell>
                                <TableCell className="text-right">
                                  {qtd(i.saidaQtd)} {i.unidade}
                                </TableCell>
                                <TableCell className="text-right">
                                  {brl(i.valorEntrada - i.valorSaida)}
                                </TableCell>
                                <TableCell className="text-right">{brl(i.reposicao)}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {i.ultima ? dataBR(i.ultima) : "estoque inicial"}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Atenção no saldo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {saldoBaixo.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Todos os ingredientes têm saldo positivo.
                    </p>
                  ) : (
                    saldoBaixo.map((i) => (
                      <div
                        key={i.id}
                        className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-2 text-sm"
                      >
                        <span className="font-medium">{i.nome}</span>
                        <span className="text-muted-foreground">
                          {qtd(i.estoqueQuantidade)} {i.estoqueUnidade ?? i.unidade}
                        </span>
                      </div>
                    ))
                  )}
                  <Link
                    to="/estoque"
                    className="mt-2 inline-block text-sm font-semibold text-accent hover:underline"
                  >
                    Ajustar estoque
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-accent" />
                    Últimas movimentações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ultimas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nada no período escolhido.</p>
                  ) : (
                    ultimas.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-border px-4 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {ingredientePorId.get(m.ingredienteId)?.nome ?? `#${m.ingredienteId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dataBR(m.data)} ·{" "}
                            {m.tipo === "entrada" ? "Entrada" : "Saída"} {qtd(m.quantidade)}{" "}
                            {m.unidade}
                          </p>
                        </div>
                        <p className="shrink-0 font-display text-base text-primary">
                          {brl(m.valor)}
                        </p>
                      </div>
                    ))
                  )}
                  <Link
                    to="/movimentacoes"
                    className="mt-2 inline-block text-sm font-semibold text-accent hover:underline"
                  >
                    Ver histórico completo
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PackageSearch className="h-5 w-5 text-accent" />
                    Sem movimento no período
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {semMovimento.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Todos os ingredientes tiveram movimentação.
                    </p>
                  ) : (
                    semMovimento.slice(0, 12).map((i) => (
                      <div
                        key={i.id}
                        className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-2 text-sm"
                      >
                        <span className="truncate pr-3 font-medium">{i.nome}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {qtd(i.estoqueQuantidade)} {i.estoqueUnidade ?? i.unidade}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="panel p-5">
      <p className="label-caps">{rotulo}</p>
      <p className="mt-1 font-display text-2xl text-primary">{valor}</p>
    </div>
  );
}

function Barra({ valor, maximo, tom }: { valor: number; maximo: number; tom: string }) {
  const largura = maximo > 0 ? Math.max(2, Math.round((valor / maximo) * 100)) : 2;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div className={`h-full rounded-full ${tom}`} style={{ width: `${largura}%` }} />
    </div>
  );
}
