import { createFileRoute } from "@tanstack/react-router";

const OPENAPI_URL = "https://amor-de-brigadeiro.lovable.app";

const openApiSchema = {
  openapi: "3.0.1",
  info: {
    title: "Amor de Brigadeiro - Ferramentas para ChatGPT",
    description:
      "Ferramentas de precificação da confeitaria Amor de Brigadeiro. Use este schema em um GPT Action do ChatGPT para calcular custo e margem de receitas e sugerir preços de venda.",
    version: "1.0.0",
  },
  servers: [{ url: OPENAPI_URL }],
  paths: {
    "/.mcp/invoke-tool/calcular_receita": {
      post: {
        operationId: "calcular_receita",
        summary: "Calcular custo e margem de uma receita",
        description:
          "Calcula o custo de produção de um bolo ou cobertura a partir dos ingredientes informados (quantidade x custo unitário) e retorna lucro e margem em relação ao preço de venda.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["nome", "precoVenda", "ingredientes"],
                properties: {
                  nome: {
                    type: "string",
                    description: "Nome do bolo ou cobertura.",
                  },
                  precoVenda: {
                    type: "number",
                    minimum: 0,
                    description: "Preço de venda em reais.",
                  },
                  ingredientes: {
                    type: "array",
                    description: "Lista de ingredientes da receita. Máximo de 20.",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["nome", "quantidade", "custoUnitario"],
                      properties: {
                        nome: {
                          type: "string",
                          description: "Nome do ingrediente.",
                        },
                        quantidade: {
                          type: "number",
                          exclusiveMinimum: 0,
                          description: "Quantidade usada na receita.",
                        },
                        custoUnitario: {
                          type: "number",
                          exclusiveMinimum: 0,
                          description: "Custo por unidade do ingrediente em reais.",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Resultado do cálculo com custo, lucro, margem e detalhes.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            },
          },
        },
      },
    },
    "/.mcp/invoke-tool/sugerir_preco": {
      post: {
        operationId: "sugerir_preco",
        summary: "Sugerir preço de venda",
        description:
          "Sugere o preço de venda de um bolo ou cobertura a partir do custo de produção e da margem de lucro desejada (em % sobre o preço de venda).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["custo", "margemDesejada"],
                properties: {
                  custo: {
                    type: "number",
                    exclusiveMinimum: 0,
                    description: "Custo de produção em reais.",
                  },
                  margemDesejada: {
                    type: "number",
                    description:
                      "Margem de lucro desejada em porcentagem do preço de venda (ex.: 40 para 40%).",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Preço sugerido e lucro estimado.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            },
          },
        },
      },
    },
    "/.mcp/invoke-tool/regras_do_sistema": {
      post: {
        operationId: "regras_do_sistema",
        summary: "Regras de cadastro da confeitaria",
        description:
          "Retorna as regras de cadastro do sistema: unidades de medida aceitas, limite de ingredientes por receita e como o custo e a margem são calculados.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {},
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Regras e limites do sistema.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            },
          },
        },
      },
    },
  },
};

export const Route = createFileRoute("/api/public/chatgpt")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify(openApiSchema), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
