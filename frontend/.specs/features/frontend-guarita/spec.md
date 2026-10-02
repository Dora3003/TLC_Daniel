# Frontend Guarita — Specification

> **Revisão de 02/10/2026.** Spec alinhada ao contrato real da API, conforme a descoberta
> registrada em `tasks.md` (T-001). A versão anterior derivava do protótipo visual "AutoPark" e
> descrevia planos por período, checkout Pix e capacidade de vagas — nada disso existe no backend.
> As decisões `DEC-01` a `DEC-07` ficam resolvidas aqui, e os pontos em que a tela usa dado local
> estão declarados como dívida (AD-014, AD-015) em vez de requisito cumprido.

## Problem Statement

O backend expõe o ciclo completo do estacionamento (entrada, ticket por token, pagamento, multa,
saída pela catraca, pátio e histórico), mas não tem interface. Sem frontend, o guarda não cadastra
veículo, o cliente não consegue abrir o ticket pelo token impresso nem pagar, e a catraca não tem
operador. São duas jornadas distintas sobre a mesma API: a do cliente, autenticada pelo token de 7
caracteres do ticket, e a operacional do atendente.

## Goals

- [x] Permitir que o cliente abra o ticket com o token e veja placa, tempo, valor e status
- [x] Permitir que o cliente pague a estadia e, quando houver, a multa de 15%
- [x] Permitir que o atendente cadastre a entrada de um veículo e registre a saída pela catraca
- [x] Permitir que o atendente acompanhe o pátio e consulte o histórico por placa
- [x] Manter a API como fonte de verdade de valor, status e janela de saída
- [ ] Exibir tabela de valores e lotação a partir da API — bloqueado: o contrato não expõe nenhum dos dois (ver `TD-05`, `TD-07`)

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Catálogo de planos 1h / 5h / diária / mensal | A API não tem catálogo; a tarifa é única, R$ 5,00/h (AD-004). O protótipo AutoPark não corresponde ao domínio |
| Checkout com provedor, QR Code ou código Pix | Pagamento é simulado: o POST já devolve `status: "pago"` (AD-009) |
| Login com e-mail e senha de verdade | A API não tem usuário, JWT nem papel. A tela do atendente é casca de experiência (DEC-07) |
| Cálculo de tarifa, multa ou tempo excedente no frontend | Regra de negócio é exclusiva do backend (AD-004, AD-011) |
| Reserva de vaga, estorno, cancelamento e renovação | Não existem no contrato |
| Hardware de cancela e leitura automática de placa | A catraca é um cliente HTTP de `POST /api/saida` |
| Atualização em tempo real (polling, websocket) | A API não tem `updatedAt` nem canal de eventos (TD-06) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Framework | React + Vite + TypeScript | Scaffold já existente no repositório | y |
| Roteamento | Navegação própria por `pathname` | Sem dependência nova; o projeto não tinha router (TD-02) | y |
| Cliente HTTP | `fetch` nativo embrulhado em `criarHttp` | Sem Axios; o backend já padroniza o corpo de erro | y |
| Estado | `useState` + hooks locais `useConsulta` / `useMutacao` | Escopo não justifica Zustand ou React Query | y |
| Runner de teste | `node --test` com type stripping | Mesmo runner do backend; zero dependência nova | y |
| DEC-01 — quem informa a placa | O atendente, em `POST /api/entrada`. O cliente nunca informa placa | O contrato só aceita placa na entrada | y |
| DEC-02 — meio de pagamento | Simulado. O QR do enunciado é o `loginUrl` do ticket, não um QR de cobrança | AD-009, AD-012 | y |
| DEC-03 — regra de início e fim do plano | Não há plano. Tarifa de R$ 5,00/h, teto, mínimo 1h, calculada só no backend | AD-004 | y |
| DEC-04 — como o backend identifica excedente | Não é excedente de plano: `POST /api/saida` com a janela de 10 min vencida gera `multa_pendente` | AD-010, AD-011 | y |
| DEC-05 — duração da diária | Não se aplica; não existe diária | AD-004 | y |
| DEC-06 — quem registra a saída | A catraca, via `POST /api/saida`. O painel do atendente opera essa chamada | AD-010 | y |
| DEC-07 — papéis que acessam o painel | Nenhum papel real: a API não tem JWT. A separação é de experiência (token para cliente, área própria para atendente) | Fora do escopo do backend | y |
| TD-05 — origem da ocupação | Contagem de `GET /api/ativos`. Capacidade não existe no contrato | Único dado oficial disponível | y |
| TD-07 — capacidade do pátio | Constante local `CAPACIDADE_PATIO = 20`, com `disponiveis` derivado no cliente | **Dívida consciente**: viola PARK-26. Registrado como AD-015 para a demonstração funcionar | y |
| TD-08 — tabela de valores | Tabela de referência local derivada de AD-004 (5/10/15/20/25) | **Dívida consciente**: viola PARK-26. Registrado como AD-014 | y |

