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
  useCursos,
  useDespesas,
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
          "Relatório mensal da Amor de Brigadeiro: faturamento de bolos e cursos, ingredientes consumidos, margem e evolução mês a mês, com exportação em PDF.",
      },
      { property: "og:title", content: "Relatório mensal | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Faturamento por curso, consumo de ingredientes e evolução mensal do desempenho, com exportação em PDF.",
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

const qtd = (v: number) => Number(v.toFixed(2)).toLocaleString("pt-BR");

function Relatorio() {
  const { data: ingredientes = [] } = useIngredientes();
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const { data: cursos = [] } = useCursos();
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
          const curso = cursos.find((c) => c.id === p.cursoId);
          const receita =
            (bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0) + (curso?.precoVenda ?? 0);
          const custo =
            (bolo ? calcularCusto(bolo.itens, ingredientes) : 0) +
            (cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0) +
            (curso ? calcularCusto(curso.itens, ingredientes) : 0);
          return {
            id: p.id,
            data: p.data,
            cliente: clientes.find((c) => c.id === p.clienteId)?.nome ?? "Cliente removido",
            bolo: bolo?.nome ?? "—",
            cobertura: cobertura?.nome ?? "Sem cobertura",
            curso: curso?.nome ?? "—",
            receitaCurso: curso?.precoVenda ?? 0,
            receita,
            custo,
            lucro: receita - custo,
          };
        }),
    [todosPedidos, mes, bolos, coberturas, cursos, clientes, ingredientes],
  );

  const totalReceita = linhas.reduce((acc, l) => acc + l.receita, 0);
  const totalCusto = linhas.reduce((acc, l) => acc + l.custo, 0);
  const totalCursos = linhas.reduce((acc, l) => acc + l.receitaCurso, 0);
  const { percentual } = margem(totalReceita, totalCusto);
  const ticket = linhas.length ? totalReceita / linhas.length : 0;

  /** Faturamento por curso no mês escolhido. */
  const porCurso = useMemo(() => {
    const pedidosMes = todosPedidos.filter((p) => p.data.startsWith(mes) && p.cursoId);
    return cursos
      .map((curso) => {
        const inscricoes = pedidosMes.filter((p) => p.cursoId === curso.id).length;
        const custoUnit = calcularCusto(curso.itens, ingredientes);
        const receita = inscricoes * curso.precoVenda;
        const custo = inscricoes * custoUnit;
        return { id: curso.id, nome: curso.nome, inscricoes, receita, custo, lucro: receita - custo };
      })
      .filter((c) => c.inscricoes > 0)
      .sort((a, b) => b.receita - a.receita);
  }, [todosPedidos, mes, cursos, ingredientes]);

  /** Ingredientes consumidos no mês (bolos + coberturas + cursos). */
  const porIngrediente = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const p of todosPedidos.filter((x) => x.data.startsWith(mes))) {
      const receitas = [
        bolos.find((b) => b.id === p.boloId),
        coberturas.find((c) => c.id === p.coberturaId),
        cursos.find((c) => c.id === p.cursoId),
      ];
      for (const r of receitas) {
        if (!r) continue;
        for (const item of r.itens) {
          mapa.set(item.ingredienteId, (mapa.get(item.ingredienteId) ?? 0) + item.quantidade);
        }
      }
    }
    return Array.from(mapa.entries())
      .map(([id, quantidade]) => {
        const ing = ingredientes.find((i) => i.id === id);
        const custo = (ing?.custoUnitario ?? 0) * quantidade;
        return {
          id,
          nome: ing?.nome ?? "Ingrediente removido",
          unidade: ing?.unidade ?? "",
          quantidade,
          custo,
          estoque: ing?.estoqueQuantidade ?? 0,
        };
      })
      .sort((a, b) => b.custo - a.custo);
  }, [todosPedidos, mes, bolos, coberturas, cursos, ingredientes]);

  /** Evolução mês a mês para acompanhar o desempenho ao longo do tempo. */
  const evolucao = useMemo(() => {
    const mapa = new Map<
      string,
      { pedidos: number; cursos: number; receita: number; custo: number }
    >();
    for (const p of todosPedidos) {
      const chave = p.data.slice(0, 7);
      const atual = mapa.get(chave) ?? { pedidos: 0, cursos: 0, receita: 0, custo: 0 };
      const bolo = bolos.find((b) => b.id === p.boloId);
      const cobertura = coberturas.find((c) => c.id === p.coberturaId);
      const curso = cursos.find((c) => c.id === p.cursoId);
      atual.pedidos += 1;
      atual.cursos += curso?.precoVenda ?? 0;
      atual.receita +=
        (bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0) + (curso?.precoVenda ?? 0);
      atual.custo +=
        (bolo ? calcularCusto(bolo.itens, ingredientes) : 0) +
        (cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0) +
        (curso ? calcularCusto(curso.itens, ingredientes) : 0);
      mapa.set(chave, atual);
    }
    return Array.from(mapa.entries())
      .map(([chave, v]) => ({ chave, ...v, lucro: v.receita - v.custo }))
      .sort((a, b) => b.chave.localeCompare(a.chave));
  }, [todosPedidos, bolos, coberturas, cursos, ingredientes]);

  return (
    <PageShell
      title="Relatório mensal"
      subtitle="Faturamento de bolos e cursos, ingredientes consumidos e evolução ao longo do tempo."
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Metrica rotulo="Pedidos" valor={String(linhas.length)} />
          <Metrica rotulo="Faturamento" valor={brl(totalReceita)} />
          <Metrica rotulo="Faturamento em cursos" valor={brl(totalCursos)} />
          <Metrica rotulo="Custo de produção" valor={brl(totalCusto)} />
          <Metrica rotulo="Lucro" valor={brl(totalReceita - totalCusto)} />
          <Metrica rotulo="Margem" valor={`${percentual.toFixed(1)}%`} />
        </div>

        <section className="space-y-2">
          <h3 className="font-display text-lg">Faturamento por curso — {nomeMes(mes)}</h3>
          <div className="panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead className="text-right">Inscrições</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porCurso.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma inscrição em cursos em {nomeMes(mes)}.
                    </TableCell>
                  </TableRow>
                ) : (
                  porCurso.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.nome}</TableCell>
                      <TableCell className="text-right">{c.inscricoes}</TableCell>
                      <TableCell className="text-right">{brl(c.receita)}</TableCell>
                      <TableCell className="text-right">{brl(c.custo)}</TableCell>
                      <TableCell className="text-right">{brl(c.lucro)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-lg">Ingredientes consumidos — {nomeMes(mes)}</h3>
          <div className="panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead className="text-right">Quantidade usada</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Estoque atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porIngrediente.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum ingrediente consumido em {nomeMes(mes)}.
                    </TableCell>
                  </TableRow>
                ) : (
                  porIngrediente.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-semibold">{i.nome}</TableCell>
                      <TableCell className="text-right">
                        {qtd(i.quantidade)} {i.unidade}
                      </TableCell>
                      <TableCell className="text-right">{brl(i.custo)}</TableCell>
                      <TableCell className="text-right">
                        {qtd(i.estoque)} {i.unidade}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-lg">Evolução mês a mês</h3>
          <div className="panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Cursos</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evolucao.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Sem histórico de pedidos ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  evolucao.map((m) => (
                    <TableRow key={m.chave}>
                      <TableCell className="font-semibold">{nomeMes(m.chave)}</TableCell>
                      <TableCell className="text-right">{m.pedidos}</TableCell>
                      <TableCell className="text-right">{brl(m.receita)}</TableCell>
                      <TableCell className="text-right">{brl(m.cursos)}</TableCell>
                      <TableCell className="text-right">{brl(m.custo)}</TableCell>
                      <TableCell className="text-right">{brl(m.lucro)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-lg">Pedidos de {nomeMes(mes)}</h3>
          <div className="panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Bolo</TableHead>
                  <TableHead>Cobertura</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                      <TableCell>{l.curso}</TableCell>
                      <TableCell className="text-right">{brl(l.receita)}</TableCell>
                      <TableCell className="text-right">{brl(l.custo)}</TableCell>
                      <TableCell className="text-right">{brl(l.lucro)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

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
