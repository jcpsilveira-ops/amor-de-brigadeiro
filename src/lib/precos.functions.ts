import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { PesquisaPrecos } from "./precos";

const schema = z.object({
  ingredientes: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        nome: z.string().trim().min(1).max(120),
        unidade: z.string().trim().max(20),
      }),
    )
    .max(40),
});

export const pesquisarPrecosMercados = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<PesquisaPrecos> => {
    const { pesquisarPrecos } = await import("./precos.server");
    try {
      return await pesquisarPrecos(data.ingredientes);
    } catch (e) {
      return {
        atualizadoEm: new Date().toISOString(),
        cotacoes: [],
        semCotacao: data.ingredientes.map((i) => i.nome),
        erro: e instanceof Error ? e.message : "Falha na pesquisa de preços.",
      };
    }
  });
