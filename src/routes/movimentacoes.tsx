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
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, Printer } from "lucide-react";
import { brl, dataBR } from "@/lib/domain";
import { qtd } from "@/lib/estoque";
import { useIngredientes, useMovimentacoes } from "@/lib/queries";

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
  const [mes, setMes] = useState("todos");

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
  const totalEntradas = entradas.reduce((a, m) => a + m.valor, 0);
  const totalSaidas = saidas.reduce((a, m) => a + m.valor, 0);
  const totalReposicao = lista.reduce((a, m) => a + m.custoReposicao, 0);

  const porIngrediente = useMemo(() => {
    const mapa = new Map<
      number,
      { entrada: number; saida: number; valorEntrada: number; valorSaida: number; reposicao: number }
    >();
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
      atual.reposicao += m.custoReposicao;
      mapa.set(m.ingredienteId, atual);
    }
    return [...mapa.entries()].sort((a, b) => b[1].reposicao - a[1].reposicao);
  }, [lista]);

  return (
    <PageShell
      title="Movimentações de estoque"
      subtitle="Toda variação de estoque é registrada com data, quantidade e valor. Nas baixas, mostramos também quanto custa repor o estoque anterior."
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
          <p className="label-caps">Entradas (valor)</p>
          <p className="mt-1 font-display text-2xl text-primary">{brl(totalEntradas)}</p>
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
            <EmptyState message="Nenhuma movimentação registrada neste período. Ajuste o estoque na tela Estoque para gerar registros." />
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
                      <TableCell className="text-right font-display text-base text-primary">
                        {m.custoReposicao > 0 ? brl(m.custoReposicao) : "—"}
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
    </PageShell>
  );
}
