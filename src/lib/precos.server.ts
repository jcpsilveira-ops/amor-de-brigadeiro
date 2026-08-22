/**
 * Busca real de preços via Firecrawl (gateway da Lovable).
 * Uma busca por ingrediente, atribuindo os preços encontrados às redes.
 */
import {
  extrairPrecos,
  identificarMercado,
  medidaPorUnidade,
  precosPorMedidaDoTexto,
  MERCADOS,
  type Cotacao,
  type Mercado,
  type PesquisaPrecos,
} from "./precos";


const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";
/** Buscas simultâneas (o provedor limita rajadas). */
const LOTE = 4;

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ResultadoBusca {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
}

async function buscar(query: string, tentativa = 0): Promise<ResultadoBusca[]> {
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
    if ((res.status === 429 || res.status >= 500) && tentativa < 2) {
      await espera(1500 * (tentativa + 1));
      return buscar(query, tentativa + 1);
    }
    throw new Error(
      res.status === 429
        ? "O provedor de pesquisa limitou as consultas agora. Tente atualizar em alguns instantes."
        : `Pesquisa de preços indisponível (${res.status}).`,
    );
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
  mercados: readonly Mercado[] = MERCADOS,
): Promise<PesquisaPrecos> {
  const alvo = ingredientes.slice(0, MAX_INGREDIENTES_PESQUISA);
  const selecionados = mercados.length > 0 ? mercados : MERCADOS;
  const redes = selecionados.join(" OR ");
  const cotacoes: Cotacao[] = [];
  const semCotacao: string[] = [];
  let erro: string | undefined;

  const buscas: { ing: (typeof alvo)[number]; resultados: ResultadoBusca[] }[] = [];
  for (let i = 0; i < alvo.length; i += LOTE) {
    const lote = await Promise.all(
      alvo.slice(i, i + LOTE).map(async (ing) => {
        const query = `preço ${ing.nome} ${ing.unidade} Uberlândia ${redes} supermercado`;
        try {
          return { ing, resultados: await buscar(query) };
        } catch (e) {
          erro = e instanceof Error ? e.message : "Falha na pesquisa de preços.";
          return { ing, resultados: [] as ResultadoBusca[] };
        }
      }),
    );
    buscas.push(...lote);
    if (i + LOTE < alvo.length) await espera(600);
  }

  for (const { ing, resultados } of buscas) {
    let encontrou = false;
    for (const r of resultados) {
      const contexto = `${r.title ?? ""} ${r.url ?? ""} ${r.description ?? ""}`;
      const mercado = identificarMercado(contexto);
      if (!mercado || !selecionados.includes(mercado)) continue;
      const texto = `${r.title ?? ""} ${r.description ?? ""} ${(r.markdown ?? "").slice(0, 2000)}`;
      const fator = medidaPorUnidade(ing.unidade);
      // Itens em kg/l/g/ml: usa o preço por g/ml (preço ÷ embalagem citada) e
      // converte para a unidade cadastrada. Itens contados usam o preço cheio.
      const porMedida = fator === null ? [] : precosPorMedidaDoTexto(texto);
      const precos =
        fator === null
          ? extrairPrecos(texto)
          : porMedida.map((p) => Math.round(p * fator * 100) / 100);
      if (precos.length === 0) continue;
      cotacoes.push({
        ingredienteId: ing.id,
        ingrediente: ing.nome,
        mercado,
        preco: Math.min(...precos),
        ...(fator === null
          ? {}
          : { precoPorMedida: Math.min(...porMedida) }),
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
