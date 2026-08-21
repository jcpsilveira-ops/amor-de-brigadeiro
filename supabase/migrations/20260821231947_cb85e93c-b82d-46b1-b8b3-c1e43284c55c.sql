create table if not exists public.historico_precos (
  id bigserial primary key,
  ingrediente_id bigint not null references public.ingredientes(id) on delete cascade,
  ingrediente_nome text not null,
  mercado text not null,
  preco numeric not null default 0,
  fonte text,
  criado_em timestamp with time zone not null default now()
);

grant select, insert, update, delete on public.historico_precos to authenticated;
grant select, insert on public.historico_precos to anon;
grant all on public.historico_precos to service_role;
grant usage, select on sequence public.historico_precos_id_seq to anon, authenticated;
grant all on sequence public.historico_precos_id_seq to service_role;

alter table public.historico_precos enable row level security;

create policy "acesso publico historico_precos"
on public.historico_precos for all
to anon, authenticated
using (true) with check (true);

create index if not exists historico_precos_ingrediente_idx
  on public.historico_precos (ingrediente_id, mercado, criado_em desc);