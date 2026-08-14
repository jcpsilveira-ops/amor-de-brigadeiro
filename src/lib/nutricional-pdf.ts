import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Ingrediente, Receita } from "./domain";
import { calcularReceitas, type ReceitaNutricional } from "./nutricional";

const CHOC: [number, number, number] = [74, 35, 23];
const CREME: [number, number, number] = [234, 220, 190];
const CLARO: [number, number, number] = [251, 244, 230];

const num = (v: number, casas = 1) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

const LINHAS: Array<{
  rotulo: string;
  campo: keyof ReceitaNutricional["total"];
  unidade: string;
  casas: number;
}> = [
  { rotulo: "Carboidratos", campo: "carboidratos", unidade: "g", casas: 1 },
  { rotulo: "Açúcares totais", campo: "acucares", unidade: "g", casas: 1 },
  { rotulo: "Gorduras totais", campo: "gorduras", unidade: "g", casas: 1 },
  { rotulo: "Gorduras saturadas", campo: "saturadas", unidade: "g", casas: 1 },
  { rotulo: "Proteínas", campo: "proteinas", unidade: "g", casas: 1 },
  { rotulo: "Sódio", campo: "sodio", unidade: "mg", casas: 0 },
];

const METODOLOGIA =
  "Metodologia: os valores por ingrediente vêm de tabelas de referência (TACO/USDA) e de rótulos comerciais típicos, aplicados às quantidades das receitas cadastradas no sistema. A porção de 100 g refere-se à massa total dos ingredientes alimentares, antes de perdas por cocção (a evaporação de água concentra os valores no produto assado). Embalagens, fitas, etiquetas, forminhas e sacos de confeitar não entram no cálculo. Valores estimados: não substituem análise laboratorial para rotulagem oficial (RDC 429/2020).";

/** Gera o PDF de informação nutricional a partir dos dados atuais e dispara o download. */
export function gerarPdfNutricional(params: {
  ingredientes: Ingrediente[];
  bolos: Receita[];
  coberturas: Receita[];
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const margem = 18;
  let y = 20;

  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...CHOC);
  doc.text("Amor de Brigadeiro", largura / 2, y, { align: "center" });

  y += 7;
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("Informação Nutricional calculada a partir das receitas cadastradas", largura / 2, y, {
    align: "center",
  });

  y += 5;
  doc.setFontSize(9);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`,
    largura / 2,
    y,
    { align: "center" },
  );
  y += 8;

  const grupos: Array<{ titulo: string; receitas: ReceitaNutricional[] }> = [
    {
      titulo: "Bolos",
      receitas: calcularReceitas(params.bolos, params.ingredientes, "Bolo"),
    },
    {
      titulo: "Coberturas",
      receitas: calcularReceitas(params.coberturas, params.ingredientes, "Cobertura"),
    },
  ];

  const espaco = (altura: number) => {
    if (y + altura > doc.internal.pageSize.getHeight() - 18) {
      doc.addPage();
      y = 20;
    }
  };

  for (const grupo of grupos) {
    espaco(20);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...CHOC);
    doc.text(grupo.titulo, margem, y);
    y += 6;

    if (grupo.receitas.length === 0) {
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.text("Nenhuma receita cadastrada.", margem, y);
      y += 8;
      continue;
    }

    for (const r of grupo.receitas) {
      const observacoes: string[] = [];
      if (r.ignorados.length)
        observacoes.push(`Itens não alimentares desconsiderados: ${r.ignorados.join(", ")}.`);
      if (r.semReferencia.length)
        observacoes.push(`Sem referência nutricional cadastrada: ${r.semReferencia.join(", ")}.`);

      // Altura real do bloco: título + 2 linhas de cabeçalho + linhas de valores + observações.
      const alturaEstimada = 9 + 6.4 * (LINHAS.length + 3) + observacoes.length * 5 + 4;
      console.log('DBG', r.nome, 'y=', y, 'est=', alturaEstimada, 'limite=', doc.internal.pageSize.getHeight() - 18);
      espaco(alturaEstimada);

      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(`${r.nome} (${r.tipo})`, margem, y);
      y += 3;

      const body: string[][] = [
        [
          "Valor energético",
          `${num(r.por100g.kcal, 0)} kcal / ${num(r.por100g.kcal * 4.184, 0)} kJ`,
          `${num(r.total.kcal, 0)} kcal / ${num(r.total.kcal * 4.184, 0)} kJ`,
        ],
        ...LINHAS.map((l) => [
          l.rotulo,
          `${num(r.por100g[l.campo], l.casas)} ${l.unidade}`,
          `${num(r.total[l.campo], l.casas)} ${l.unidade}`,
        ]),
      ];

      autoTable(doc, {
        startY: y,
        margin: { left: margem, right: margem, top: 18, bottom: 18 },
        head: [
          [
            { content: "Informação Nutricional", colSpan: 3, styles: { halign: "center" } },
          ],
          ["Porção", "Por 100 g", `Por receita (${num(r.pesoTotal, 0)} g)`],
        ],
        body,
        theme: "grid",
        styles: {
          font: "times",
          fontSize: 9,
          textColor: CHOC,
          lineColor: CHOC,
          lineWidth: 0.2,
          cellPadding: 1.4,
        },
        headStyles: { fillColor: CREME, textColor: CHOC, fontStyle: "bold", halign: "center" },
        alternateRowStyles: { fillColor: CLARO },
        columnStyles: {
          0: { cellWidth: 62 },
          1: { cellWidth: 50, halign: "center" },
          2: { cellWidth: 62, halign: "center" },
        },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

      if (observacoes.length) {
        doc.setFont("times", "italic");
        doc.setFontSize(8);
        for (const obs of observacoes) {
          const linhas = doc.splitTextToSize(obs, largura - margem * 2);
          espaco(linhas.length * 4);
          doc.text(linhas, margem, y);
          y += linhas.length * 4 + 1;
        }
      }
      y += 4;
    }
  }

  espaco(30);
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...CHOC);
  const metodo = doc.splitTextToSize(METODOLOGIA, largura - margem * 2);
  espaco(metodo.length * 3.6);
  doc.text(metodo, margem, y);

  doc.save("informacao-nutricional-amor-de-brigadeiro.pdf");
}
