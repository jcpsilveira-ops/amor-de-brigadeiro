import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, EmptyState } from "@/components/PageShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { ItensMenorPreco } from "@/components/ItensMenorPreco";
import { ReceitaForm } from "@/components/ReceitaForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil } from "lucide-react";
import { brl, calcularCusto, dataBR, margem, type Receita, type ReceitaInput } from "@/lib/domain";
import { bolosApi, keys, useAppMutation, useBolos, useIngredientes, useMercados, usePrecosMercado } from "@/lib/queries";
import { aplicarMenoresPrecos } from "@/lib/precos-mercado";

export const Route = createFileRoute("/bolos")({
  head: () => ({
    meta: [
      { title: "Bolos | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Monte receitas de bolos com até 20 ingredientes e veja o custo de produção e a margem calculados na hora.",
      },
      { property: "og:title", content: "Bolos | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Receitas de bolos com cálculo automático de custo, preço de venda e lucro.",
      },
    ],
  }),
  component: BolosPage,
});

function BolosPage() {
  const { data: bolos = [], isLoading } = useBolos();
  const { data: ingredientesBase = [] } = useIngredientes();
  const { data: mercados = [] } = useMercados();
  const { data: precosMercado = [] } = usePrecosMercado();
  // O custo da receita usa o MENOR preço encontrado (estoque × supermercados).
  const { ingredientes, origens } = aplicarMenoresPrecos(ingredientesBase, precosMercado, mercados);
  const [editando, setEditando] = useState<Receita | null>(null);
  const [chave, setChave] = useState(0);

  const salvar = useAppMutation<ReceitaInput>({
    mutationFn: (input) =>
      editando ? bolosApi.update(editando.id, input) : bolosApi.create(input),
    invalidate: [keys.bolos],
    successMessage: editando ? "Bolo atualizado!" : "Bolo cadastrado!",
    onSuccess: () => {
      setEditando(null);
      setChave((k) => k + 1);
    },
  });

  const excluir = useAppMutation({
    mutationFn: (id: number) => bolosApi.remove(id),
    invalidate: [keys.bolos],
    successMessage: "Bolo excluído.",
  });

  return (
    <PageShell
      title="Bolos"
      subtitle="Até 20 ingredientes por receita, com custo de produção calculado automaticamente."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,460px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editando ? `Editar ${editando.nome}` : "Novo bolo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceitaForm
              key={`${editando?.id ?? "novo"}-${chave}`}
              entidade="bolo"
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
            <CardTitle>Receitas cadastradas ({bolos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyState message="Carregando..." />
            ) : bolos.length === 0 ? (
              <EmptyState message="Nenhum bolo cadastrado ainda." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bolo</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Margem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bolos.map((b) => {
                    const custo = calcularCusto(b.itens, ingredientes);
                    const { percentual } = margem(b.precoVenda, custo);
                    return (
                      <TableRow key={b.id}>
                        <TableCell>
                          <p className="font-semibold">{b.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.itens.length} ingrediente(s) · criado em {dataBR(b.criadoEm)}
                          </p>
                          <ItensMenorPreco itens={b.itens} ingredientes={ingredientes} origens={origens} />
                        </TableCell>
                        <TableCell>{brl(custo)}</TableCell>
                        <TableCell>{brl(b.precoVenda)}</TableCell>
                        <TableCell>{percentual.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Editar"
                            onClick={() => setEditando(b)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDelete
                            description={`Excluir "${b.nome}"? Bolos vinculados a pedidos não podem ser removidos.`}
                            onConfirm={() => excluir.mutate(b.id)}
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
