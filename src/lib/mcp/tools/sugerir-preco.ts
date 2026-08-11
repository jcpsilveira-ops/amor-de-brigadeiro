import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { brl } from "@/lib/domain";

export default defineTool({
  name: "sugerir_preco",
  title: "Sugerir preço de venda",
  description:
    "Sugere o preço de venda de um bolo ou cobertura a partir do custo de produção e da margem de lucro desejada (em % sobre o preço de venda).",
  inputSchema: {
    custo: z.number().positive().describe("Custo de produção em reais."),
    margemDesejada: z
      .number()
      .describe("Margem de lucro desejada em porcentagem do preço de venda (ex.: 40 para 40%)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ custo, margemDesejada }) => {
    if (margemDesejada < 0 || margemDesejada >= 100) {
      return {
        content: [{ type: "text", text: "A margem desejada deve ficar entre 0% e 99,9%." }],
        isError: true,
      };
    }
    const preco = Math.round((custo / (1 - margemDesejada / 100)) * 100) / 100;
    const lucro = Math.round((preco - custo) * 100) / 100;
    return {
      content: [
        {
          type: "text",
          text: `Custo ${brl(custo)} com margem de ${margemDesejada}% → preço sugerido ${brl(preco)} (lucro de ${brl(lucro)}).`,
        },
      ],
      structuredContent: { custo, margemDesejada, precoSugerido: preco, lucro },
    };
  },
});
