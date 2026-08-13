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
import { analisarEstoqueProximoPedido, converterQuantidade, qtd } from "@/lib/estoque";
import {
  ingredientesApi,
  keys,
  useAppMutation,
  useBolos,
  useCoberturas,
  useIngredientes,
  usePedidos,
} from "@/lib/queries";
import { dataBR } from "@/lib/domain";

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

  function limpar() {
    setEditando(null);
    setNome("");
    setUnidade("");
    setCusto("");
    setTocado(false);
  }


  const salvar = useAppMutation({
    mutationFn: async () => {
      if (!parsed.success) return;
      return editando
        ? ingredientesApi.update(editando.id, parsed.data)
        : ingredientesApi.create(parsed.data);
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
                  onChange={(e) => setCusto(e.target.value.replace(",", "."))}
                  placeholder="0,00"
                />
                <FieldError message={(tocado || custo !== "") ? erros["custoUnitario"] : undefined} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="estoque">Estoque disponível</Label>
                  <Input
                    id="estoque"
                    inputMode="decimal"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value.replace(",", "."))}
                    placeholder="0"
                  />
                  <FieldError message={estoque !== "" ? erros["estoqueQuantidade"] : undefined} />
                </div>
                <div>
                  <Label htmlFor="estoque-unidade">Unidade do estoque</Label>
                  <Select
                    value={estoqueUnidade || unidade}
                    onValueChange={(v) => setEstoqueUnidade(v as Unidade)}
                  >
                    <SelectTrigger id="estoque-unidade">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map((u) => (
                        <SelectItem key={`estoque-${u}`} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={tocado ? erros["estoqueUnidade"] : undefined} />
                </div>
              </div>
              {avisoForm ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{avisoForm}</span>
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={salvar.isPending}>
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
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientes.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-semibold">{i.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{i.unidade}</TableCell>
                      <TableCell>{brl(i.custoUnitario)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            analise.porIngrediente.get(i.id)?.insuficiente
                              ? "font-semibold text-destructive"
                              : undefined
                          }
                        >
                          {i.estoqueQuantidade.toLocaleString("pt-BR")} {i.estoqueUnidade}
                        </span>
                        {analise.porIngrediente.get(i.id)?.insuficiente ? (
                          <span
                            className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive"
                            title={`Faltam ${qtd(
                              analise.porIngrediente.get(i.id)!.faltando,
                            )} ${i.unidade} para o próximo pedido`}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Faltam {qtd(analise.porIngrediente.get(i.id)!.faltando)} {i.unidade}
                          </span>
                        ) : null}
                      </TableCell>
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
                            setEstoque(String(i.estoqueQuantidade));
                            setEstoqueUnidade(i.estoqueUnidade);
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
