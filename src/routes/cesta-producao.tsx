import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBasket, Scale, Percent, Wheat } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { EmptyState } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { brl } from "@/lib/domain";
import {
  brlPreciso,
  montarCesta,
  qtd,
  resumirIngredientes,
  type LinhaCesta,
} from "@/lib/cesta";
import { useBolos, useCoberturas, useIngredientes } from "@/lib/queries";

export const Route = createFileRoute("/cesta-producao")({
  head: () => ({
    meta: [
      { title: "Cesta da produção | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Cruzamento dos ingredientes das receitas: preço de compra, custo por receita, custo por grama, custo por bolo ou cobertura e margem de lucro.",
      },
      { property: "og:title", content: "Cesta da produção | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Veja quanto cada ingrediente pesa no custo, o custo por grama de cada receita e a margem de lucro por bolo e cobertura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CestaProducao,
});

const Kpi = ({
  titulo,
  valor,
  detalhe,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  icone: typeof Scale;
}) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
      <CardTitle className="label-caps text-muted-foreground">{titulo}</CardTitle>
      <Icone className="h-4 w-4 text-primary" />
    </CardHeader>
    <CardContent>
      <p className="font-display text-2xl text-primary">{valor}</p>
      {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
    </CardContent>
  </Card>
);

function CartaoReceita({ linha }: { linha: LinhaCesta }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-display text-xl text-primary">
            {linha.nome}
          </CardTitle>
          <span className="label-caps rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {linha.tipo}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Peso da receita: {qtd(linha.gramasTotais)} g/ml
          {linha.itensPorUnidade > 0
            ? ` + ${qtd(linha.itensPorUnidade)} item(ns) por unidade`
            : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead className="text-right">Qtde</TableHead>
                <TableHead className="text-right">Preço de compra</TableHead>
                <TableHead className="text-right">Custo na receita</TableHead>
                <TableHead className="text-right">Custo por g/ml</TableHead>
                <TableHead className="text-right">Peso no custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linha.itens.map((item) => (
                <TableRow key={item.ingredienteId}>
                  <TableCell className="font-semibold">{item.nome}</TableCell>
                  <TableCell className="text-right">
                    {qtd(item.quantidade)} {item.unidade}
                  </TableCell>
                  <TableCell className="text-right">
                    {brl(item.precoCompra)}/{item.unidade}
                  </TableCell>
                  <TableCell className="text-right">{brl(item.custo)}</TableCell>
                  <TableCell className="text-right">
                    {item.custoPorGrama === null ? "—" : brlPreciso(item.custoPorGrama)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.participacao.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="label-caps text-muted-foreground">Custo por receita</p>
            <p className="font-display text-lg text-primary">{brl(linha.custoReceita)}</p>
          </div>
          <div>
            <p className="label-caps text-muted-foreground">Custo por grama</p>
            <p className="font-display text-lg text-primary">
              {linha.custoPorGrama > 0 ? brlPreciso(linha.custoPorGrama) : "—"}
            </p>
          </div>
          <div>
            <p className="label-caps text-muted-foreground">
              Preço por {linha.tipo.toLowerCase()}
            </p>
            <p className="font-display text-lg text-primary">{brl(linha.precoVenda)}</p>
          </div>
          <div>
            <p className="label-caps text-muted-foreground">Lucro</p>
            <p className="font-display text-lg text-primary">{brl(linha.lucro)}</p>
          </div>
          <div>
            <p className="label-caps text-muted-foreground">Margem</p>
            <p className="font-display text-lg text-primary">
              {linha.percentual.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CestaProducao() {
  const { data: bolos = [] } = useBolos();
  const { data: coberturas = [] } = useCoberturas();
  const { data: ingredientes = [] } = useIngredientes();
  const [tipo, setTipo] = useState<"todos" | "bolos" | "coberturas">("todos");

  const linhas = useMemo(() => {
    const todas = [
      ...montarCesta(bolos, "Bolo", ingredientes),
      ...montarCesta(coberturas, "Cobertura", ingredientes),
    ];
    const filtradas =
      tipo === "bolos"
        ? todas.filter((l) => l.tipo === "Bolo")
        : tipo === "coberturas"
          ? todas.filter((l) => l.tipo === "Cobertura")
          : todas;
    return filtradas.sort((a, b) => b.percentual - a.percentual);
  }, [bolos, coberturas, ingredientes, tipo]);

  const cesta = useMemo(() => resumirIngredientes(linhas), [linhas]);

  const custoTotal = linhas.reduce((a, l) => a + l.custoReceita, 0);
  const custoPorGramaMedio = (() => {
    const gramas = linhas.reduce((a, l) => a + l.gramasTotais, 0);
    return gramas > 0 ? custoTotal / gramas : 0;
  })();
  const margemMedia = linhas.length
    ? linhas.reduce((a, l) => a + l.percentual, 0) / linhas.length
    : 0;

  return (
    <PageShell
      title="Cesta da produção"
      subtitle="Preço de compra → custo por receita → custo por grama → custo por bolo/cobertura → margem de lucro."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3 panel p-4">
        <Label htmlFor="filtro-cesta" className="label-caps">
          Mostrar
        </Label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
          <SelectTrigger id="filtro-cesta" className="w-56">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Bolos e coberturas</SelectItem>
            <SelectItem value="bolos">Somente bolos</SelectItem>
            <SelectItem value="coberturas">Somente coberturas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {linhas.length === 0 ? (
        <EmptyState message="Cadastre bolos ou coberturas com ingredientes para montar a cesta da produção." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              titulo="Receitas na cesta"
              valor={String(linhas.length)}
              detalhe={`${cesta.length} ingredientes diferentes`}
              icone={ShoppingBasket}
            />
            <Kpi
              titulo="Custo total das receitas"
              valor={brl(custoTotal)}
              detalhe="Soma do custo de produção"
              icone={Wheat}
            />
            <Kpi
              titulo="Custo médio por grama"
              valor={custoPorGramaMedio > 0 ? brlPreciso(custoPorGramaMedio) : "—"}
              detalhe="Considerando itens em g/ml"
              icone={Scale}
            />
            <Kpi
              titulo="Margem média"
              valor={`${margemMedia.toFixed(1)}%`}
              detalhe="Média das receitas listadas"
              icone={Percent}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl text-primary">
                Cesta de ingredientes
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Total consumido por ingrediente somando todas as receitas listadas.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">Preço de compra</TableHead>
                    <TableHead className="text-right">Quantidade total</TableHead>
                    <TableHead className="text-right">Receitas</TableHead>
                    <TableHead className="text-right">Custo total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cesta.map((item) => (
                    <TableRow key={item.ingredienteId}>
                      <TableCell className="font-semibold">{item.nome}</TableCell>
                      <TableCell className="text-right">
                        {brl(item.precoCompra)}/{item.unidade}
                      </TableCell>
                      <TableCell className="text-right">
                        {qtd(item.quantidadeTotal)} {item.unidade}
                      </TableCell>
                      <TableCell className="text-right">{item.receitas}</TableCell>
                      <TableCell className="text-right">{brl(item.custoTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-4 text-right text-sm font-semibold text-primary">
                Custo total da cesta: {brl(custoTotal)}
              </p>
            </CardContent>
          </Card>

          {linhas.map((linha) => (
            <CartaoReceita key={`${linha.tipo}-${linha.id}`} linha={linha} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
