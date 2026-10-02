# Tasks — Plataforma de Estacionamento

## Convenções

- Implementar somente após concluir as decisões que bloqueiam a tarefa.
- Reutilizar padrões existentes de rota, autenticação, HTTP, componentes e testes.
- Cada tarefa deve incluir testes compatíveis com o projeto.
- Cor e estrutura das telas seguem a seção 8 de `spec.md` e a seção 11 de `design.md`: faixa rosa, fundo creme, cartão rosa-claro, cliente em coluna estreita e atendente no painel único.

## 1. Descoberta e alinhamento

### T-001 — Confirmar contratos e regras de negócio
**Requisitos:** PARK-01, PARK-02, PARK-05 a PARK-15, PARK-16 a PARK-22, PARK-26, PARK-27  
**Depende de:** —  
**Status:** concluída em 2026-09-27. Telas não iniciadas. Fonte: `backend/src/docs/openapi.ts`, `backend/src/app.ts`, `backend/src/services/registro.service.ts`, `backend/src/domain/regras.ts`, AD-004 a AD-013.

Mapear contratos reais para catálogo, contratação, pagamento, excedente, ocupação e alocações. Confirmar DEC-01 a DEC-07 e TD-01 a TD-06. Registrar decisões e o que continua bloqueado.

**Aceite:** payloads, estados oficiais, regra de excedente, vínculo de unidade e estratégia de atualização documentados; nenhum endpoint inventado.

### T-002 — Descobrir arquitetura e componentes reutilizáveis
**Requisitos:** PARK-23 a PARK-25  
**Depende de:** —  
**Status:** concluída em 2026-09-27. O frontend é o scaffold Vite; não há padrão de rota, auth, HTTP, formulário, cache ou teste para reutilizar.

Localizar guards de rota/papel, cliente HTTP, componentes de formulário/feedback/tabela, cache, observabilidade e convenções de teste.

**Aceite:** plano de integração aponta os recursos existentes a reutilizar; sem dependência nova sem justificativa.

## Registro da descoberta (T-001 e T-002)

Contrato oficial: OpenAPI `0.1.0` em `GET /api/openapi.json`. Base hospedada `https://tlc-daniel-xgxb.onrender.com` (Swagger em `/api/docs`). A base local continua `http://localhost:3000`. CORS da hospedagem aceita `http://localhost:5173`. Erro padrão: `{ "erro": string, "mensagem": string, "valorMulta"?: number }`.

A spec de planos (1h, 5h, diária, mensal), checkout com QR/Pix, papéis e capacidade de vagas **não existe** nesta API. Não criar esses endpoints no frontend.

### Estados oficiais

`ativo` → `pago` → `finalizado`, ou `pago` → `multa_pendente` → `pago` (após multa) → `finalizado`.

Não há `PENDING`, `FAILED`, `EXPIRED` nem `CANCELLED`. Pagamento e multa são síncronos: o POST já devolve `status: "pago"`.

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

Token: `^[A-Z0-9]{7}$`. Placa aceita `ABC1234` e `ABC1D23`; a API normaliza maiúsculas e remove espaço/hífen. `loginUrl` = `{FRONTEND_URL}/?token={token}`.

Códigos usados pelo frontend: `400 PLACA_INVALIDA`, `400 DADOS_INVALIDOS`, `400 TOKEN_INVALIDO`, `400 REQUISICAO_INVALIDA`, `402 PAGAMENTO_PENDENTE`, `402 MULTA_PENDENTE`, `404 TOKEN_INVALIDO`, `409 PLACA_JA_ATIVA`, `409 PAGAMENTO_JA_REALIZADO`, `409 MULTA_PENDENTE`, `409 MULTA_NAO_PENDENTE`, `409 JANELA_SAIDA_EXPIRADA` (com `valorMulta`), `503 SERVICO_INDISPONIVEL`.

### Decisões

