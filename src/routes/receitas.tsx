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
import { receitasAvulsasApi, keys, useAppMutation, useReceitasAvulsas } from "@/lib/queries";

export const Route = createFileRoute("/receitas")({
  head: () => ({
    meta: [
      { title: "Outras receitas | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Registre outras receitas da confeitaria com data, descrição e valor para acompanhar as entradas do mês.",
      },
      { property: "og:title", content: "Outras receitas | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Controle de entradas avulsas da Amor de Brigadeiro: data, descrição e valor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReceitasPage,
});

function ReceitasPage() {
  const { data: receitas = [], isLoading } = useReceitasAvulsas();
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

  const total = receitas.reduce((acc, r) => acc + r.valor, 0);

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
        ? receitasAvulsasApi.update(editando.id, parsed.data)
        : receitasAvulsasApi.create(parsed.data);
    },
    invalidate: [keys.receitasAvulsas],
    successMessage: editando ? "Receita atualizada!" : "Receita registrada!",
    onSuccess: limpar,
  });

  const excluir = useAppMutation({
    mutationFn: (id: number) => receitasAvulsasApi.remove(id),
    invalidate: [keys.receitasAvulsas],
    successMessage: "Receita excluída.",
  });

  return (
    <PageShell
      title="Outras receitas"
      subtitle="Entradas que não vêm dos pedidos — vendas avulsas, brindes pagos e afins."
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editando ? "Editar receita" : "Nova receita"}</CardTitle>
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
                  placeholder="Venda de doces na feira"
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
                  onChange={(e) => setValor(limitarPreco(e.target.value))}
                  placeholder="150,00"
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
              Registradas ({receitas.length}) — total {brl(total)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyState message="Carregando..." />
            ) : receitas.length === 0 ? (
              <EmptyState message="Nenhuma receita registrada ainda." />
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
                  {receitas.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{dataBR(r.data)}</TableCell>
                      <TableCell className="font-semibold">{r.descricao}</TableCell>
                      <TableCell className="text-right">{brl(r.valor)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Editar"
                          onClick={() => {
                            setEditando(r);
                            setData(r.data);
                            setDescricao(r.descricao);
                            setValor(String(r.valor));
                            setTocado(false);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          description={`Excluir a receita "${r.descricao}"?`}
                          onConfirm={() => excluir.mutate(r.id)}
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
