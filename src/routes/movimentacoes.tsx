import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyState } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, Printer } from "lucide-react";
import { brl, dataBR, type MovimentacaoEstoque } from "@/lib/domain";
import { converterQuantidade, qtd } from "@/lib/estoque";
import {
  useBolos,
  useClientes,
  useCoberturas,
  useCursos,
  useIngredientes,
  useMovimentacoes,
  usePedidos,
} from "@/lib/queries";

export const Route = createFileRoute("/movimentacoes")({
  head: () => ({
    meta: [
      { title: "Movimentações de estoque | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Histórico das variações de estoque da confeitaria: data, ingrediente, quantidade, valor e custo de reposição em caso de baixa.",
      },
      { property: "og:title", content: "Movimentações de estoque | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Relatório de entradas e saídas de ingredientes com valor movimentado e custo de reposição.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MovimentacoesPage,
});

const mesLabel = (mes: string) => {
  const [ano, m] = mes.split("-");
  const d = new Date(Number(ano), Number(m) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

function MovimentacoesPage() {
  const { data: movimentacoes = [], isLoading } = useMovimentacoes();
  const { data: ingredientes = [] } = useIngredientes();
  const { data: pedidos = [] } = usePedidos();
  const { data: clientes = [] } = useClientes();
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const { data: cursos = [] } = useCursos();
  const [mes, setMes] = useState("todos");
  const [detalhe, setDetalhe] = useState<MovimentacaoEstoque | null>(null);

  const ingredientePorId = useMemo(
    () => new Map(ingredientes.map((i) => [i.id, i])),
    [ingredientes],
  );

  /**
   * Custo de reposição = quantidade da baixa (convertida para a unidade de compra)
   * x custo unitário atual do ingrediente. Entradas não geram reposição.
   */
  const reposicaoDaMov = (m: MovimentacaoEstoque) => {
    if (m.tipo !== "saida") return 0;
    const ing = ingredientePorId.get(m.ingredienteId);
    if (!ing) return m.custoReposicao;
    const naCompra = converterQuantidade(m.quantidade, m.unidade, ing.unidade) ?? m.quantidade;
    return Math.round(naCompra * ing.custoUnitario * 100) / 100;
  };

  const nomePorId = useMemo(
    () => new Map(ingredientes.map((i) => [i.id, i.nome])),
    [ingredientes],
  );

  const meses = useMemo(
    () => [...new Set(movimentacoes.map((m) => m.data.slice(0, 7)))].sort().reverse(),
    [movimentacoes],
  );

  const lista = useMemo(
    () => (mes === "todos" ? movimentacoes : movimentacoes.filter((m) => m.data.startsWith(mes))),
    [movimentacoes, mes],
  );

  const entradas = lista.filter((m) => m.tipo === "entrada");
  const saidas = lista.filter((m) => m.tipo === "saida");
  const totalEntradasRegistradas = entradas.reduce((a, m) => a + m.valor, 0);
  const totalSaidas = saidas.reduce((a, m) => a + m.valor, 0);
  const totalReposicao = lista.reduce((a, m) => a + reposicaoDaMov(m), 0);

  /** Saldo anterior às movimentações do período (não duplica entradas registradas). */
  const valorEstoqueExistente = useMemo(
    () =>
      ingredientes.reduce(
        (acc, ing) => acc + estoqueExistenteComoEntrada(ing, lista) * ing.custoUnitario,
        0,
      ),
    [ingredientes, lista],
  );
  const totalEntradas = totalEntradasRegistradas + valorEstoqueExistente;


  const porIngrediente = useMemo(() => {
    const mapa = new Map<
      number,
      { entrada: number; saida: number; valorEntrada: number; valorSaida: number; reposicao: number }
    >();
    /** O estoque existente entra como entrada de cada ingrediente. */
    for (const ing of ingredientes) {
      const q = estoqueNaUnidade(ing);
      if (q <= 0) continue;
      mapa.set(ing.id, {
        entrada: q,
        saida: 0,
        valorEntrada: q * ing.custoUnitario,
        valorSaida: 0,
        reposicao: 0,
      });
    }
    for (const m of lista) {
      const atual =
        mapa.get(m.ingredienteId) ??
        { entrada: 0, saida: 0, valorEntrada: 0, valorSaida: 0, reposicao: 0 };
      if (m.tipo === "entrada") {
        atual.entrada += m.quantidade;
        atual.valorEntrada += m.valor;
      } else {
        atual.saida += m.quantidade;
        atual.valorSaida += m.valor;
      }
      atual.reposicao += reposicaoDaMov(m);
      mapa.set(m.ingredienteId, atual);
    }
    return [...mapa.entries()].sort(
      (a, b) => b[1].reposicao - a[1].reposicao || b[1].valorEntrada - a[1].valorEntrada,
    );
  }, [lista, ingredientes]);

  const pedidoDoDetalhe = useMemo(() => {
    const id = Number(detalhe?.observacao?.match(/#(\d+)/)?.[1]);
    return Number.isFinite(id) ? pedidos.find((p) => p.id === id) ?? null : null;
  }, [detalhe, pedidos]);

  const boloDoDetalhe = pedidoDoDetalhe
    ? bolos.find((b) => b.id === pedidoDoDetalhe.boloId) ?? null
    : null;
  const coberturaDoDetalhe = pedidoDoDetalhe
    ? coberturas.find((c) => c.id === pedidoDoDetalhe.coberturaId) ?? null
    : null;

  const itensDoDetalhe = useMemo(() => {
    const porId = new Map(ingredientes.map((i) => [i.id, i]));
    const linhas: {
      ingredienteId: number;
      nome: string;
      receita: string;
      quantidade: number;
      unidade: string;
      custo: number;
    }[] = [];
    for (const receita of [boloDoDetalhe, coberturaDoDetalhe]) {
      for (const item of receita?.itens ?? []) {
        const ing = porId.get(item.ingredienteId);
        linhas.push({
          ingredienteId: item.ingredienteId,
          nome: ing?.nome ?? `#${item.ingredienteId}`,
          receita: receita?.nome ?? "—",
          quantidade: item.quantidade,
          unidade: ing?.unidade ?? "",
          custo: Math.round((ing?.custoUnitario ?? 0) * item.quantidade * 100) / 100,
        });
      }
    }
    return linhas;
  }, [boloDoDetalhe, coberturaDoDetalhe, ingredientes]);

  const totalDoDetalhe = itensDoDetalhe.reduce((a, i) => a + i.custo, 0);

  return (
    <PageShell
      title="Movimentações de estoque"
      subtitle="Toda variação de estoque é registrada com data, quantidade e valor. O custo de reposição vem das baixas: quantidade baixada × custo unitário atual do ingrediente."
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <p className="label-caps mb-1">Período</p>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-[240px]" aria-label="Selecionar mês">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              {meses.map((m) => (
                <SelectItem key={m} value={m}>
                  {mesLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5">
          <p className="label-caps">Movimentações</p>
          <p className="mt-1 font-display text-2xl text-primary">{lista.length}</p>
        </div>
        <div className="panel p-5">
          <p className="label-caps">Entradas (inclui estoque existente)</p>
          <p className="mt-1 font-display text-2xl text-primary">{brl(totalEntradas)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Registradas {brl(totalEntradasRegistradas)} + estoque existente{" "}
            {brl(valorEstoqueExistente)}
          </p>
        </div>
        <div className="panel p-5">
          <p className="label-caps">Baixas (valor)</p>
          <p className="mt-1 font-display text-2xl text-primary">{brl(totalSaidas)}</p>
        </div>
        <div className="panel p-5">
          <p className="label-caps">Custo de reposição</p>
          <p className="mt-1 font-display text-2xl text-primary">{brl(totalReposicao)}</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-accent" />
            Histórico de variações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando movimentações…</p>
          ) : lista.length === 0 ? (
            <EmptyState message="Nenhuma movimentação registrada neste período. Ajuste o estoque na tela Estoque ou registre um pedido para gerar registros." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Variação</TableHead>
                    <TableHead>Antes → depois</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Custo de reposição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{dataBR(m.data)}</TableCell>
                      <TableCell className="font-semibold">
                        {nomePorId.get(m.ingredienteId) ?? `#${m.ingredienteId}`}
                      </TableCell>
                      <TableCell>
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                            m.tipo === "entrada"
                              ? "bg-accent/15 text-accent-foreground"
                              : "bg-destructive/10 text-destructive",
                          ].join(" ")}
                        >
                          {m.tipo === "entrada" ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {m.tipo === "entrada" ? "entrada" : "baixa"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {m.tipo === "entrada" ? "+" : "−"}
                        {qtd(m.quantidade)} {m.unidade}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {qtd(m.quantidadeAnterior)} → {qtd(m.quantidadeNova)} {m.unidade}
                      </TableCell>
                      <TableCell className="text-right">{brl(m.valor)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.observacao ? (
                          <button
                            type="button"
                            className="text-left font-medium text-primary underline decoration-dotted underline-offset-4 hover:text-accent print:no-underline print:text-inherit"
                            onClick={() => setDetalhe(m)}
                          >
                            {m.observacao}
                          </button>
                        ) : (
                          "Ajuste manual"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-display text-base text-primary">
                        {reposicaoDaMov(m) > 0 ? brl(reposicaoDaMov(m)) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {porIngrediente.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo por ingrediente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Baixas</TableHead>
                    <TableHead className="text-right">Valor entradas</TableHead>
                    <TableHead className="text-right">Valor baixas</TableHead>
                    <TableHead className="text-right">Custo de reposição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porIngrediente.map(([id, r]) => (
                    <TableRow key={id}>
                      <TableCell className="font-semibold">
                        {nomePorId.get(id) ?? `#${id}`}
                      </TableCell>
                      <TableCell className="text-right">{qtd(r.entrada)}</TableCell>
                      <TableCell className="text-right">{qtd(r.saida)}</TableCell>
                      <TableCell className="text-right">{brl(r.valorEntrada)}</TableCell>
                      <TableCell className="text-right">{brl(r.valorSaida)}</TableCell>
                      <TableCell className="text-right font-display text-base text-primary">
                        {brl(r.reposicao)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!detalhe} onOpenChange={(aberto) => !aberto && setDetalhe(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {pedidoDoDetalhe ? `Pedido #${pedidoDoDetalhe.id}` : "Detalhe da movimentação"}
            </DialogTitle>
            <DialogDescription>
              {detalhe ? `${detalhe.observacao ?? ""} • ${dataBR(detalhe.data)}` : ""}
            </DialogDescription>
          </DialogHeader>

          {pedidoDoDetalhe ? (
            <div className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="panel p-4">
                  <dt className="label-caps">Cliente</dt>
                  <dd className="mt-1 font-semibold">
                    {clientes.find((c) => c.id === pedidoDoDetalhe.clienteId)?.nome ?? "—"}
                  </dd>
                </div>
                <div className="panel p-4">
                  <dt className="label-caps">Data do pedido</dt>
                  <dd className="mt-1 font-semibold">{dataBR(pedidoDoDetalhe.data)}</dd>
                </div>
                <div className="panel p-4">
                  <dt className="label-caps">Bolo</dt>
                  <dd className="mt-1 font-semibold">{boloDoDetalhe?.nome ?? "Sem bolo"}</dd>
                </div>
                <div className="panel p-4">
                  <dt className="label-caps">Cobertura</dt>
                  <dd className="mt-1 font-semibold">
                    {coberturaDoDetalhe?.nome ?? "Sem cobertura"}
                  </dd>
                </div>
                {pedidoDoDetalhe.cursoId && (
                  <div className="panel p-4 sm:col-span-2">
                    <dt className="label-caps">Curso</dt>
                    <dd className="mt-1 font-semibold">
                      {cursos.find((c) => c.id === pedidoDoDetalhe.cursoId)?.nome ?? "—"}
                    </dd>
                  </div>
                )}
              </dl>

              <div>
                <p className="label-caps mb-2">Ingredientes consumidos na produção</p>
                {itensDoDetalhe.length === 0 ? (
                  <EmptyState message="Este pedido não tem receita com ingredientes." />
                ) : (
                  <div className="max-h-[40vh] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead>Origem</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Custo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itensDoDetalhe.map((item) => (
                          <TableRow key={`${item.receita}-${item.ingredienteId}`}>
                            <TableCell className="font-semibold">{item.nome}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.receita}
                            </TableCell>
                            <TableCell className="text-right">
                              {qtd(item.quantidade)} {item.unidade}
                            </TableCell>
                            <TableCell className="text-right">{brl(item.custo)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <p className="mt-3 text-right font-display text-lg text-primary">
                  Custo total: {brl(totalDoDetalhe)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Esta movimentação é um ajuste manual de estoque, sem pedido vinculado.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

