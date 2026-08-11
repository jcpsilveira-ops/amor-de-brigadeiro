import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MAX_INGREDIENTES, UNIDADES } from "@/lib/domain";

export default defineTool({
  name: "regras_do_sistema",
  title: "Regras de cadastro da confeitaria",
  description:
    "Retorna as regras de cadastro do sistema Amor de Brigadeiro: unidades de medida aceitas, limite de ingredientes por receita e como o custo e a margem são calculados.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: [
          `Unidades aceitas: ${UNIDADES.join(", ")}.`,
          `Limite de ingredientes por bolo ou cobertura: ${MAX_INGREDIENTES}.`,
          "Custo de produção = soma(quantidade x custo unitário do ingrediente).",
          "Lucro = preço de venda - custo. Margem % = lucro / preço de venda x 100.",
          "Ingredientes não podem se repetir na mesma receita.",
          "Os cadastros (ingredientes, receitas, clientes e pedidos) ficam salvos no próprio dispositivo e não são acessíveis por estas ferramentas.",
        ].join("\n"),
      },
    ],
    structuredContent: {
      unidades: UNIDADES,
      maxIngredientes: MAX_INGREDIENTES,
    },
  }),
});
