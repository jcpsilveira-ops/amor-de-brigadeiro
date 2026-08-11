import { defineMcp } from "@lovable.dev/mcp-js";
import calcularReceita from "./tools/calcular-receita";
import sugerirPreco from "./tools/sugerir-preco";
import regrasDoSistema from "./tools/regras-do-sistema";

export default defineMcp({
  name: "amor-de-brigadeiro",
  title: "Amor de Brigadeiro",
  version: "0.1.0",
  instructions:
    "Ferramentas de precificação da confeitaria Amor de Brigadeiro. Use `calcular_receita` para obter custo de produção, lucro e margem de um bolo ou cobertura, `sugerir_preco` para calcular o preço de venda a partir do custo e da margem desejada, e `regras_do_sistema` para conferir unidades aceitas e limites de cadastro. Os cadastros do app ficam no dispositivo do usuário e não são acessíveis por estas ferramentas.",
  tools: [calcularReceita, sugerirPreco, regrasDoSistema],
});