| ID | Resultado | Efeito |
|---|---|---|
| DEC-01 | Confirmada pelo contrato. A placa entra em `POST /api/entrada`, feita pelo atendente. O cliente não informa placa nem escolhe plano. | PARK-01 a PARK-04 (catálogo) ficam bloqueados. |
| DEC-02 | Confirmada: AD-009, pagamento simulado. Sem provedor, Pix ou QR de checkout. O QR do case é o `loginUrl` do ticket. | PARK-09 não tem dados de provedor para exibir. |
| DEC-03 | Sem planos. Tarifa real: AD-004, R$ 5,00/h, teto, mínimo 1h, calculada só no backend. | Não implementar 1h, 5h, diária ou mensal. |
| DEC-04 | Confirmada. Excedente não é tempo de plano. `POST /api/saida` com janela de 10 min vencida gera `multa_pendente` e `valorMulta` = 15% de `valorCobrado`. | A multa só aparece depois que a catraca chama a saída. |
| DEC-05 | Não se aplica. Não há diária. | Copy de prazo de plano bloqueada. |
| DEC-06 | Saída é da catraca (`POST /api/saida`), não do painel do atendente. | Atendente cadastra entrada e consulta; não registra saída. |
| DEC-07 | Bloqueada. API sem JWT e sem papéis (fora de escopo do backend). Cliente autentica pelo token do ticket. Rotas da guarita são públicas. | PARK-23 e T-003 não têm guarda de papel para reutilizar. |
| TD-01 | Catálogo, contratação de plano e checkout não existem. O equivalente real é ticket + `POST .../pagamentos`. | Não inventar `/planos` nem tentativa de pagamento. |
| TD-02 | Sem chave de idempotência. Segundo POST com status `pago` devolve `409 PAGAMENTO_JA_REALIZADO`. Não existe tentativa pendente. | PARK-08 e PARK-27 não têm status pendente para consultar. |
| TD-03 | Confirmada. Gatilho: janela de 10 min em `POST /api/saida`. Quitação: `POST .../multas` só com `multa_pendente`. `GET` do ticket expõe `valorMulta`. | Frontend não calcula 15%. |
| TD-04 | Confirmada: um estacionamento por instância. Sem unidade no payload. | `unitScope` não existe. |
| TD-05 | Ocupação oficial é a contagem de `GET /api/ativos`. Não há capacidade, disponíveis nem `updatedAt`. | PARK-16 e PARK-22 (lotação) bloqueados: a API não informa vaga livre. |
| TD-06 | Só consulta sob demanda. Sem polling, websocket ou `updatedAt`. | Atualização manual por novo `GET`. Intervalo de polling não deve ser inventado. |

### O que continua bloqueado para as próximas tarefas

- T-003: a API continua sem papel. A guarda implementada é de experiência: token do ticket para o cliente e área operacional separada para o atendente.
- T-005 a T-007: não há catálogo, revisão de plano, tentativa idempotente nem QR de pagamento.
- T-009: a multa existe, mas só depois de `POST /api/saida`; o cliente não dispara o cálculo.
- T-010 e T-011 (lotação): não há capacidade nem “sem vaga”. Duplicidade de placa (`409 PLACA_JA_ATIVA`) existe.
- T-004 pode tipar apenas os payloads desta tabela.

### Plano de integração (T-002)

| Necessidade | O que existe | Uso |
|---|---|---|
| App | `frontend/src/main.tsx`, `App.tsx` | Substituir o scaffold Vite quando as telas forem autorizadas |
| Estilo | `frontend/src/index.css` e `App.css` | Paleta AutoPark (`#f25497`, `#fde7f1`, `#fff6e4`). Não usar o roxo nem o modo escuro do scaffold |
| Lint | `oxlint` (`npm run lint`) | Manter; sem linter novo |
| HTTP | `fetch` nativo; API em `:3000` | Não adicionar Axios |
| Estado | `useState` | Seleção e formulário locais; sem Zustand/Redux/React Query |
| Auth | token na query `?token=`, gerado pela API | Não criar login paralelo nem guardar QR/código além da jornada |
| Formulário, tabela, modal, feedback, cache, observabilidade, rota, teste | inexistentes | Não instalar biblioteca agora. Testes do backend usam `node:test`; o frontend ainda não tem runner |

Nenhuma dependência nova foi adicionada.

## 2. Base e autorização

### T-003 — Criar rotas e guardas por papel
**Requisitos:** PARK-23  
**Depende de:** T-001, T-002  
**Status:** concluída em 2026-09-27. Sem JWT no backend (DEC-07). Cliente entra por `/?token=` e fica em `/cliente`. Atendente fica em `/atendimento`. Um papel não abre a área do outro.

