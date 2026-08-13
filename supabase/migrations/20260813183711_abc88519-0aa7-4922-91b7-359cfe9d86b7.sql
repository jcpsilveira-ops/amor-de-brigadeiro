CREATE TABLE public.movimentacoes_estoque (
  id BIGSERIAL PRIMARY KEY,
  ingrediente_id BIGINT NOT NULL REFERENCES public.ingredientes(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL DEFAULT 'ajuste',
  quantidade NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL,
  quantidade_anterior NUMERIC NOT NULL DEFAULT 0,
  quantidade_nova NUMERIC NOT NULL DEFAULT 0,
  custo_unitario NUMERIC NOT NULL DEFAULT 0,
  valor NUMERIC NOT NULL DEFAULT 0,
  custo_reposicao NUMERIC NOT NULL DEFAULT 0,
  observacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque TO authenticated;
GRANT ALL ON public.movimentacoes_estoque TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.movimentacoes_estoque_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.movimentacoes_estoque_id_seq TO authenticated;

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso publico movimentacoes_estoque"
ON public.movimentacoes_estoque
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX idx_movimentacoes_estoque_data ON public.movimentacoes_estoque (data DESC, id DESC);
CREATE INDEX idx_movimentacoes_estoque_ingrediente ON public.movimentacoes_estoque (ingrediente_id);