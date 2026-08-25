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
import type { MenorPreco } from "@/lib/precos-mercado";

interface ItemLista {
  nome: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

interface ListaMercado {
  mercado: string;
  itens: ItemLista[];
  total: number;
}

/**
 * Listas de compras por supermercado: cada mercado que aparece na pesquisa
 * como o de menor preço recebe a lista dos ingredientes correspondentes,
 * com o valor encontrado e o total da lista. Exportável para Excel.
 */
export function ListasCompras({
  cesta,
  origens,
}: {
  cesta: ResumoIngredienteCesta[];
  origens: Map<number, MenorPreco>;
}) {
  const listas = useMemo<ListaMercado[]>(() => {
    const mapa = new Map<string, ItemLista[]>();
    for (const item of cesta) {
      const menor = origens.get(item.ingredienteId);
      if (!menor || menor.origem === "Estoque") continue;
      const quantidade = item.quantidadeTotal;
      const subtotal = Math.round(menor.valor * quantidade * 100) / 100;
      const lista = mapa.get(menor.origem) ?? [];
      lista.push({
        nome: item.nome,
        unidade: item.unidade,
        quantidade,
        precoUnitario: menor.valor,
        subtotal,
      });
      mapa.set(menor.origem, lista);
    }
    return [...mapa.entries()]
      .map(([mercado, itens]) => ({
        mercado,
        itens: itens.sort((a, b) => b.subtotal - a.subtotal || a.nome.localeCompare(b.nome, "pt-BR")),
        total: Math.round(itens.reduce((a, i) => a + i.subtotal, 0) * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total);
  }, [cesta, origens]);

  const linhasPlanilha = (lista: ListaMercado) => [
    ...lista.itens.map((i) => ({
      Ingrediente: i.nome,
      Unidade: i.unidade,
      Quantidade: i.quantidade,
      "Menor valor (R$/unidade)": i.precoUnitario,
      "Subtotal (R$)": i.subtotal,
    })),
    {
      Ingrediente: "TOTAL DA LISTA",
      Unidade: "",
      Quantidade: "",
      "Menor valor (R$/unidade)": "",
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
              Ingredientes cujo menor preço foi encontrado em um supermercado, com o valor
              encontrado e o total de cada lista.
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
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Menor valor</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.itens.map((i) => (
                      <TableRow key={`${lista.mercado}-${i.nome}`}>
                        <TableCell className="font-semibold">{i.nome}</TableCell>
                        <TableCell className="text-right">
                          {qtd(i.quantidade)} {i.unidade}
                        </TableCell>
                        <TableCell className="text-right">
                          {brl(i.precoUnitario)}/{i.unidade || "un."}
                        </TableCell>
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