**Open questions:** none

---

## User Stories

### P1: Abrir o ticket pelo token ⭐ MVP

**User Story**: Como cliente, quero entrar com o token de 7 caracteres do papel para ver placa, tempo, valor e status da minha estadia.

**Why P1**: É o login da jornada do cliente; sem ele nada mais é acessível.

**Acceptance Criteria**:

1. WHEN the client submits a token matching `^[A-Z0-9]{7}$` THEN the app SHALL call `GET /api/tickets/:token` and render `placa`, `motoristaNome`, `status`, `duracaoMinutos` and `valorAtual` exactly as returned
2. The app SHALL normalize the typed token to uppercase before calling the API
3. IF the token does not match the 7-character format THEN the app SHALL block the request and show a recovery message without calling the API
4. IF the API answers `404 TOKEN_INVALIDO` THEN the app SHALL keep the client on the login screen and show the message from the API
5. WHILE the request is in flight the app SHALL show a loading state and SHALL NOT allow a second submission

**Independent Test**: Entrar com um token válido mostra o ticket; token de 6 caracteres não dispara chamada.

---

### P1: Pagar a estadia ⭐ MVP

**User Story**: Como cliente, quero pagar o valor da estadia para liberar minha saída na catraca.

**Why P1**: É o ato central da jornada do cliente.

**Acceptance Criteria**:

1. WHEN the client confirms payment for a ticket with status `ativo` THEN the app SHALL call `POST /api/tickets/:token/pagamentos` and render `valorCobrado`, `pagoEm` and `janelaSaidaExpiraEm` from the response
2. The app SHALL consider the stay paid only WHEN the API returns `status: "pago"`
3. IF the ticket is already `pago` before the POST THEN the app SHALL skip the payment call and show the existing receipt
4. IF the API answers `409 PAGAMENTO_JA_REALIZADO` THEN the app SHALL re-read the ticket and show the receipt instead of an error
5. WHILE a payment is in flight the app SHALL reject a second submission so one confirmation never creates two payments
6. IF the API answers with a status other than `pago` THEN the app SHALL NOT show a receipt and SHALL preserve the ability to retry

**Independent Test**: Clicar duas vezes em pagar gera um único POST; ticket já pago mostra comprovante sem novo POST.

---

### P1: Pagar a multa ⭐ MVP

**User Story**: Como cliente, quero pagar a multa de 15% para reabrir a janela de saída.

**Why P1**: Sem isso o veículo fica preso depois da janela de 10 minutos expirar.

**Acceptance Criteria**:

1. WHEN the ticket status is `multa_pendente` and `valorMulta` is numeric THEN the app SHALL show the fine amount from the API and offer the payment action
2. IF the ticket status is not `multa_pendente` THEN the app SHALL hide the fine payment action entirely
3. WHEN the client confirms the fine payment THEN the app SHALL call `POST /api/tickets/:token/multas` and render `valorMulta`, `pagoEm` and the new `janelaSaidaExpiraEm`
4. The app SHALL NOT compute the 15% itself and SHALL display only the `valorMulta` returned by the API
5. IF the API answers `409 MULTA_NAO_PENDENTE` THEN the app SHALL re-read the ticket and show its current state

**Independent Test**: Ticket `multa_pendente` mostra o botão e o valor da API; ticket `ativo` não mostra a ação.

---

### P1: Cadastrar entrada de veículo ⭐ MVP

**User Story**: Como atendente, quero cadastrar placa e motorista para gerar o ticket do cliente.

**Why P1**: É a porta de entrada de todo o fluxo.

**Acceptance Criteria**:

