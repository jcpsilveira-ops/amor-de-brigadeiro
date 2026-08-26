import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { History, Ruler } from "lucide-react";

import { PageShell, EmptyState } from "@/components/PageShell";
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
import type { HistoricoFator } from "@/lib/domain";
import { NOME_BASE, qtd, type BaseGrandeza } from "@/lib/estoque";
import { useHistoricoFatores } from "@/lib/queries";

export const Route = createFileRoute("/auditoria-unidades")({
  head: () => ({
    meta: [
      { title: "Auditoria dos fatores de conversão | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Histórico completo e versionado dos fatores de conversão de unidades: o que mudou, quando e por quem, com comparação entre versões.",
      },
      { property: "og:title", content: "Auditoria dos fatores de conversão | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Veja cada versão dos fatores de conversão, a data da alteração e o autor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditoriaUnidadesPage,
});

const dataHoraBR = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const rotuloBase = (base: string) => NOME_BASE[base as BaseGrandeza] ?? base;

const ROTULO_ACAO: Record<HistoricoFator["acao"], string> = {
  criado: "Criado",
  alterado: "Alterado",
  removido: "Removido",
};

const CORES_ACAO: Record<HistoricoFator["acao"], string> = {
  criado: "bg-accent/15 text-accent-foreground",
  alterado: "bg-secondary text-secondary-foreground",
  removido: "bg-destructive/10 text-destructive",
};

/** Descreve o que mudou em relação à versão anterior da mesma unidade. */
function descreverMudanca(atual: HistoricoFator, anterior: HistoricoFator | undefined): string {
  if (!anterior) return atual.acao === "criado" ? "Primeira versão." : "Sem versão anterior.";
  if (atual.acao === "removido") return "Fator removido — o padrão do sistema voltou a valer.";
  const partes: string[] = [];
  if (anterior.base !== atual.base) {
    partes.push(`grandeza: ${rotuloBase(anterior.base)} → ${rotuloBase(atual.base)}`);
  }
  if (anterior.fator !== atual.fator) {
    partes.push(`fator: ${qtd(anterior.fator)} → ${qtd(atual.fator)}`);
  }
  if ((anterior.observacao ?? "") !== (atual.observacao ?? "")) {
    partes.push("observação atualizada");
  }
  return partes.length > 0 ? partes.join(" · ") : "Sem mudanças nos valores.";
}

function AuditoriaUnidadesPage() {
  const { data: historico = [], isLoading } = useHistoricoFatores();
  const [unidadeFiltro, setUnidadeFiltro] = useState("todas");
  const [autorFiltro, setAutorFiltro] = useState("todos");

  const unidades = useMemo(
    () => [...new Set(historico.map((h) => h.unidade))].sort((a, b) => a.localeCompare(b)),
    [historico],
  );
  const autores = useMemo(
    () => [...new Set(historico.map((h) => h.autor))].sort((a, b) => a.localeCompare(b)),
    [historico],
  );

  // Versão anterior de cada registro (mesma unidade, versão imediatamente menor).
  const anteriores = useMemo(() => {
    const porUnidade = new Map<string, HistoricoFator[]>();
    for (const h of historico) {
      const lista = porUnidade.get(h.unidade) ?? [];
      lista.push(h);
      porUnidade.set(h.unidade, lista);
    }
    const mapa = new Map<number, HistoricoFator | undefined>();
    for (const lista of porUnidade.values()) {
      const ordenada = [...lista].sort((a, b) => a.versao - b.versao);
      ordenada.forEach((h, i) => mapa.set(h.id, i > 0 ? ordenada[i - 1] : undefined));
    }
    return mapa;
  }, [historico]);

  const filtrado = historico.filter(
    (h) =>
      (unidadeFiltro === "todas" || h.unidade === unidadeFiltro) &&
      (autorFiltro === "todos" || h.autor === autorFiltro),
  );

  const ultimaAlteracao = historico[0];

  return (
    <PageShell
      title="Auditoria dos fatores de conversão"
      subtitle="Todo o histórico versionado das equivalências entre unidades: o que mudou, quando e por quem."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="label-caps">Versões registradas</p>
          <p className="mt-1 font-display text-2xl text-primary">{historico.length}</p>
        </div>
        <div className="panel p-5">
          <p className="label-caps">Unidades com histórico</p>
          <p className="mt-1 font-display text-2xl text-primary">{unidades.length}</p>
        </div>
        <div className="panel p-5">
          <p className="label-caps">Última alteração</p>
          <p className="mt-1 font-display text-lg text-primary">
            {ultimaAlteracao ? dataHoraBR(ultimaAlteracao.criadoEm) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {ultimaAlteracao ? `por ${ultimaAlteracao.autor}` : "Nenhuma alteração ainda"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-accent" />
            Histórico de versões
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={unidadeFiltro} onValueChange={setUnidadeFiltro}>
              <SelectTrigger className="w-[200px]" aria-label="Filtrar por unidade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as unidades</SelectItem>
                {unidades.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={autorFiltro} onValueChange={setAutorFiltro}>
              <SelectTrigger className="w-[180px]" aria-label="Filtrar por autor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os autores</SelectItem>
                {autores.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando histórico…</p>
          ) : filtrado.length === 0 ? (
            <EmptyState
              message={
                historico.length === 0
                  ? "Nenhuma alteração registrada ainda. Cadastre ou edite um fator na tela de Unidades."
                  : "Nenhum registro para os filtros escolhidos."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Versão</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Grandeza</TableHead>
                    <TableHead className="text-right">Fator</TableHead>
                    <TableHead>O que mudou</TableHead>
                    <TableHead>Autor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrado.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {dataHoraBR(h.criadoEm)}
                      </TableCell>
                      <TableCell className="font-semibold">{h.unidade}</TableCell>
                      <TableCell className="text-right">v{h.versao}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CORES_ACAO[h.acao]}`}
                        >
                          {ROTULO_ACAO[h.acao]}
                        </span>
                      </TableCell>
                      <TableCell>{rotuloBase(h.base)}</TableCell>
                      <TableCell className="text-right">{qtd(h.fator)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {descreverMudanca(h, anteriores.get(h.id))}
                        {h.observacao ? (
                          <span className="block text-xs">Obs.: {h.observacao}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm">{h.autor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            O autor é o nome informado no campo “Quem está alterando” da tela de{" "}
            <Link to="/unidades" className="inline-flex items-center gap-1 font-semibold underline">
              <Ruler className="h-3 w-3" />
              Unidades
            </Link>
            . O histórico só recebe novos registros — nada pode ser apagado ou editado.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
