# Frontend Guarita — Tasks

> **Revisão de 02/10/2026.** Reestruturado com matriz de cobertura, gates e dependências por fase,
> que faltavam. As tarefas passam a apontar os commits que as entregaram. O registro de descoberta
> de T-001 e T-002 está preservado integralmente ao final.

## Test Coverage Matrix

> Gerada a partir do código existente e da spec. Não havia runner no frontend; adotado `node --test`
> com type stripping, o mesmo do backend, para não introduzir dependência.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica de domínio da tela | unit | 1:1 com os ACs de pagamento, multa, entrada, saída e lotação | `src/**/*.test.ts` | `npm test` |
| Cliente de API | unit com `fetch` injetado | URL, método e tradução de erro por rota usada | `src/api/integracao.test.ts` | `npm test` |
| Autorização de área | unit | Toda combinação de sessão e área | `src/auth/acesso.test.ts` | `npm test` |
| Rastreabilidade de requisito | unit | Um caso nomeado por PARK-xx | `src/qualidade/requisitos.test.ts` | `npm test` |
| Componentes `.tsx` | none | Sem runner de DOM; coberto por build gate | - | `npm run build` |
| Acessibilidade | none | **Lacuna conhecida**: hoje é inspeção de texto do fonte, não comportamento | `src/atendimento/acessibilidade.test.ts` | `npm test` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas de lógica pura | `npm test` (cwd `frontend`) |
| Full | Tarefas que tocam cliente de API ou autorização | `npm test` (cwd `frontend`) |
| Build | Tarefas que tocam `.tsx` ou configuração | `npm test && npm run build` (cwd `frontend`) |

---

## Task Breakdown

| ID | Deliverable | Layer | Tests | Commit |
| -- | ----------- | ----- | ----- | ------ |
| T1 | Scaffold e build | Config | none | `112f1be`, `5cce771` |
| T2 | Cliente HTTP e tipos | API | unit | `4ba286a` |
| T3 | Token, sessão e autorização de área | Auth | unit | `9994806` |
| T4 | Pagamento da estadia e da multa | Domínio cliente | unit | `07aec5c` |
| T5 | Tabela de valores de referência | Domínio cliente | unit | `7f6f607` |
| T6 | Entrada, pátio e saída do atendente | Domínio atendente | unit | `71cf428`, `7f6f607` |
| T7 | Rotas, páginas e composição do app | UI | none | `1a1d021`, `7f6f607` |
| T8 | Suíte de rastreabilidade por requisito | Qualidade | unit | `84ed7f3` |

---

## Execution Plan

```
Phase 1 (base) → Phase 2 (jornada do cliente) → Phase 3 (operação) → Phase 4 (composição) → Phase 5 (rastreabilidade)
```

### Phase 1: Base

Scaffold, cliente HTTP e autorização. Sem dependência intra-fase além de T1.

```
T1 -> T2
T1 -> T3
```

### T1: Scaffold Vite e build de container

**What**: Inicializar o app React + Vite + TypeScript e o build Docker com nginx.
**Where**: `frontend/package.json`
**Depends on**: none
**Reqs**: none
**Done when**: `npm run build` gera `dist/` e a imagem nginx serve o bundle.
**Tests**: none
**Gate**: Build

### T2: Cliente HTTP e tipos do contrato real

**What**: Embrulhar `fetch` com base configurável, traduzir o corpo de erro padrão da API em `ErroApi` e tipar só os payloads existentes.
**Where**: `frontend/src/api/http.ts`
**Depends on**: T1
**Reqs**: PARK-24, PARK-26
**Done when**: Cada rota usada tem método, URL e tradução de erro cobertos por teste com `fetch` injetado.
**Tests**: unit em `src/api/integracao.test.ts`
**Gate**: Full

### T3: Token, sessão e separação de áreas

