CREATE TABLE public.ingredientes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL,
  custo_unitario NUMERIC NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.bolos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  preco_venda NUMERIC NOT NULL DEFAULT 0,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.coberturas (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  preco_venda NUMERIC NOT NULL DEFAULT 0,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.clientes (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.pedidos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  bolo_id BIGINT NOT NULL REFERENCES public.bolos(id) ON DELETE RESTRICT,
  cobertura_id BIGINT REFERENCES public.coberturas(id) ON DELETE RESTRICT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredientes, public.bolos, public.coberturas, public.clientes, public.pedidos TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON public.ingredientes, public.bolos, public.coberturas, public.clientes, public.pedidos TO service_role;

ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coberturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso publico ingredientes" ON public.ingredientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso publico bolos" ON public.bolos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso publico coberturas" ON public.coberturas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso publico clientes" ON public.clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso publico pedidos" ON public.pedidos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredientes, public.bolos, public.coberturas, public.clientes, public.pedidos;