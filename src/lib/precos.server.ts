/**
 * Busca real de preços via Firecrawl (gateway da Lovable).
 * Uma busca por ingrediente, atribuindo os preços encontrados às redes.
 */
import {
  extrairPrecos,
  identificarMercado,
  MERCADOS,
  type Cotacao,
  type PesquisaPrecos,
} from "./precos";

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";
/** Limite de ingredientes por pesquisa para manter a tela rápida. */
const MAX_INGREDIENTES_PESQUISA = 12;

interface ResultadoBusca {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
}

async function buscar(query: string): Promise<ResultadoBusca[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const firecrawlKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !firecrawlKey) throw new Error("Pesquisa de preços não configurada.");

  const res = await fetch(`${GATEWAY}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": firecrawlKey,
    },
    body: JSON.stringify({ query, limit: 8, lang: "pt", country: "br" }),
  });

  if (!res.ok) {
    const corpo = await res.text();
    console.error(`Firecrawl search falhou [${res.status}]: ${corpo}`);
    throw new Error(`Pesquisa de preços indisponível (${res.status}).`);
  }

  const json = (await res.json()) as {
    data?: ResultadoBusca[] | { web?: ResultadoBusca[] };
    web?: ResultadoBusca[];
  };
  const data = json.data;
  if (Array.isArray(data)) return data;
  return data?.web ?? json.web ?? [];
}

export async function pesquisarPrecos(
  ingredientes: { id: number; nome: string; unidade: string }[],
): Promise<PesquisaPrecos> {
  const alvo = ingredientes.slice(0, MAX_INGREDIENTES_PESQUISA);
  const redes = MERCADOS.join(" OR ");
  const cotacoes: Cotacao[] = [];
  const semCotacao: string[] = [];
  let erro: string | undefined;

  const buscas = await Promise.all(
    alvo.map(async (ing) => {
      const query = `preço ${ing.nome} ${ing.unidade} Uberlândia ${redes} supermercado`;
      try {
        return { ing, resultados: await buscar(query) };
      } catch (e) {
        erro = e instanceof Error ? e.message : "Falha na pesquisa de preços.";
        return { ing, resultados: [] as ResultadoBusca[] };
      }
    }),
  );

  for (const { ing, resultados } of buscas) {
    let encontrou = false;
    for (const r of resultados) {
      const contexto = `${r.title ?? ""} ${r.url ?? ""} ${r.description ?? ""}`;
      const mercado = identificarMercado(contexto);
      if (!mercado) continue;
      const texto = `${r.title ?? ""} ${r.description ?? ""} ${(r.markdown ?? "").slice(0, 2000)}`;
      const precos = extrairPrecos(texto);
      if (precos.length === 0) continue;
      cotacoes.push({
        ingredienteId: ing.id,
        ingrediente: ing.nome,
        mercado,
        preco: Math.min(...precos),
        trecho: (r.title ?? r.description ?? "").slice(0, 140),
        fonte: r.url ?? "",
      });
      encontrou = true;
    }
    if (!encontrou) semCotacao.push(ing.nome);
  }

  return {
    atualizadoEm: new Date().toISOString(),
    cotacoes,
    semCotacao,
    ...(erro ? { erro } : {}),
  };
}