**What**: Normalizar e validar o token de 7 caracteres, derivar a sessão de `?token=` e decidir acesso por área.
**Where**: `frontend/src/auth/acesso.ts`
**Depends on**: T1
**Reqs**: PARK-23
**Done when**: Token fora do formato é recusado sem chamar a API e cada combinação de sessão e área tem decisão explícita.
**Tests**: unit em `src/auth/acesso.test.ts`, `src/auth/sessao.test.ts`, `src/auth/login.test.ts`
**Gate**: Full

### Phase 2: Jornada do cliente

```
T2 -> T4
T3 -> T4
T2 -> T5
```

### T4: Pagamento da estadia e da multa

**What**: Reler o ticket antes do POST, impedir submissão dupla, confirmar só com `status: "pago"` e expor a multa apenas quando `multa_pendente`.
**Where**: `frontend/src/planos/pagamento.ts`
**Depends on**: T2, T3
**Reqs**: PARK-04, PARK-05, PARK-06, PARK-07, PARK-08, PARK-10, PARK-11, PARK-12, PARK-13, PARK-14, PARK-15, PARK-27
**Done when**: Clique repetido gera um único POST, `409 PAGAMENTO_JA_REALIZADO` vira comprovante e nenhum valor é calculado localmente.
**Tests**: unit em `src/planos/pagamento.test.ts`, `src/planos/multa.test.ts`, `src/planos/contratacoes.test.ts`
**Gate**: Quick

### T5: Tabela de valores de referência

**What**: Derivar a tabela de referência de AD-004 e marcá-la como referência, nunca como valor devido.
**Where**: `frontend/src/planos/tabela-valores.ts`
**Depends on**: T2
**Reqs**: PARK-01, PARK-02, PARK-03
**Done when**: A tabela reflete R$ 5,00/h e o pagamento continua usando `valorAtual` do ticket.
**Tests**: unit em `src/planos/tabela-valores.test.ts`, `src/planos/selecao.test.ts`
**Gate**: Quick

### Phase 3: Operação do atendente

```
T2 -> T6
T3 -> T6
```

### T6: Entrada, pátio e saída na catraca

**What**: Enviar entrada, tratar `409 PLACA_JA_ATIVA`, derivar ocupação da contagem de ativos e operar `POST /api/saida` com seus bloqueios.
**Where**: `frontend/src/atendimento/entrada.ts`
**Depends on**: T2, T3
**Reqs**: PARK-16, PARK-17, PARK-18, PARK-19, PARK-20, PARK-21, PARK-22, PARK-28, PARK-29
**Done when**: Placa duplicada não confirma, ocupação sai de `GET /api/ativos` e cada código de erro da saída tem tratamento.
**Tests**: unit em `src/atendimento/entrada.test.ts`, `src/atendimento/vagas.test.ts`, `src/atendimento/alocacoes.test.ts`, `src/atendimento/saida.test.ts`
**Gate**: Quick

### Phase 4: Composição

```
T4 -> T7
T5 -> T7
T6 -> T7
```

### T7: Rotas, páginas e composição do app

**What**: Ligar navegação por `pathname`, montar as telas das duas jornadas e aplicar foco, `aria-current` e layout estreito.
**Where**: `frontend/src/app/Aplicacao.tsx`
**Depends on**: T4, T5, T6
**Reqs**: PARK-24, PARK-25
**Done when**: As duas jornadas navegam ponta a ponta e o build passa.
**Tests**: none
**Gate**: Build

### Phase 5: Rastreabilidade

```
T7 -> T8
```

### T8: Suíte de rastreabilidade por requisito

**What**: Um caso de teste nomeado por requisito PARK-xx, para amarrar spec e evidência.
**Where**: `frontend/src/qualidade/requisitos.test.ts`
**Depends on**: T7
**Reqs**: PARK-01, PARK-29
**Done when**: Cada PARK coberto aparece nomeado na saída do runner.
**Tests**: unit em `src/qualidade/requisitos.test.ts`
**Gate**: Full

---

## Registro da descoberta (preservado de T-001 e T-002, 27/09/2026)

