import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, EmptyState, FieldError } from "@/components/PageShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageCircle, Pencil } from "lucide-react";
import { clienteSchema, type Cliente } from "@/lib/domain";
import { clientesApi, keys, useAppMutation, useClientes } from "@/lib/queries";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes | Amor de Brigadeiro" },
      {
        name: "description",
        content: "Cadastro de clientes com nome e WhatsApp para agilizar o atendimento e os pedidos.",
      },
      { property: "og:title", content: "Clientes | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Lista de clientes da confeitaria com contato direto por WhatsApp.",
      },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const { data: clientes = [], isLoading } = useClientes();
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tocado, setTocado] = useState(false);

  const parsed = clienteSchema.safeParse({ nome, whatsapp });
  const erros: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) erros[issue.path.join(".")] = issue.message;
  }

  function limpar() {
    setEditando(null);
    setNome("");
    setWhatsapp("");
    setTocado(false);
  }

  const salvar = useAppMutation({
    mutationFn: async () => {
      if (!parsed.success) return;
      return editando
        ? clientesApi.update(editando.id, parsed.data)
        : clientesApi.create(parsed.data);
    },
    invalidate: [keys.clientes],
    successMessage: editando ? "Cliente atualizado!" : "Cliente cadastrado!",
    onSuccess: limpar,
  });

  const excluir = useAppMutation({
    mutationFn: (id: number) => clientesApi.remove(id),
    invalidate: [keys.clientes],
    successMessage: "Cliente excluído.",
  });

  return (
    <PageShell title="Clientes" subtitle="Quem faz a doçura acontecer — contatos sempre à mão.">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editando ? "Editar cliente" : "Novo cliente"}</CardTitle>
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
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Marina Souza" />
                <FieldError message={tocado || nome !== "" ? erros["nome"] : undefined} />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 98888-1234"
                />
                <FieldError message={tocado || whatsapp !== "" ? erros["whatsapp"] : undefined} />
              </div>
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
            <CardTitle>Cadastrados ({clientes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyState message="Carregando..." />
            ) : clientes.length === 0 ? (
              <EmptyState message="Nenhum cliente cadastrado ainda." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold">{c.nome}</TableCell>
                      <TableCell>
                        <a
                          className="inline-flex items-center gap-1.5 text-accent hover:underline"
                          href={`https://wa.me/${encodeURIComponent(c.whatsapp.replace(/\D/g, ""))}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {c.whatsapp}
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label="Editar"
                          onClick={() => {
                            setEditando(c);
                            setNome(c.nome);
                            setWhatsapp(c.whatsapp);
                            setTocado(false);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          description={`Excluir "${c.nome}"? Clientes com pedidos não podem ser removidos.`}
                          onConfirm={() => excluir.mutate(c.id)}
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
