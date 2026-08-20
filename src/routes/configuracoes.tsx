import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Check, Copy, ExternalLink, Save } from "lucide-react";
import { PageShell, FieldError } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONFIG_DASHBOARD_URL, dashboardUrlSchema } from "@/lib/domain";
import { configuracoesApi, keys, useAppMutation, useConfiguracoes } from "@/lib/queries";

const CHATGPT_OPENAPI_URL = "https://amor-de-brigadeiro.lovable.app/api/public/chatgpt";


export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Amor de Brigadeiro" },
      {
        name: "description",
        content:
          "Ajuste as configurações do sistema Amor de Brigadeiro, como o endereço do Dashboard externo exibido no menu.",
      },
      { property: "og:title", content: "Configurações | Amor de Brigadeiro" },
      {
        property: "og:description",
        content: "Atualize o link do Dashboard externo e outros ajustes do sistema.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { data: config, isLoading } = useConfiguracoes();
  const salvo = config?.[CONFIG_DASHBOARD_URL] ?? "";
  const [url, setUrl] = useState("");
  const [tocado, setTocado] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (!isLoading && !carregado) {
      setUrl(salvo);
      setCarregado(true);
    }
  }, [isLoading, carregado, salvo]);

  const parsed = dashboardUrlSchema.safeParse({ url });
  const erro = parsed.success ? undefined : parsed.error.issues[0]?.message;

  const salvar = useAppMutation<string>({
    mutationFn: (valor) => configuracoesApi.set(CONFIG_DASHBOARD_URL, valor),
    invalidate: [keys.configuracoes],
    successMessage: "Configurações atualizadas.",
  });

  return (
    <PageShell
      title="Configurações"
      subtitle="Ajustes do sistema que valem para todos que acessam o link."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard externo</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setTocado(true);
                if (!parsed.success) return;
                salvar.mutate(parsed.data.url);
              }}
            >
              <div>
                <Label htmlFor="url">Endereço (URL) do dashboard</Label>
                <Input
                  id="url"
                  inputMode="url"
                  placeholder="https://meu-dashboard.exemplo.com/"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => setTocado(true)}
                />
                <FieldError message={tocado ? erro : undefined} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Este é o link aberto pelo botão “Dashboard externo” no menu. Deixe o campo
                  vazio para esconder o botão do menu.
                </p>
              </div>

              <Button type="submit" disabled={salvar.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {salvar.isPending ? "Salvando..." : "Salvar configurações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading ? (
              <p className="text-muted-foreground">Carregando configurações...</p>
            ) : salvo ? (
              <>
                <p className="break-all text-muted-foreground">{salvo}</p>
                <a
                  href={salvo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
                >
                  Abrir dashboard
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </>
            ) : (
              <p className="text-muted-foreground">
                Nenhum dashboard externo configurado. O botão não aparece no menu.
              </p>
            )}
          </CardContent>
        </Card>

        <ChatGptCard />
      </div>
    </PageShell>
  );
}

function ChatGptCard() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CHATGPT_OPENAPI_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignorar
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          ChatGPT / GPT Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          Use as ferramentas de precificação do Amor de Brigadeiro diretamente dentro de um GPT
          personalizado do ChatGPT: calcular custo e margem de receitas, sugerir preço de venda e
          consultar as regras do sistema.
        </p>

        <div className="rounded-md border bg-muted/50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            URL do schema OpenAPI
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all text-xs">{CHATGPT_OPENAPI_URL}</code>
            <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0">
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
          <li>No ChatGPT, crie um novo GPT (Configurações → Meus GPTs → Criar).</li>
          <li>Em “Actions”, clique em “Create new action”.</li>
          <li>Cole a URL do schema OpenAPI no campo “Schema” e salve.</li>
          <li>Defina a autenticação como “None” — as ferramentas são públicas.</li>
          <li>Na instrução do GPT, peça para usar as ferramentas quando o usuário falar de receitas, custos ou preços.</li>
        </ol>

        <a
          href={CHATGPT_OPENAPI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
        >
          Testar schema
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </CardContent>
    </Card>
  );
}

