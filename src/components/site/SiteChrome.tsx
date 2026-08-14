import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MessageCircle, ArrowUpRight, Instagram } from "lucide-react";

export const WHATSAPP = "5531975894545";

export function waLink(texto: string) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

export const MSG_ENCOMENDA =
  "Olá! Vim pelo site e quero fazer uma encomenda para retirada em Uberlândia-MG na Amor de Brigadeiro.";
export const MSG_CURSO =
  "Olá! Quero me inscrever no Curso de Cupcakes da Amor de Brigadeiro, em Uberlândia-MG.";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="site-eyebrow">
      <span aria-hidden>♥</span> {children} <span aria-hidden>♥</span>
    </p>
  );
}

/** Título editorial: primeira linha em bold, segunda em itálico terracota. */
export function EditorialTitle({
  linha1,
  linha2,
  as: Tag = "h2",
  className = "",
}: {
  linha1: string;
  linha2?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Tag className={`site-display ${className}`}>
      {linha1}
      {linha2 ? (
        <>
          {" "}
          <em className="site-display-em">{linha2}</em>
        </>
      ) : null}
    </Tag>
  );
}

export function SiteButton({
  href,
  children,
  variant = "solid",
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] transition-colors";
  const styles =
    variant === "solid"
      ? "bg-primary text-primary-foreground hover:bg-accent"
      : "border border-border text-foreground hover:bg-secondary";
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`${base} ${styles}`}>
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" />
    </a>
  );
}

const navItems = [
  { label: "Bolos", to: "/site", hash: "bolos" },
  { label: "Cursos", to: "/site/cursos", hash: undefined },
  { label: "Nosso jeito", to: "/site", hash: "nosso-jeito" },
  { label: "Retirada em Uberlândia", to: "/site", hash: "encomendas" },
] as const;

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="site-theme min-h-screen bg-background text-foreground">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em]">
          <span>bolos com cobertura, feitos sob encomenda</span>
          <span className="hidden md:inline">
            Uberlândia–MG · retirada no local · pedidos pelo WhatsApp
          </span>
          <a
            href={waLink(MSG_ENCOMENDA)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            falar com a confeitaria <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/site" className="flex items-center gap-3">
            <img
              src="/site/logo-amor-de-brigadeiro-transparent_9a17be92.png"
              alt="Logomarca Amor de Brigadeiro"
              className="h-12 w-12 rounded-full border border-border bg-card object-contain p-1"
            />
            <span>
              <span className="site-display block text-xl leading-none">Amor de Brigadeiro</span>
              <span className="site-eyebrow mt-1 block">bolos com cobertura</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => {
              const cls =
                "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-foreground/80 transition-colors hover:text-accent";
              return item.hash ? (
                <Link key={item.label} to="/site" hash={item.hash} className={cls}>
                  {item.label}
                </Link>
              ) : (
                <Link key={item.label} to="/site/cursos" className={cls}>
                  {item.label}
                </Link>
              );
            })}

            <a
              href={waLink(MSG_ENCOMENDA)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent hover:underline"
            >
              <MessageCircle className="h-4 w-4" /> encomendar
            </a>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-24 border-t border-border/70 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="site-display text-2xl">Amor de Brigadeiro</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] opacity-80">
              Uberlândia–MG · encomendas e cursos presenciais
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] opacity-90">
            <a href={waLink(MSG_ENCOMENDA)} target="_blank" rel="noreferrer" className="hover:underline">
              WhatsApp (31) 97589-4545
            </a>
            <a
              href="https://www.instagram.com/amordebrigadeirooficial"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:underline"
            >
              <Instagram className="h-4 w-4" /> Siga @amordebrigadeirooficial
            </a>
            <Link to="/" className="hover:underline">
              área de gestão
            </Link>
          </div>
        </div>
      </footer>

      <a
        href={waLink(MSG_ENCOMENDA)}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-accent-foreground shadow-lg"
      >
        <MessageCircle className="h-4 w-4" /> falar no WhatsApp
      </a>
    </div>
  );
}