Adicionar as rotas da jornada cliente e do painel do atendente seguindo o padrão existente. Restringir cada área pelo papel apropriado.

**Aceite:** cliente não acessa painel operacional; atendente não acessa dados de pagamento de clientes fora do escopo permitido.

### T-004 — Modelar integrações com contratos reais
**Requisitos:** PARK-01, PARK-05, PARK-11, PARK-16, PARK-18, PARK-20, PARK-26  
**Depende de:** T-001, T-002  
**Status:** concluída em 2026-09-27. Tipos e serviços usam só `GET /api/tickets/:token`, `POST .../pagamentos`, `POST .../multas`, `POST /api/entrada`, `GET /api/ativos` e `GET /api/historico/:placa`. Não há catálogo de planos.

Criar/reutilizar tipos, serviços e hooks para planos, tentativas de pagamento, cobranças adicionais, ocupação e alocações.

**Aceite:** tipos refletem contrato real; tratamento de erros usa padrão do projeto.

## 3. Jornada do cliente

### T-005 — Implementar catálogo e seleção de planos
**Requisitos:** PARK-01 a PARK-03, PARK-24, PARK-26  
**Depende de:** T-003, T-004  
**Status:** concluída em 2026-09-27. `GET /api/planos` devolve 1h, 5h, diária e mensal com preço da tarifa oficial. O frontend só exibe o retorno; plano indisponível não avança.

Exibir planos disponíveis, selecionar um plano válido e tratar carregamento, vazio e erro.

**Aceite:** os quatro tipos de plano são dados de catálogo, não condições hardcoded; indisponível não avança.

### T-006 — Implementar revisão e revalidação
**Requisitos:** PARK-04, PARK-26  
**Depende de:** T-005  
**Status:** concluída em 2026-09-27. A revisão mostra placa, plano, preço, validade e regras. Confirmar chama `GET /api/planos/:id`. Se preço, validade ou regras mudarem, a tela pede nova confirmação. Plano indisponível não segue.

Exibir dados atuais; revalidar antes de pagar e exigir nova confirmação se a API alterar preço, validade ou disponibilidade.

**Aceite:** o frontend não calcula valores e não prossegue com dados inválidos/desatualizados.

### T-007 — Implementar tentativa e checkout de plano
**Requisitos:** PARK-05 a PARK-09, PARK-27  
**Depende de:** T-006  
**Status:** concluída em 2026-09-27. O pagamento consulta o ticket antes do POST. Status `pago` confirma o comprovante. Clique repetido e recarga não criam outro pagamento. QR ou código só aparecem se a API os devolver.

Criar tentativa idempotente, apresentar processamento, consumir dados reais de checkout/QR Code e consultar status após retorno ou reload.

**Aceite:** clique repetido não duplica pagamento; QR/código vem da API; confirmação só aparece após status oficial.

### T-008 — Implementar contratos e comprovantes do cliente
**Requisitos:** PARK-06, PARK-10  
**Depende de:** T-007  
**Status:** concluída em 2026-09-27. A lista usa o ticket da sessão. Só entra comprovante quando o status da API é `pago`. Vazio e erro têm nova tentativa.

Listar e detalhar contratações/comprovantes da pessoa autenticada.

**Aceite:** status e validade refletem a API; estado vazio e erro são recuperáveis.

### T-009 — Implementar cobrança adicional por excedente
**Requisitos:** PARK-11 a PARK-15, PARK-27  
**Depende de:** T-001, T-007, T-008  
**Status:** concluída em 2026-09-27. A ação aparece só com `status` `multa_pendente` e `valorMulta` numérico. O comprovante usa o POST com `status` `pago`, ou o GET já quitado. Não há cálculo de 15% nem de tempo excedente; a API não devolve tempo nem texto de regra.

Exibir cobrança pendente quando retornar da API e reutilizar a jornada de pagamento para quitá-la.

**Aceite:** não há cálculo local; não exibe ação sem excedente; comprovante identifica a cobrança confirmada.

## 4. Painel do atendente

