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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { registrarConsumoDoPedido } from "@/lib/consumo-pedido";

import {
  brl,
  calcularCusto,
  dataBR,
  hojeISO,
  pedidoSchema,
  type Pedido,
} from "@/lib/domain";
import {
  keys,
  pedidosApi,
  useAppMutation,
  useBolos,
  useClientes,
  useCoberturas,
  useCursos,
  useIngredientes,
  usePedidos,
} from "@/lib/queries";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Registre pedidos ligando cliente, bolo e cobertura, com custo e preço total calculados automaticamente.",
      },
      { property: "og:title", content: "Pedidos | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Controle de pedidos da confeitaria com totais de custo e venda.",
      },
    ],
  }),
  component: PedidosPage,
});

const SEM_COBERTURA = "sem";
const SEM_BOLO = "sem-bolo";
const SEM_CURSO = "sem-curso";

function PedidosPage() {
  const { data: pedidos = [], isLoading } = usePedidos();
  const { data: clientes = [] } = useClientes();
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const { data: cursos = [] } = useCursos();
  const { data: ingredientes = [] } = useIngredientes();

  const [editando, setEditando] = useState<Pedido | null>(null);
  const [clienteId, setClienteId] = useState("");
  const [boloId, setBoloId] = useState(SEM_BOLO);
  const [coberturaId, setCoberturaId] = useState(SEM_COBERTURA);
  const [cursoId, setCursoId] = useState(SEM_CURSO);
  const [data, setData] = useState(hojeISO());
  const [outrosItens, setOutrosItens] = useState<{ ingredienteId: string; quantidade: string }[]>(
    [],
  );
  const [outrosPreco, setOutrosPreco] = useState("0");
  const [tocado, setTocado] = useState(false);

  const outrosLimpos = outrosItens.filter((i) => i.ingredienteId !== "");

  const parsed = pedidoSchema.safeParse({
    clienteId,
    boloId: boloId === SEM_BOLO ? null : boloId,
    coberturaId: coberturaId === SEM_COBERTURA ? null : coberturaId,
    cursoId: cursoId === SEM_CURSO ? null : cursoId,
    data,
    outrosItens: outrosLimpos,
    outrosPreco,
  });
  const erros: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) erros[issue.path.join(".")] = issue.message;
  }

  function limpar() {
    setEditando(null);
    setClienteId("");
    setBoloId(SEM_BOLO);
    setCoberturaId(SEM_COBERTURA);
    setCursoId(SEM_CURSO);
    setData(hojeISO());
    setOutrosItens([]);
    setOutrosPreco("0");
    setTocado(false);
  }



  const salvar = useAppMutation({
    mutationFn: async () => {
      if (!parsed.success) return;
      if (editando) return pedidosApi.update(editando.id, parsed.data);
      const criado = await pedidosApi.create(parsed.data);
      const bolo = bolos.find((b) => b.id === criado.boloId);
      const cobertura = coberturas.find((c) => c.id === criado.coberturaId);
      const extras =
        criado.outrosItens.length > 0
          ? ({ id: 0, nome: "Outros itens", precoVenda: 0, criadoEm: "", itens: criado.outrosItens } as const)
          : undefined;
      const partes = [bolo?.nome, cobertura?.nome, extras ? "outros itens" : null]
        .filter(Boolean)
        .join(" + ");
      await registrarConsumoDoPedido({
        data: criado.data,
        descricao: `Produção do pedido #${criado.id}${partes ? ` — ${partes}` : ""}`,
        ingredientes,
        receitas: [bolo, cobertura, extras],
      });

      return criado;
    },
    invalidate: [keys.pedidos, keys.ingredientes, keys.movimentacoes],
    successMessage: editando
      ? "Pedido atualizado!"
      : "Pedido registrado e estoque baixado!",
    onSuccess: limpar,
  });


  const excluir = useAppMutation({
    mutationFn: (id: number) => pedidosApi.remove(id),
    invalidate: [keys.pedidos],
    successMessage: "Pedido excluído.",
  });

  return (
    <PageShell title="Pedidos" subtitle="Cliente + bolo, cobertura ou curso, com custo e preço somados na hora.">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editando ? `Editar pedido #${editando.id}` : "Novo pedido"}</CardTitle>
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
                <Label>Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={tocado ? erros["clienteId"] : undefined} />
              </div>
              <div>
                <Label>Bolo</Label>
                <Select value={boloId} onValueChange={setBoloId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o bolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_BOLO}>Sem bolo</SelectItem>
                    {bolos.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.nome} — {brl(b.precoVenda)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={tocado ? erros["boloId"] : undefined} />
              </div>
              <div>
                <Label>Cobertura</Label>
                <Select value={coberturaId} onValueChange={setCoberturaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cobertura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_COBERTURA}>Sem cobertura</SelectItem>
                    {coberturas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome} — {brl(c.precoVenda)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Curso</Label>
                <Select value={cursoId} onValueChange={setCursoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_CURSO}>Sem curso</SelectItem>
                    {cursos.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome} — {brl(c.precoVenda)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 rounded-md border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <Label>Outros itens (estoque)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setOutrosItens((atual) => [...atual, { ingredienteId: "", quantidade: "1" }])
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" /> Adicionar
                  </Button>
                </div>
                {outrosItens.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhum item extra. Use para vender itens direto do estoque.
                  </p>
                ) : (
                  outrosItens.map((item, indice) => {
                    const ing = ingredientes.find((i) => String(i.id) === item.ingredienteId);
                    return (
                      <div key={indice} className="space-y-2 rounded-md bg-muted/40 p-2">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <Select
                              value={item.ingredienteId}
                              onValueChange={(valor) =>
                                setOutrosItens((atual) =>
                                  atual.map((linha, i) =>
                                    i === indice ? { ...linha, ingredienteId: valor } : linha,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o item" />
                              </SelectTrigger>
                              <SelectContent>
                                {ingredientes.map((i) => (
                                  <SelectItem key={i.id} value={String(i.id)}>
                                    {i.nome} ({i.estoqueQuantidade} {i.estoqueUnidade ?? i.unidade})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Remover item"
                            onClick={() =>
                              setOutrosItens((atual) => atual.filter((_, i) => i !== indice))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            className="w-28"
                            type="number"
                            step="0.001"
                            min="0"
                            aria-label="Quantidade"
                            value={item.quantidade}
                            onChange={(e) =>
                              setOutrosItens((atual) =>
                                atual.map((linha, i) =>
                                  i === indice ? { ...linha, quantidade: e.target.value } : linha,
                                ),
                              )
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {ing ? `${ing.estoqueUnidade ?? ing.unidade} · disponível: ${ing.estoqueQuantidade} ${ing.estoqueUnidade ?? ing.unidade}` : "Selecione o item para ver a unidade"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <FieldError message={tocado ? erros["outrosItens"] : undefined} />
                <div>
                  <Label htmlFor="outrosPreco">Preço de venda dos outros itens</Label>
                  <Input
                    id="outrosPreco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={outrosPreco}
                    onChange={(e) => setOutrosPreco(e.target.value)}
                  />
                  <FieldError message={tocado ? erros["outrosPreco"] : undefined} />
                </div>
              </div>
              <div>

                <Label htmlFor="data">Data do pedido</Label>
                <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
                <FieldError message={tocado ? erros["data"] : undefined} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={salvar.isPending}>
                  {editando ? "Salvar alterações" : "Registrar pedido"}
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
            <CardTitle>Pedidos registrados ({pedidos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EmptyState message="Carregando..." />
            ) : pedidos.length === 0 ? (
              <EmptyState message="Nenhum pedido registrado ainda." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Bolo / Cobertura / Curso / Outros</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((p) => {
                    const cliente = clientes.find((c) => c.id === p.clienteId);
                    const bolo = bolos.find((b) => b.id === p.boloId);
                    const cobertura = coberturas.find((c) => c.id === p.coberturaId);
                    const curso = cursos.find((c) => c.id === p.cursoId);
                    const custo =
                      (bolo ? calcularCusto(bolo.itens, ingredientes) : 0) +
                      (cobertura ? calcularCusto(cobertura.itens, ingredientes) : 0) +
                      (curso ? calcularCusto(curso.itens, ingredientes) : 0) +
                      calcularCusto(p.outrosItens ?? [], ingredientes);
                    const total =
                      (bolo?.precoVenda ?? 0) +
                      (cobertura?.precoVenda ?? 0) +
                      (curso?.precoVenda ?? 0) +
                      (p.outrosPreco ?? 0);
                    const extras = (p.outrosItens ?? [])
                      .map((item) => {
                        const ing = ingredientes.find((i) => i.id === item.ingredienteId);
                        return `${ing?.nome ?? "Item removido"} ${item.quantidade}${ing?.unidade ?? ""}`;
                      })
                      .join(", ");
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground">{p.id}</TableCell>
                        <TableCell className="font-semibold">{cliente?.nome ?? "—"}</TableCell>
                        <TableCell>
                          <p>{bolo?.nome ?? "Sem bolo"}</p>
                          <p className="text-xs text-muted-foreground">
                            {cobertura?.nome ?? "Sem cobertura"}
                            {curso ? ` · Curso: ${curso.nome}` : ""}
                          </p>
                          {extras ? (
                            <p className="text-xs text-muted-foreground">Outros: {extras}</p>
                          ) : null}
                        </TableCell>

                        <TableCell>{dataBR(p.data)}</TableCell>
                        <TableCell>{brl(custo)}</TableCell>
                        <TableCell className="font-semibold">{brl(total)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Editar"
                            onClick={() => {
                              setEditando(p);
                              setClienteId(String(p.clienteId));
                              setBoloId(p.boloId ? String(p.boloId) : SEM_BOLO);
                              setCoberturaId(p.coberturaId ? String(p.coberturaId) : SEM_COBERTURA);
                              setCursoId(p.cursoId ? String(p.cursoId) : SEM_CURSO);
                              setData(p.data.slice(0, 10));
                              setOutrosItens(
                                (p.outrosItens ?? []).map((item) => ({
                                  ingredienteId: String(item.ingredienteId),
                                  quantidade: String(item.quantidade),
                                })),
                              );
                              setOutrosPreco(String(p.outrosPreco ?? 0));
                              setTocado(false);

                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDelete
                            description={`Excluir o pedido #${p.id}?`}
                            onConfirm={() => excluir.mutate(p.id)}
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
