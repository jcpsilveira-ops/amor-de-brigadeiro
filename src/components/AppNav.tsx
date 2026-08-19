import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BarChart3,
  Cake,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  Home,
  Layers,
  LayoutDashboard,
  PackageCheck,
  PiggyBank,
  ShoppingBag,
  Users,
  Wallet,
  Wheat,
} from "lucide-react";
import logoAsset from "@/assets/logo.jpg.asset.json";

const links = [
  { to: "/", label: "Painel", icon: Home },
  { to: "/ingredientes", label: "Ingredientes", icon: Wheat },
  { to: "/estoque", label: "Estoque", icon: PackageCheck },
  { to: "/bolos", label: "Bolos", icon: Cake },
  { to: "/coberturas", label: "Coberturas", icon: Layers },
  { to: "/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/receitas", label: "Outras receitas", icon: PiggyBank },
  { to: "/despesas", label: "Outras Despesas", icon: Wallet },
  { to: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { to: "/painel-estoque", label: "Painel de estoque", icon: BarChart3 },
  { to: "/painel-pedidos", label: "Painel de pedidos", icon: ShoppingBag },
  { to: "/relatorio", label: "Relatório", icon: FileText },
] as const;

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="Logomarca Amor de Brigadeiro"
            className="h-11 w-11 rounded-full border border-border object-cover shadow-vintage"
          />
          <div className="leading-tight">
            <p className="font-display text-xl text-primary">Amor de Brigadeiro</p>
            <p className="text-xs text-muted-foreground">Gestão de bolos, receitas e pedidos</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-1.5">
          {links.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
          <a
            href="https://amordash-5yrr3vx8.manus.space/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard externo
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        </nav>
      </div>
    </header>
  );
}
