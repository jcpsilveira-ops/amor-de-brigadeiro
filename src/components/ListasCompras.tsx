import { useMemo } from "react";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { brl } from "@/lib/domain";
import { qtd, type ResumoIngredienteCesta } from "@/lib/cesta";
import { medidaPorUnidade } from "@/lib/precos";
import {
  pesoEmMedida,
  type MenorPreco,
  type MercadoCadastro,
  type PrecoMercado,
} from "@/lib/precos-mercado";

interface ItemLista {
  nome: string;
  /** Nome do produto como aparece na pesquisa. */
  produto: string;
  /** Peso/volume/unidade da embalagem encontrada na pesquisa. */
  embalagem: string;
  /** Preço da embalagem encontrado na pesquisa. */
  precoEmbalagem: number;
  /** Quantidade necessária (na unidade cadastrada). */
  necessario: string;
  /** Quantas embalagens comprar. */
  embalagens: number;
  subtotal: number;
}

interface ListaMercado {
  mercado: string;
  itens: ItemLista[];
  total: number;
}

/**
 * Listas de compras por supermercado. Usa o preço e o peso/volume/unidade
 * exatamente como encontrados na pesquisa de preços: para cada ingrediente
 * calcula quantas embalagens são necessárias e o subtotal correspondente.
 */
export function ListasCompras({
  cesta,
  origens,
  precos,
  mercados,
}: {
  cesta: ResumoIngredienteCesta[];
  origens: Map<number, MenorPreco>;
  precos: PrecoMercado[];
  mercados: MercadoCadastro[];
}) {
  const listas = useMemo<ListaMercado[]>(() => {
    const nomePorId = new Map(mercados.map((m) => [m.id, m.nome]));
    const mapa = new Map<string, ItemLista[]>();

    for (const item of cesta) {
      if (item.quantidadeTotal <= 0) continue;
      const menor = origens.get(item.ingredienteId);
      if (!menor || menor.origem === "Estoque") continue;

      // Registro exato da pesquisa que originou o menor preço.
      const registro = precos
        .filter(
          (p) =>
            p.ingredienteId === item.ingredienteId &&
            p.preco !== null &&
            nomePorId.get(p.mercadoId) === menor.origem,
        )
        .sort((a, b) => (a.preco ?? 0) - (b.preco ?? 0))[0];
      if (!registro || registro.preco === null) continue;

      const fator = medidaPorUnidade(item.unidade);
      const medidaEmbalagem = pesoEmMedida(registro.peso);
      const necessarioMedida = fator !== null ? item.quantidadeTotal * fator : null;
      const embalagens =
        necessarioMedida !== null && medidaEmbalagem !== null && medidaEmbalagem > 0
          ? Math.max(1, Math.ceil(necessarioMedida / medidaEmbalagem))
          : Math.max(1, Math.ceil(item.quantidadeTotal));
      const subtotal = Math.round(registro.preco * embalagens * 100) / 100;

      const lista = mapa.get(menor.origem) ?? [];
      lista.push({
        nome: item.nome,
        produto: registro.nomeProduto ?? item.nome,
        embalagem:
          registro.peso ??
          (fator === null ? "1 unidade" : `${qtd(item.quantidadeTotal)} ${item.unidade}`),
        precoEmbalagem: registro.preco,
        necessario: `${qtd(item.quantidadeTotal)} ${item.unidade}`,
        embalagens,
        subtotal,
      });
      mapa.set(menor.origem, lista);
    }

    return [...mapa.entries()]
      .map(([mercado, itens]) => ({
        mercado,
        itens: itens.sort(
          (a, b) => b.subtotal - a.subtotal || a.nome.localeCompare(b.nome, "pt-BR"),
        ),
        total: Math.round(itens.reduce((a, i) => a + i.subtotal, 0) * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total);
  }, [cesta, origens, precos, mercados]);

  const linhasPlanilha = (lista: ListaMercado) => [
    ...lista.itens.map((i) => ({
      Ingrediente: i.nome,
      "Produto (pesquisa)": i.produto,
      "Embalagem (pesquisa)": i.embalagem,
      "Preço da embalagem (R$)": i.precoEmbalagem,
      "Necessário": i.necessario,
      Embalagens: i.embalagens,
      "Subtotal (R$)": i.subtotal,
    })),
    {
      Ingrediente: "TOTAL DA LISTA",
      "Produto (pesquisa)": "",
      "Embalagem (pesquisa)": "",
      "Preço da embalagem (R$)": "",
      "Necessário": "",
      Embalagens: "",
      "Subtotal (R$)": lista.total,
    },
  ];

  const exportarUma = (lista: ListaMercado) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(linhasPlanilha(lista)),
      lista.mercado.slice(0, 31),
    );
    XLSX.writeFile(wb, `lista-compras-${lista.mercado.toLowerCase().replace(/\s+/g, "-")}.xlsx`);
  };

  const exportarTodas = () => {
    const wb = XLSX.utils.book_new();
    for (const lista of listas) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(linhasPlanilha(lista)),
        lista.mercado.slice(0, 31),
      );
    }
    XLSX.writeFile(wb, "listas-compras-supermercados.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display text-xl text-primary">
              Listas de compras por supermercado
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Preço e embalagem (peso/volume/unidade) exatamente como encontrados na pesquisa de
              preços, com a quantidade de embalagens necessária.
            </p>
          </div>
          {listas.length > 0 ? (
            <Button variant="outline" size="sm" onClick={exportarTodas}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar todas (Excel)
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {listas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum ingrediente com menor preço em supermercado. Faça a pesquisa de preços para
            gerar as listas.
          </p>
        ) : (
          listas.map((lista) => (
            <div key={lista.mercado} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg text-primary">{lista.mercado}</h3>
                <Button variant="ghost" size="sm" onClick={() => exportarUma(lista)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Embalagem</TableHead>
                      <TableHead className="text-right">Preço da embalagem</TableHead>
                      <TableHead className="text-right">Necessário</TableHead>
                      <TableHead className="text-right">Embalagens</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.itens.map((i) => (
                      <TableRow key={`${lista.mercado}-${i.nome}`}>
                        <TableCell className="font-semibold">
                          {i.nome}
                          <span className="block text-xs font-normal text-muted-foreground">
                            {i.produto}
                          </span>
                        </TableCell>
                        <TableCell>{i.embalagem}</TableCell>
                        <TableCell className="text-right">{brl(i.precoEmbalagem)}</TableCell>
                        <TableCell className="text-right">{i.necessario}</TableCell>
                        <TableCell className="text-right">{i.embalagens}</TableCell>
                        <TableCell className="text-right">{brl(i.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-right text-sm font-semibold text-primary">
                Total da lista: {brl(lista.total)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
