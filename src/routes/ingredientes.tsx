import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Pencil } from "lucide-react";
import {
  UNIDADES,
  brl,
  ingredienteSchema,
  type Ingrediente,
  type Unidade,
} from "@/lib/domain";
import { analisarEstoqueProximoPedido, avaliarConversao, converterQuantidade, qtd } from "@/lib/estoque";
import {
  bolosApi,
  coberturasApi,
  ingredientesApi,
  keys,
  useAppMutation,
  useBolos,
  useCoberturas,
  useIngredientes,
  usePedidos,
} from "@/lib/queries";
import { Checkbox } from "@/components/ui/checkbox";

import { dataBR, limitarPreco } from "@/lib/domain";

export const Route = createFileRoute("/ingredientes")({
  head: () => ({
    meta: [
      { title: "Ingredientes | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Cadastre ingredientes com unidade e custo unitário para calcular o custo de produção dos bolos.",
      },
      { property: "og:title", content: "Ingredientes | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Controle de insumos, unidades e custos unitários da confeitaria.",
      },
    ],
  }),
  component: IngredientesPage,
});

function IngredientesPage() {
  const { data: ingredientes = [], isLoading } = useIngredientes();
  const { data: pedidos = [] } = usePedidos();
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const [editando, setEditando] = useState<Ingrediente | null>(null);
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState<Unidade | "">("");
  const [custo, setCusto] = useState("");
  const [tocado, setTocado] = useState(false);

  const parsed = ingredienteSchema.safeParse({
    nome,
    unidade,
    custoUnitario: custo,
    // Estoque é gerenciado na tela de Estoque; aqui apenas preservamos o valor atual.
    estoqueQuantidade: editando?.estoqueQuantidade ?? 0,
    estoqueUnidade: editando?.estoqueUnidade ?? (unidade || undefined),
  });
  const erros: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) erros[issue.path.join(".")] = issue.message;
  }

  const analise = analisarEstoqueProximoPedido(ingredientes, pedidos, bolos, coberturas);

  // Aviso automático: trocar a unidade de um ingrediente muda o custo das receitas que o usam.
  const unidadeAlterada = Boolean(editando) && unidade !== "" && unidade !== editando?.unidade;
  const receitasImpactadas = unidadeAlterada
    ? [
        ...bolos.map((r) => ({ ...r, tipo: "Bolo" as const, api: bolosApi })),
        ...coberturas.map((r) => ({ ...r, tipo: "Cobertura" as const, api: coberturasApi })),
      ]
        .map((r) => {
          const quantidade = r.itens.find((it) => it.ingredienteId === editando!.id)?.quantidade ?? null;
          const avaliacao = avaliarConversao(editando!.unidade, unidade as Unidade);
          return {
            tipo: r.tipo,
            nome: r.nome,
            id: r.id,
            itens: r.itens,
            precoVenda: r.precoVenda,
            api: r.api,
            quantidade,
            avaliacao,
            equivalente:
              quantidade === null || avaliacao.status !== "ok"
                ? null
                : converterQuantidade(quantidade, editando!.unidade, unidade as Unidade),
          };
        })
        .filter((r) => r.quantidade !== null)
    : [];
  const ajustaveis = receitasImpactadas.filter((r) => r.equivalente !== null);
  const manuais = receitasImpactadas.filter((r) => r.equivalente === null);
  const [ajustarReceitas, setAjustarReceitas] = useState(true);
  const [confirmarManual, setConfirmarManual] = useState(false);
  const exigeConfirmacao = manuais.length > 0;
  const bloqueado = exigeConfirmacao && !confirmarManual;

  function limpar() {
    setEditando(null);
    setNome("");
    setUnidade("");
    setCusto("");
    setTocado(false);
    setAjustarReceitas(true);
    setConfirmarManual(false);
  }


  const salvar = useAppMutation({
    mutationFn: async () => {
      if (!parsed.success) return;
      if (!editando) return ingredientesApi.create(parsed.data);
      // Assistente de unidade: converte as quantidades das receitas para manter o mesmo peso/volume.
      const paraAjustar = unidadeAlterada && ajustarReceitas ? ajustaveis : [];
      const atualizado = await ingredientesApi.update(editando.id, parsed.data);
      for (const r of paraAjustar) {
        await r.api.update(r.id, {
          nome: r.nome,
          precoVenda: r.precoVenda,
          itens: r.itens.map((it) =>
            it.ingredienteId === editando.id ? { ...it, quantidade: r.equivalente! } : it,
          ),
        });
      }
      return atualizado;
    },
    invalidate: [keys.ingredientes, keys.bolos, keys.coberturas],
    successMessage: editando ? "Ingrediente atualizado!" : "Ingrediente cadastrado!",
    onSuccess: limpar,
  });


  const excluir = useAppMutation({
    mutationFn: (id: number) => ingredientesApi.remove(id),
    invalidate: [keys.ingredientes],
    successMessage: "Ingrediente excluído.",
  });

  return (
    <PageShell
      title="Ingredientes"
      subtitle="Base de custos da confeitaria: cada ingrediente alimenta o cálculo automático das receitas."
    >
      {analise.insuficientes.length > 0 ? (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-destructive">
              Estoque insuficiente para o próximo pedido
              {analise.pedido ? ` (${dataBR(analise.pedido.data)})` : ""}
            </p>
            <ul className="list-inside list-disc text-muted-foreground">
              {analise.insuficientes.map((i) => {
                const n = analise.porIngrediente.get(i.id)!;
                return (
                  <li key={i.id}>
                    <span className="font-medium text-foreground">{i.nome}</span>: precisa de{" "}
                    {qtd(n.necessario)} {i.unidade}, disponível {qtd(n.disponivel ?? 0)} {i.unidade} —
                    faltam {qtd(n.faltando)} {i.unidade}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editando ? "Editar ingrediente" : "Novo ingrediente"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setTocado(true);
                if (bloqueado) return;
                if (parsed.success) salvar.mutate(undefined as never);
              }}
            >
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Leite condensado" />
                <FieldError message={(tocado || nome !== "") ? erros["nome"] : undefined} />
              </div>
              <div>
                <Label htmlFor="unidade">Unidade</Label>
                <Select value={unidade} onValueChange={(v) => setUnidade(v as Unidade)}>
                  <SelectTrigger id="unidade">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={tocado ? erros["unidade"] : undefined} />
              </div>
              <div>
                <Label htmlFor="custo">Custo unitário (R$)</Label>
                <Input
                  id="custo"
                  inputMode="decimal"
                  value={custo}
                  onChange={(e) => setCusto(limitarPreco(e.target.value))}
                  placeholder="0,00"
                />
                <FieldError message={(tocado || custo !== "") ? erros["custoUnitario"] : undefined} />
              </div>
              <p className="text-xs text-muted-foreground">
                As quantidades em estoque são gerenciadas na tela Estoque.
              </p>

              {unidadeAlterada ? (
                <div
                  role="alert"
                  className="flex gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3"
                >
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div className="space-y-1 text-xs">
                    <p className="text-sm font-semibold">
                      Você mudou a unidade de “{editando?.unidade}” para “{unidade}”
                    </p>
                    {receitasImpactadas.length === 0 ? (
                      <p className="text-muted-foreground">
                        Nenhum bolo ou cobertura usa este ingrediente — nada será impactado.
                      </p>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          {receitasImpactadas.length} receita(s) usam este ingrediente. O assistente pode
                          converter as quantidades para manter o mesmo peso/volume total:
                        </p>
                        <ul className="list-inside list-disc text-muted-foreground">
                          {receitasImpactadas.map((r) => (
                            <li key={`${r.tipo}-${r.id}`}>
                              <span className="font-medium text-foreground">
                                {r.tipo}: {r.nome}
                              </span>{" "}
                              — {qtd(r.quantidade!)} {editando?.unidade}
                              {r.equivalente !== null
                                ? ` → ${qtd(r.equivalente)} ${unidade}`
                                : ` — ${
                                    r.avaliacao.status === "ambigua"
                                      ? `conversão ambígua: ${r.avaliacao.motivo ?? ""}`
                                      : `sem equivalência automática: ${r.avaliacao.motivo ?? ""}`
                                  } Ajuste manualmente.`}
                            </li>
                          ))}
                        </ul>
                        {ajustaveis.length > 0 ? (
                          <label className="mt-2 flex items-start gap-2 text-xs">
                            <Checkbox
                              checked={ajustarReceitas}
                              onCheckedChange={(v) => setAjustarReceitas(v === true)}
                              aria-label="Ajustar quantidades das receitas automaticamente"
                            />
                            <span>
                              Ajustar automaticamente {ajustaveis.length} receita(s) ao salvar, mantendo o
                              mesmo peso/volume total.
                            </span>
                          </label>
                        ) : null}
                        {exigeConfirmacao ? (
                          <label className="mt-2 flex items-start gap-2 text-xs font-medium text-destructive">
                            <Checkbox
                              checked={confirmarManual}
                              onCheckedChange={(v) => setConfirmarManual(v === true)}
                              aria-label="Confirmo que ajustarei manualmente as receitas sem conversão confiável"
                            />
                            <span>
                              Confirmo que ajustarei manualmente {manuais.length} receita(s) sem fator de
                              conversão confiável.
                            </span>
                          </label>
                        ) : null}

                      </>
                    )}

                  </div>
                </div>
              ) : null}


              <div className="flex gap-2">
                <Button type="submit" disabled={salvar.isPending || bloqueado}>
                  {editando ? "Salvar alterações" : "Cadastrar"}
                </Button>
                {editando ? (
                  <Button type="button" variant="ghost" onClick={limpar}>
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrados ({ingredientes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyState message="Carregando..." />
            ) : ingredientes.length === 0 ? (
              <EmptyState message="Nenhum ingrediente cadastrado ainda." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>

                </TableHeader>
                <TableBody>
                  {ingredientes.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-semibold">{i.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{i.unidade}</TableCell>
                      <TableCell>{brl(i.custoUnitario)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Editar"
                          onClick={() => {
                            setEditando(i);
                            setNome(i.nome);
                            setUnidade(i.unidade);
                            setCusto(String(i.custoUnitario));
                            setTocado(false);


                            setTocado(false);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          description={`Excluir "${i.nome}"? Ingredientes usados em receitas não podem ser removidos.`}
                          onConfirm={() => excluir.mutate(i.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
