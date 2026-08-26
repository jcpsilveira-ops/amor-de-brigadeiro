CREATE TABLE public.fatores_conversao_historico (
  id bigint generated always as identity primary key,
  fator_id bigint,
  unidade text not null,
  base text not null,
  fator numeric not null default 1,
  observacao text,
  acao text not null default 'alterado',
  versao integer not null default 1,
  autor text not null default 'Não identificado',
  criado_em timestamptz not null default now()
);
CREATE INDEX fatores_conversao_historico_unidade_idx ON public.fatores_conversao_historico (unidade, versao);
GRANT SELECT, INSERT ON public.fatores_conversao_historico TO anon;
GRANT SELECT, INSERT ON public.fatores_conversao_historico TO authenticated;
GRANT ALL ON public.fatores_conversao_historico TO service_role;
ALTER TABLE public.fatores_conversao_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura publica historico fatores" ON public.fatores_conversao_historico FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "registro publico historico fatores" ON public.fatores_conversao_historico FOR INSERT TO anon, authenticated WITH CHECK (true);