# Amor de Brigadeiro Gestão

Você é um arquiteto de sistemas full-stack especializado em aplicações desktop para pequenos negócios. Sua tarefa é criar um sistema completo de gestão para a empresa **Amor de Brigadeiro**, composto por banco de dados relacional, API backend e interface frontend, empacotado como executável instalável em Windows.

**Objetivo principal:**

Desenvolver uma aplicação desktop full-stack com Node.js/Express no backend e React no frontend que permita gerenciar um negócio de bolos. O sistema deve permitir o cadastro de ingredientes, bolos (com até 10 ingredientes cada), coberturas (com até 10 ingredientes cada), clientes e pedidos, com cálculo automático de custos de produção. A implementação deve seguir boas práticas de engenharia (código limpo, estrutura modular, tratamento de erros adequado), ser funcional e fácil de expandir. A aplicação deve ser empacotada como um programa executável instalável em Windows.

**Estrutura do banco de dados (Microsoft Access):**

1. **Tabela Ingredientes**

   - ID (chave primária, auto-incremento)

   - Nome

   - Unidade (ex: kg, g, ml, litro, unidade)

   - Custo unitário

2. **Tabela Bolos**

   - ID (chave primária, auto-incremento)

   - Nome

   - Preço de venda

   - Data de criação

3. **Tabela Bolo_Ingredientes** (relacionamento muitos-para-muitos, máximo 10 ingredientes por bolo)

   - ID (chave primária, auto-incremento)

   - ID do Bolo (chave estrangeira)

   - ID do Ingrediente (chave estrangeira)

   - Quantidade utilizada

4. **Tabela Coberturas**

   - ID (chave primária, auto-incremento)

   - Nome

   - Preço de venda

   - Data de criação

5. **Tabela Cobertura_Ingredientes** (relacionamento muitos-para-muitos, máximo 10 ingredientes por cobertura)

   - ID (chave primária, auto-incremento)

   - ID da Cobertura (chave estrangeira)

   - ID do Ingrediente (chave estrangeira)

   - Quantidade utilizada

6. **Tabela Clientes**

   - ID (chave primária, auto-incremento)

   - Nome

   - Número WhatsApp

7. **Tabela Pedidos**

   - ID (chave primária, auto-incremento)

   - ID do Cliente (chave estrangeira)

   - ID do Bolo (chave estrangeira)

   - ID da Cobertura (chave estrangeira)

   - Data do pedido

**Requisitos da interface (Frontend com React):**

- Tela de cadastro de ingredientes com campos para nome, unidade e custo unitário

- Tela de cadastro de bolos com campo para nome, dropdown para selecionar até 10 ingredientes diferentes, campos para quantidade de cada ingrediente e campo para preço de venda final

- Tela de cadastro de coberturas com campo para nome, dropdown para selecionar até 10 ingredientes diferentes, campos para quantidade de cada ingrediente e campo para preço de venda final

- Tela de cadastro de clientes com campos para nome e número WhatsApp

- Tela de cadastro de pedidos com dropdowns para selecionar cliente, bolo e cobertura

- Telas de listagem, edição e exclusão para ingredientes, bolos, coberturas e clientes

- Validação em tempo real dos campos obrigatórios

- Feedback visual claro ao usuário (mensagens de sucesso, erro, confirmação)

**Requisitos da API (Backend com Node.js/Express):**

- Endpoints CRUD (Create, Read, Update, Delete) para cada entidade: ingredientes, bolos, coberturas, clientes e pedidos

- Validações no backend (nenhum campo obrigatório vazio, formatos corretos)

- Cálculo automático do custo total de produção para cada bolo e cobertura baseado nos ingredientes e quantidades

- Validação de limite máximo de 10 ingredientes por bolo e cobertura

**Stack técnico:**

- Banco de dados: Microsoft Access

- Backend: Node.js com Express

- Frontend: React

- Empacotamento: Electron ou similar para gerar executável instalável em Windows

**Entrega esperada:**

1. Script de criação do banco de dados Microsoft Access com todas as tabelas (incluindo a tabela Pedidos), chaves primárias, chaves estrangeiras e relacionamentos

2. Código da API Express com todos os endpoints necessários para ingredientes, bolos, coberturas, clientes e pedidos

3. Código do Frontend React com as telas mencionadas

4. Configuração de empacotamento para gerar executável instalável em Windows

5. Instruções claras de como construir e instalar a aplicação em Windows (instalação de dependências, variáveis de ambiente, setup do banco de dados, etc.)

Comece pelo banco de dados e estrutura de dados, depois implemente a API, e finalize com a interface do usuário. Garanta que o sistema seja funcional e fácil de expandir no futuro. Implemente com sólidas práticas de engenharia (código limpo, estrutura modular, tratamento de erros adequado).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://amor-de-brigadeiro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d8e00cad-776e-4333-9c51-6c2f125c2db3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
