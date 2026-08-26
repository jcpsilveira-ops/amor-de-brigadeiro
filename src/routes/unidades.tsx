import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Pencil, Ruler, Save, X } from "lucide-react";

import { PageShell, EmptyState, FieldError } from "@/components/PageShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  UNIDADES,
  fatorConversaoSchema,
  type FatorConversao,
  type Unidade,
} from "@/lib/domain";
import {
  BASES,
  FATORES_PADRAO,
  NOME_BASE,
  fatorDe,
  qtd,
  temFatorPersonalizado,
  type BaseGrandeza,
} from "@/lib/estoque";
import { fatoresConversaoApi, keys, useFatoresConversao, useAppMutation } from "@/lib/queries";

export const Route = createFileRoute("/unidades")({
  head: () => ({
    meta: [
      { title: "Fatores de conversão de unidades | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Cadastre e edite os fatores de conversão entre as unidades dos ingredientes, com alertas para equivalências ambíguas ou pouco confiáveis.",
      },
      { property: "og:title", content: "Fatores de conversão de unidades | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Defina quanto vale cada unidade em peso, volume ou contagem e veja alertas de ambiguidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UnidadesPage,
});

const numeroBR = (v: string) => Number(v.replace(",", "."));
const familia = (u: string) => u.split(" ")[0]!;

interface Alerta {
  unidade: Unidade;
  tipo: "ambigua" | "atencao";
  motivo: string;
}

function calcularAlertas(fatores: FatorConversao[]): Alerta[] {
  const alertas: Alerta[] = [];
  const cadastrados = new Map(fatores.map((f) => [f.unidade, f]));

  for (const u of UNIDADES) {
    const atual = fatorDe(u);
    if (!atual) {
      alertas.push({ unidade: u, tipo: "ambigua", motivo: "Unidade sem fator de conversão cadastrado." });
      continue;
    }
    if (atual.base === "cartela" || atual.base === "fardo") {
      alertas.push({
        unidade: u,
        tipo: "ambigua",
        motivo:
          "Embalagem genérica, sem quantidade definida: cadastre quantas unidades, gramas ou ml ela contém.",
      });
      continue;
    }
    const parentes = UNIDADES.filter((o) => o !== u && familia(o) === familia(u));
    const divergente = parentes.find((o) => (fatorDe(o)?.base ?? atual.base) !== atual.base);
    if (divergente) {
      alertas.push({
        unidade: u,
        tipo: "ambigua",
        motivo: `Mesmo nome de “${divergente}”, mas grandezas diferentes — a conversão entre elas fica bloqueada.`,
      });
      continue;
    }
    const padrao = FATORES_PADRAO[u];
    const cadastro = cadastrados.get(u);
    if (cadastro && padrao && padrao.base !== atual.base) {
      alertas.push({
        unidade: u,
        tipo: "atencao",
        motivo: `O cadastro mudou a grandeza de ${NOME_BASE[padrao.base]} para ${NOME_BASE[atual.base]}. Revise as receitas que usam esta unidade.`,
      });
      continue;
    }
    if (cadastro && padrao && padrao.fator !== atual.fator) {
      alertas.push({
        unidade: u,
        tipo: "atencao",
        motivo: `Fator alterado: o padrão do sistema é ${qtd(padrao.fator)} e o cadastro usa ${qtd(atual.fator)}.`,
      });
    }
  }
  return alertas;
}

function UnidadesPage() {
  const { data: fatores = [], isLoading } = useFatoresConversao();
  const [editando, setEditando] = useState<FatorConversao | null>(null);
  const [unidade, setUnidade] = useState<Unidade>(UNIDADES[0]);
  const [base, setBase] = useState<BaseGrandeza>("massa");
  const [fator, setFator] = useState("1");
  const [observacao, setObservacao] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  const alertas = useMemo(() => calcularAlertas(fatores), [fatores]);
  const ambiguas = alertas.filter((a) => a.tipo === "ambigua");
  const atencoes = alertas.filter((a) => a.tipo === "atencao");

  const limpar = () => {
    setEditando(null);
    setUnidade(UNIDADES[0]);
    setBase("massa");
    setFator("1");
    setObservacao("");
    setErros({});
  };

  const salvar = useAppMutation({
    mutationFn: async () => {
      const parsed = fatorConversaoSchema.safeParse({
        unidade,
        base,
        fator: numeroBR(fator),
        observacao: observacao.trim() === "" ? null : observacao.trim(),
      });
      if (!parsed.success) {
        const mapa: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          mapa[String(issue.path[0])] = issue.message;
        }
        setErros(mapa);
        throw new Error("Revise os campos destacados.");
      }
      setErros({});
      const duplicado = fatores.find(
        (f) => f.unidade === parsed.data.unidade && f.id !== editando?.id,
      );
      if (duplicado) throw new Error("Já existe um fator cadastrado para esta unidade.");
      return editando
        ? fatoresConversaoApi.update(editando.id, parsed.data)
        : fatoresConversaoApi.create(parsed.data);
    },
    invalidate: [keys.fatoresConversao, keys.ingredientes, keys.movimentacoes],
    successMessage: editando ? "Fator atualizado!" : "Fator cadastrado!",
    onSuccess: limpar,
  });

  const excluir = useAppMutation({
    mutationFn: (id: number) => fatoresConversaoApi.remove(id),
    invalidate: [keys.fatoresConversao, keys.ingredientes, keys.movimentacoes],
    successMessage: "Fator removido — o padrão do sistema volta a valer.",
  });

  const editar = (f: FatorConversao) => {
    setEditando(f);
    setUnidade(f.unidade);
    setBase((BASES.includes(f.base as BaseGrandeza) ? f.base : "massa") as BaseGrandeza);
    setFator(String(f.fator));
    setObservacao(f.observacao ?? "");
    setErros({});
  };

  return (
    <PageShell
      title="Fatores de conversão de unidades"
      subtitle="Diga quanto vale cada unidade em peso, volume ou contagem. O sistema usa esses fatores no estoque, nas receitas e na cesta da produção."
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-accent" />
              {editando ? "Editar fator" : "Novo fator"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Unidade</Label>
              <Select value={unidade} onValueChange={(v) => setUnidade(v as Unidade)}>
                <SelectTrigger aria-label="Unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={erros["unidade"]} />
            </div>
            <div>
              <Label>Grandeza de referência</Label>
              <Select value={base} onValueChange={(v) => setBase(v as BaseGrandeza)}>
                <SelectTrigger aria-label="Grandeza de referência">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {NOME_BASE[b]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={erros["base"]} />
            </div>
            <div>
              <Label htmlFor="fator">Equivale a</Label>
              <Input
                id="fator"
                inputMode="decimal"
                value={fator}
                onChange={(e) => setFator(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Ex.: “caixa de 1 l” em Volume equivale a 1000 (ml). “dúzia” em Contagem equivale a 12.
              </p>
              <FieldError message={erros["fator"]} />
            </div>
            <div>
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Input
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: cartela do fornecedor com 30 ovos"
              />
              <FieldError message={erros["observacao"]} />
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => salvar.mutate(undefined)} disabled={salvar.isPending}>
                <Save className="mr-1.5 h-4 w-4" />
                {editando ? "Salvar alterações" : "Cadastrar fator"}
              </Button>
              {editando ? (
                <Button type="button" variant="outline" onClick={limpar}>
                  <X className="mr-1.5 h-4 w-4" />
                  Cancelar
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {ambiguas.length > 0 || atencoes.length > 0 ? (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Alertas de equivalência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ambiguas.length > 0 ? (
                  <div>
                    <p className="label-caps text-destructive">
                      Ambíguas ou não confiáveis ({ambiguas.length})
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {ambiguas.map((a) => (
                        <li key={`amb-${a.unidade}`}>
                          <span className="font-semibold">{a.unidade}</span> — {a.motivo}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {atencoes.length > 0 ? (
                  <div>
                    <p className="label-caps">Atenção ({atencoes.length})</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      {atencoes.map((a) => (
                        <li key={`at-${a.unidade}`}>
                          <span className="font-semibold text-foreground">{a.unidade}</span> —{" "}
                          {a.motivo}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Fatores cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando fatores…</p>
              ) : fatores.length === 0 ? (
                <EmptyState message="Nenhum fator personalizado ainda — o sistema está usando os padrões." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Grandeza</TableHead>
                        <TableHead className="text-right">Equivale a</TableHead>
                        <TableHead>Observação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fatores.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-semibold">{f.unidade}</TableCell>
                          <TableCell>{NOME_BASE[f.base as BaseGrandeza] ?? f.base}</TableCell>
                          <TableCell className="text-right">{qtd(f.fator)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {f.observacao ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-label={`Editar fator de ${f.unidade}`}
                              onClick={() => editar(f)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <ConfirmDelete
                              description={`Remover o fator personalizado de “${f.unidade}”? O padrão do sistema volta a valer.`}
                              onConfirm={() => excluir.mutate(f.id)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equivalências em uso</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Grandeza</TableHead>
                    <TableHead className="text-right">Equivale a</TableHead>
                    <TableHead>Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {UNIDADES.map((u) => {
                    const f = fatorDe(u);
                    return (
                      <TableRow key={u}>
                        <TableCell className="font-semibold">{u}</TableCell>
                        <TableCell>{f ? NOME_BASE[f.base] : "—"}</TableCell>
                        <TableCell className="text-right">{f ? qtd(f.fator) : "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {temFatorPersonalizado(u) ? "Cadastro" : "Padrão do sistema"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
