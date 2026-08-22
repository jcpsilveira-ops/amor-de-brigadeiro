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
const LOTE = 2;
/** Intervalo mínimo entre chamadas ao provedor (ms). */
const INTERVALO_MIN = 400;
/** Validade do cache de resultados por consulta (ms). */
const CACHE_TTL = 6 * 60 * 60 * 1000;
/** Tentativas por consulta antes de desistir daquele ingrediente. */
const MAX_TENTATIVAS = 5;

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ResultadoBusca {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
}

/** Cache em memória por consulta: evita reconsultar o provedor e estourar o limite. */
const cache = new Map<string, { em: number; resultados: ResultadoBusca[] }>();

/** Fila serializada com pacing adaptativo: uma chamada por vez, com espera mínima. */
let ultimaChamada = 0;
let atraso = INTERVALO_MIN;
let fila: Promise<unknown> = Promise.resolve();

function enfileirar<T>(fn: () => Promise<T>): Promise<T> {
  const proximo = fila.then(async () => {
    const desde = Date.now() - ultimaChamada;
    if (desde < atraso) await espera(atraso - desde);
    ultimaChamada = Date.now();
    return fn();
  });
  fila = proximo.catch(() => undefined);
  return proximo;
}

async function chamarProvedor(query: string): Promise<ResultadoBusca[] | "limitado"> {
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

  if (res.status === 429 || res.status === 402 || res.status >= 500) {
    const corpo = await res.text();
    console.error(`Firecrawl search limitado [${res.status}]: ${corpo.slice(0, 300)}`);
    const retry = Number(res.headers.get("retry-after"));
    // Desacelera globalmente e informa ao chamador para tentar de novo.
    atraso = Math.min(8000, Math.max(atraso * 2, Number.isFinite(retry) && retry > 0 ? retry * 1000 : 1000));
    return "limitado";
  }

  if (!res.ok) {
    const corpo = await res.text();
    console.error(`Firecrawl search falhou [${res.status}]: ${corpo.slice(0, 300)}`);
    throw new Error(`Pesquisa de preços indisponível (${res.status}).`);
  }

  // Sucesso: volta gradualmente ao ritmo normal.
  atraso = Math.max(INTERVALO_MIN, Math.round(atraso * 0.7));

  const json = (await res.json()) as {
    data?: ResultadoBusca[] | { web?: ResultadoBusca[] };
    web?: ResultadoBusca[];
  };
  const data = json.data;
  if (Array.isArray(data)) return data;
  return data?.web ?? json.web ?? [];
}

/** Busca com cache, fila e retentativa exponencial; nunca derruba a pesquisa inteira. */
async function buscar(query: string): Promise<{ resultados: ResultadoBusca[]; limitado: boolean }> {
  const emCache = cache.get(query);
  if (emCache && Date.now() - emCache.em < CACHE_TTL) {
    return { resultados: emCache.resultados, limitado: false };
  }

  for (let tentativa = 0; tentativa < MAX_TENTATIVAS; tentativa++) {
    const r = await enfileirar(() => chamarProvedor(query));
    if (r !== "limitado") {
      cache.set(query, { em: Date.now(), resultados: r });
      return { resultados: r, limitado: false };
    }
    await espera(Math.min(10000, 800 * 2 ** tentativa));
  }

  // Sem sucesso: reaproveita cache vencido, se houver.
  return { resultados: emCache?.resultados ?? [], limitado: true };
}


export async function pesquisarPrecos(
  ingredientes: { id: number; nome: string; unidade: string }[],
  mercados: readonly Mercado[] = MERCADOS,
): Promise<PesquisaPrecos> {
  const alvo = ingredientes;
  const selecionados = mercados.length > 0 ? mercados : MERCADOS;
  const redes = selecionados.join(" OR ");
  const cotacoes: Cotacao[] = [];
  const semCotacao: string[] = [];
  let erro: string | undefined;

  const buscas: { ing: (typeof alvo)[number]; resultados: ResultadoBusca[] }[] = [];
  let limitados = 0;
  for (let i = 0; i < alvo.length; i += LOTE) {
    const lote = await Promise.all(
      alvo.slice(i, i + LOTE).map(async (ing) => {
        const query = `preço ${ing.nome} ${ing.unidade} Uberlândia ${redes} supermercado`;
        try {
          const r = await buscar(query);
          if (r.limitado) limitados++;
          return { ing, resultados: r.resultados };
        } catch (e) {
          erro = e instanceof Error ? e.message : "Falha na pesquisa de preços.";
          return { ing, resultados: [] as ResultadoBusca[] };
        }
      }),
    );
    buscas.push(...lote);
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
