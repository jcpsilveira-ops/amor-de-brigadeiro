CREATE TABLE public.fatores_conversao (
  id bigint generated always as identity primary key,
  unidade text not null unique,
  base text not null,
  fator numeric not null default 1,
  observacao text,
  criado_em timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fatores_conversao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fatores_conversao TO authenticated;
GRANT ALL ON public.fatores_conversao TO service_role;
ALTER TABLE public.fatores_conversao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico fatores_conversao" ON public.fatores_conversao FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);