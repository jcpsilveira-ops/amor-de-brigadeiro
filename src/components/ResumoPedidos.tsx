import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ClipboardList, Crown, Star, TrendingUp } from "lucide-react";
import { brl, calcularCusto, dataBR, margem } from "@/lib/domain";
import {
  useBolos,
  useClientes,
  useCoberturas,
  useCursos,
  useIngredientes,
  usePedidos,
} from "@/lib/queries";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const nomeMes = (chave: string) => {
  const [ano, mes] = chave.split("-");
  const rotulo = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
};

type Linha = { nome: string; qtd: number; valor: number };

function Ranking({
  titulo,
  icone: Icone,
  linhas,
  vazio,
}: {
  titulo: string;
  icone: typeof Star;
  linhas: Linha[];
  vazio: string;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icone className="h-4 w-4 text-accent" />
        {titulo}
      </p>
      {linhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vazio}</p>
      ) : (
        <div className="space-y-2">
          {linhas.map((l) => (
            <div
              key={l.nome}
              className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-2"
            >
              <div className="min-w-0">
                <p className="truncate pr-3 text-sm font-medium">{l.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {l.qtd} {l.qtd === 1 ? "pedido" : "pedidos"}
                </p>
              </div>
              <p className="shrink-0 font-display text-base text-primary">{brl(l.valor)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Resumo analítico dos pedidos exibido dentro do Painel Geral.
 * `mes` no formato "YYYY-MM" ou "todos".
 */
export function ResumoPedidos({ mes }: { mes: string }) {
  const { data: todosPedidos = [] } = usePedidos();
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const { data: cursos = [] } = useCursos();
  const { data: clientes = [] } = useClientes();
  const { data: ingredientes = [] } = useIngredientes();

  const pedidos = useMemo(
    () => (mes === "todos" ? todosPedidos : todosPedidos.filter((p) => p.data.startsWith(mes))),
    [todosPedidos, mes],
  );

  const analise = useMemo(() => {
    const boloPorId = new Map(bolos.map((b) => [b.id, b]));
    const cobPorId = new Map(coberturas.map((c) => [c.id, c]));
    const cursoPorId = new Map(cursos.map((c) => [c.id, c]));
    const clientePorId = new Map(clientes.map((c) => [c.id, c]));

    const detalhes = pedidos.map((p) => {
      const bolo = p.boloId ? boloPorId.get(p.boloId) : undefined;
      const cobertura = p.coberturaId ? cobPorId.get(p.coberturaId) : undefined;
      const curso = p.cursoId ? cursoPorId.get(p.cursoId) : undefined;
      const receita =
        (bolo?.precoVenda ?? 0) +
        (cobertura?.precoVenda ?? 0) +
        (curso?.precoVenda ?? 0) +
        (p.outrosPreco ?? 0);
      const custo =
        (bolo ? calcularCusto(bolo.itens, ingredientes) : 0) +
        (cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0) +
        (curso ? calcularCusto(curso.itens, ingredientes) : 0) +
        calcularCusto(p.outrosItens ?? [], ingredientes);
      return { pedido: p, bolo, cobertura, curso, receita, custo, lucro: receita - custo };
    });

    const receitaTotal = detalhes.reduce((a, d) => a + d.receita, 0);
    const custoTotal = detalhes.reduce((a, d) => a + d.custo, 0);
    const ticket = detalhes.length > 0 ? receitaTotal / detalhes.length : 0;

    const acumular = (chave: (d: (typeof detalhes)[number]) => string | undefined) => {
      const mapa = new Map<string, Linha>();
      for (const d of detalhes) {
        const nome = chave(d);
        if (!nome) continue;
        const atual = mapa.get(nome) ?? { nome, qtd: 0, valor: 0 };
        atual.qtd += 1;
        atual.valor += d.receita;
        mapa.set(nome, atual);
      }
      return [...mapa.values()].sort((a, b) => b.valor - a.valor);
    };

    const porDia = DIAS.map((nome) => ({ nome, qtd: 0 }));
    for (const d of detalhes) {
      const dia = new Date(`${d.pedido.data.slice(0, 10)}T12:00:00`).getDay();
      const alvo = porDia[dia];
      if (alvo) alvo.qtd += 1;
    }

    const mensal = new Map<string, { chave: string; qtd: number; receita: number; lucro: number }>();
    for (const d of detalhes) {
      const chave = d.pedido.data.slice(0, 7);
      const atual = mensal.get(chave) ?? { chave, qtd: 0, receita: 0, lucro: 0 };
      atual.qtd += 1;
      atual.receita += d.receita;
      atual.lucro += d.lucro;
      mensal.set(chave, atual);
    }

    return {
      detalhes,
      receitaTotal,
      custoTotal,
      ticket,
      topBolos: acumular((d) => d.bolo?.nome).slice(0, 5),
      topCursos: acumular((d) => d.curso?.nome).slice(0, 5),
      topClientes: acumular((d) => clientePorId.get(d.pedido.clienteId)?.nome).slice(0, 5),
      maisRentaveis: [...detalhes].sort((a, b) => b.lucro - a.lucro).slice(0, 5),
      menosRentaveis: [...detalhes].sort((a, b) => a.lucro - b.lucro).slice(0, 3),
      porDia: [...porDia].sort((a, b) => b.qtd - a.qtd),
      mensal: [...mensal.values()].sort((a, b) => b.chave.localeCompare(a.chave)).slice(0, 6),
    };
  }, [pedidos, bolos, coberturas, cursos, clientes, ingredientes]);

  const { percentual } = margem(analise.receitaTotal, analise.custoTotal);
  const clientesUnicos = new Set(pedidos.map((p) => p.clienteId)).size;
  const recorrentes = clientesUnicos > 0 ? pedidos.length / clientesUnicos : 0;
  const melhorDia = analise.porDia[0];

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-accent" />
          Painel de pedidos
          {mes !== "todos" && (
            <span className="text-sm font-normal text-muted-foreground">· {nomeMes(mes)}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {pedidos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum pedido neste período. Registre pedidos em{" "}
            <Link to="/pedidos" className="text-accent hover:underline">
              Pedidos
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Bloco rotulo="Pedidos no período" valor={String(pedidos.length)} />
              <Bloco rotulo="Ticket médio" valor={brl(analise.ticket)} />
              <Bloco rotulo="Lucro bruto dos pedidos" valor={brl(analise.receitaTotal - analise.custoTotal)} />
              <Bloco rotulo="Margem dos pedidos" valor={`${percentual.toFixed(1)}%`} />
              <Bloco rotulo="Clientes atendidos" valor={String(clientesUnicos)} />
              <Bloco rotulo="Pedidos por cliente" valor={recorrentes.toFixed(1)} />
              <Bloco
                rotulo="Dia mais forte"
                valor={melhorDia && melhorDia.qtd > 0 ? `${melhorDia.nome} (${melhorDia.qtd})` : "—"}
              />
              <Bloco
                rotulo="Pedidos com curso"
                valor={String(pedidos.filter((p) => p.cursoId).length)}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Ranking
                titulo="Bolos mais vendidos"
                icone={Star}
                linhas={analise.topBolos}
                vazio="Nenhum bolo vendido no período."
              />
              <Ranking
                titulo="Melhores clientes"
                icone={Crown}
                linhas={analise.topClientes}
                vazio="Nenhum cliente no período."
              />
              <Ranking
                titulo="Cursos mais vendidos"
                icone={TrendingUp}
                linhas={analise.topCursos}
                vazio="Nenhum curso vendido no período."
              />

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarDays className="h-4 w-4 text-accent" />
                  Evolução mensal
                </p>
                <div className="space-y-2">
                  {analise.mensal.map((m) => (
                    <div
                      key={m.chave}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{nomeMes(m.chave)}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.qtd} {m.qtd === 1 ? "pedido" : "pedidos"} · lucro {brl(m.lucro)}
                        </p>
                      </div>
                      <p className="font-display text-base text-primary">{brl(m.receita)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Pedidos mais lucrativos</p>
                <div className="space-y-2">
                  {analise.maisRentaveis.map((d) => (
                    <div
                      key={`top-${d.pedido.id}`}
                      className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate pr-3 text-sm font-medium">
                          #{d.pedido.id} · {d.bolo?.nome ?? d.curso?.nome ?? "Pedido"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dataBR(d.pedido.data)} · receita {brl(d.receita)}
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-base text-primary">{brl(d.lucro)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Atenção: menor lucro por pedido
                </p>
                <div className="space-y-2">
                  {analise.menosRentaveis.map((d) => (
                    <div
                      key={`low-${d.pedido.id}`}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate pr-3 text-sm font-medium">
                          #{d.pedido.id} · {d.bolo?.nome ?? d.curso?.nome ?? "Pedido"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dataBR(d.pedido.data)} · custo {brl(d.custo)}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 font-display text-base ${d.lucro < 0 ? "text-destructive" : "text-primary"}`}
                      >
                        {brl(d.lucro)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Bloco({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="panel p-4">
      <p className="label-caps">{rotulo}</p>
      <p className="mt-1 font-display text-xl text-primary">{valor}</p>
    </div>
  );
}
