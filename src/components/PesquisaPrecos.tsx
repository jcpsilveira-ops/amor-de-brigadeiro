import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Compass,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Store,
  TriangleAlert,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { brl, UNIDADES, type Ingrediente } from "@/lib/domain";

import { brlPreciso } from "@/lib/cesta";
import { medidaPorUnidade, precoPorMedida, rotuloMedida } from "@/lib/precos";

import {
  buscarPrecosMercados,
  descobrirLinkMercadoFn,
  descobrirMercadosFn,
} from "@/lib/precos-mercado.functions";
import {
  indexarPrecos,
  melhorMercadoDoIngrediente,
  precoPorMedidaDoRegistro,
  type MercadoCadastro,
  type PrecoMercado,
  type SugestaoMercado,
} from "@/lib/precos-mercado";
import {
  keys,
  mercadosApi,
  precosMercadoApi,
  useAppMutation,
  useMercados,
  usePrecosMercado,
} from "@/lib/queries";

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

interface EdicaoManual {
  ingrediente: Ingrediente;
  mercado: MercadoCadastro;
  atual: PrecoMercado | undefined;
}

/* ----------------------------- cadastro de mercados ---------------------- */

function CadastroMercados({
  mercados,
  onFechar,
}: {
  mercados: MercadoCadastro[];
  onFechar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [sugestoes, setSugestoes] = useState<SugestaoMercado[]>([]);
  const [descobrindo, setDescobrindo] = useState(false);
  const descobrirLink = useServerFn(descobrirLinkMercadoFn);
  const descobrir = useServerFn(descobrirMercadosFn);

  const criar = useAppMutation<{ nome: string; urlBusca: string | null }>({
    mutationFn: async (input) => {
      // Sem link informado: o sistema procura o site do mercado na internet.
      const urlBusca =
        input.urlBusca ?? (await descobrirLink({ data: { nome: input.nome } })).urlBusca;
      await mercadosApi.create({ nome: input.nome, urlBusca });
    },
    invalidate: [keys.mercados],
    successMessage: "Supermercado cadastrado.",
  });

  const excluir = useAppMutation<number>({
    mutationFn: (id) => mercadosApi.remove(id),
    invalidate: [keys.mercados, keys.precosMercado],
    successMessage: "Supermercado removido.",
  });

  const adicionar = () => {
    const limpo = nome.trim();
    if (limpo.length < 2) {
      toast.error("Informe o nome do supermercado.");
      return;
    }
    criar.mutate(
      { nome: limpo, urlBusca: url.trim() ? url.trim() : null },
      {
        onSuccess: () => {
          setNome("");
          setUrl("");
        },
      },
    );
  };

  const buscarSugestoes = async () => {
    setDescobrindo(true);
    try {
      const r = await descobrir({ data: { jaCadastrados: mercados.map((m) => m.nome) } });
      setSugestoes(r.sugestoes);
      if (r.sugestoes.length === 0) {
        toast.error(r.erro ?? "Nenhum supermercado novo encontrado agora.");
      }
    } finally {
      setDescobrindo(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="label-caps flex items-center gap-2 text-muted-foreground">
          <Store className="h-4 w-4 text-primary" /> Supermercados pesquisados
        </p>
        <Button variant="ghost" size="sm" onClick={onFechar}>
          Fechar
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <div>
          <Label htmlFor="mercado-nome" className="label-caps">
            Nome
          </Label>
          <Input
            id="mercado-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Bahamas"
          />
        </div>
        <div>
          <Label htmlFor="mercado-url" className="label-caps">
            Link de busca (opcional)
          </Label>
          <Input
            id="mercado-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Se ficar em branco, o sistema procura na internet"
          />
        </div>
        <Button onClick={adicionar} disabled={criar.isPending}>
          <Plus className="h-4 w-4" />
          {criar.isPending ? "Salvando..." : "Adicionar"}
        </Button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {mercados.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{m.nome}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {m.urlBusca ?? "Sem link — busca pelo nome"}
              </span>
            </span>
            <ConfirmDelete
              description={`Excluir o supermercado ${m.nome} e seus preços pesquisados?`}
              onConfirm={() => excluir.mutate(m.id)}
            />
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Button variant="outline" size="sm" onClick={() => void buscarSugestoes()} disabled={descobrindo}>
          <Compass className={`h-4 w-4 ${descobrindo ? "animate-spin" : ""}`} />
          {descobrindo ? "Procurando..." : "Descobrir supermercados de Uberlândia"}
        </Button>
        {sugestoes.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {sugestoes.map((s) => (
              <li
                key={s.urlBusca}
                className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{s.nome}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.urlBusca}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    criar.mutate(
                      { nome: s.nome, urlBusca: s.urlBusca },
                      {
                        onSuccess: () =>
                          setSugestoes((atual) => atual.filter((x) => x.urlBusca !== s.urlBusca)),
                      },
                    )
                  }
                >
                  <Plus className="h-4 w-4" /> Usar
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------ entrada manual --------------------------- */

function DialogManual({
  edicao,
  onFechar,
}: {
  edicao: EdicaoManual | null;
  onFechar: () => void;
}) {
  const [nomeProduto, setNomeProduto] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState<string>("");

  useEffect(() => {
    setNomeProduto(edicao?.atual?.nomeProduto ?? "");
    setPreco(edicao?.atual?.preco === null || edicao?.atual?.preco === undefined ? "" : String(edicao.atual.preco));
    const bruto = (edicao?.atual?.peso ?? "").trim();
    // Tenta separar "500 g" em quantidade + unidade da tabela de ingredientes.
    const achada = [...UNIDADES]
      .sort((a, b) => b.length - a.length)
      .find((u) => bruto.toLowerCase().endsWith(u.toLowerCase()));
    if (achada) {
      setQuantidade(bruto.slice(0, bruto.length - achada.length).trim());
      setUnidade(achada);
    } else {
      setQuantidade(bruto);
      setUnidade(edicao?.ingrediente.unidade ?? "");
    }
  }, [edicao]);


  const salvar = useAppMutation<{
    ingredienteId: number;
    mercadoId: number;
    nomeProduto: string | null;
    preco: number | null;
    peso: string | null;
  }>({
    mutationFn: (input) => precosMercadoApi.salvarManual(input),
    invalidate: [keys.precosMercado],
    successMessage: "Preço atualizado manualmente.",
    onSuccess: onFechar,
  });

  if (!edicao) return null;

  const enviar = () => {
    const numero = preco.trim() === "" ? null : Number(preco.replace(",", "."));
    if (numero !== null && (!Number.isFinite(numero) || numero < 0)) {
      toast.error("Informe um preço válido (ex.: 12,50).");
      return;
    }
    const quantidadeLimpa = quantidade.trim();
    salvar.mutate({
      ingredienteId: edicao.ingrediente.id,
      mercadoId: edicao.mercado.id,
      nomeProduto: nomeProduto.trim() ? nomeProduto : null,
      preco: numero === null ? null : Math.round(numero * 100) / 100,
      peso: quantidadeLimpa && unidade ? `${quantidadeLimpa} ${unidade}` : null,
    });
  };

  return (
    <Dialog open onOpenChange={(aberto) => (aberto ? null : onFechar())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-primary">
            {edicao.ingrediente.nome} · {edicao.mercado.nome}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="manual-nome" className="label-caps">
              Nome do produto
            </Label>
            <Input
              id="manual-nome"
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder="Ex.: Leite condensado Itambé"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="manual-preco" className="label-caps">
                Preço (R$)
              </Label>
              <Input
                id="manual-preco"
                inputMode="decimal"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="12,50"
              />
            </div>
            <div>
              <Label htmlFor="manual-qtde" className="label-caps">
                Quantidade
              </Label>
              <Input
                id="manual-qtde"
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="395"
              />
            </div>
            <div>
              <Label htmlFor="manual-unidade" className="label-caps">
                Unidade
              </Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger id="manual-unidade">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Deixe em branco o que você não souber — o sistema não preenche valores estimados.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={enviar} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- pesquisa ------------------------------- */

/** Chave de ordenação: nome do ingrediente, preço do estoque ou preço de um mercado. */
type Ordenacao = { chave: "nome" | "estoque" | `m:${number}`; asc: boolean };

function CabecalhoOrdenavel({
  rotulo,
  chave,
  ordem,
  onOrdenar,
  className,
}: {
  rotulo: string;
  chave: Ordenacao["chave"];
  ordem: Ordenacao;
  onOrdenar: (chave: Ordenacao["chave"]) => void;
  className?: string;
}) {
  const ativo = ordem.chave === chave;
  const Icone = !ativo ? ArrowUpDown : ordem.asc ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onOrdenar(chave)}
        aria-label={`Ordenar por ${rotulo}`}
        className={`inline-flex w-full items-center gap-1 whitespace-nowrap ${
          className?.includes("text-right") ? "justify-end" : ""
        } ${ativo ? "text-primary" : ""}`}
      >
        {rotulo}
        <Icone className="h-3 w-3 opacity-70" />
      </button>
    </TableHead>
  );
}

export function PesquisaPrecos({ ingredientes }: { ingredientes: Ingrediente[] }) {
  const buscar = useServerFn(buscarPrecosMercados);
  const { data: mercados = [] } = useMercados();
  const { data: precos = [], refetch: recarregarPrecos } = usePrecosMercado();
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [edicao, setEdicao] = useState<EdicaoManual | null>(null);
  const [pesquisando, setPesquisando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultima, setUltima] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<Ordenacao>({ chave: "nome", asc: true });

  const ordenar = (chave: Ordenacao["chave"]) =>
    setOrdem((o) => (o.chave === chave ? { chave, asc: !o.asc } : { chave, asc: true }));

  /* Rolagem espelhada entre as duas tabelas (horizontal e vertical). */
  const refA = useRef<HTMLDivElement | null>(null);
  const refB = useRef<HTMLDivElement | null>(null);
  const sincronizando = useRef(false);
  const espelhar = useCallback(
    (origem: HTMLDivElement | null, destino: HTMLDivElement | null) => {
      if (!origem || !destino || sincronizando.current) return;
      sincronizando.current = true;
      destino.scrollLeft = origem.scrollLeft;
      requestAnimationFrame(() => {
        sincronizando.current = false;
      });
    },
    [],
  );

  const indice = useMemo(() => indexarPrecos(precos), [precos]);

  const lista = useMemo(() => {
    const base = [...ingredientes];
    const valor = (i: Ingrediente): number | null => {
      if (ordem.chave === "estoque") return i.custoUnitario ?? null;
      if (ordem.chave === "nome") return null;
      const mercadoId = Number(ordem.chave.slice(2));
      return indice.get(`${i.id}|${mercadoId}`)?.preco ?? null;
    };
    base.sort((a, b) => {
      if (ordem.chave === "nome") {
        const c = a.nome.localeCompare(b.nome);
        return ordem.asc ? c : -c;
      }
      const va = valor(a);
      const vb = valor(b);
      // Itens sem preço vão sempre para o fim da lista.
      if (va === null && vb === null) return a.nome.localeCompare(b.nome);
      if (va === null) return 1;
      if (vb === null) return -1;
      return ordem.asc ? va - vb : vb - va;
    });
    return base;
  }, [ingredientes, ordem, indice]);


  const pesquisar = async () => {
    if (lista.length === 0 || mercados.length === 0) return;
    setPesquisando(true);
    setErro(null);
    try {
      const r = await buscar({
        data: {
          ingredientes: lista.map((i) => ({
            id: i.id,
            nome: i.nome,
            unidade: i.estoqueUnidade ?? i.unidade,
          })),
          mercados: mercados.map((m) => ({ id: m.id, nome: m.nome, urlBusca: m.urlBusca })),
        },
      });
      if (r.erro) setErro(r.erro);
      const gravados = await precosMercadoApi.aplicarAchados(r.achados);
      await recarregarPrecos();
      setUltima(new Date().toISOString());
      toast.success(
        gravados > 0
          ? `${gravados} preço(s) atualizado(s) — só entram valores novos ou menores.`
          : "Pesquisa concluída: nenhum preço menor foi encontrado.",
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na pesquisa de preços.");
    } finally {
      setPesquisando(false);
    }
  };

  /* A pesquisa é sempre manual (botão "Pesquisar preços"). */



  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 font-display text-xl text-primary">
            <Search className="h-5 w-5" />
            Pesquisa de preços — Uberlândia-MG
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMostrarCadastro((v) => !v)}>
              <Store className="h-4 w-4" />
              {mostrarCadastro ? "Fechar supermercados" : "Supermercados"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void pesquisar()}
              disabled={pesquisando}
            >
              <RefreshCw className={`h-4 w-4 ${pesquisando ? "animate-spin" : ""}`} />
              {pesquisando ? "Pesquisando..." : "Atualizar agora"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          A pesquisa é manual e pode ser repetida a qualquer momento.
          Um preço só é substituído quando estava em branco ou quando o novo valor é menor.
          Clique em qualquer célula para digitar nome, preço, quantidade e unidade manualmente.
          {ultima ? ` Última pesquisa: ${dataHora(ultima)}.` : ""}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {mostrarCadastro ? (
          <CadastroMercados mercados={mercados} onFechar={() => setMostrarCadastro(false)} />
        ) : null}

        {erro ? (
          <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {erro}
          </p>
        ) : null}

        {mercados.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Cadastre ao menos um supermercado para comparar preços.
          </p>
        ) : (
          <>
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-40 bg-card">
                    <TableHead className="sticky left-0 top-0 z-50 bg-card">Ingrediente</TableHead>
                    <TableHead className="sticky top-0 z-40 bg-card text-right">Estoque</TableHead>
                    {mercados.map((m) => (
                      <TableHead key={m.id} className="sticky top-0 z-40 bg-card text-right">
                        {m.nome}
                      </TableHead>
                    ))}
                    <TableHead className="sticky top-0 z-40 bg-card text-right">Melhor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((ing) => {
                    const melhor = melhorMercadoDoIngrediente(precos, ing.id);
                    return (
                      <TableRow key={ing.id}>
                        <TableCell className="sticky left-0 z-30 bg-card font-semibold">
                          {ing.nome}
                          <span className="ml-1 text-xs text-muted-foreground">
                            /{ing.estoqueUnidade ?? ing.unidade}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {brl(ing.custoUnitario)}
                        </TableCell>
                        {mercados.map((m) => {
                          const p = indice.get(`${ing.id}|${m.id}`);
                          const porMedida = p ? precoPorMedidaDoRegistro(p) : null;
                          const destaque = melhor?.mercadoId === m.id;
                          return (
                            <TableCell key={m.id} className="text-right align-top">
                              <button
                                type="button"
                                className="w-full text-right"
                                onClick={() => setEdicao({ ingrediente: ing, mercado: m, atual: p })}
                                aria-label={`Editar ${ing.nome} em ${m.nome}`}
                              >
                                <span
                                  className={`block text-sm ${
                                    destaque ? "font-semibold text-primary" : ""
                                  }`}
                                >
                                  {p?.preco === null || p?.preco === undefined
                                    ? "—"
                                    : brl(p.preco)}
                                  <Pencil className="ml-1 inline h-3 w-3 text-muted-foreground" />
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {p?.peso ?? "peso —"}
                                  {porMedida === null ? "" : ` · ${brlPreciso(porMedida)}/un.med.`}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {p?.nomeProduto ?? "produto —"}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {p ? dataHora(p.atualizadoEm) : "sem pesquisa"}
                                </span>
                              </button>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right text-sm font-semibold text-primary">
                          {melhor
                            ? (mercados.find((m) => m.id === melhor.mercadoId)?.nome ?? "—")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <p className="label-caps text-muted-foreground">
                Preço comparativo — estoque × supermercados (por unidade ou por g/ml)
              </p>
              <div className="overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 z-40 bg-card">
                      <TableHead className="sticky left-0 top-0 z-50 bg-card">Ingrediente</TableHead>
                      <TableHead className="sticky top-0 z-40 bg-card text-right">Estoque</TableHead>
                      {mercados.map((m) => (
                        <TableHead key={m.id} className="sticky top-0 z-40 bg-card text-right">
                          {m.nome}
                        </TableHead>
                      ))}
                      <TableHead className="sticky top-0 z-40 bg-card text-right">Menor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lista.map((ing) => {
                      const unidade = ing.estoqueUnidade ?? ing.unidade;
                      // Item contado por unidade (un., cx, dz...) → compara pelo
                      // preço da unidade; massa/volume (kg, g, l, ml) → por g/ml.
                      const porMedida = medidaPorUnidade(unidade) !== null;
                      const rotulo = porMedida ? rotuloMedida(unidade) : "un.";
                      const estoqueValor = porMedida
                        ? precoPorMedida(ing.custoUnitario, unidade)
                        : ing.custoUnitario;
                      const porMercado = mercados.map((m) => {
                        const p = indice.get(`${ing.id}|${m.id}`);
                        return {
                          id: m.id,
                          valor: p ? (porMedida ? precoPorMedidaDoRegistro(p) : p.preco) : null,
                        };
                      });
                      const validos = porMercado.filter(
                        (x): x is { id: number; valor: number } => x.valor !== null,
                      );
                      const candidatos: { nome: string; valor: number }[] = validos.map((x) => ({
                        nome: mercados.find((m) => m.id === x.id)?.nome ?? "—",
                        valor: x.valor,
                      }));
                      if (estoqueValor !== null && estoqueValor !== undefined) {
                        candidatos.push({ nome: "Estoque", valor: estoqueValor });
                      }
                      const menor = candidatos.length
                        ? candidatos.reduce((a, b) => (b.valor < a.valor ? b : a))
                        : null;
                      return (
                        <TableRow key={ing.id}>
                          <TableCell className="sticky left-0 z-30 bg-card font-semibold">
                            {ing.nome}
                            <span className="ml-1 text-xs text-muted-foreground">/{rotulo}</span>
                          </TableCell>
                          <TableCell
                            className={`text-right text-sm ${
                              menor && menor.nome === "Estoque" ? "font-semibold text-primary" : ""
                            }`}
                          >
                            {estoqueValor === null ? "—" : `${brlPreciso(estoqueValor)}/${rotulo}`}
                          </TableCell>
                          {porMercado.map((x) => (
                            <TableCell
                              key={x.id}
                              className={`text-right text-sm ${
                                menor && menor.nome === (mercados.find((m) => m.id === x.id)?.nome ?? "—")
                                  ? "font-semibold text-primary"
                                  : ""
                              }`}
                            >
                              {x.valor === null ? "—" : `${brlPreciso(x.valor)}/${rotulo}`}
                            </TableCell>
                          ))}
                          <TableCell className="text-right text-sm font-semibold text-primary">
                            {menor ? menor.nome : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Preços coletados de páginas públicas dos supermercados (busca que respeita robots.txt).
          Campos não encontrados ficam em branco, sem estimativas. A coluna “Melhor” usa o preço
          por g/ml quando o peso está preenchido.
        </p>

      </CardContent>

      <DialogManual edicao={edicao} onFechar={() => setEdicao(null)} />
    </Card>
  );
}