Contrato oficial: OpenAPI `0.1.0` em `GET /api/openapi.json`. Base hospedada
`https://tlc-daniel-xgxb.onrender.com` (Swagger em `/api/docs`); base local `http://localhost:3000`.
Erro padrão: `{ "erro": string, "mensagem": string, "valorMulta"?: number }`.

**A spec de planos (1h, 5h, diária, mensal), checkout com QR/Pix, papéis e capacidade de vagas não
existe nesta API. Não criar esses endpoints no frontend.**

### Estados oficiais

`ativo` → `pago` → `finalizado`, ou `pago` → `multa_pendente` → `pago` (após multa) → `finalizado`.
Não há `PENDING`, `FAILED`, `EXPIRED` nem `CANCELLED`. Pagamento e multa são síncronos.

### Payloads reais

| Operação | Contrato | Sucesso | Corpo |
|---|---|---|---|
| Entrada | `POST /api/entrada` | 201 | req: `placa`, `motoristaNome`, `modelo?`, `cor?`. res: `id`, `placa`, `motoristaNome`, `modelo`, `cor`, `token`, `loginUrl`, `entradaEm`, `status` |
| Login do ticket | `GET /api/tickets/:token` | 200 | `placa`, `motoristaNome`, `entradaEm`, `status`, `duracaoMinutos`, `valorAtual`, `valorMulta`, `janelaSaidaExpiraEm` |
| Pagar estadia | `POST /api/tickets/:token/pagamentos` | 200 | sem body. res: `valorCobrado`, `pagoEm`, `status`, `janelaSaidaExpiraEm` |
| Pagar multa | `POST /api/tickets/:token/multas` | 200 | sem body. res: `valorMulta`, `pagoEm`, `status`, `janelaSaidaExpiraEm` |
| Saída (catraca) | `POST /api/saida` | 200 | req: `{ token }`. res: `id`, `placa`, `entradaEm`, `saidaEm`, `duracaoMinutos`, `valorCobrado`, `status` |
| Pátio | `GET /api/ativos` | 200 | array de `placa`, `motoristaNome`, `token`, `entradaEm`, `status`, `tempoDecorridoMinutos`; vazio = `[]` |
| Histórico | `GET /api/historico/:placa` | 200 | array de `id`, `placa`, `entradaEm`, `saidaEm`, `valorCobrado`, `status` |

Token: `^[A-Z0-9]{7}$`. Placa aceita `ABC1234` e `ABC1D23`. `loginUrl` = `{FRONTEND_URL}/?token={token}`.

Códigos usados pelo frontend: `400 PLACA_INVALIDA`, `400 DADOS_INVALIDOS`, `400 TOKEN_INVALIDO`,
`400 REQUISICAO_INVALIDA`, `402 PAGAMENTO_PENDENTE`, `402 MULTA_PENDENTE`, `404 TOKEN_INVALIDO`,
`409 PLACA_JA_ATIVA`, `409 PAGAMENTO_JA_REALIZADO`, `409 MULTA_PENDENTE`, `409 MULTA_NAO_PENDENTE`,
`409 JANELA_SAIDA_EXPIRADA` (com `valorMulta`), `503 SERVICO_INDISPONIVEL`.

### Resolução das decisões

As decisões `DEC-01` a `DEC-07` e `TD-01` a `TD-08` estão resolvidas na seção
*Assumptions & Open Questions* de `spec.md`. As duas que viraram dívida consciente — tabela de
valores local (AD-014) e capacidade local (AD-015) — estão registradas em `.specs/STATE.md` e
cobradas em `validation.md`.

### Desvio registrado

Entre 27/09 e 01/10 a implementação contrariou esta descoberta: as telas foram construídas contra
`GET /api/planos`, `GET /api/planos/:id` e `GET /api/ocupacao`, que nunca existiram. O desvio foi
corrigido em `7f6f607` (02/10), substituindo as chamadas fantasma pela tabela de referência local e
pela contagem de `GET /api/ativos`. A lição está em `.specs/LESSONS.md`.
