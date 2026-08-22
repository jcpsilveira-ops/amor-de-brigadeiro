import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, EmptyState, FieldError } from "@/components/PageShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil } from "lucide-react";
import { brl, dataBR, despesaSchema, hojeISO, limitarPreco, type Despesa } from "@/lib/domain";
import { despesasApi, keys, useAppMutation, useDespesas } from "@/lib/queries";

export const Route = createFileRoute("/despesas")({
  head: () => ({
    meta: [
      { title: "Outras despesas | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Registre outras despesas da confeitaria com data, descrição e valor para acompanhar os gastos do mês.",
      },
      { property: "og:title", content: "Outras despesas | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Controle de gastos avulsos da Amor de Brigadeiro: data, descrição e valor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DespesasPage,
});

function DespesasPage() {
  const { data: despesas = [], isLoading } = useDespesas();
  const [editando, setEditando] = useState<Despesa | null>(null);
  const [data, setData] = useState(hojeISO());
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tocado, setTocado] = useState(false);

  const parsed = despesaSchema.safeParse({ data, descricao, valor });
  const erros: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) erros[issue.path.join(".")] = issue.message;
  }

  const total = despesas.reduce((acc, d) => acc + d.valor, 0);

  function limpar() {
    setEditando(null);
    setData(hojeISO());
    setDescricao("");
    setValor("");
    setTocado(false);
  }

  const salvar = useAppMutation({
    mutationFn: async () => {
      if (!parsed.success) return;
      return editando
        ? despesasApi.update(editando.id, parsed.data)
        : despesasApi.create(parsed.data);
    },
    invalidate: [keys.despesas],
    successMessage: editando ? "Despesa atualizada!" : "Despesa registrada!",
    onSuccess: limpar,
  });

  const excluir = useAppMutation({
    mutationFn: (id: number) => despesasApi.remove(id),
    invalidate: [keys.despesas],
    successMessage: "Despesa excluída.",
  });

  return (
    <PageShell
      title="Outras despesas"
      subtitle="Gastos que não estão nas receitas — embalagens, gás, entregas e afins."
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editando ? "Editar despesa" : "Nova despesa"}</CardTitle>
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
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
                <FieldError message={tocado ? erros["data"] : undefined} />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Embalagens e caixinhas"
                />
                <FieldError message={tocado || descricao !== "" ? erros["descricao"] : undefined} />
              </div>
              <div>
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="35,00"
                />
                <FieldError message={tocado || valor !== "" ? erros["valor"] : undefined} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={salvar.isPending}>
                  {editando ? "Salvar alterações" : "Registrar"}
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
            <CardTitle>
              Registradas ({despesas.length}) — total {brl(total)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyState message="Carregando..." />
            ) : despesas.length === 0 ? (
              <EmptyState message="Nenhuma despesa registrada ainda." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesas.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{dataBR(d.data)}</TableCell>
                      <TableCell className="font-semibold">{d.descricao}</TableCell>
                      <TableCell className="text-right">{brl(d.valor)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Editar"
                          onClick={() => {
                            setEditando(d);
                            setData(d.data);
                            setDescricao(d.descricao);
                            setValor(String(d.valor));
                            setTocado(false);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          description={`Excluir a despesa "${d.descricao}"?`}
                          onConfirm={() => excluir.mutate(d.id)}
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
