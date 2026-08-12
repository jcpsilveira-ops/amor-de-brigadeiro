import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/components/PageShell";
import { Plus, X } from "lucide-react";
import {
  MAX_INGREDIENTES,
  brl,
  calcularCusto,
  margem,
  receitaSchema,
  type Ingrediente,
  type Receita,
  type ReceitaInput,
} from "@/lib/domain";

interface Linha {
  ingredienteId: string;
  quantidade: string;
}

export function ReceitaForm({
  ingredientes,
  registro,
  submitting,
  onSubmit,
  onCancel,
  entidade,
}: {
  ingredientes: Ingrediente[];
  registro: Receita | null;
  submitting: boolean;
  onSubmit: (input: ReceitaInput) => void;
  onCancel?: () => void;
  entidade: "bolo" | "cobertura" | "curso";
}) {
  const [nome, setNome] = useState(registro?.nome ?? "");
  const [precoVenda, setPrecoVenda] = useState(registro ? String(registro.precoVenda) : "");
  const [linhas, setLinhas] = useState<Linha[]>(
    registro?.itens.length
      ? registro.itens.map((i) => ({
          ingredienteId: String(i.ingredienteId),
          quantidade: String(i.quantidade),
        }))
      : [{ ingredienteId: "", quantidade: "" }],
  );
  const [tocado, setTocado] = useState(false);

  const candidato = useMemo(
    () => ({
      nome,
      precoVenda,
      itens: linhas
        .filter((l) => l.ingredienteId !== "" || l.quantidade !== "")
        .map((l) => ({ ingredienteId: l.ingredienteId, quantidade: l.quantidade })),
    }),
    [nome, precoVenda, linhas],
  );

  const parsed = receitaSchema.safeParse(candidato);
  const erros = useMemo(() => {
    if (parsed.success) return {} as Record<string, string>;
    const out: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      out[issue.path.join(".") || "itens"] = issue.message;
    }
    return out;
  }, [parsed]);

  const custo = parsed.success ? calcularCusto(parsed.data.itens, ingredientes) : 0;
  const { lucro, percentual } = margem(parsed.success ? parsed.data.precoVenda : 0, custo);

  const usados = new Set(linhas.map((l) => l.ingredienteId).filter(Boolean));

  function atualizar(index: number, patch: Partial<Linha>) {
    setLinhas((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setTocado(true);
        if (parsed.success) onSubmit(parsed.data);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nome">Nome do {entidade}</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder={
              entidade === "bolo"
                ? "Bolo de chocolate"
                : entidade === "curso"
                  ? "Curso de brigadeiro gourmet"
                  : "Brigadeiro cremoso"
            }
          />
          <FieldError message={(tocado || nome !== "") && erros["nome"] ? erros["nome"] : undefined} />
        </div>
        <div>
          <Label htmlFor="preco">
            {entidade === "curso" ? "Valor da inscrição (R$)" : "Preço de venda (R$)"}
          </Label>
          <Input
            id="preco"
            inputMode="decimal"
            value={precoVenda}
            onChange={(e) => setPrecoVenda(e.target.value.replace(",", "."))}
            placeholder="0,00"
          />
          <FieldError
            message={(tocado || precoVenda !== "") && erros["precoVenda"] ? erros["precoVenda"] : undefined}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="label-caps">
            Ingredientes ({linhas.length}/{MAX_INGREDIENTES})
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={linhas.length >= MAX_INGREDIENTES}
            onClick={() => setLinhas((p) => [...p, { ingredienteId: "", quantidade: "" }])}
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </div>

        {linhas.map((linha, index) => {
          const ing = ingredientes.find((i) => String(i.id) === linha.ingredienteId);
          return (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_150px_auto] sm:items-end">
              <div>
                <Select
                  value={linha.ingredienteId}
                  onValueChange={(value) => atualizar(index, { ingredienteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredientes.map((i) => (
                      <SelectItem
                        key={i.id}
                        value={String(i.id)}
                        disabled={usados.has(String(i.id)) && linha.ingredienteId !== String(i.id)}
                      >
                        {i.nome} — {brl(i.custoUnitario)}/{i.unidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  inputMode="decimal"
                  value={linha.quantidade}
                  onChange={(e) => atualizar(index, { quantidade: e.target.value.replace(",", ".") })}
                  placeholder={ing ? `Qtd em ${ing.unidade}` : "Quantidade"}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                disabled={linhas.length === 1}
                onClick={() => setLinhas((p) => p.filter((_, i) => i !== index))}
                aria-label="Remover ingrediente"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        <FieldError message={tocado ? (erros["itens"] ?? erros["itens.0.ingredienteId"] ?? erros["itens.0.quantidade"]) : undefined} />
        {ingredientes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Cadastre ingredientes primeiro para montar a receita.
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-xl bg-secondary/70 p-4 sm:grid-cols-3">
        <Resumo rotulo="Custo de produção" valor={brl(custo)} />
        <Resumo rotulo="Lucro estimado" valor={brl(lucro)} />
        <Resumo rotulo="Margem" valor={`${percentual.toFixed(1)}%`} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {registro ? "Salvar alterações" : `Cadastrar ${entidade}`}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="label-caps">{rotulo}</p>
      <p className="font-display text-xl text-primary">{valor}</p>
    </div>
  );
}