1. WHEN the attendant submits a valid plate and driver name THEN the app SHALL call `POST /api/entrada` and render `id`, `placa`, `entradaEm` and `token` from the response
2. IF the API answers `409 PLACA_JA_ATIVA` THEN the app SHALL show the API message and SHALL NOT present a confirmation
3. IF the API answers `400 PLACA_INVALIDA` or `400 DADOS_INVALIDOS` THEN the app SHALL show the API message and keep the typed values for correction
4. IF the response is missing `id`, `placa` or `entradaEm` THEN the app SHALL treat it as a failure and show no confirmation
5. WHERE the yard has zero free spots the app SHALL disable the submit action and SHALL explain why

**Independent Test**: Placa duplicada mostra a mensagem da API e nenhuma confirmação.

---

### P1: Registrar saída na catraca ⭐ MVP

**User Story**: Como atendente operando a catraca, quero validar o token na saída para liberar ou barrar o veículo.

**Why P1**: Fecha o ciclo operacional do enunciado.

**Acceptance Criteria**:

1. WHEN the attendant submits a token to `POST /api/saida` and the API returns `200` THEN the app SHALL render `saidaEm`, `duracaoMinutos` and `valorCobrado` and SHALL report the stay as `finalizado`
2. IF the API answers `402 PAGAMENTO_PENDENTE` THEN the app SHALL block the exit and show that payment is required
3. IF the API answers `409 JANELA_SAIDA_EXPIRADA` THEN the app SHALL block the exit and show the `valorMulta` returned in the error body
4. IF the API answers `402 MULTA_PENDENTE` THEN the app SHALL block the exit and show the pending fine
5. The app SHALL NOT decide by itself whether the exit window is still open

**Independent Test**: Saída de ticket não pago devolve bloqueio com a mensagem da API.

---

### P2: Acompanhar o pátio

**User Story**: Como atendente, quero ver os veículos no pátio e quantas vagas estão ocupadas.

**Why P2**: Operação de apoio; não bloqueia entrada nem saída.

**Acceptance Criteria**:

1. WHEN the attendant opens the panel THEN the app SHALL call `GET /api/ativos` and list `id`, `placa` and `entradaEm` for every record returned
2. The app SHALL derive `ocupadas` from the length of the `GET /api/ativos` array, which is the only official occupancy signal
3. WHEN the array is empty THEN the app SHALL show an empty state with a retry action
4. The app SHALL refresh the indicators only on an explicit user action, since the contract has no change signal
5. WHERE total capacity is displayed the app SHALL label it as a local configuration value, because the API does not expose capacity

**Independent Test**: Pátio vazio mostra estado vazio; dois ativos mostram duas linhas e ocupadas igual a 2.

---

### P2: Consultar a tabela de valores

**User Story**: Como cliente, quero ver quanto custa a estadia antes de pagar.

**Why P2**: Transparência; o valor efetivo já vem do ticket.

**Acceptance Criteria**:

1. The app SHALL present the reference table derived from AD-004 (R$ 5,00 per hour, minimum one hour) labelled as reference, not as a quote
2. The app SHALL NOT present the reference table as the amount due; the amount due SHALL always be `valorAtual` or `valorCobrado` from the API
3. IF the tariff in AD-004 changes THEN the reference table SHALL be updated in the same commit as the decision record

**Independent Test**: A tela de valores mostra 5/10/15/20/25 e o pagamento cobra o `valorAtual` do ticket, não a linha escolhida.

---

### P3: Histórico por placa

**User Story**: Como atendente, quero consultar estadias finalizadas de uma placa.

**Why P3**: Consulta útil na demonstração, sem bloquear o fluxo.

**Acceptance Criteria**:

1. WHEN the attendant queries a plate THEN the app SHALL call `GET /api/historico/:placa` and list the returned records
2. IF the plate never parked THEN the app SHALL show an empty state

**Independent Test**: Finalizar uma estadia e consultar a placa mostra um registro.

---

### P3: Acessibilidade e separação de áreas

**User Story**: Como qualquer usuário, quero operar por teclado e não cair na área do outro perfil.

**Why P3**: Qualidade transversal.

**Acceptance Criteria**:

1. IF a client session requests an attendant route THEN the app SHALL deny access and redirect to the client start route
2. IF an attendant session requests a client payment route THEN the app SHALL deny access and redirect to the attendant panel
3. The app SHALL mark the current navigation item with `aria-current="page"`
4. The app SHALL announce errors through `role="alert"` and transient status through `role="status"`
5. The app SHALL NOT convey status through color alone

