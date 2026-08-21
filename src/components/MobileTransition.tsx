import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMobileShell } from "@/hooks/use-mobile-shell";

/**
 * Anima a troca de telas no mobile: telas internas entram deslizando da direita,
 * o painel geral volta deslizando da esquerda. Respeita prefers-reduced-motion.
 */
export function MobileTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMobileShell = useMobileShell();

  if (!isMobileShell) return <>{children}</>;

  const entrada = pathname === "/" ? "animate-tela-voltar" : "animate-tela-entrar";

  return (
    <div key={pathname} className={entrada}>
      {children}
    </div>
  );
}
