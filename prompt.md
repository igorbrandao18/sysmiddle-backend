# Integração Trello & Asana

## 1. Análise das APIs

### 1.1 API do Trello
A API do Trello fornece um conjunto de endpoints REST para interagir com quadros, listas, cards e outros elementos. Os principais endpoints a serem utilizados para esta integração incluem:

- **Autenticação**: Trello utiliza **OAuth 1.0** ou **chave de API + token**.
- **Obter um Quadro**: `GET https://api.trello.com/1/boards/{id}`
- **Obter Listas de um Quadro**: `GET https://api.trello.com/1/boards/{id}/lists`
- **Obter Cards de uma Lista**: `GET https://api.trello.com/1/lists/{id}/cards`
- **Criar um Card**: `POST https://api.trello.com/1/cards`
- **Atualizar um Card**: `PUT https://api.trello.com/1/cards/{id}`

### 1.2 API do Asana
A API do Asana permite a manipulação de projetos, seções e tarefas. Os principais endpoints incluem:

- **Autenticação**: Asana utiliza **OAuth 2.0**.
- **Criar um Projeto**: `POST https://app.asana.com/api/1.0/projects`
- **Obter um Projeto**: `GET https://app.asana.com/api/1.0/projects/{project_gid}`
- **Criar uma Seção**: `POST https://app.asana.com/api/1.0/sections`
- **Criar uma Tarefa**: `POST https://app.asana.com/api/1.0/tasks`
- **Obter uma Tarefa**: `GET https://app.asana.com/api/1.0/tasks/{task_gid}`

## 2. Investigando os Endpoints

Abaixo está o mapeamento dos endpoints necessários para a integração entre as duas plataformas.

| Ação | Endpoint Trello | Endpoint Asana |
|---------|----------------|---------------|
| Obter um quadro | `/1/boards/{id}` | `/1.0/projects/{project_gid}` |
| Obter listas de um quadro | `/1/boards/{id}/lists` | `/1.0/projects/{project_gid}/sections` |
| Obter cards de uma lista | `/1/lists/{id}/cards` | `/1.0/tasks` |
| Criar um card | `POST /1/cards` | `POST /1.0/tasks` |
| Criar uma seção | N/A | `POST /1.0/sections` |

## 3. Desenho do Fluxo de Integração

1. Autenticação nas APIs do Trello e Asana.
2. Buscar um quadro no Trello (identificado pelo ID).
3. Obter as listas do quadro e mapear para seções no Asana.
4. Obter os cards de cada lista e criar as tarefas correspondentes no Asana.
5. Sincronizar os status das tarefas conforme mudanças no Trello.
6. Criar um mecanismo de monitoramento para garantir que alterações sejam refletidas entre as plataformas.

*(Para o diagrama de fluxo, recomendados criar um modelo no Miro ou Whimsical e anexar aqui.)*

## 4. Correlação dos Campos (De-Para)

Uma planilha foi criada com a relação dos campos entre Trello e Asana, identificando equivalências e conversões necessárias. O documento inclui:
- **Nome do Quadro (Trello) → Nome do Projeto (Asana)**
- **Listas (Trello) → Seções (Asana)**
- **Cards (Trello) → Tarefas (Asana)**
- **Descrição do Card (Trello) → Notas da Tarefa (Asana)**
- **Data de Vencimento (Trello) → Due Date (Asana)**
- **Etiquetas (Trello) → Tags (Asana)**
- **Responsável (Trello) → Assigned User (Asana)**

### Entregáveis

1. **Documento com a análise e fluxo de integração** (este documento).
2. **Planilha de correlação dos campos** (será anexada separadamente).

---

Com esta documentação e planilha, é possível iniciar a implementação da integração entre Trello e Asana. ✅

---

# Estrutura do Sistema Full Stack - SysMiddle

## **📌 Backend - SysMiddle API (NestJS + Prisma + PostgreSQL)**

### **✅ Tecnologias Utilizadas**
- **NestJS**: Framework Node.js modular e altamente escalável.
- **Prisma ORM**: Para modelagem e acesso ao banco de dados.
- **PostgreSQL**: Banco de dados relacional.
- **Zod**: Validação de dados no DTO.
- **JWT + Passport**: Para autenticação e autorização.
- **Swagger**: Documentação automática da API.
- **Redis**: Cache para otimizar buscas.
- **Sentry**: Monitoramento de erros.

### **📌 Padrões Utilizados**
- **DDD (Domain-Driven Design)**: Separação clara entre camadas **(Application, Domain, Infrastructure e Interfaces)**.
- **CQRS (Command Query Responsibility Segregation)**: Separação entre comandos e queries para melhorar a escalabilidade.
- **TDD (Test-Driven Development)**: Desenvolvimento baseado em testes.
- **SOLID**: Aplicação dos princípios SOLID na estrutura dos serviços e repositórios.
- **Decorator Pattern**: Para composição de serviços no NestJS.

## **📌 Frontend - SysMiddle Dashboard (Next.js + Styled Components)**

### **✅ Tecnologias Utilizadas**
- **Next.js**: Framework React para renderização híbrida (SSR/SSG).
- **Styled Components**: CSS-in-JS para componentização de estilos.
- **React Query**: Gerenciamento de estado assíncrono.
- **Zod**: Validação de formulários e schemas.
- **Vitest + Testing Library**: Testes unitários e de integração.

### **📌 Padrões Utilizados**
- **Atomic Design**: Organização de componentes reutilizáveis.
- **TDD**: Desenvolvimento guiado por testes.
- **Padrão de Camadas**: Separação entre **components, hooks, pages e services**.

## **📌 Três Pirâmides de Testes**
1. **Testes Unitários** (Vitest + Testing Library)
2. **Testes de Integração** (Vitest + Cypress)
3. **Testes End-to-End (E2E)** (Cypress)

Com essa estrutura, o sistema SysMiddle terá **alta escalabilidade, segurança e manutenção facilitada**.

