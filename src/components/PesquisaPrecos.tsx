import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Search,
  Settings2,
  Timer,
  Trophy,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { brl, type Ingrediente } from "@/lib/domain";
import { brlPreciso, qtd, type LinhaCesta } from "@/lib/cesta";
import { pesquisarPrecosMercados } from "@/lib/precos.functions";
import {
  CONFIG_INTERVALO,
  CONFIG_MERCADOS,
  INTERVALOS,
  MERCADOS,
  compararComEstoque,
  lerIntervaloConfigurado,
  lerMercadosConfigurados,
  medidaPorUnidade,
  rankearReceitas,
  rotuloMedida,
  type Mercado,
  type PesquisaPrecos as Pesquisa,
} from "@/lib/precos";

import {
  configuracoesApi,
  historicoPrecosApi,
  keys,
  useConfiguracoes,
  useAppMutation,
} from "@/lib/queries";

const MEDALHAS = ["1º", "2º", "3º"];

const rotuloIntervalo = (min: number) =>
  min === 0 ? "Desligada" : min < 60 ? `A cada ${min} min` : `A cada ${min / 60} h`;

const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR");

function PainelConfiguracao({
  mercados,
  intervalo,
  onSalvar,
  salvando,
}: {
  mercados: Mercado[];
  intervalo: number;
  onSalvar: (input: { mercados: Mercado[]; intervalo: number }) => void;
  salvando: boolean;
}) {
  const [ordem, setOrdem] = useState<Mercado[]>(mercados);
  const [selecionados, setSelecionados] = useState<Mercado[]>(mercados);
  const [minutos, setMinutos] = useState(intervalo);

  useEffect(() => {
    const restantes = MERCADOS.filter((m) => !mercados.includes(m));
    setOrdem([...mercados, ...restantes]);
    setSelecionados(mercados);
    setMinutos(intervalo);
  }, [mercados, intervalo]);

  const mover = (index: number, direcao: -1 | 1) => {
    const destino = index + direcao;
    if (destino < 0 || destino >= ordem.length) return;
    const copia = [...ordem];
    const atual = copia[index]!;
    copia[index] = copia[destino]!;
    copia[destino] = atual;
    setOrdem(copia);
  };

  const alternar = (mercado: Mercado, ativo: boolean) =>
    setSelecionados((atual) =>
      ativo ? [...atual, mercado] : atual.filter((m) => m !== mercado),
    );

  const salvar = () =>
    onSalvar({
      mercados: ordem.filter((m) => selecionados.includes(m)),
      intervalo: minutos,
    });

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-primary" />
        <p className="label-caps text-muted-foreground">
          Fornecedores no ranking e prioridade
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {ordem.map((mercado, i) => (
          <li
            key={mercado}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Checkbox
                checked={selecionados.includes(mercado)}
                onCheckedChange={(v) => alternar(mercado, v === true)}
                aria-label={`Incluir ${mercado} no ranking`}
              />
              <span className="text-xs text-muted-foreground">{i + 1}º</span>
              {mercado}
            </label>
            <span className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Subir ${mercado}`}
                disabled={i === 0}
                onClick={() => mover(i, -1)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Descer ${mercado}`}
                disabled={i === ordem.length - 1}
                onClick={() => mover(i, 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="intervalo-pesquisa" className="label-caps flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> Atualização automática
          </Label>
          <Select
            value={String(minutos)}
            onValueChange={(v) => setMinutos(Number(v))}
          >
            <SelectTrigger id="intervalo-pesquisa" className="mt-1 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVALOS.map((min) => (
                <SelectItem key={min} value={String(min)}>
                  {rotuloIntervalo(min)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={salvar} disabled={salvando || selecionados.length === 0}>
          {salvando ? "Salvando..." : "Salvar preferências"}
        </Button>
        {selecionados.length === 0 ? (
          <p className="text-xs text-destructive">Selecione pelo menos um fornecedor.</p>
        ) : null}
      </div>
    </div>
  );
}

export function PesquisaPrecos({
  linhas,
  ingredientes,
}: {
  linhas: LinhaCesta[];
  ingredientes: Ingrediente[];
}) {
  const pesquisar = useServerFn(pesquisarPrecosMercados);
  const { data: config } = useConfiguracoes();
  const [mostrarConfig, setMostrarConfig] = useState(false);

  const mercados = useMemo(
    () => lerMercadosConfigurados(config?.[CONFIG_MERCADOS]),
    [config],
  );
  const intervalo = lerIntervaloConfigurado(config?.[CONFIG_INTERVALO]);

  const salvarConfig = useAppMutation<{ mercados: Mercado[]; intervalo: number }>({
    mutationFn: async (input) => {
      await configuracoesApi.set(CONFIG_MERCADOS, JSON.stringify(input.mercados));
      await configuracoesApi.set(CONFIG_INTERVALO, String(input.intervalo));
    },
    invalidate: [keys.configuracoes],
    successMessage: "Preferências da pesquisa salvas.",
  });

  /** Todos os ingredientes cadastrados, em ordem alfabética. */
  const usados = useMemo(
    () => [...ingredientes].sort((a, b) => a.nome.localeCompare(b.nome)),
    [ingredientes],
  );

  const chave = `${usados.map((i) => i.id).join(",")}|${mercados.join(",")}`;

  const { data, isFetching, dataUpdatedAt, refetch } = useQuery<Pesquisa>({
    queryKey: ["pesquisa-precos", chave],
    enabled: usados.length > 0,
    // Atualiza sempre que a Cesta da produção é aberta e, se configurado,
    // em intervalos automáticos enquanto a tela permanece aberta.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchInterval: intervalo > 0 ? intervalo * 60_000 : false,
    refetchIntervalInBackground: false,
    retry: false,
    queryFn: () =>
      pesquisar({
        data: {
          ingredientes: usados.map((i) => ({
            id: i.id,
            nome: i.nome,
            unidade: i.unidade,
          })),
          mercados,
        },
      }),
  });

  const cotacoes = data?.cotacoes ?? [];

  /* Salva o histórico de cada pesquisa concluída (uma vez por resultado). */
  const qc = useQueryClient();
  const registrado = useRef<string>("");
  useEffect(() => {
    if (!data || data.cotacoes.length === 0) return;
    if (registrado.current === data.atualizadoEm) return;
    registrado.current = data.atualizadoEm;
    void historicoPrecosApi
      .registrar(
        data.cotacoes.map((c) => ({
          ingredienteId: c.ingredienteId,
          ingredienteNome: c.ingrediente,
          mercado: c.mercado,
          preco: c.preco,
          fonte: c.fonte,
        })),
      )
      .then(() => qc.invalidateQueries({ queryKey: keys.historicoPrecos }))
      .catch(() => undefined);
  }, [data, qc]);

  const comparativo = useMemo(
    () => compararComEstoque(usados, cotacoes, mercados),
    [usados, cotacoes, mercados],
  );
  const rankings = useMemo(
    () => rankearReceitas(linhas, cotacoes, mercados),
    [linhas, cotacoes, mercados],
  );
  const comRanking = rankings.filter((r) => r.ranking.length > 0);

  const mercadosComPreco = mercados.filter((m) => cotacoes.some((c) => c.mercado === m));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 font-display text-xl text-primary">
            <Search className="h-5 w-5" />
            Pesquisa de preços — Uberlândia
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMostrarConfig((v) => !v)}
            >
              <Settings2 className="h-4 w-4" />
              {mostrarConfig ? "Fechar ajustes" : "Ajustar fornecedores"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Pesquisando..." : "Atualizar agora"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Busca automática nos fornecedores escolhidos ({mercados.join(", ")}) a cada abertura
          desta tela · atualização automática: {rotuloIntervalo(intervalo).toLowerCase()}. Os
          valores são aproximados (encartes e lojas online) e servem de referência para
          comparar com o preço cadastrado no estoque.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {mostrarConfig ? (
          <PainelConfiguracao
            mercados={mercados}
            intervalo={intervalo}
            salvando={salvarConfig.isPending}
            onSalvar={(input) =>
              salvarConfig.mutate(input, { onSuccess: () => setMostrarConfig(false) })
            }
          />
        ) : null}

        {isFetching && cotacoes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Pesquisando preços nos mercados de Uberlândia...
          </p>
        ) : null}

        {data?.erro ? (
          <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {data.erro}
          </p>
        ) : null}

        {!isFetching && cotacoes.length === 0 && !data?.erro ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum preço público foi encontrado agora para estes ingredientes. Tente atualizar
            a pesquisa em alguns minutos.
          </p>
        ) : null}

        {comparativo.length > 0 ? (
          <div className="space-y-2">
            <p className="label-caps text-muted-foreground">
              Preço por g/ml x estoque
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    {mercadosComPreco.map((m) => (
                      <TableHead key={m} className="text-right">
                        {m}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Melhor</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparativo.map((c) => {
                    const medida = medidaPorUnidade(c.unidade);
                    const valor = (v: number) =>
                      medida ? brlPreciso(v / medida) : brl(v);
                    return (
                      <TableRow key={c.ingredienteId}>
                        <TableCell className="font-semibold">
                          {c.nome}
                          <span className="ml-1 text-xs text-muted-foreground">
                            /{medida ? rotuloMedida(c.unidade) : c.unidade}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {valor(c.precoEstoque)}
                        </TableCell>
                        {mercadosComPreco.map((m) => (
                          <TableCell
                            key={m}
                            className={`text-right ${
                              c.melhorMercado === m ? "font-semibold text-primary" : ""
                            }`}
                          >
                            {c.precos[m] === undefined ? "—" : valor(c.precos[m]!)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold text-primary">
                          {c.melhorMercado ?? "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            (c.diferenca ?? 0) < 0 ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {c.diferenca === null
                            ? "—"
                            : `${c.diferenca < 0 ? "−" : "+"}${valor(
                                Math.abs(c.diferenca),
                              )}`}
                          {c.diferencaPercentual === null ? null : (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({c.diferencaPercentual.toFixed(0)}%)
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Valores por g/ml (preço da embalagem dividido pelo peso/volume). Itens
              contados por unidade aparecem com o preço da unidade.
            </p>
          </div>
        ) : null}


        {comRanking.length > 0 ? (
          <div className="space-y-3">
            <p className="label-caps flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4 text-primary" />
              Ranking de custo-benefício por receita
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {comRanking.map((r) => (
                <div
                  key={`${r.tipo}-${r.id}`}
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display text-lg text-primary">{r.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Custo com o estoque: {brl(r.custoEstoque)}
                    </p>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {r.ranking.slice(0, 3).map((m, i) => (
                      <li key={m.mercado} className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          {MEDALHAS[i]} {m.mercado}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {m.cobertura}/{m.totalItens} itens cotados
                          </span>
                        </span>
                        <span className="text-right">
                          {brl(m.custo)}
                          <span
                            className={`ml-2 text-xs ${
                              m.economia > 0 ? "text-primary" : "text-destructive"
                            }`}
                          >
                            {m.economia > 0 ? "economia" : "acima"} {brl(Math.abs(m.economia))}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {data?.semCotacao?.length ? (
          <p className="text-xs text-muted-foreground">
            Sem cotação pública nesta pesquisa: {data.semCotacao.join(", ")}. Para esses itens
            o ranking usa o preço cadastrado no estoque.
          </p>
        ) : null}

        {data?.atualizadoEm ? (
          <p className="text-xs text-muted-foreground">
            Pesquisa atualizada em {dataHora(data.atualizadoEm)} · {qtd(cotacoes.length)}{" "}
            cotações encontradas
            {dataUpdatedAt && intervalo > 0
              ? ` · próxima atualização automática por volta de ${new Date(
                  dataUpdatedAt + intervalo * 60_000,
                ).toLocaleTimeString("pt-BR")}`
              : ""}
            .
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
