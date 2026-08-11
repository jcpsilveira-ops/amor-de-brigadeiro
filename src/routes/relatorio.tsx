import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
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
import { brl, calcularCusto, dataBR, margem } from "@/lib/domain";
import {
  useBolos,
  useClientes,
  useCoberturas,
  useIngredientes,
  usePedidos,
} from "@/lib/queries";

export const Route = createFileRoute("/relatorio")({
  head: () => ({
    meta: [
      { title: "Relatório mensal | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Relatório mensal da Amor de Brigadeiro: faturamento, custo de produção, margem e lista de pedidos do mês, com exportação em PDF.",
      },
      { property: "og:title", content: "Relatório mensal | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Consolide faturamento, custos, margem e pedidos de cada mês e exporte o relatório em PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Relatorio,
});

const chaveMes = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const nomeMes = (chave: string) => {
  const [ano, mes] = chave.split("-");
  const rotulo = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
};

function Relatorio() {
  const { data: ingredientes = [] } = useIngredientes();
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const { data: clientes = [] } = useClientes();
  const { data: todosPedidos = [] } = usePedidos();

  const [mes, setMes] = useState<string>(() => chaveMes(new Date()));

  const mesesDisponiveis = useMemo(() => {
    const set = new Set(todosPedidos.map((p) => p.data.slice(0, 7)));
    set.add(chaveMes(new Date()));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [todosPedidos]);

  const linhas = useMemo(
    () =>
      todosPedidos
        .filter((p) => p.data.startsWith(mes))
        .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
        .map((p) => {
          const bolo = bolos.find((b) => b.id === p.boloId);
          const cobertura = coberturas.find((c) => c.id === p.coberturaId);
          const receita = (bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0);
          const custo =
            (bolo ? calcularCusto(bolo.itens, ingredientes) : 0) +
            (cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0);
          return {
            id: p.id,
            data: p.data,
            cliente: clientes.find((c) => c.id === p.clienteId)?.nome ?? "Cliente removido",
            bolo: bolo?.nome ?? "—",
            cobertura: cobertura?.nome ?? "Sem cobertura",
            receita,
            custo,
            lucro: receita - custo,
          };
        }),
    [todosPedidos, mes, bolos, coberturas, clientes, ingredientes],
  );

  const totalReceita = linhas.reduce((acc, l) => acc + l.receita, 0);
  const totalCusto = linhas.reduce((acc, l) => acc + l.custo, 0);
  const { percentual } = margem(totalReceita, totalCusto);
  const ticket = linhas.length ? totalReceita / linhas.length : 0;

  return (
    <PageShell
      title="Relatório mensal"
      subtitle="Consolidado de faturamento, custos e pedidos do mês escolhido."
    >
      <div className="mb-6 flex flex-wrap items-end gap-3 panel p-4 print:hidden">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="relatorio-mes" className="label-caps">
            Mês do relatório
          </Label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger id="relatorio-mes" className="w-[240px]">
              <SelectValue placeholder="Escolha o mês" />
            </SelectTrigger>
            <SelectContent>
              {mesesDisponiveis.map((m) => (
                <SelectItem key={m} value={m}>
                  {nomeMes(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <div id="relatorio-print" className="space-y-6">
        <div className="hidden print:block">
          <h2 className="font-display text-2xl">Amor de Brigadeiro — Relatório mensal</h2>
          <p className="text-sm text-muted-foreground">{nomeMes(mes)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metrica rotulo="Pedidos" valor={String(linhas.length)} />
          <Metrica rotulo="Faturamento" valor={brl(totalReceita)} />
          <Metrica rotulo="Custo de produção" valor={brl(totalCusto)} />
          <Metrica rotulo="Lucro" valor={brl(totalReceita - totalCusto)} />
          <Metrica rotulo="Margem" valor={`${percentual.toFixed(1)}%`} />
        </div>

        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Bolo</TableHead>
                <TableHead>Cobertura</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum pedido em {nomeMes(mes)}.
                  </TableCell>
                </TableRow>
              ) : (
                linhas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{dataBR(l.data)}</TableCell>
                    <TableCell className="font-semibold">{l.cliente}</TableCell>
                    <TableCell>{l.bolo}</TableCell>
                    <TableCell>{l.cobertura}</TableCell>
                    <TableCell className="text-right">{brl(l.receita)}</TableCell>
                    <TableCell className="text-right">{brl(l.custo)}</TableCell>
                    <TableCell className="text-right">{brl(l.lucro)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          Ticket médio por pedido: {brl(ticket)}.
        </p>
      </div>
    </PageShell>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="panel p-4">
      <p className="label-caps">{rotulo}</p>
      <p className="mt-1 font-display text-xl text-primary">{valor}</p>
    </div>
  );
}
