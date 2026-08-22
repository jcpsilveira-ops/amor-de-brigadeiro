CREATE TABLE public.mercados (
  id bigint generated always as identity primary key,
  nome text not null unique,
  url_busca text,
  origem text not null default 'manual',
  criado_em timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mercados TO anon, authenticated;
GRANT ALL ON public.mercados TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.mercados_id_seq TO anon, authenticated;
ALTER TABLE public.mercados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico mercados" ON public.mercados FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.precos_mercado (
  id bigint generated always as identity primary key,
  ingrediente_id bigint not null references public.ingredientes(id) on delete cascade,
  mercado_id bigint not null references public.mercados(id) on delete cascade,
  nome_produto text,
  preco numeric,
  peso text,
  fonte text,
  origem text not null default 'automatico',
  atualizado_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  unique (ingrediente_id, mercado_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.precos_mercado TO anon, authenticated;
GRANT ALL ON public.precos_mercado TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.precos_mercado_id_seq TO anon, authenticated;
ALTER TABLE public.precos_mercado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico precos_mercado" ON public.precos_mercado FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.mercados (nome, origem) VALUES
  ('Atacadão', 'automatico'),
  ('Mart Minas', 'automatico'),
  ('Assaí', 'automatico'),
  ('BH', 'automatico'),
  ('ABC', 'automatico'),
  ('Leal', 'automatico'),
  ('D''Ville', 'automatico');