import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ResumoPedidos } from "@/components/ResumoPedidos";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList } from "lucide-react";
import { usePedidos } from "@/lib/queries";

export const Route = createFileRoute("/painel-pedidos")({
  head: () => ({
    meta: [
      { title: "Painel de pedidos | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Análise dos pedidos da confeitaria: ticket médio, lucro bruto, bolos e cursos mais vendidos, melhores clientes e evolução mensal.",
      },
      { property: "og:title", content: "Painel de pedidos | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Indicadores de vendas, rentabilidade por pedido, ranking de produtos e clientes e evolução mensal da Amor de Brigadeiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelPedidos,
});

const TODOS = "todos";

const nomeMes = (chave: string) => {
  const [ano, mes] = chave.split("-");
  const rotulo = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
};

function PainelPedidos() {
  const { data: todosPedidos = [] } = usePedidos();
  const [mes, setMes] = useState<string>(TODOS);

  const mesesDisponiveis = useMemo(
    () =>
      Array.from(new Set(todosPedidos.map((p) => p.data.slice(0, 7)))).sort(
        (a, b) => b.localeCompare(a),
      ),
    [todosPedidos],
  );

  return (
    <PageShell
      title="Painel de pedidos"
      subtitle="Indicadores de vendas, rentabilidade, produtos e clientes para embasar decisões."
      icon={<ClipboardList className="h-6 w-6 text-accent" />}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3 panel p-4">
        <Label htmlFor="filtro-mes-pedidos" className="label-caps">
          Mês de referência
        </Label>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger id="filtro-mes-pedidos" className="w-full sm:w-[240px]">
            <SelectValue placeholder="Escolha o mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os meses</SelectItem>
            {mesesDisponiveis.map((m) => (
              <SelectItem key={m} value={m}>
                {nomeMes(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResumoPedidos mes={mes} />
    </PageShell>
  );
}
