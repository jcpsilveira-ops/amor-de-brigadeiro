import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppNav } from "@/components/AppNav";

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
 * No mobile, as telas internas abrem em tela cheia (sem o menu de navegação),
 * com uma barra superior contendo o botão de retorno ao painel geral.
 */
export function MobileChrome() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMobile = useIsMobile();

  const isInterna = pathname !== "/";

  if (!isMobile || !isInterna) {
    return <AppNav />;
  }

  const titulo =
    Object.entries(TITULOS).find(([path]) => pathname.startsWith(path))?.[1] ?? "Amor de Brigadeiro";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Link
          to="/"
          aria-label="Voltar ao painel geral"
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Painel
        </Link>
        <p className="truncate font-display text-lg text-primary">{titulo}</p>
      </div>
    </header>
  );
}