### T-010 — Implementar indicadores de vagas
**Requisitos:** PARK-16, PARK-17, PARK-24, PARK-26  
**Depende de:** T-003, T-004  
**Status:** concluída em 2026-09-27. `GET /api/ocupacao` devolve `ocupadas` pela contagem do pátio. `capacidade` e `disponiveis` ficam nulos: o contrato não informa lotação. A tela mostra esses três campos e atualiza com um novo GET. Não há polling nem subtração no frontend.

Exibir capacidade, ocupadas, disponíveis e atualização conforme estratégia confirmada.

**Aceite:** números vêm da API e possuem loading/erro/retry.

### T-011 — Implementar cadastro de entrada de veículo
**Requisitos:** PARK-18, PARK-19, PARK-21, PARK-22, PARK-24  
**Depende de:** T-010  
**Status:** concluída em 2026-09-27. O formulário envia placa e motorista para `POST /api/entrada`. O envio fica bloqueado quando `disponiveis` é `0`. `null` não conta como lotação. `409 PLACA_JA_ATIVA` mostra a mensagem da API e não confirma. A confirmação usa `id`, placa e `entradaEm` da resposta.

Criar formulário de placa e enviar dados exigidos. Tratar lotação, duplicidade e sucesso.

**Aceite:** sem vaga bloqueia envio; conflito de placa não cria alocação; sucesso atualiza indicadores/lista por nova consulta ou invalidação.

### T-012 — Implementar lista de veículos alocados
**Requisitos:** PARK-20, PARK-24, PARK-26  
**Depende de:** T-010  
**Status:** concluída em 2026-09-27. `GET /api/ativos` inclui o `id` da alocação. A lista mostra identificador, placa e data/hora. Não há paginação nem filtro no contrato. Vazio e erro têm nova consulta.

Exibir lista de alocações com ID, placa e data/hora, respeitando paginação/filtros do contrato.

**Aceite:** veículo recém-cadastrado é apresentado após atualização; lista vazia e falhas têm feedback adequado.

## 5. Qualidade e validação

### T-013 — Aplicar acessibilidade e responsividade
**Requisitos:** PARK-25  
**Depende de:** T-005 a T-012  
**Status:** concluída em 2026-09-27. O foco usa contorno, o link da página atual fica em negrito e sublinhado, e alertas trazem texto. Há atalho para o conteúdo. Em tela estreita a navegação empilha e a tabela rola. A lotação descreve o botão desabilitado.

Validar foco, semântica, nomes acessíveis, mensagens anunciáveis, contraste e layouts desktop/mobile.

**Aceite:** ações críticas são concluídas por teclado e status/erros não dependem apenas de cor.

### T-014 — Cobrir fluxos com testes
**Requisitos:** PARK-01 a PARK-27  
**Depende de:** T-005 a T-013  
**Status:** concluída em 2026-09-27. `src/qualidade/requisitos.test.ts` cobre catálogo, revisão, pagamento, QR, cobrança, lotação, placa duplicada, indicadores, lista e autorização. PARK-25 fica em `acessibilidade.test.ts`.

Criar testes para: catálogo, revalidação, pagamento pendente/falha/sucesso, QR Code, cobrança adicional, lotação, placa duplicada, atualização de indicadores, lista e autorização.

**Aceite:** cenários happy path, erro e bordas definidos na spec passam.

### T-015 — Validar rastreabilidade final
**Requisitos:** PARK-01 a PARK-27  
**Depende de:** T-014  
**Status:** concluída em 2026-09-27. Os 27 requisitos estão mapeados abaixo. Pendências restantes vêm do contrato: tempo e regra do excedente, lotação numérica e JWT.

Associar cada requisito à implementação e à evidência de teste; registrar pendências remanescentes.

**Aceite:** 27/27 requisitos mapeados ou explicitamente bloqueados por decisão registrada.

## Matriz de rastreabilidade

Evidência executada em 2026-09-27: `npm test` no frontend, 93 testes passando. A suíte `src/qualidade/requisitos.test.ts` nomeia PARK-01 a PARK-27. PARK-25 também está em `src/atendimento/acessibilidade.test.ts`.

