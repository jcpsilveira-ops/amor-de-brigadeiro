ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS outros_itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS outros_preco numeric NOT NULL DEFAULT 0;