**Independent Test**: Sessão de cliente em `/atendimento` é negada; o item de navegação ativo carrega `aria-current`.

---

## Edge Cases

- IF the network request throws THEN the app SHALL show a non-technical message with a retry action
- IF the API answers `503 SERVICO_INDISPONIVEL` THEN the app SHALL show that the service is temporarily unavailable
- WHEN the client reloads during a pending payment THEN the app SHALL re-read the ticket before offering to pay again
- WHEN the token arrives in the URL as `?token=` THEN the app SHALL start the client session from it
- WHEN the viewport is narrow THEN the panel cards SHALL stack and the table SHALL scroll horizontally

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| PARK-01 | P2: Tabela de valores | Execute | Verified |
| PARK-02 | P2: Tabela de valores | Execute | Verified |
| PARK-03 | P2: Tabela de valores | Execute | Verified |
| PARK-04 | P1: Pagar a estadia | Execute | Verified |
| PARK-05 | P1: Pagar a estadia | Execute | Verified |
| PARK-06 | P1: Pagar a estadia | Execute | Verified |
| PARK-07 | P1: Pagar a estadia | Execute | Verified |
| PARK-08 | P1: Pagar a estadia | Execute | Verified |
| PARK-09 | Out of scope (AD-009) | Specify | Pending |
| PARK-10 | P1: Abrir o ticket | Execute | Verified |
| PARK-11 | P1: Pagar a multa | Execute | Verified |
| PARK-12 | P1: Pagar a multa | Execute | Verified |
| PARK-13 | P1: Pagar a multa | Execute | Verified |
| PARK-14 | P1: Pagar a multa | Execute | Verified |
| PARK-15 | P1: Pagar a multa | Execute | Verified |
| PARK-16 | P2: Acompanhar o pátio | Execute | Implementing |
| PARK-17 | P2: Acompanhar o pátio | Execute | Verified |
| PARK-18 | P1: Cadastrar entrada | Execute | Verified |
| PARK-19 | P1: Cadastrar entrada | Execute | Verified |
| PARK-20 | P2: Acompanhar o pátio | Execute | Verified |
| PARK-21 | P1: Cadastrar entrada | Execute | Verified |
| PARK-22 | P1: Cadastrar entrada | Execute | Implementing |
| PARK-23 | P3: Acessibilidade e áreas | Execute | Implementing |
| PARK-24 | P3: Acessibilidade e áreas | Execute | Verified |
| PARK-25 | P3: Acessibilidade e áreas | Execute | Implementing |
| PARK-26 | P2: Tabela de valores | Execute | Implementing |
| PARK-27 | P1: Pagar a estadia | Execute | Verified |
| PARK-28 | P1: Registrar saída | Execute | Verified |
| PARK-29 | P3: Histórico por placa | Execute | Verified |

**Coverage:** 29 total, 28 mapped to stories, 1 explicitly out of scope (PARK-09).

---

## Known Gaps

Os cinco requisitos em `Implementing` têm a lacuna nomeada em `validation.md`:

| Requisito | Lacuna |
| --------- | ------ |
| PARK-16 | `capacidade` e `disponiveis` vêm da constante local `CAPACIDADE_PATIO`, não da API (AD-015) |
| PARK-22 | O bloqueio por lotação depende dessa constante, então não reflete a lotação real |
| PARK-23 | A negação de cliente para rota de atendente não tem teste: mutante sobreviveu |
| PARK-25 | `aria-current` é verificado por regex no código-fonte, não por comportamento: mutante sobreviveu |
| PARK-26 | Preço de referência e lotação são locais; o restante (valor, status, janela) respeita a API |

---

## Success Criteria

- [x] O cliente abre o ticket pelo token, paga a estadia e paga a multa quando existe
- [x] O atendente cadastra entrada, registra saída e acompanha o pátio
- [x] Valor cobrado, status e janela de saída vêm sempre da API
- [x] Nenhuma tela chama endpoint inexistente
- [ ] Preço de referência e lotação virão da API quando o contrato expuser catálogo e capacidade
- [ ] PARK-23 e PARK-25 cobertos por teste de comportamento que mate os mutantes registrados
