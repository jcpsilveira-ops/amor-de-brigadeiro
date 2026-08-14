import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ImportarDadosLocais } from "@/components/ImportarDadosLocais";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cake,
  ClipboardList,
  GraduationCap,
  Layers,
  Receipt,
  TrendingUp,
  Users,
  Wheat,
} from "lucide-react";
import { brl, calcularCusto, dataBR, margem } from "@/lib/domain";
import { converterQuantidade } from "@/lib/estoque";
import {
  useBolos,
  useClientes,
  useCoberturas,
  useCursos,
  useDespesas,
  useIngredientes,
  usePedidos,
  useReceitasAvulsas,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Amor de Brigadeiro | Gestão da confeitaria" },
      {
        name: "description",
        content:
          "Painel de gestão da Amor de Brigadeiro: ingredientes, receitas de bolos e coberturas, clientes, pedidos e custos de produção.",
      },
      { property: "og:title", content: "Amor de Brigadeiro | Gestão da confeitaria" },
      {
        property: "og:description",
        content:
          "Sistema completo para gerenciar ingredientes, receitas, clientes, pedidos e custos de produção.",
      },
    ],
  }),
  component: Painel,
});

const atalhos = [
  { to: "/ingredientes", label: "Ingredientes", icon: Wheat },
  { to: "/bolos", label: "Bolos", icon: Cake },
  { to: "/coberturas", label: "Coberturas", icon: Layers },
  { to: "/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
] as const;

const TODOS = "todos";

const nomeMes = (chave: string) => {
  const [ano, mes] = chave.split("-");
  const rotulo = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
};

function Painel() {
  const { data: ingredientes = [] } = useIngredientes();
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const { data: cursos = [] } = useCursos();
  const { data: clientes = [] } = useClientes();
  const { data: todosPedidos = [] } = usePedidos();
  const { data: todasDespesas = [] } = useDespesas();
  const { data: todasReceitasAvulsas = [] } = useReceitasAvulsas();

  const [mes, setMes] = useState<string>(TODOS);

  const mesesDisponiveis = useMemo(
    () =>
      Array.from(
        new Set([
          ...todosPedidos.map((p) => p.data.slice(0, 7)),
          ...todasDespesas.map((d) => d.data.slice(0, 7)),
          ...todasReceitasAvulsas.map((r) => r.data.slice(0, 7)),
        ]),
      ).sort((a, b) => b.localeCompare(a)),
    [todosPedidos, todasDespesas, todasReceitasAvulsas],
  );

  const pedidos = useMemo(
    () => (mes === TODOS ? todosPedidos : todosPedidos.filter((p) => p.data.startsWith(mes))),
    [todosPedidos, mes],
  );

  const despesas = useMemo(
    () => (mes === TODOS ? todasDespesas : todasDespesas.filter((d) => d.data.startsWith(mes))),
    [todasDespesas, mes],
  );

  const receitaBolos = pedidos.reduce((acc, p) => {
    const bolo = bolos.find((b) => b.id === p.boloId);
    const cobertura = coberturas.find((c) => c.id === p.coberturaId);
    return acc + (bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0) + (p.outrosPreco ?? 0);
  }, 0);

  const receitaCursos = pedidos.reduce((acc, p) => {
    const curso = cursos.find((c) => c.id === p.cursoId);
    return acc + (curso?.precoVenda ?? 0);
  }, 0);


  const receitasAvulsas = useMemo(
    () =>
      mes === TODOS
        ? todasReceitasAvulsas
        : todasReceitasAvulsas.filter((r) => r.data.startsWith(mes)),
    [todasReceitasAvulsas, mes],
  );

  const totalOutrasReceitas = receitasAvulsas.reduce((acc, r) => acc + r.valor, 0);

  const receitaPrevista = receitaBolos + receitaCursos + totalOutrasReceitas;

  const custoBolos = pedidos.reduce((acc, p) => {
    const bolo = bolos.find((b) => b.id === p.boloId);
    return acc + (bolo ? calcularCusto(bolo.itens, ingredientes) : 0);
  }, 0);

  const custoCoberturas = pedidos.reduce((acc, p) => {
    const cobertura = coberturas.find((c) => c.id === p.coberturaId);
    return acc + (cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0);
  }, 0);

  const custoCursos = pedidos.reduce((acc, p) => {
    const curso = cursos.find((c) => c.id === p.cursoId);
    return acc + (curso ? calcularCusto(curso.itens, ingredientes) : 0);
  }, 0);

  const custoPrevisto = custoBolos + custoCoberturas + custoCursos;

  const totalOutrasDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);

  const lucroLiquido = receitaPrevista - (custoPrevisto + totalOutrasDespesas);

  const valorEstoque = ingredientes.reduce((acc, ing) => {
    const qtdNaUnidadeDeCompra = converterQuantidade(
      ing.estoqueQuantidade,
      ing.estoqueUnidade ?? ing.unidade,
      ing.unidade,
    );
    return acc + (qtdNaUnidadeDeCompra ?? 0) * ing.custoUnitario;
  }, 0);

  const { percentual } = margem(receitaPrevista, custoPrevisto);

  return (
    <PageShell
      title="Painel da confeitaria"
      subtitle="Uma visão rápida das receitas, dos clientes e do dinheiro que entra."
    >
      <ImportarDadosLocais />

      <div className="mb-6 flex flex-wrap items-center gap-3 panel p-4">
        <Label htmlFor="filtro-mes" className="label-caps">
          Mês de referência
        </Label>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger id="filtro-mes" className="w-full sm:w-[240px]">
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



      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metrica rotulo="Faturamento em bolos e coberturas" valor={brl(receitaBolos)} />
        <Metrica rotulo="Faturamento em cursos" valor={brl(receitaCursos)} />
        <Metrica rotulo="Total de outras receitas" valor={brl(totalOutrasReceitas)} />
        <Metrica rotulo="Faturamento total" valor={brl(receitaPrevista)} />
        <Metrica rotulo="Custo de produção dos bolos" valor={brl(custoBolos)} />
        <Metrica rotulo="Custo de produção das coberturas" valor={brl(custoCoberturas)} />
        <Metrica rotulo="Custo de realização dos cursos" valor={brl(custoCursos)} />
        <Metrica rotulo="Custo total da produção" valor={brl(custoPrevisto)} />
        <Metrica rotulo="Total de outras despesas" valor={brl(totalOutrasDespesas)} />
        <Metrica rotulo="Valor dos produtos estocados" valor={brl(valorEstoque)} />
        <Metrica rotulo="Lucro líquido" valor={brl(lucroLiquido)} />
        <Metrica rotulo="Margem média" valor={`${percentual.toFixed(1)}%`} />
        <Metrica rotulo="Pedidos" valor={String(pedidos.length)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-accent" />
              Resumo de despesas
              {mes !== TODOS && <span className="text-sm font-normal text-muted-foreground">· {nomeMes(mes)}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="panel p-4">
                <p className="label-caps">Total de despesas no mês</p>
                <p className="mt-1 font-display text-2xl text-primary">{brl(totalOutrasDespesas)}</p>
              </div>
              <div className="panel p-4">
                <p className="label-caps">Maior despesa</p>
                <p className="mt-1 font-display text-2xl text-primary">
                  {despesas.length > 0 ? brl(Math.max(...despesas.map((d) => d.valor))) : brl(0)}
                </p>
              </div>
            </div>

            {despesas.length > 0 && (
              <>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Despesas mais altas
                  </p>
                  <div className="space-y-2">
                    {[...despesas]
                      .sort((a, b) => b.valor - a.valor)
                      .slice(0, 3)
                      .map((d) => (
                        <div
                          key={`top-${d.id}`}
                          className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-2"
                        >
                          <p className="truncate pr-3 text-sm font-medium">{d.descricao}</p>
                          <p className="shrink-0 font-display text-base text-primary">{brl(d.valor)}</p>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">Últimas despesas</p>
                  <div className="space-y-2">
                    {[...despesas]
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .slice(0, 5)
                      .map((d) => (
                        <div
                          key={`recent-${d.id}`}
                          className="flex items-center justify-between rounded-xl border border-border px-4 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{d.descricao}</p>
                            <p className="text-xs text-muted-foreground">{dataBR(d.data)}</p>
                          </div>
                          <p className="shrink-0 font-display text-base text-primary">{brl(d.valor)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {despesas.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma despesa registrada neste período. Cadastre despesas em {" "}
                <Link to="/despesas" className="text-accent hover:underline">
                  Outras despesas
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Últimos pedidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pedidos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum pedido ainda. Comece cadastrando ingredientes e receitas.
                </p>
              ) : (
                [...pedidos]
                  .sort((a, b) => b.id - a.id)
                  .slice(0, 6)
                  .map((p) => {
                    const cliente = clientes.find((c) => c.id === p.clienteId);
                    const bolo = bolos.find((b) => b.id === p.boloId);
                    const cobertura = coberturas.find((c) => c.id === p.coberturaId);
                    const curso = cursos.find((c) => c.id === p.cursoId);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold">{cliente?.nome ?? "Cliente removido"}</p>
                          <p className="text-xs text-muted-foreground">
                            {bolo?.nome ?? "Sem bolo"} · {cobertura?.nome ?? "Sem cobertura"}
                            {curso ? ` · ${curso.nome}` : ""} · {dataBR(p.data)}
                          </p>
                        </div>
                        <p className="font-display text-lg text-primary">
                          {brl(
                            (bolo?.precoVenda ?? 0) +
                              (cobertura?.precoVenda ?? 0) +
                              (curso?.precoVenda ?? 0),
                          )}
                        </p>
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cadastros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {atalhos.map(({ to, label, icon: Icon }) => {
                const totais: Record<string, number> = {
                  "/ingredientes": ingredientes.length,
                  "/bolos": bolos.length,
                  "/coberturas": coberturas.length,
                  "/cursos": cursos.length,
                  "/clientes": clientes.length,
                  "/pedidos": pedidos.length,
                };
                return (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center justify-between rounded-xl border border-border px-4 py-3 transition-colors hover:bg-secondary"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <Icon className="h-4 w-4 text-accent" />
                      {label}
                    </span>
                    <span className="text-sm text-muted-foreground">{totais[to] ?? 0}</span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
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