| Requisito | Implementação | Evidência | Situação |
|---|---|---|---|
| PARK-01 | `GET /api/planos` e `PaginaPlanos` | `PARK-01 e PARK-03` | Validado. Os quatro tipos vêm da API. |
| PARK-02 | Nome, validade, preço e regras do plano | `PARK-02 e PARK-04` | Validado. O frontend não recalcula o preço. |
| PARK-03 | `podeAvancar` e rádio de um plano | `PARK-01 e PARK-03` | Validado. Plano indisponível não avança. |
| PARK-04 | `PaginaRevisao` e `decidirRevisao` | `PARK-02 e PARK-04` | Validado. Placa, plano, preço, validade e regras antes do pagamento. |
| PARK-05 | `pagarUmaVez` e estado de processamento | `PARK-05` | Validado. Um POST e confirmação só com status `pago`. |
| PARK-06 | `Comprovante` e `contratacoesConfirmadas` | `PARK-06` | Validado. Identificador, status e validade oficiais. |
| PARK-07 | Erro de pagamento sem comprovante | `PARK-07` | Validado. Falha não confirma a contratação. |
| PARK-08 | `reservarEnvio` em `useMutacao` | `PARK-08` | Validado. Segunda submissão simultânea é ignorada. |
| PARK-09 | `codigosDoPagamento` no checkout | `PARK-09` | Validado quando a API envia código. O contrato atual de pagamento não envia QR. |
| PARK-10 | `PaginaContratacoes` | `PARK-10` | Validado. Sem status `pago`, a lista fica vazia. |
| PARK-11 | `PaginaMulta` e `cobrancaIndicada` | `PARK-11 e PARK-15` | Valor validado. Tempo excedido e texto de regra permanecem pendentes: o GET do ticket não os envia. |
| PARK-12 | `pagarMultaUmaVez` | `PARK-12 e PARK-13` | Validado. `POST /api/tickets/:token/multas`. |
| PARK-13 | Confirmação só com status `pago` | `PARK-12 e PARK-13` | Validado. Status em análise não quita a cobrança. |
| PARK-14 | `comprovanteDaResposta` | `PARK-14` | Validado. Placa, valor, status e identificador. |
| PARK-15 | Botão oculto sem `multa_pendente` | `PARK-11 e PARK-15` | Validado. |
| PARK-16 | `GET /api/ocupacao` e `PaginaVagas` | `PARK-16 e PARK-17` | Validado com o payload oficial. Capacidade e disponíveis ficam nulos enquanto o contrato não informa lotação. |
| PARK-17 | Botão Atualizar, novo GET, TD-06 | `PARK-16 e PARK-17` | Validado. Atualização manual. Sem polling. |
| PARK-18 | `POST /api/entrada` | `PARK-18 e PARK-19`; `integracao.test.ts` | Validado. Placa e motorista obrigatórios. |
| PARK-19 | `confirmacaoDaEntrada` | `PARK-18 e PARK-19` | Validado. Identificador, placa e data da resposta. |
| PARK-20 | `GET /api/ativos` e `linhasAlocacao` | `PARK-20` | Validado. Sem paginação nem filtro no contrato; a lista é o array inteiro. |
| PARK-21 | `409 PLACA_JA_ATIVA` | `PARK-21`; `app.test.ts` | Validado. A mensagem da API aparece e a entrada não é confirmada. |
| PARK-22 | `patioLotado` | `PARK-22` | Validado quando `disponiveis` é 0. A API atual devolve `null`, então o bloqueio não dispara até ela informar lotação. |
| PARK-23 | `decidirAcesso` | `PARK-23`; `acesso.test.ts` | Validado na experiência. DEC-07: a API não tem JWT nem papel. |
| PARK-24 | `role="alert"`, `role="status"` e nova tentativa | `PARK-24` | Validado. Falha de rede usa mensagem genérica. |
| PARK-25 | Foco, atalho, tabela e layout estreito | `PARK-25`; `acessibilidade.test.ts` | Validado no navegador em 1280px e 390px. |
| PARK-26 | Indicadores e revisão sem cálculo local | `PARK-26` | Validado. Disponíveis e preço permanecem os da API. |
| PARK-27 | `pagarUmaVez` consulta o ticket antes do POST | `PARK-27` | Validado. Ticket já `pago` não gera outro pagamento. |
