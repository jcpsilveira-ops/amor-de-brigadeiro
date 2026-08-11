ALTER TABLE public.ingredientes
  ADD COLUMN estoque_quantidade numeric NOT NULL DEFAULT 0,
  ADD COLUMN estoque_unidade text;

UPDATE public.ingredientes SET estoque_unidade = unidade WHERE estoque_unidade IS NULL;