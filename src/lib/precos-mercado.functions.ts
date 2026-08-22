import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { AchadoPreco, SugestaoMercado } from "./precos-mercado";

const buscaSchema = z.object({
  ingredientes: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        nome: z.string().trim().min(1).max(120),
        unidade: z.string().trim().max(20),
      }),
    )
    .max(300),
  mercados: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        nome: z.string().trim().min(1).max(80),
        urlBusca: z.string().trim().max(300).nullable().optional(),
      }),
    )
    .max(40),
});

/** Busca preços de cada ingrediente em cada mercado cadastrado. */
export const buscarPrecosMercados = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => buscaSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ achados: AchadoPreco[]; semResultado: number; erro?: string }> => {
      const { buscarPrecosPorMercado } = await import("./precos-mercado.server");
      try {
        return await buscarPrecosPorMercado(data.ingredientes, data.mercados);
      } catch (e) {
        return {
          achados: [],
          semResultado: data.ingredientes.length * data.mercados.length,
          erro: e instanceof Error ? e.message : "Falha na pesquisa de preços.",
        };
      }
    },
  );

/** Descobre supermercados de Uberlândia-MG na internet. */
export const descobrirMercadosFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ jaCadastrados: z.array(z.string().max(80)).max(60).default([]) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ sugestoes: SugestaoMercado[]; erro?: string }> => {
    const { descobrirMercados } = await import("./precos-mercado.server");
    try {
      return await descobrirMercados(data.jaCadastrados);
    } catch (e) {
      return {
        sugestoes: [],
        erro: e instanceof Error ? e.message : "Falha na descoberta de mercados.",
      };
    }
  });

/** Descobre o link de busca de um mercado informado apenas pelo nome. */
export const descobrirLinkMercadoFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ nome: z.string().trim().min(2).max(80) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ urlBusca: string | null }> => {
    const { descobrirLinkMercado } = await import("./precos-mercado.server");
    try {
      return { urlBusca: await descobrirLinkMercado(data.nome) };
    } catch {
      return { urlBusca: null };
    }
  });
