# Estado do Projeto — Estacionamento Guarita

## Visão Geral

Sistema de controle de estacionamento com duas frentes: guarita (cadastro, pátio e catraca) e cliente (login por token, pagamento e multa). A catraca libera a saída só com pagamento válido nos últimos 10 minutos.

| Camada       | Tecnologia                      |
| ------------ | ------------------------------- |
| Frontend     | React + Vite + TypeScript       |
| Backend      | Node.js + Express + TypeScript  |
| Persistência | PostgreSQL + Docker + DBeaver   |

## Estrutura do Repositório

```
/
├── docker-compose.yml
├── .env.example
├── database/
├── .specs/
│   ├── STATE.md
│   ├── LESSONS.md        # gerado por lessons.py — não editar à mão
│   ├── lessons.json
│   └── _tlc/             # validadores determinísticos da skill (versionados)
├── backend/
│   ├── .specs/features/
│   └── src/
└── frontend/
    ├── .specs/features/
    └── src/
```

## Decisões (AD)

| ID     | Decisão | Rationale | Data | Status |
| ------ | ------- | --------- | ---- | ------ |
| AD-001 | Stack: Node.js + React + PostgreSQL | Alinhamento do grupo | 2026-09-11 | active |
| AD-002 | Banco via `docker-compose` | Setup reproduzível | 2026-09-11 | active |
| AD-003 | Abordagem TLC Spec-Driven Development | Requisito da atividade | 2026-09-11 | active |
| AD-004 | Tarifa: R$ 5,00 por hora, mínimo 1 hora | MVP da apresentação | 2026-09-11 | active |
| AD-005 | Placa ABC-1234 ou ABC1D23 | Validação brasileira | 2026-09-11 | active |
| AD-006 | PostgreSQL + DBeaver | Gestão visual; driver `pg` | 2026-09-11 | active |
| AD-007 | Specs por domínio (`backend/.specs`, `frontend/.specs`) | Paralelizar o grupo | 2026-09-11 | active |
| AD-008 | Token de 7 caracteres `[A-Z0-9]` (ex.: `U3T98LX`) | Ticket impresso / login do cliente | 2026-09-24 | active |
| AD-009 | Pagamento simulado via POST | Sem gateway no MVP acadêmico | 2026-09-24 | active |
| AD-010 | Janela de saída de 10 minutos após `pagoEm` | Regra da catraca no enunciado | 2026-09-24 | active |
| AD-011 | Multa de 15% sobre `valorCobrado` se a janela expirar | Enunciado do case | 2026-09-24 | active |
| AD-012 | Impressão e QR são pressuposto; API devolve `token` e `loginUrl` | Fora do escopo de hardware | 2026-09-24 | active |
| AD-013 | Status: `ativo` → `pago` → `finalizado` ou `multa_pendente` | Máquina de estados do ticket | 2026-09-24 | active |
| AD-014 | Tabela de valores do cliente é referência local derivada de AD-004 | A API não expõe catálogo. Dívida consciente: contradiz PARK-26 e sai quando o backend expuser a tarifa | 2026-10-02 | active |
| AD-015 | Capacidade do pátio é constante local `CAPACIDADE_PATIO = 20` | A API só informa ocupação pela contagem de `GET /api/ativos`. Dívida consciente: contradiz PARK-26 | 2026-10-02 | active |
| AD-016 | Frontend não chama endpoint inexistente; divergência de contrato virá para esta tabela | Corrige o desvio de `GET /api/planos` e `GET /api/ocupacao` detectado na verificação | 2026-10-02 | active |
| AD-017 | Validadores da skill versionados em `.specs/_tlc/` | Gates reproduzíveis por qualquer pessoa, não só na máquina de quem rodou | 2026-10-02 | active |

## Features

| Feature | Spec | Status | Responsável |
| ------- | ---- | ------ | ----------- |
| Persistência de Dados | `backend/.specs/features/persistencia-dados/` | Em andamento | João (persist.) |
| Backend API | `backend/.specs/features/backend-api/` | Done | Gustavo |
| Frontend Guarita | `frontend/.specs/features/frontend-guarita/` | Em verificação | Heloisa |

## Estado dos gates (02/10/2026)

| Feature | `validate_spec` | `validate_tasks` | `validate_state` |
| ------- | --------------- | ---------------- | ---------------- |
| backend-api | 0 erros | 0 erros, 2 avisos | PASS |
| persistencia-dados | 0 erros, 1 aviso | fase omitida (auto-sizing) | sem `validation.md` |
| frontend-guarita | 0 erros | 0 erros, 2 avisos | FAIL — veredicto FAIL em `validation.md` |

Testes: 31 no backend, 98 no frontend, todos passando.

## Handoff

**Última atualização:** 2026-10-02

**Branch:** `main`

**Concluído:**
- Backend API completo e verificado: 29 requisitos em EARS, `validation.md` com evidência `file:line`
- Schema PostgreSQL com token e estados de pagamento
- Frontend das duas jornadas: ticket por token, pagamento, multa, entrada, pátio, saída e histórico
- Alinhamento de contrato em `7f6f607`: removidas as chamadas a `/api/planos`, `/api/planos/:id` e `/api/ocupacao`, que não existem no backend
- Specs do frontend revisadas: `spec.md` e `tasks.md` passam nos gates estruturais
- Verificação independente do frontend em `validation.md`: veredicto FAIL, 11 mutantes injetados, 2 sobreviveram
- Lições registradas em `.specs/LESSONS.md` via `lessons.py`
- Validadores da skill versionados em `.specs/_tlc/`
- Registro de gestão de demandas consolidado em `GESTAO-DEMANDAS.md`

**Próximo passo:**
- Fechar G1 de `validation.md`: teste de negação para `/atendimento?token=...` em `src/auth/acesso.test.ts`
- Fechar G2: extrair `ehPaginaAtual` como função pura e testar comportamento em vez de regex no fonte
- Re-rodar o Verifier para mover o veredicto de FAIL para PASS
- Escrever `validation.md` de `persistencia-dados` ou mover a feature para `Done` só depois disso

**Bloqueios:**
- `capacidade` e tabela de valores seguem locais (AD-014, AD-015) até o backend expor catálogo e lotação. Não é bloqueio de demonstração, é dívida registrada.
