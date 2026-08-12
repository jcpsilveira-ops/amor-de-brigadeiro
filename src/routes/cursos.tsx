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
import { cursosApi, keys, useAppMutation, useCursos, useIngredientes } from "@/lib/queries";

export const Route = createFileRoute("/cursos")({
  head: () => ({
    meta: [
      { title: "Cursos | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Cadastre cursos da confeitaria com até 20 insumos, valor da inscrição e custo de realização calculados na hora.",
      },
      { property: "og:title", content: "Cursos | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Cursos com valor da inscrição, custo dos insumos e margem calculada automaticamente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CursosPage,
});

function CursosPage() {
  const { data: cursos = [], isLoading } = useCursos();
  const { data: ingredientes = [] } = useIngredientes();
  const [editando, setEditando] = useState<Receita | null>(null);
  const [chave, setChave] = useState(0);

  const salvar = useAppMutation<ReceitaInput>({
    mutationFn: (input) =>
      editando ? cursosApi.update(editando.id, input) : cursosApi.create(input),
    invalidate: [keys.cursos],
    successMessage: editando ? "Curso atualizado!" : "Curso cadastrado!",
    onSuccess: () => {
      setEditando(null);
      setChave((k) => k + 1);
    },
  });

  const excluir = useAppMutation({
    mutationFn: (id: number) => cursosApi.remove(id),
    invalidate: [keys.cursos],
    successMessage: "Curso excluído.",
  });

  return (
    <PageShell
      title="Cursos"
      subtitle="Até 20 insumos por curso, com custo de realização calculado automaticamente."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,460px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editando ? `Editar ${editando.nome}` : "Novo curso"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceitaForm
              key={`${editando?.id ?? "novo"}-${chave}`}
              entidade="curso"
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
            <CardTitle>Cursos cadastrados ({cursos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyState message="Carregando..." />
            ) : cursos.length === 0 ? (
              <EmptyState message="Nenhum curso cadastrado ainda." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Valor da inscrição</TableHead>
                    <TableHead>Margem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursos.map((c) => {
                    const custo = calcularCusto(c.itens, ingredientes);
                    const { percentual } = margem(c.precoVenda, custo);
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-semibold">{c.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.itens.length} insumo(s) · criado em {dataBR(c.criadoEm)}
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
                            description={`Excluir "${c.nome}"? Cursos vinculados a pedidos não podem ser removidos.`}
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
