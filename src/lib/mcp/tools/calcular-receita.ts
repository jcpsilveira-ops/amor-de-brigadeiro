import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MAX_INGREDIENTES, brl, margem } from "@/lib/domain";

export default defineTool({
  name: "calcular_receita",
  title: "Calcular custo e margem de uma receita",
  description:
    "Calcula o custo de produção de um bolo ou cobertura a partir dos ingredientes informados (quantidade x custo unitário) e retorna lucro e margem em relação ao preço de venda. Máximo de 20 ingredientes.",
  inputSchema: {
    nome: z.string().trim().describe("Nome do bolo ou cobertura."),
    precoVenda: z.number().nonnegative().describe("Preço de venda em reais."),
    ingredientes: z
      .array(
        z.object({
          nome: z.string().trim().describe("Nome do ingrediente."),
          quantidade: z.number().positive().describe("Quantidade usada na receita."),
          custoUnitario: z.number().positive().describe("Custo por unidade do ingrediente em reais."),
        }),
      )
      .describe("Lista de ingredientes da receita."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ nome, precoVenda, ingredientes }) => {
    if (ingredientes.length === 0) {
      return { content: [{ type: "text", text: "Informe ao menos 1 ingrediente." }], isError: true };
    }
    if (ingredientes.length > MAX_INGREDIENTES) {
      return {
        content: [
          { type: "text", text: `Máximo de ${MAX_INGREDIENTES} ingredientes por receita.` },
        ],
        isError: true,
      };
    }

    const detalhes = ingredientes.map((i) => ({
      ...i,
      custo: Math.round(i.quantidade * i.custoUnitario * 100) / 100,
    }));
    const custo = Math.round(detalhes.reduce((a, d) => a + d.custo, 0) * 100) / 100;
    const { lucro, percentual } = margem(precoVenda, custo);

    return {
      content: [
        {
          type: "text",
          text: [
            `${nome}`,
            `Custo de produção: ${brl(custo)}`,
            `Preço de venda: ${brl(precoVenda)}`,
            `Lucro: ${brl(lucro)} (margem de ${percentual.toFixed(1)}%)`,
            "",
            ...detalhes.map((d) => `- ${d.nome}: ${d.quantidade} x ${brl(d.custoUnitario)} = ${brl(d.custo)}`),
          ].join("\n"),
        },
      ],
      structuredContent: { nome, custo, precoVenda, lucro, margemPercentual: percentual, detalhes },
    };
  },
});
