CREATE TABLE public.outras_receitas (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outras_receitas TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.outras_receitas_id_seq TO anon, authenticated;
GRANT ALL ON public.outras_receitas TO service_role;
GRANT ALL ON SEQUENCE public.outras_receitas_id_seq TO service_role;
ALTER TABLE public.outras_receitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico outras_receitas" ON public.outras_receitas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);