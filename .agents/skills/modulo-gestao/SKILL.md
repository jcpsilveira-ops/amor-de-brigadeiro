---
name: modulo-gestao
description: Processo padrão deste projeto para criar ou alterar um módulo de gestão (tabela + tela CRUD + métricas no painel/relatório) e para criar dashboards analíticos. Use ao pedir "nova tabela", "novo cadastro", "novo campo", "novo painel/dashboard" ou "incluir no relatório".
---

# Módulo de gestão (Amor de Brigadeiro)

Fluxo repetível usado em todos os módulos (ingredientes, estoque, bolos, coberturas,
cursos, clientes, pedidos, outras receitas, outras despesas, movimentações).

## Ordem de execução

1. **Banco (Lovable Cloud)** — `supabase--migration`. Tabela em `public.<nome>`,
   snake_case, `id bigint generated always as identity`, `criado_em timestamptz default now()`.
   Na MESMA migração, nesta ordem: `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY`.
   Este app é de acesso compartilhado por link (sem login): políticas públicas de
   leitura/escrita para `anon` e `authenticated`, com `GRANT ALL ... TO service_role`.
2. **Domínio** — `src/lib/domain.ts`: tipo `X`, tipo `XInput`, `xSchema` (Zod, mensagens
   em português) e qualquer fórmula de negócio. Nunca duplicar fórmula em tela.
3. **API** — `src/lib/api.ts`: exportar `xApi` com `list/create/update/remove`,
   mapeando snake_case do banco para camelCase do app. Telas nunca falam com
   `supabase` diretamente. Erros de regra: `throw new ApiError("mensagem em pt-BR")`.
4. **Queries** — `src/lib/queries.ts`: adicionar `keys.x`, hook `useX()` e re-export do
   `xApi`. Mutações sempre via `useAppMutation` (toast + invalidação).
5. **Tela** — `src/routes/<nome>.tsx`: `createFileRoute` com `head()` próprio
   (title/description/og:title/og:description/og:type/twitter:card, texto único em pt-BR),
   `PageShell` + `Card` de formulário à esquerda/topo, `Table` de listagem,
   `EmptyState` quando vazio, `FieldError` por campo, `ConfirmDelete` para excluir,
   botão `Pencil` para editar inline, e um total/resumo no rodapé do card.
6. **Menu** — `src/components/AppNav.tsx`: novo item em `links` com ícone lucide.
7. **Painel e relatório** — se o módulo tem dinheiro envolvido, refletir em
   `src/routes/index.tsx` e `src/routes/relatorio.tsx` usando os MESMOS helpers de
   filtro de mês e de cálculo. Painel e relatório nunca podem divergir.
8. **Verificar** — rodar o preview/dev, conferir a tela e o painel; só então publicar
   (com `security--run_security_scan` antes de publicações relevantes).

## Dashboards analíticos

Componente em `src/components/Resumo<Tema>.tsx` recebendo o período como prop; rota
`src/routes/painel-<tema>.tsx` que envolve o componente com seletor de mês/ano
(incluindo a opção "Todos os meses"); link no `AppNav`. Estrutura: grid de KPIs →
rankings Top 5 → evolução mensal. Valores em `brl()`, datas em `dataBR()`.

## Convenções invioláveis

- Todo texto de interface em **português do Brasil**.
- Somente tokens semânticos de cor (paleta creme/chocolate/rosa em `src/styles.css`);
  nunca `text-white`, `bg-black` ou hex inline. Fontes: `font-display` (Baloo 2) em
  títulos, Nunito no corpo.
- Estoque: nunca deixar saldo negativo; ler o saldo atual do banco antes de gravar
  (padrão de `src/lib/consumo-pedido.ts`) e registrar cada variação em
  `movimentacoes_estoque`.
- Estoque existente conta como "Entrada inicial" apenas via os helpers de
  `src/lib/estoque.ts` — não somar estoque atual com movimentações (dupla contagem).
- PDFs: `jspdf`, seguindo o estilo de `src/lib/nutricional-pdf.ts`.
- Nunca mencionar "Supabase" ao usuário: dizer "banco de dados" / "nuvem".
