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
import { Cake, ClipboardList, Layers, Users, Wheat } from "lucide-react";
import { brl, calcularCusto, dataBR, margem } from "@/lib/domain";
import {
  useBolos,
  useClientes,
  useCoberturas,
  useIngredientes,
  usePedidos,
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
  const { data: clientes = [] } = useClientes();
  const { data: todosPedidos = [] } = usePedidos();

  const [mes, setMes] = useState<string>(TODOS);

  const mesesDisponiveis = useMemo(
    () =>
      Array.from(new Set(todosPedidos.map((p) => p.data.slice(0, 7)))).sort((a, b) =>
        b.localeCompare(a),
      ),
    [todosPedidos],
  );

  const pedidos = useMemo(
    () => (mes === TODOS ? todosPedidos : todosPedidos.filter((p) => p.data.startsWith(mes))),
    [todosPedidos, mes],
  );

  const receitaPrevista = pedidos.reduce((acc, p) => {
    const bolo = bolos.find((b) => b.id === p.boloId);
    const cobertura = coberturas.find((c) => c.id === p.coberturaId);
    return acc + (bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0);
  }, 0);

  const custoPrevisto = pedidos.reduce((acc, p) => {
    const bolo = bolos.find((b) => b.id === p.boloId);
    const cobertura = coberturas.find((c) => c.id === p.coberturaId);
    return (
      acc +
      (bolo ? calcularCusto(bolo.itens, ingredientes) : 0) +
      (cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0)
    );
  }, 0);

  const { percentual } = margem(receitaPrevista, custoPrevisto);

  return (
    <PageShell
      title="Painel da confeitaria"
      subtitle="Uma visão rápida das receitas, dos clientes e do dinheiro que entra."
    >
      <ImportarDadosLocais />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica rotulo="Faturamento em pedidos" valor={brl(receitaPrevista)} />
        <Metrica rotulo="Custo de produção" valor={brl(custoPrevisto)} />
        <Metrica rotulo="Margem média" valor={`${percentual.toFixed(1)}%`} />
        <Metrica rotulo="Pedidos" valor={String(pedidos.length)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
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
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold">{cliente?.nome ?? "Cliente removido"}</p>
                        <p className="text-xs text-muted-foreground">
                          {bolo?.nome ?? "—"} · {cobertura?.nome ?? "Sem cobertura"} ·{" "}
                          {dataBR(p.data)}
                        </p>
                      </div>
                      <p className="font-display text-lg text-primary">
                        {brl((bolo?.precoVenda ?? 0) + (cobertura?.precoVenda ?? 0))}
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
