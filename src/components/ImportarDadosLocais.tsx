import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CloudUpload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { keys } from "@/lib/queries";
import {
  contarDadosLocais,
  importacaoJaFeita,
  importarDadosLocais,
  marcarImportacaoConcluida,
  type ResumoImportacao,
} from "@/lib/importar-local";

/**
 * Aviso mostrado quando o dispositivo ainda tem cadastros da versão antiga
 * (salvos só no navegador). Um clique envia tudo para o banco compartilhado.
 */
export function ImportarDadosLocais() {
  const qc = useQueryClient();
  const [resumo, setResumo] = useState<ResumoImportacao | null>(null);
  const [jaEnviado, setJaEnviado] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const contagem = contarDadosLocais();
    if (!contagem) return;
    const total = Object.values(contagem).reduce((a, b) => a + b, 0);
    if (total > 0) {
      setResumo(contagem);
      setJaEnviado(importacaoJaFeita());
    }
  }, []);

  if (!resumo || oculto) return null;

  const enviar = async () => {
    setEnviando(true);
    try {
      const feito = await importarDadosLocais();
      await Promise.all(
        Object.values(keys).map((key) => qc.invalidateQueries({ queryKey: key })),
      );
      marcarImportacaoConcluida();
      setJaEnviado(true);
      const total = Object.values(feito).reduce((a, b) => a + b, 0);
      toast.success(
        total === 0
          ? "Tudo já estava no banco compartilhado."
          : `Enviado: ${feito.ingredientes} ingredientes, ${feito.bolos} bolos, ${feito.coberturas} coberturas, ${feito.clientes} clientes e ${feito.pedidos} pedidos.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível enviar os dados.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card className="mb-6 border-accent/50 bg-secondary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudUpload className="h-5 w-5 text-accent" />
          Enviar cadastros deste dispositivo para o banco compartilhado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {jaEnviado ? "Este dispositivo ainda tem uma cópia local: " : "Encontrei dados salvos apenas neste dispositivo: "}
          {resumo.ingredientes} ingredientes, {resumo.bolos} bolos, {resumo.coberturas}{" "}
          coberturas, {resumo.clientes} clientes e {resumo.pedidos} pedidos. Ao enviar, eles
          passam a aparecer para todos que abrirem o link. Nada é duplicado: registros com o
          mesmo nome já existentes são reaproveitados.
        </p>
        <div className="flex gap-2">
          <Button onClick={enviar} disabled={enviando}>
            {enviando
              ? "Enviando..."
              : jaEnviado
                ? "Enviar novamente"
                : "Enviar para o banco compartilhado"}
          </Button>
          <Button
            variant="ghost"
            disabled={enviando}
            onClick={() => {
              marcarImportacaoConcluida();
              setOculto(true);
            }}
          >
            Agora não
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
