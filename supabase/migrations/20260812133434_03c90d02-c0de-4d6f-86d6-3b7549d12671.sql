CREATE TABLE public.cursos (
  id bigserial PRIMARY KEY,
  nome text NOT NULL,
  preco_venda numeric NOT NULL DEFAULT 0,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cursos TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.cursos_id_seq TO anon, authenticated;
GRANT ALL ON public.cursos TO service_role;
GRANT ALL ON SEQUENCE public.cursos_id_seq TO service_role;

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso publico cursos" ON public.cursos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.pedidos ADD COLUMN curso_id bigint REFERENCES public.cursos(id);
ALTER TABLE public.pedidos ALTER COLUMN bolo_id DROP NOT NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.cursos;