import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyState } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Minus, PackageCheck, Plus, Save } from "lucide-react";
import { brl, hojeISO, UNIDADES, type Ingrediente, type Unidade } from "@/lib/domain";
import { converterQuantidade, qtd } from "@/lib/estoque";
import {
  ingredientesApi,
  keys,
  movimentacoesApi,
  useAppMutation,
  useIngredientes,
} from "@/lib/queries";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque de ingredientes | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Acompanhe o estoque atual de cada ingrediente da confeitaria: quantidade, unidade, custo unitário e valor total, com ajuste rápido de quantidades.",
      },
      { property: "og:title", content: "Estoque de ingredientes | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Quantidade, unidade, custo unitário e valor do estoque de ingredientes, com ajuste rápido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstoquePage,
});

const quantidadeNaUnidadeDeCompra = (ing: Ingrediente) =>
  converterQuantidade(ing.estoqueQuantidade, ing.estoqueUnidade ?? ing.unidade, ing.unidade) ?? 0;

const valorDoEstoque = (ing: Ingrediente) =>
  quantidadeNaUnidadeDeCompra(ing) * ing.custoUnitario;

const numeroBR = (v: string) => Number(v.replace(",", "."));

function EstoquePage() {
  const { data: ingredientes = [], isLoading } = useIngredientes();
  const [rascunhos, setRascunhos] = useState<
    Record<number, { quantidade: string; unidade: Unidade; custo: string }>
  >({});

  const total = useMemo(
    () => ingredientes.reduce((acc, ing) => acc + valorDoEstoque(ing), 0),
    [ingredientes],
  );
  const semEstoque = ingredientes.filter((i) => i.estoqueQuantidade <= 0);

  const salvar = useAppMutation({
    mutationFn: async ({
      ing,
      quantidade,
      unidade,
      custoUnitario,
    }: {
      ing: Ingrediente;
      quantidade: number;
      unidade: Unidade;
      custoUnitario: number;
    }) => {
      const unidadeAnterior = ing.estoqueUnidade ?? ing.unidade;
      const anteriorNaUnidade =
        converterQuantidade(ing.estoqueQuantidade, unidadeAnterior, unidade) ??
        ing.estoqueQuantidade;
      const delta = Math.round((quantidade - anteriorNaUnidade) * 1000) / 1000;
      const salvo = await ingredientesApi.update(ing.id, {
        nome: ing.nome,
        unidade: ing.unidade,
        custoUnitario,
        estoqueQuantidade: quantidade,
        estoqueUnidade: unidade,
      });
      if (delta !== 0) {
        const deltaNaCompra =
          converterQuantidade(Math.abs(delta), unidade, ing.unidade) ?? Math.abs(delta);
        const valor = Math.round(deltaNaCompra * custoUnitario * 100) / 100;
        await movimentacoesApi.create({
          ingredienteId: ing.id,
          data: hojeISO(),
          tipo: delta > 0 ? "entrada" : "saida",
          quantidade: Math.abs(delta),
          unidade,
          quantidadeAnterior: Math.round(anteriorNaUnidade * 1000) / 1000,
          quantidadeNova: quantidade,
          custoUnitario,
          valor,
          custoReposicao: delta < 0 ? valor : 0,
          observacao: null,
        });
      }
      setRascunhos((prev) => {
        const proximo = { ...prev };
        delete proximo[ing.id];
        return proximo;
      });
      return salvo;
    },
    invalidate: [keys.ingredientes, keys.movimentacoes],
    successMessage: "Estoque atualizado!",
  });


  const valorDe = (ing: Ingrediente) =>
    rascunhos[ing.id]?.quantidade ?? String(ing.estoqueQuantidade);
  const unidadeDe = (ing: Ingrediente) =>
    rascunhos[ing.id]?.unidade ?? (ing.estoqueUnidade ?? ing.unidade);
  const custoDe = (ing: Ingrediente) =>
    rascunhos[ing.id]?.custo ?? String(ing.custoUnitario);

  const atualizar = (
    ing: Ingrediente,
    patch: { quantidade?: string; unidade?: Unidade; custo?: string },
  ) =>
    setRascunhos((prev) => ({
      ...prev,
      [ing.id]: {
        quantidade: patch.quantidade ?? valorDe(ing),
        unidade: patch.unidade ?? unidadeDe(ing),
        custo: patch.custo ?? custoDe(ing),
      },
    }));

  // Custo de reposição por item = quantidade em estoque (convertida para a unidade
  // de compra) x custo unitário informado.
  const reposicaoDe = (ing: Ingrediente) => {
    const quantidade = numeroBR(valorDe(ing)) || 0;
    const custo = numeroBR(custoDe(ing)) || 0;
    const naCompra = converterQuantidade(quantidade, unidadeDe(ing), ing.unidade);
    const convertivel = naCompra !== null && naCompra !== undefined;
    const quantidadeCompra = convertivel ? naCompra : quantidade;
    return { quantidadeCompra, custo, total: quantidadeCompra * custo, convertivel };
  };

  const ajustar = (ing: Ingrediente, delta: number) => {
    const atual = numeroBR(valorDe(ing)) || 0;
    const proximo = Math.max(0, Math.round((atual + delta) * 1000) / 1000);
    atualizar(ing, { quantidade: String(proximo) });
  };

  const alterado = (ing: Ingrediente) => {
    const rascunho = rascunhos[ing.id];
    if (!rascunho) return false;
    const numero = numeroBR(rascunho.quantidade);
    const custo = numeroBR(rascunho.custo);
    if (!Number.isFinite(numero) || numero < 0) return false;
    if (!Number.isFinite(custo) || custo < 0) return false;
    return (
      numero !== ing.estoqueQuantidade ||
      rascunho.unidade !== (ing.estoqueUnidade ?? ing.unidade) ||
      custo !== ing.custoUnitario
    );
  };

  const passoDe = (ing: Ingrediente) => (unidadeDe(ing) === "unidade" ? 1 : 0.1);

  return (
    <PageShell
      title="Estoque de ingredientes"
      subtitle="Veja quanto você tem de cada ingrediente e ajuste as quantidades conforme compra ou usa."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="label-caps">Valor total do estoque</p>
          <p className="mt-1 font-display text-2xl text-primary">{brl(total)}</p>
        </div>
        <div className="panel p-5">
          <p className="label-caps">Ingredientes cadastrados</p>
          <p className="mt-1 font-display text-2xl text-primary">{ingredientes.length}</p>
        </div>
        <div className="panel p-5">
          <p className="label-caps">Sem estoque</p>
          <p className="mt-1 font-display text-2xl text-primary">{semEstoque.length}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-accent" />
            Estoque atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando estoque…</p>
          ) : ingredientes.length === 0 ? (
            <EmptyState message="Nenhum ingrediente cadastrado ainda." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Custo unitário</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Custo de reposição</TableHead>
                    <TableHead className="text-right">Valor em estoque</TableHead>
                    <TableHead className="text-right">Ajustar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientes.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell className="font-semibold">
                        {ing.nome}
                        {ing.estoqueQuantidade <= 0 && (
                          <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                            sem estoque
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <Input
                            className="w-24"
                            inputMode="decimal"
                            aria-label={`Custo unitário de ${ing.nome}`}
                            value={custoDe(ing)}
                            onChange={(e) => atualizar(ing, { custo: e.target.value })}
                          />
                          <span className="text-xs text-muted-foreground">/ {ing.unidade}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Atual: {brl(ing.custoUnitario)} / {ing.unidade}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={`Diminuir estoque de ${ing.nome}`}
                            onClick={() => ajustar(ing, -passoDe(ing))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            className="w-24"
                            inputMode="decimal"
                            aria-label={`Quantidade em estoque de ${ing.nome}`}
                            value={valorDe(ing)}
                            onChange={(e) => atualizar(ing, { quantidade: e.target.value })}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={`Aumentar estoque de ${ing.nome}`}
                            onClick={() => ajustar(ing, passoDe(ing))}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Select
                            value={unidadeDe(ing)}
                            onValueChange={(v) => atualizar(ing, { unidade: v as Unidade })}
                          >
                            <SelectTrigger
                              className="w-[110px]"
                              aria-label={`Unidade do estoque de ${ing.nome}`}
                            >
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
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Atual: {qtd(ing.estoqueQuantidade)} {ing.estoqueUnidade ?? ing.unidade}
                        </p>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const r = reposicaoDe(ing);
                          return (
                            <>
                              <p className="font-display text-base text-primary">{brl(r.total)}</p>
                              <p className="text-xs text-muted-foreground">
                                {qtd(r.quantidadeCompra)} {ing.unidade} × {brl(r.custo)} ={" "}
                                {brl(r.total)}
                              </p>
                              {!r.convertivel && (
                                <p className="text-xs text-destructive">
                                  Unidade do estoque incompatível com {ing.unidade} — usamos a
                                  quantidade informada.
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right font-display text-base text-primary">
                        {brl(valorDoEstoque(ing))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          disabled={!alterado(ing) || salvar.isPending}
                          onClick={() =>
                            salvar.mutate({
                              ing,
                              quantidade: numeroBR(valorDe(ing)),
                              unidade: unidadeDe(ing),
                              custoUnitario: numeroBR(custoDe(ing)),
                            })
                          }
                        >
                          <Save className="mr-1.5 h-4 w-4" />
                          Salvar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
