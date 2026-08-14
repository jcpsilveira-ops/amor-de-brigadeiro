import { createFileRoute } from "@tanstack/react-router";
import { Award, BookOpen, CakeSlice, GraduationCap } from "lucide-react";

import {
  EditorialTitle,
  Eyebrow,
  MSG_CURSO,
  SiteButton,
  SiteChrome,
  waLink,
} from "../components/site/SiteChrome";

export const Route = createFileRoute("/site/cursos")({
  head: () => ({
    meta: [
      { title: "Curso de Cupcakes em Uberlândia–MG | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Curso prático e presencial de cupcakes em Uberlândia–MG: 12/09/2026, das 14h às 18h, com e-book, certificado e cupcakes incluídos. Vagas limitadas.",
      },
      { property: "og:title", content: "Curso de Cupcakes | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Uma tarde prática para aprender a confeitar cupcakes lindos em Uberlândia–MG. Inscrições pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CursosSitePage,
});

const beneficios = [
  { icon: GraduationCap, t: "Curso prático e presencial", s: "acompanhe cada etapa de perto" },
  { icon: BookOpen, t: "E-book incluso", s: "leve o conteúdo para continuar praticando" },
  { icon: CakeSlice, t: "Cupcakes incluídos", s: "prepare, decore e leve suas criações" },
  { icon: Award, t: "Certificado de participação", s: "um registro da sua nova habilidade" },
];

const detalhes = [
  { rotulo: "quando", valor: "12 de setembro de 2026" },
  { rotulo: "horário", valor: "das 14h às 18h" },
  { rotulo: "onde", valor: "Uberlândia–MG" },
  { rotulo: "inscrições", valor: "(31) 97589-4545" },
  { rotulo: "investimento", valor: "R$ 197,00 · vagas limitadas" },
];

const registros = [
  { img: "/site/WhatsAppImage2026-08-13_079f7e33.jpeg", n: "01 / mãos na massa", legenda: "Uma tarde de prática e troca." },
  { img: "/site/WhatsAppImage2026-08-13at_289361d2.jpeg", n: "02 / turma presencial", legenda: "Aprender junto deixa tudo mais gostoso." },
  { img: "/site/WhatsAppImage2026-08-13at16.43.38_89af9db0.jpeg", n: "03 / na prática", legenda: "Cada detalhe começa com uma tentativa." },
  { img: "/site/WhatsAppImage2026-08-13at16.43.39_c9e1d1ba.jpeg", n: "04 / colorir", legenda: "Confeitos para inventar combinações." },
  { img: "/site/WhatsAppImage2026-08-13at16.43.40_710ea37a.jpeg", n: "05 / preparo", legenda: "A bancada pronta para começar." },
  { img: "/site/WhatsAppImage2026-08-13at16.43.42_6896b6a7.jpeg", n: "06 / cobertura", legenda: "Texturas que fazem a diferença." },
  { img: "/site/WhatsAppImage2026-08-13at16.43_c2fe53fe.jpeg", n: "07 / resultado", legenda: "O primeiro cupcake feito por você." },
  { img: "/site/WhatsAppImage_eb2a14e6.jpeg", n: "08 / para provar", legenda: "Uma lembrança doce para levar." },
  { img: "/site/WhatsAppImage2026-08-13at16.43.41_9b369b35.jpeg", n: "09 / encontro", legenda: "Mais um registro da tarde de aula." },
  { img: "/site/WhatsAppImage2026-08-13at16.43.43_ca0a997e.jpeg", n: "10 / detalhes", legenda: "Detalhes que ficam na memória." },
  { img: "/site/WhatsAppImage2026-08-13at16_68d7d2b2.jpeg", n: "11 / prática", legenda: "Aprender fazendo, lado a lado." },
  { img: "/site/WhatsAppImage2026_6d2520b1.jpeg", n: "12 / lembrança", legenda: "Uma tarde para guardar." },
];

function CursosSitePage() {
  return (
    <SiteChrome>
      {/* --------------------------------- hero -------------------------------- */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 md:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <Eyebrow>aprendizado que dá vontade de repetir</Eyebrow>
            <EditorialTitle
              as="h1"
              linha1="Aprenda a fazer"
              linha2="cupcakes lindos."
              className="mt-5 text-4xl md:text-6xl"
            />
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Uma tarde prática para colocar a mão na massa, aprender técnicas de confeitaria e sair
              com seus próprios cupcakes — em Uberlândia–MG.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SiteButton href={waLink(MSG_CURSO)}>Quero me inscrever</SiteButton>
              <SiteButton href="#detalhes" variant="outline">
                ver detalhes
              </SiteButton>
            </div>
            <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              um curso para confeitar com mais confiança
            </p>
          </div>

          <figure className="overflow-hidden rounded-2xl border border-border bg-card">
            <img
              src="/site/cupcakes-curso-editorial_0b354f71.png"
              alt="Arte do Curso de Cupcakes da Amor de Brigadeiro"
              className="w-full object-cover"
            />
            <figcaption className="flex items-center justify-between px-5 py-4">
              <span>
                <span className="site-eyebrow block">turma presencial</span>
                <span className="text-sm font-bold">12 SET · Uberlândia–MG</span>
              </span>
              <span className="site-display text-2xl text-accent">12</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ------------------------------ detalhes ------------------------------- */}
      <section
        id="detalhes"
        className="scroll-mt-28 border-y border-border/70 bg-secondary/40 py-20"
      >
        <div className="mx-auto max-w-6xl px-5">
          <Eyebrow>o que você vai encontrar</Eyebrow>
          <EditorialTitle
            linha1="Uma tarde doce,"
            linha2="do começo ao fim."
            className="mt-5 text-3xl md:text-5xl"
          />
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            O Curso de Cupcakes foi pensado para quem quer aprender fazendo, com orientação próxima,
            receitas possíveis e acabamento que enche os olhos.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              {beneficios.map(({ icon: Icon, t, s }) => (
                <div key={t} className="rounded-xl border border-border bg-card p-5">
                  <Icon className="h-4 w-4 text-accent" />
                  <p className="mt-2 text-sm font-bold">{t}</p>
                  <p className="text-xs text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <p className="site-eyebrow">caderno de aula</p>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">01 / 01</p>
              </div>
              <dl className="mt-4 divide-y divide-border">
                {detalhes.map((d) => (
                  <div key={d.rotulo} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="site-eyebrow">{d.rotulo}</dt>
                    <dd className="text-right text-sm font-bold">{d.valor}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <SiteButton href={waLink(MSG_CURSO)}>Reservar minha vaga</SiteButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ registros ------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Eyebrow>registros da última turma</Eyebrow>
        <EditorialTitle linha1="Mãos na massa," linha2="memórias doces." className="mt-5 text-3xl md:text-5xl" />
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Um pouco do que aconteceu no último curso realizado: ingredientes preparados, decoração
          compartilhada e cupcakes feitos pelas participantes.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {registros.map((r) => (
            <figure
              key={r.img}
              className="group overflow-hidden rounded-2xl border border-border bg-card"
            >
              <img
                src={r.img}
                alt={r.legenda}
                loading="lazy"
                className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <figcaption className="p-4">
                <p className="site-eyebrow">{r.n}</p>
                <p className="mt-1 text-sm font-bold">{r.legenda}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10">
          <SiteButton href={waLink(MSG_CURSO)}>Quero participar da próxima turma</SiteButton>
        </div>
      </section>

      {/* -------------------------------- final -------------------------------- */}
      <section className="border-t border-border/70 bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] opacity-80">
            sua próxima receita começa aqui
          </p>
          <p className="site-display mt-4 text-3xl md:text-5xl">
            Reserve sua vaga <em className="site-display-em text-[color:var(--gold)]">pelo WhatsApp.</em>
          </p>
          <p className="mx-auto mt-5 max-w-xl text-sm opacity-90">
            As inscrições são feitas diretamente com a Amor de Brigadeiro. Chame a gente para
            confirmar sua vaga e receber as orientações.
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href={waLink(MSG_CURSO)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-background px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] text-foreground hover:bg-secondary"
            >
              falar sobre o curso
            </a>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
