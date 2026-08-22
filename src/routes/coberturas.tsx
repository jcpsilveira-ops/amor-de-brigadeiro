import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, EmptyState } from "@/components/PageShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { ReceitaForm } from "@/components/ReceitaForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil } from "lucide-react";
import { brl, calcularCusto, dataBR, margem, type Receita, type ReceitaInput } from "@/lib/domain";
import { coberturasApi, keys, useAppMutation, useCoberturas, useIngredientes, useMercados, usePrecosMercado } from "@/lib/queries";
import { aplicarMenoresPrecos } from "@/lib/precos-mercado";

export const Route = createFileRoute("/coberturas")({
  head: () => ({
    meta: [
      { title: "Coberturas | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Cadastre coberturas com até 20 ingredientes e acompanhe custo de produção, preço e lucro por receita.",
      },
      { property: "og:title", content: "Coberturas | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Receitas de coberturas e recheios com custo calculado automaticamente.",
      },
    ],
  }),
  component: CoberturasPage,
});

function CoberturasPage() {
  const { data: coberturas = [], isLoading } = useCoberturas();
  const { data: ingredientesBase = [] } = useIngredientes();
  const { data: mercados = [] } = useMercados();
  const { data: precosMercado = [] } = usePrecosMercado();
  // O custo da receita usa o MENOR preço encontrado (estoque × supermercados).
  const { ingredientes, origens } = aplicarMenoresPrecos(ingredientesBase, precosMercado, mercados);
  const [editando, setEditando] = useState<Receita | null>(null);
  const [chave, setChave] = useState(0);

  const salvar = useAppMutation<ReceitaInput>({
    mutationFn: (input) =>
      editando ? coberturasApi.update(editando.id, input) : coberturasApi.create(input),
    invalidate: [keys.coberturas],
    successMessage: editando ? "Cobertura atualizada!" : "Cobertura cadastrada!",
    onSuccess: () => {
      setEditando(null);
      setChave((k) => k + 1);
    },
  });

  const excluir = useAppMutation({
    mutationFn: (id: number) => coberturasApi.remove(id),
    invalidate: [keys.coberturas],
    successMessage: "Cobertura excluída.",
  });

  return (
    <PageShell
      title="Coberturas"
      subtitle="O brilho final: receitas de cobertura com limite de 20 ingredientes e custo automático."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,460px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editando ? `Editar ${editando.nome}` : "Nova cobertura"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceitaForm
              key={`${editando?.id ?? "novo"}-${chave}`}
              entidade="cobertura"
              ingredientes={ingredientes}
              registro={editando}
              submitting={salvar.isPending}
              onSubmit={(input) => salvar.mutate(input)}
              {...(editando ? { onCancel: () => setEditando(null) } : {})}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receitas cadastradas ({coberturas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyState message="Carregando..." />
            ) : coberturas.length === 0 ? (
              <EmptyState message="Nenhuma cobertura cadastrada ainda." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cobertura</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Margem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coberturas.map((c) => {
                    const custo = calcularCusto(c.itens, ingredientes);
                    const { percentual } = margem(c.precoVenda, custo);
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-semibold">{c.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.itens.length} ingrediente(s) · criada em {dataBR(c.criadoEm)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Menor preço: {[...new Set(c.itens.map((i) => origens.get(i.ingredienteId)?.origem ?? "Estoque"))].join(", ")}
                          </p>
                        </TableCell>
                        <TableCell>{brl(custo)}</TableCell>
                        <TableCell>{brl(c.precoVenda)}</TableCell>
                        <TableCell>{percentual.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Editar"
                            onClick={() => setEditando(c)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDelete
                            description={`Excluir "${c.nome}"? Coberturas vinculadas a pedidos não podem ser removidas.`}
                            onConfirm={() => excluir.mutate(c.id)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
