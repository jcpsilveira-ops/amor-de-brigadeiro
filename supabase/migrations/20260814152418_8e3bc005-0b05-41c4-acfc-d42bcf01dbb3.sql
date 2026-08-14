insert into public.movimentacoes_estoque (ingrediente_id, data, tipo, quantidade, unidade, quantidade_anterior, quantidade_nova, custo_unitario, valor, custo_reposicao, observacao) values
 (33, (select data from public.pedidos where id=41), 'saida', 1, 'unidade', 9, 8, 1.3, 1.3, 1.3, 'Produção do pedido #41 — outros itens (registro retroativo)'),
 (34, (select data from public.pedidos where id=41), 'saida', 1, 'unidade', 1, 0, 10, 10, 10, 'Produção do pedido #41 — outros itens (registro retroativo)'),
 (33, (select data from public.pedidos where id=42), 'saida', 1, 'unidade', 8, 7, 1.3, 1.3, 1.3, 'Produção do pedido #42 — outros itens (registro retroativo)'),
 (34, (select data from public.pedidos where id=42), 'saida', 1, 'unidade', 0, -1, 10, 10, 10, 'Produção do pedido #42 — outros itens (registro retroativo)');

update public.ingredientes set estoque_quantidade = 7 where id = 33;
update public.ingredientes set estoque_quantidade = -1 where id = 34;