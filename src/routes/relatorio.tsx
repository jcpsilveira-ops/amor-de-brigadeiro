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

const TODOS = "todos";

const nomeMes = (chave: string) => {
  if (chave === TODOS) return "Todos os meses";
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
  const { data: todasDespesas = [] } = useDespesas();

  const [mes, setMes] = useState<string>(() => chaveMes(new Date()));

  /** Mesma regra do painel: meses vindos de pedidos e de despesas. */
  const mesesDisponiveis = useMemo(() => {
    const set = new Set([
      ...todosPedidos.map((p) => p.data.slice(0, 7)),
      ...todasDespesas.map((d) => d.data.slice(0, 7)),
    ]);
    set.add(chaveMes(new Date()));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [todosPedidos, todasDespesas]);

  const noMes = (data: string) => mes === TODOS || data.startsWith(mes);

  const linhas = useMemo(
    () =>
      todosPedidos
        .filter((p) => noMes(p.data))
        .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
        .map((p) => {
          const bolo = bolos.find((b) => b.id === p.boloId);
          const cobertura = coberturas.find((c) => c.id === p.coberturaId);
          const curso = cursos.find((c) => c.id === p.cursoId);
          const receita =
            (bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0) + (curso?.precoVenda ?? 0);
          const custoBolo = bolo ? calcularCusto(bolo.itens, ingredientes) : 0;
          const custoCobertura = cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0;
          const custoCurso = curso ? calcularCusto(curso.itens, ingredientes) : 0;
          const custo = custoBolo + custoCobertura + custoCurso;
          return {
            id: p.id,
            data: p.data,
            cliente: clientes.find((c) => c.id === p.clienteId)?.nome ?? "Cliente removido",
            bolo: bolo?.nome ?? "Sem bolo",
            cobertura: cobertura?.nome ?? "Sem cobertura",
            curso: curso?.nome ?? "—",
            receitaBolos: (bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0),
            receitaCurso: curso?.precoVenda ?? 0,
            custoBolo,
            custoCobertura,
            custoCurso,
            receita,
            custo,
            lucro: receita - custo,
          };
        }),
    [todosPedidos, mes, bolos, coberturas, cursos, clientes, ingredientes],
  );

  const despesas = useMemo(
    () => todasDespesas.filter((d) => noMes(d.data)),
    [todasDespesas, mes],
  );

  /** Mesmos cálculos do painel geral, para não haver divergência entre as telas. */
  const receitaBolos = linhas.reduce((acc, l) => acc + l.receitaBolos, 0);
  const receitaCursos = linhas.reduce((acc, l) => acc + l.receitaCurso, 0);
  const totalReceita = receitaBolos + receitaCursos;
  const custoBolos = linhas.reduce((acc, l) => acc + l.custoBolo, 0);
  const custoCoberturas = linhas.reduce((acc, l) => acc + l.custoCobertura, 0);
  const custoCursos = linhas.reduce((acc, l) => acc + l.custoCurso, 0);
  const totalCusto = custoBolos + custoCoberturas + custoCursos;
  const totalOutrasDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const lucroLiquido = totalReceita - (totalCusto + totalOutrasDespesas);
  const { percentual } = margem(totalReceita, totalCusto);
  const ticket = linhas.length ? totalReceita / linhas.length : 0;



  /** Faturamento por curso no período escolhido. */
  const porCurso = useMemo(() => {
    const pedidosMes = todosPedidos.filter((p) => noMes(p.data) && p.cursoId);
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

  /** Ingredientes consumidos no período (bolos + coberturas + cursos). */
  const porIngrediente = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const p of todosPedidos.filter((x) => noMes(x.data))) {
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

  /** Evolução mês a mês, com outras despesas e lucro líquido (igual ao painel). */
  const evolucao = useMemo(() => {
    type Linha = {
      pedidos: number;
      cursos: number;
      receita: number;
      custo: number;
      despesas: number;
    };
    const mapa = new Map<string, Linha>();
    const obter = (chave: string) => {
      const atual =
        mapa.get(chave) ?? { pedidos: 0, cursos: 0, receita: 0, custo: 0, despesas: 0 };
      mapa.set(chave, atual);
      return atual;
    };
    for (const p of todosPedidos) {
      const atual = obter(p.data.slice(0, 7));
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
    }
    for (const d of todasDespesas) {
      obter(d.data.slice(0, 7)).despesas += d.valor;
    }
    return Array.from(mapa.entries())
      .map(([chave, v]) => ({ chave, ...v, lucro: v.receita - v.custo - v.despesas }))
      .sort((a, b) => b.chave.localeCompare(a.chave));
  }, [todosPedidos, todasDespesas, bolos, coberturas, cursos, ingredientes]);


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
              <SelectItem value={TODOS}>Todos os meses</SelectItem>
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
        <Button asChild variant="outline" className="gap-2">
          <a
            href="/informacao-nutricional-amor-de-brigadeiro.pdf"
            download="informacao-nutricional-amor-de-brigadeiro.pdf"
          >
            <FileDown className="h-4 w-4" />
            Baixar informação nutricional
          </a>
        </Button>
      </div>

      <div id="relatorio-print" className="space-y-6">
        <div className="hidden print:block">
          <h2 className="font-display text-2xl">Amor de Brigadeiro — Relatório mensal</h2>
          <p className="text-sm text-muted-foreground">{nomeMes(mes)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica rotulo="Faturamento em bolos e coberturas" valor={brl(receitaBolos)} />
          <Metrica rotulo="Faturamento em cursos" valor={brl(receitaCursos)} />
          <Metrica rotulo="Faturamento total" valor={brl(totalReceita)} />
          <Metrica rotulo="Custo de produção dos bolos" valor={brl(custoBolos)} />
          <Metrica rotulo="Custo de produção das coberturas" valor={brl(custoCoberturas)} />
          <Metrica rotulo="Custo de realização dos cursos" valor={brl(custoCursos)} />
          <Metrica rotulo="Custo total da produção" valor={brl(totalCusto)} />
          <Metrica rotulo="Total de outras despesas" valor={brl(totalOutrasDespesas)} />
          <Metrica rotulo="Lucro líquido" valor={brl(lucroLiquido)} />
          <Metrica rotulo="Margem média" valor={`${percentual.toFixed(1)}%`} />
          <Metrica rotulo="Pedidos" valor={String(linhas.length)} />
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
                  <TableHead className="text-right">Custo produção</TableHead>
                  <TableHead className="text-right">Outras despesas</TableHead>
                  <TableHead className="text-right">Lucro líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evolucao.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                      <TableCell className="text-right">{brl(m.despesas)}</TableCell>
                      <TableCell className="text-right">{brl(m.lucro)}</TableCell>
                    </TableRow>
                  ))
                )}

              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-display text-lg">Outras despesas — {nomeMes(mes)}</h3>
          <div className="panel overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhuma despesa registrada em {nomeMes(mes)}.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...despesas]
                    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
                    .map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{dataBR(d.data)}</TableCell>
                        <TableCell className="font-semibold">{d.descricao}</TableCell>
                        <TableCell className="text-right">{brl(d.valor)}</TableCell>
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
