import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Clock, MapPin, Sparkles } from "lucide-react";

import {
  EditorialTitle,
  Eyebrow,
  MSG_ENCOMENDA,
  SiteButton,
  SiteChrome,
  waLink,
} from "../components/site/SiteChrome";

export const Route = createFileRoute("/site")({
  head: () => ({
    meta: [
      { title: "Amor de Brigadeiro | Bolos com cobertura em Uberlândia–MG" },
      {
        name: "description",
        content:
          "Bolos com cobertura feitos sob encomenda em Uberlândia–MG, com retirada no local e pedidos pelo WhatsApp. Também temos cursos práticos de confeitaria.",
      },
      { property: "og:title", content: "Amor de Brigadeiro | Bolos com cobertura sob encomenda" },
      {
        property: "og:description",
        content:
          "Encomende bolos com cobertura e recheio generoso em Uberlândia–MG. Retirada no local e atendimento pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SitePage,
});

const bolos = [
  {
    n: "01",
    nome: "Bolo Brigadeiro",
    tag: "cobertura de granulado",
    img: "/site/bolo-brigadeiro_17870532.jpg",
    texto:
      "Massa macia, recheio cremoso e uma cobertura generosa de brigadeiro para celebrar sem economia.",
  },
  {
    n: "02",
    nome: "Bolos com cobertura",
    tag: "para a mesa ficar bonita",
    img: "/site/bolo-mesa_8bf7b70f.jpg",
    texto:
      "Receitas feitas sob encomenda, com acabamento cuidadoso e espaço para você escolher o sabor da ocasião.",
  },
  {
    n: "03",
    nome: "Seu bolo, do seu jeito",
    tag: "conversamos pelo WhatsApp",
    img: "/site/bolo-do-seu-jeito_7fd1e27c.jpg",
    texto:
      "Conte a data, o tamanho e a ideia. A gente monta uma sugestão gostosa para você retirar no local.",
  },
];

const galeria = [
  {
    img: "/site/bolo-embalado-branco_417512a6.jpg",
    n: "01 / presente",
    legenda: "Um bolo pronto para chegar bonito.",
    alt: "Bolo branco embalado com laço vermelho e cartão Amor de Brigadeiro",
  },
  {
    img: "/site/bolos-com-lacos_a0210717.jpg",
    n: "02 / cuidado",
    legenda: "Cada encomenda vai com carinho.",
    alt: "Três bolos embalados com laços vermelhos",
  },
  {
    img: "/site/mesa-de-bolos_2be95d4a.jpg",
    n: "03 / vitrine",
    legenda: "Sabores para escolher.",
    alt: "Mesa com vários bolos cobertos e embalados",
  },
  {
    img: "/site/bolo-brigadeiro-granulado_ba29b1e3.jpg",
    n: "04 / chocolate",
    legenda: "Cobertura generosa, do jeito que a gente gosta.",
    alt: "Close de bolo de brigadeiro coberto com granulado",
  },
  {
    img: "/site/bolo-forma-granulado_4a0fbf99.jpg",
    n: "05 / feito à mão",
    legenda: "Textura que começa na cozinha.",
    alt: "Bolo assado em forma com cobertura de granulado",
  },
  {
    img: "/site/bolo-festa-laco_fc342e54.jpg",
    n: "06 / celebrar",
    legenda: "Para a próxima história da sua mesa.",
    alt: "Bolo de festa com laço vermelho em uma mesa",
  },
];

function SitePage() {
  return (
    <SiteChrome>
      {/* ------------------------------- escolha ------------------------------- */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 md:pt-24">
        <Eyebrow>um amor, dois jeitos de viver</Eyebrow>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <EditorialTitle
            as="h1"
            linha1="Escolha o seu"
            linha2="momento doce."
            className="text-4xl md:text-6xl"
          />
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Na Amor de Brigadeiro, você pode encomendar um bolo para a sua mesa ou aprender a
            confeitar o seu próprio. Qual caminho combina com hoje?
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <a
            href="#bolos"
            className="group grid overflow-hidden rounded-2xl border border-border bg-secondary/50 sm:grid-cols-2"
          >
            <img
              src="/site/bolo-brigadeiro_17870532.jpg"
              alt="Bolo de brigadeiro com cobertura"
              loading="lazy"
              className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:h-full"
            />
            <div className="flex flex-col justify-between gap-6 p-6">
              <p className="site-eyebrow">01 / confeitaria</p>
              <EditorialTitle linha1="Bolos com cobertura" linha2="para celebrar." className="text-2xl" />
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent">
                ver bolos e encomendar
              </p>
            </div>
          </a>

          <Link
            to="/site/cursos"
            className="group grid overflow-hidden rounded-2xl border border-border bg-primary text-primary-foreground sm:grid-cols-2"
          >
            <img
              src="/site/curso-cupcakes-2_960c07d1.jpg"
              alt="Arte do Curso de Cupcakes"
              loading="lazy"
              className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:h-full"
            />
            <div className="flex flex-col justify-between gap-6 p-6">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] opacity-80">
                02 / cursos
              </p>
              <p className="site-display text-2xl">
                Aprenda a confeitar{" "}
                <em className="site-display-em text-[color:var(--gold)]">com afeto.</em>
              </p>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] opacity-90">
                conhecer os cursos
              </p>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-center text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          encomendas e cursos presenciais em Uberlândia–MG ♥ inscrições pelo WhatsApp
        </p>
      </section>

      {/* -------------------------------- hero -------------------------------- */}
      <section className="border-y border-border/70 bg-secondary/40 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Eyebrow>receita de família, carinho de hoje</Eyebrow>
            <EditorialTitle
              linha1="Um bolo bonito"
              linha2="muda o dia."
              className="mt-5 text-3xl md:text-5xl"
            />
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Bolos com cobertura e recheio generoso para aniversários, encontros e aquela vontade de
              adoçar a semana — com encomendas e retirada em Uberlândia–MG.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SiteButton href={waLink(MSG_ENCOMENDA)}>Pedir pelo WhatsApp</SiteButton>
              <SiteButton href="#bolos" variant="outline">
                ver bolos
              </SiteButton>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Sparkles, t: "Sob encomenda", s: "feito no seu ritmo" },
                { icon: MapPin, t: "Retirada em Uberlândia–MG", s: "combinamos o melhor horário" },
                { icon: Clock, t: "Pedidos em Uberlândia–MG", s: "resposta de gente de verdade" },
              ].map(({ icon: Icon, t, s }) => (
                <div key={t} className="rounded-xl border border-border bg-card p-4">
                  <Icon className="h-4 w-4 text-accent" />
                  <p className="mt-2 text-sm font-bold">{t}</p>
                  <p className="text-xs text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
          </div>

          <figure className="overflow-hidden rounded-2xl border border-border bg-card">
            <img
              src="/site/bolo-da-semana_bb4dad1b.jpg"
              alt="Bolo de brigadeiro coberto com granulado sobre um prato colorido"
              className="h-[26rem] w-full object-cover"
            />
            <figcaption className="flex items-center justify-between px-5 py-4">
              <span>
                <span className="site-eyebrow block">bolo da semana</span>
                <span className="text-sm font-bold">brigadeiro com granulado</span>
              </span>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">01 / 03</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* -------------------------------- bolos -------------------------------- */}
      <section id="bolos" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-20">
        <Eyebrow>o que sai da nossa cozinha</Eyebrow>
        <EditorialTitle
          linha1="Escolha o sabor."
          linha2="A ocasião a gente adoça."
          className="mt-5 text-3xl md:text-5xl"
        />
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Um pequeno catálogo para inspirar. Cada bolo é preparado fresquinho e finalizado para a sua
          data — fale com a gente para confirmar sabores, tamanhos e disponibilidade.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {bolos.map((b) => (
            <article
              key={b.nome}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="relative">
                <img
                  src={b.img}
                  alt={b.nome}
                  loading="lazy"
                  className="h-60 w-full object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em]">
                  {b.n}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <p className="site-eyebrow">{b.tag}</p>
                <h3 className="site-display text-xl">{b.nome}</h3>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{b.texto}</p>
                <a
                  href={waLink(
                    `Olá! Quero encomendar um ${b.nome} na Amor de Brigadeiro.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent hover:underline"
                >
                  quero este bolo →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ----------------------------- nosso jeito ----------------------------- */}
      <section
        id="nosso-jeito"
        className="scroll-mt-28 border-y border-border/70 bg-secondary/40 py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2 lg:items-center">
          <img
            src="/site/ingredientes_a255038e.jpg"
            alt="Ingredientes e utensílios usados no preparo dos bolos"
            loading="lazy"
            className="h-[24rem] w-full rounded-2xl border border-border object-cover"
          />
          <div>
            <Eyebrow>feito com cuidado</Eyebrow>
            <EditorialTitle linha1="A cobertura" linha2="é só o começo." className="mt-5 text-3xl md:text-5xl" />
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Tem o tempo de escolher os ingredientes, preparar a massa, acertar o ponto do
              brigadeiro e esperar o bolo esfriar antes do acabamento.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              É assim que um bolo deixa de ser sobremesa e vira parte da lembrança: com sabor,
              textura e um pouco de carinho em cada camada.
            </p>
            <div className="mt-8">
              <SiteButton href={waLink(MSG_ENCOMENDA)}>conversar sobre uma encomenda</SiteButton>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- encomendas ------------------------------ */}
      <section id="encomendas" className="mx-auto max-w-6xl scroll-mt-28 px-5 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <Eyebrow>combinado com carinho</Eyebrow>
            <EditorialTitle linha1="Encomende em" linha2="Uberlândia–MG." className="mt-5 text-3xl md:text-5xl" />
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Atendemos encomendas para retirada em <strong>Uberlândia–MG</strong>. Você chama no
              WhatsApp, conta a data e escolhe o bolo. A gente combina o horário e deixa tudo pronto,
              fresquinho e bem embalado.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <MapPin className="h-4 w-4 text-accent" />
                <p className="mt-2 text-sm font-bold">Retirada em Uberlândia–MG</p>
                <p className="text-xs text-muted-foreground">
                  endereço e horário combinados pelo WhatsApp
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <CalendarClock className="h-4 w-4 text-accent" />
                <p className="mt-2 text-sm font-bold">Faça com antecedência</p>
                <p className="text-xs text-muted-foreground">
                  assim conseguimos preparar tudo com calma
                </p>
              </div>
            </div>
            <div className="mt-8">
              <SiteButton href={waLink(MSG_ENCOMENDA)}>Quero fazer uma encomenda</SiteButton>
            </div>
          </div>
          <img
            src="/site/logo-amor-de-brigadeiro-transparent_9a17be92.png"
            alt="Logomarca Amor de Brigadeiro"
            loading="lazy"
            className="mx-auto w-64 max-w-full"
          />
        </div>
      </section>

      {/* ------------------------------- galeria ------------------------------- */}
      <section className="border-y border-border/70 bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Eyebrow>um pouco do que sai daqui</Eyebrow>
          <EditorialTitle linha1="Feitos para" linha2="ser lembrados." className="mt-5 text-3xl md:text-5xl" />
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Uma seleção de bolos que já passaram pela nossa cozinha — com cobertura, laço e cuidado em
            cada detalhe. Quer ver o seu por aqui? Fale com a gente.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galeria.map((g) => (
              <figure
                key={g.img}
                className="group overflow-hidden rounded-2xl border border-border bg-card"
              >
                <img
                  src={g.img}
                  alt={g.alt}
                  loading="lazy"
                  className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <figcaption className="p-4">
                  <p className="site-eyebrow">{g.n}</p>
                  <p className="mt-1 text-sm font-bold">{g.legenda}</p>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-10">
            <SiteButton href={waLink(MSG_ENCOMENDA)}>Encomendar um bolo</SiteButton>
          </div>
        </div>
      </section>

      {/* ----------------------------- depoimentos ----------------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Eyebrow>palavras que chegam de volta</Eyebrow>
        <EditorialTitle linha1="O doce vira" linha2="lembrança." className="mt-5 text-3xl md:text-5xl" />
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Estamos reunindo depoimentos reais de quem já recebeu um bolo ou participou de um curso da
          Amor de Brigadeiro — sempre com autorização.
        </p>

        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8">
          <p className="site-display text-5xl leading-none text-accent">“</p>
          <p className="site-eyebrow mt-4">caderno de carinho</p>
          <p className="site-display mt-2 text-2xl">
            Este espaço será preenchido{" "}
            <em className="site-display-em">com histórias de verdade.</em>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Quer compartilhar como foi sua experiência? Fale com a gente pelo WhatsApp.
          </p>
          <div className="mt-6">
            <SiteButton
              href={waLink("Olá! Quero compartilhar minha experiência com a Amor de Brigadeiro.")}
              variant="outline"
            >
              Enviar minha avaliação
            </SiteButton>
          </div>
        </div>
      </section>

      {/* -------------------------------- final -------------------------------- */}
      <section className="border-t border-border/70 bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] opacity-80">
            04 / amor de brigadeiro
          </p>
          <p className="mt-3 text-sm opacity-90">um bolo para a sua próxima história</p>
          <p className="site-display mt-4 text-4xl md:text-6xl">
            Vamos fazer <em className="site-display-em text-[color:var(--gold)]">com amor?</em>
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href={waLink(MSG_ENCOMENDA)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-foreground hover:bg-secondary"
            >
              chamar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
