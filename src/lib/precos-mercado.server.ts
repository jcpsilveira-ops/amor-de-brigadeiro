/**
 * Busca de preços por supermercado e descoberta de mercados em Uberlândia-MG.
 *
 * Usa a busca web do provedor (Firecrawl, via gateway da Lovable), que respeita
 * robots.txt e os termos dos sites. Nada é inventado: quando o campo não é
 * encontrado, ele volta em branco (null).
 */
import { extrairEmbalagem, extrairPrecos } from "./precos";
import { buscar, type ResultadoBusca } from "./precos.server";
import type { AchadoPreco, SugestaoMercado } from "./precos-mercado";

/** Pares processados simultaneamente (o provedor limita rajadas). */
const LOTE = 3;

/** Palavras-chave do nome do mercado, para reconhecer o resultado certo. */
function tokens(nome: string): string[] {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function normal(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** O resultado pertence a este mercado? (título, URL ou descrição citam o nome) */
function combina(r: ResultadoBusca, nomeMercado: string, urlBusca: string | null): boolean {
  const contexto = normal(`${r.title ?? ""} ${r.url ?? ""} ${r.description ?? ""}`);
  if (urlBusca) {
    try {
      const host = new URL(urlBusca).hostname.replace(/^www\./, "");
      const raiz = host.split(".")[0];
      if (raiz && contexto.includes(normal(raiz))) return true;
    } catch {
      /* URL inválida: segue pelos tokens do nome */
    }
  }
  const t = tokens(nomeMercado);
  return t.length > 0 && t.every((token) => contexto.includes(token));
}

/** Extrai nome do produto, preço e peso/volume de um resultado. */
function extrair(r: ResultadoBusca): {
  nomeProduto: string | null;
  preco: number | null;
  peso: string | null;
} {
  const texto = `${r.title ?? ""} ${r.description ?? ""} ${(r.markdown ?? "").slice(0, 2000)}`;
  const precos = extrairPrecos(texto);
  const preco = precos.length > 0 ? Math.min(...precos) : null;

  const rePeso =
    /([0-9]{1,4}(?:[.,][0-9]{1,3})?)\s*(kg|kilos?|quilos?|g|gr|gramas?|l|lt|litros?|ml)\b/i;
  const m = rePeso.exec(texto);
  const peso = m && extrairEmbalagem(m[0]) !== null ? m[0].replace(/\s+/g, " ").trim() : null;

  const nomeProduto = (r.title ?? "").trim().slice(0, 120) || null;
  return { nomeProduto, preco, peso };
}

export async function buscarPrecosPorMercado(
  ingredientes: { id: number; nome: string; unidade: string }[],
  mercados: { id: number; nome: string; urlBusca?: string | null }[],
): Promise<{ achados: AchadoPreco[]; semResultado: number; erro?: string }> {
  const pares: { ing: (typeof ingredientes)[number]; merc: (typeof mercados)[number] }[] = [];
  for (const ing of ingredientes) for (const merc of mercados) pares.push({ ing, merc });

  const achados: AchadoPreco[] = [];
  let semResultado = 0;
  let erro: string | undefined;

  for (let i = 0; i < pares.length; i += LOTE) {
    const lote = await Promise.all(
      pares.slice(i, i + LOTE).map(async ({ ing, merc }) => {
        const alvo = merc.urlBusca ? ` site:${hostDe(merc.urlBusca)}` : "";
        const query = `${ing.nome} preço ${merc.nome} supermercado Uberlândia${alvo}`;
        try {
          const { resultados } = await buscar(query);
          for (const r of resultados) {
            if (!alvo && !combina(r, merc.nome, merc.urlBusca ?? null)) continue;
            const dados = extrair(r);
            if (dados.preco === null) continue;
            return {
              ingredienteId: ing.id,
              mercadoId: merc.id,
              ...dados,
              fonte: r.url ?? null,
            } satisfies AchadoPreco;
          }
          return null;
        } catch (e) {
          erro = e instanceof Error ? e.message : "Falha na pesquisa de preços.";
          return null;
        }
      }),
    );
    for (const r of lote) {
      if (r) achados.push(r);
      else semResultado++;
    }
  }

  return { achados, semResultado, ...(erro ? { erro } : {}) };
}

function hostDe(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return "";
  }
}

/** Descobre supermercados de Uberlândia-MG na internet. */
export async function descobrirMercados(
  jaCadastrados: string[] = [],
): Promise<{ sugestoes: SugestaoMercado[]; erro?: string }> {
  const consultas = [
    "supermercados em Uberlândia MG loja online ofertas",
    "atacarejo e supermercado Uberlândia MG site oficial encarte",
  ];
  const vistos = new Set(jaCadastrados.map((n) => normal(n)));
  const sugestoes: SugestaoMercado[] = [];
  let erro: string | undefined;

  for (const q of consultas) {
    try {
      const { resultados } = await buscar(q);
      for (const r of resultados) {
        if (!r.url) continue;
        const host = hostDe(r.url).replace(/^www\./, "");
        if (!host) continue;
        const nome = nomeDoResultado(r, host);
        if (!nome || vistos.has(normal(nome))) continue;
        vistos.add(normal(nome));
        sugestoes.push({ nome, urlBusca: `https://${host}` });
      }
    } catch (e) {
      erro = e instanceof Error ? e.message : "Falha na descoberta de mercados.";
    }
  }

  return { sugestoes: sugestoes.slice(0, 12), ...(erro ? { erro } : {}) };
}

/** Nome legível do mercado a partir do título/host do resultado. */
function nomeDoResultado(r: ResultadoBusca, host: string): string | null {
  const bruto = (r.title ?? "").split(/[|—–\-:·]/)[0]?.trim() ?? "";
  const limpo = bruto.replace(/\s+/g, " ").slice(0, 60);
  if (limpo.length >= 3 && limpo.length <= 60 && /[a-zA-ZÀ-ú]/.test(limpo)) return limpo;
  const raiz = host.split(".")[0];
  return raiz ? raiz.charAt(0).toUpperCase() + raiz.slice(1) : null;
}

/** Descobre automaticamente o link de busca de um mercado informado pelo nome. */
export async function descobrirLinkMercado(nome: string): Promise<string | null> {
  try {
    const { resultados } = await buscar(`${nome} supermercado Uberlândia MG site oficial`);
    for (const r of resultados) {
      const host = hostDe(r.url ?? "").replace(/^www\./, "");
      if (!host) continue;
      if (/facebook|instagram|linkedin|youtube|reclameaqui|wikipedia/.test(host)) continue;
      return `https://${host}`;
    }
    return null;
  } catch {
    return null;
  }
}
