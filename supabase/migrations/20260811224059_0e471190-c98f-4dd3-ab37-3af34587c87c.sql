CREATE TABLE public.outras_despesas (
  id BIGSERIAL PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outras_despesas TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.outras_despesas_id_seq TO anon, authenticated;
GRANT ALL ON public.outras_despesas TO service_role;
GRANT ALL ON SEQUENCE public.outras_despesas_id_seq TO service_role;

ALTER TABLE public.outras_despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso publico outras_despesas" ON public.outras_despesas
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.outras_despesas;