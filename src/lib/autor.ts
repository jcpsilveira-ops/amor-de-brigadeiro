/**
 * Identificação simples de quem está usando o sistema (acesso por link, sem
 * login). O nome fica salvo no próprio dispositivo e acompanha os registros
 * de auditoria dos fatores de conversão.
 */
const CHAVE = "amor_de_brigadeiro_autor";

export const AUTOR_PADRAO = "Não identificado";

export function lerAutor(): string {
  if (typeof window === "undefined") return AUTOR_PADRAO;
  const valor = window.localStorage.getItem(CHAVE)?.trim();
  return valor && valor.length > 0 ? valor : AUTOR_PADRAO;
}

export function salvarAutor(nome: string): void {
  if (typeof window === "undefined") return;
  const limpo = nome.trim().slice(0, 60);
  if (limpo === "") window.localStorage.removeItem(CHAVE);
  else window.localStorage.setItem(CHAVE, limpo);
}
