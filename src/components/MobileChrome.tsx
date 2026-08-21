import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { hapticTap, useMobileShell } from "@/hooks/use-mobile-shell";

const TITULOS: Record<string, string> = {
  "/ingredientes": "Ingredientes",
  "/estoque": "Estoque",
  "/bolos": "Bolos",
  "/coberturas": "Coberturas",
  "/cursos": "Cursos",
  "/clientes": "Clientes",
  "/pedidos": "Pedidos",
  "/receitas": "Outras receitas",
  "/despesas": "Outras Despesas",
  "/movimentacoes": "Movimentações",
  "/painel-estoque": "Painel de estoque",
  "/painel-pedidos": "Painel de pedidos",
  "/relatorio": "Relatório",
  "/configuracoes": "Configurações",
};

/**
 * No mobile (inclusive paisagem), as telas internas abrem em tela cheia,
 * com uma barra superior compacta e botão de retorno ao painel geral.
 * A barra respeita as áreas seguras (notch / ilha dinâmica).
 */
export function MobileChrome() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMobileShell = useMobileShell();

  const isInterna = pathname !== "/";

  if (!isMobileShell || !isInterna) {
    return <AppNav />;
  }

  const titulo =
    Object.entries(TITULOS).find(([path]) => pathname.startsWith(path))?.[1] ?? "Amor de Brigadeiro";

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="safe-x flex items-center gap-3 px-3 py-2 landscape:py-1.5">
        <Link
          to="/"
          aria-label="Voltar ao painel geral"
          onClick={() => hapticTap(14)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground transition-all duration-150 active:scale-95 hover:bg-primary hover:text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Painel
        </Link>
        <p className="min-w-0 truncate font-display text-lg leading-tight text-primary landscape:text-base">
          {titulo}
        </p>
      </div>
    </header>
  );
}
