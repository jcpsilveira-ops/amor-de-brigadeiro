import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ResumoReceitas } from "@/components/ResumoReceitas";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/painel-receitas")({
  head: () => ({
    meta: [
      { title: "Painel de receitas | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Receitas dos bolos e coberturas com ingredientes, quantidades, custo de produção, preço de venda e margem de lucro.",
      },
      { property: "og:title", content: "Painel de receitas | Amor de Brigadeiro" },
      {
        property: "og:description",
        content:
          "Consulte a ficha de cada bolo e cobertura: ingredientes, custo por item, margem e ingredientes que mais pesam no custo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelReceitas,
});

function PainelReceitas() {
  const [tipo, setTipo] = useState<"todos" | "bolos" | "coberturas">("todos");

  return (
    <PageShell
      title="Painel de receitas"
      subtitle="Ficha completa dos bolos e coberturas: ingredientes, custo, preço e margem."
    >
      <div className="mb-6 flex flex-wrap items-center gap-3 panel p-4">
        <Label htmlFor="filtro-tipo-receita" className="label-caps">
          Mostrar
        </Label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
          <SelectTrigger id="filtro-tipo-receita" className="w-56">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Bolos e coberturas</SelectItem>
            <SelectItem value="bolos">Somente bolos</SelectItem>
            <SelectItem value="coberturas">Somente coberturas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ResumoReceitas tipoFiltro={tipo} />
    </PageShell>
  );
}
