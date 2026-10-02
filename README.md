# TCL_Daniel — Estacionamento Guarita

Trabalho de Inovação e Tecnologia — Spec-Driven Development (TLC).

## Estrutura

```
/
├── docker-compose.yml
├── database/          # Schema SQL + guia DBeaver
├── .specs/STATE.md    # Decisões globais do grupo
├── backend/           # Express + TypeScript
└── frontend/          # React + spec da interface
```

## Setup

```bash
cp .env.example .env
docker compose up -d
cd backend
npm install
npm run dev
```

API em `http://localhost:3000`. Swagger em `http://localhost:3000/api/docs`. Specs TLC em `backend/.specs/features/backend-api/`.

Se o banco já existia com o schema antigo:

```bash
docker compose down -v
docker compose up -d
```

## Endpoints

| Método | Rota | Quem usa |
| ------ | ---- | -------- |
| POST | `/api/entrada` | Guarita |
| GET | `/api/ativos` | Guarita |
| GET | `/api/historico/:placa` | Guarita |
| GET | `/api/tickets/:token` | Cliente (login) |
| POST | `/api/tickets/:token/pagamentos` | Cliente |
| POST | `/api/tickets/:token/multas` | Cliente |
| POST | `/api/saida` | Catraca |
| GET | `/api/health` | Operação |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/openapi.json` | Spec OpenAPI |

Impressão do ticket e QR são pressuposto: o cadastro devolve `token` e `loginUrl`.

## Deploy no Render

O arquivo `render.yaml` configura um Web Service Docker para a API usando `backend/` como diretório raiz e `backend/Dockerfile`. O frontend ainda não está implementado como aplicação executável; neste momento, o Blueprint publica somente o backend.

No primeiro deploy, informe no Render:

- `DATABASE_URL` (obrigatória): URL de conexão do PostgreSQL hospedado. Se o banco também estiver no Render, use a URL interna fornecida pelo banco.
- `FRONTEND_URL`: URL do frontend usada para montar links de acesso; enquanto o frontend não estiver publicado, pode usar `http://localhost:5173` para desenvolvimento ou ajustar depois.
- `CORS_ORIGIN`: origem permitida para chamadas do frontend; aceita múltiplas origens separadas por vírgula ou `*`.

As variáveis `PORT` e `NODE_ENV` não precisam ser cadastradas manualmente: a imagem define `10000` como fallback e `production`, e o Render fornece a porta do serviço. Não configure `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER` ou `POSTGRES_PASSWORD` no serviço da API; elas são usadas somente pelo PostgreSQL local do Docker Compose.

O `render.yaml` marca as variáveis como `sync: false`; portanto, elas devem ser preenchidas no painel/fluxo do Blueprint. O `.env.example` serve como referência local; não é importado automaticamente pelo Render.

O health check está configurado em `/api/health` e verifica também a conexão com o banco.

Local com API em container:

```bash
docker compose up --build
```

Conexão DBeaver: `database/README.md`.
