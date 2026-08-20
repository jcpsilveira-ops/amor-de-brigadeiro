CREATE TABLE public.configuracoes (
  chave text PRIMARY KEY,
  valor text NOT NULL DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO anon, authenticated;
GRANT ALL ON public.configuracoes TO service_role;

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso publico configuracoes" ON public.configuracoes
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.configuracoes (chave, valor)
VALUES ('dashboard_externo_url', 'https://amordash-5yrr3vx8.manus.space/');