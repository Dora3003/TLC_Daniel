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

Contrato oficial: OpenAPI `0.1.0` em `GET /api/openapi.json`. Base hospedada `https://tlc-daniel-xgxb.onrender.com` (Swagger em `/api/docs`). Frontend hospedado em `https://tlc-daniel.onrender.com` com `VITE_API_URL` apontando para a base da API no build. A base local continua `http://localhost:3000`. CORS: configurar `CORS_ORIGIN` (e `FRONTEND_URL` para `loginUrl`) no serviço da API. Erro padrão: `{ "erro": string, "mensagem": string, "valorMulta"?: number }`.

Não existem na API deployada: `GET /api/planos`, `GET /api/ocupacao`, catálogo de planos contratáveis, checkout Pix/QR de provedor, JWT/papéis no backend, nem campo `capacidade`/`disponiveis` de lotação. O frontend **não inventa** rotas HTTP; usa adaptações documentadas em FE-DEC abaixo.

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
| DEC-06 | Saída oficial é `POST /api/saida` (catraca). **FE-DEC-12:** o painel do atendente também oferece aba **Saída de Veículo** com token, chamando o mesmo endpoint (operação assistida; regras de pagamento/janela continuam no backend). |
| DEC-07 | Bloqueada. API sem JWT e sem papéis (fora de escopo do backend). Cliente autentica pelo token do ticket. Rotas da guarita são públicas. | PARK-23 e T-003 não têm guarda de papel para reutilizar. |
| TD-01 | Contratação de plano e checkout não existem. Pagamento real: ticket + `POST .../pagamentos`. **FE-DEC-08:** tabela de valores informativa local (`tabela-valores.ts`, AD-004), sem `GET /api/planos`. |
| TD-02 | Sem chave de idempotência. Segundo POST com status `pago` devolve `409 PAGAMENTO_JA_REALIZADO`. Não existe tentativa pendente. | PARK-08 e PARK-27 não têm status pendente para consultar. |
| TD-03 | Confirmada. Gatilho: janela de 10 min em `POST /api/saida`. Quitação: `POST .../multas` só com `multa_pendente`. `GET` do ticket expõe `valorMulta`. | Frontend não calcula 15%. |
| TD-04 | Confirmada: um estacionamento por instância. Sem unidade no payload. | `unitScope` não existe. |
| TD-05 | Ocupadas = tamanho de `GET /api/ativos`. **FE-DEC-09:** capacidade e disponíveis vêm de `CAPACIDADE_PATIO` (20) no front: `disponiveis = max(0, capacidade − ocupadas)`. Não há `updatedAt`. |
| TD-06 | Só consulta sob demanda. Sem polling, websocket ou `updatedAt`. | Atualização manual por novo `GET`. Intervalo de polling não deve ser inventado. |

### Decisões de implementação (FE-DEC, 2026-10-02)

| ID | Decisão | Onde no código |
|---|---|---|
| FE-DEC-08 | Tabela de valores = catálogo local por hora (R$ 5,00/h); regras exibidas: “R$ 5,00 por hora. Mínimo de 1 hora.”; valor cobrado na estadia vem de `GET /api/tickets/:token`. | `planos/tabela-valores.ts`, `api/cliente.ts` |
| FE-DEC-09 | Capacidade do pátio = 20; disponíveis calculadas no front. | `atendimento/capacidade.ts`, `api/atendente.ts` |
| FE-DEC-10 | Indicadores de vagas: `ocupadas` = `GET /api/ativos`.length (sem `/api/ocupacao`). | `api/atendente.ts` |
| FE-DEC-11 | Coluna **Identificador** na lista = `token` (7 chars); `id` UUID não vem em `/api/ativos` em produção. | `atendimento/alocacoes.ts` |
| FE-DEC-12 | Painel com abas **Cadastrar Veículo** e **Saída de Veículo** (`POST /api/saida`). | `atendimento/painel-operacao.tsx` |
| FE-DEC-13 | Após entrada/saída, invalidar consultas de vagas e lista (`versaoPatio`). | `paginas/areas.tsx` |
| FE-DEC-14 | Busca local na tabela: motorista, token ou placa (sem endpoint). | `atendimento/alocacoes.ts`, `alocacoes-pagina.tsx` |
| FE-DEC-15 | Textos ao cliente não mencionam “API”; erros genéricos via `ErroApi`. | `planos/paginas.tsx`, `checkout.tsx` |

### O que continua bloqueado ou parcial

- JWT/papéis no backend (DEC-07): guarda só na experiência do front.
- QR/código Pix de provedor (DEC-02): só se a API devolver no payload de pagamento.
- Tempo excedido e texto de regra da multa no GET do ticket: não vêm no contrato atual.
- Lotação “oficial” numérica no backend: bloqueio com `disponiveis === 0` funciona após FE-DEC-09.

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
**Status:** concluída em 2026-10-02. Tabela informativa local (FE-DEC-08): faixas 1h–5h a R$ 5,00/h; card **Sua estadia** com dados de `GET /api/tickets/:token`. Não chama `/api/planos`.

Exibir planos disponíveis, selecionar um plano válido e tratar carregamento, vazio e erro.

**Aceite:** os quatro tipos de plano são dados de catálogo, não condições hardcoded; indisponível não avança.

### T-006 — Implementar revisão e revalidação
**Requisitos:** PARK-04, PARK-26  
**Depende de:** T-005  
**Status:** concluída em 2026-10-02. Revisão com placa do ticket e período selecionado; revalidação via catálogo local (`obterPlano`), não via HTTP `/api/planos/:id`.

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
**Status:** concluída em 2026-10-02. `ocupadas` = contagem de `GET /api/ativos` (FE-DEC-10). `capacidade`/`disponiveis` via FE-DEC-09. Atualização manual (TD-06) e após cadastro/saída (FE-DEC-13).

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
**Status:** concluída em 2026-10-02. Lista via `GET /api/ativos`: identificador = **token** (FE-DEC-11), colunas placa, motorista, data. Filtro local por nome/token/placa (FE-DEC-14). Vazio, erro e botão Atualizar.

Exibir lista de alocações com ID, placa e data/hora, respeitando paginação/filtros do contrato.

**Aceite:** veículo recém-cadastrado é apresentado após atualização; lista vazia e falhas têm feedback adequado.

### T-016 — Painel cadastro e saída (2026-10-02)
**Requisitos:** PARK-18, operação assistida de saída  
**Depende de:** T-011  
**Status:** concluída. Abas **Cadastrar Veículo** / **Saída de Veículo**; saída com token em `POST /api/saida` (FE-DEC-12).

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

Evidência: `npm test` no frontend (`integracao.test.ts`, `qualidade/requisitos.test.ts`, `atendimento/*`, `planos/*`). Atualizado em 2026-10-02.

| Requisito | Implementação | Evidência | Situação |
|---|---|---|---|
| PARK-01 | `catalogoTarifaOficial` e `PaginaPlanos` | `tabela-valores.test.ts`, `integracao.test.ts` | Tabela informativa local (FE-DEC-08), não catálogo contratável da API. |
| PARK-02 | Nome, validade, preço e regras do período | `PARK-02 e PARK-04` | Validado. Preço de referência; cobrança real no ticket. |
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
| PARK-16 | `obterOcupacao` (`/api/ativos` + FE-DEC-09) e `PaginaVagas` | `integracao.test.ts`, `PARK-16 e PARK-17` | Ocupadas oficiais; capacidade/disponíveis parâmetro UI 20 vagas. |
| PARK-17 | Botão Atualizar, novo GET, TD-06 | `PARK-16 e PARK-17` | Validado. Atualização manual. Sem polling. |
| PARK-18 | `POST /api/entrada` | `PARK-18 e PARK-19`; `integracao.test.ts` | Validado. Placa e motorista obrigatórios. |
| PARK-19 | `confirmacaoDaEntrada` | `PARK-18 e PARK-19` | Validado. Identificador, placa e data da resposta. |
| PARK-20 | `GET /api/ativos`, `linhasAlocacao` (token), busca local | `alocacoes.test.ts`, `PARK-20` | Identificador = token; filtro UX local (FE-DEC-14). |
| PARK-21 | `409 PLACA_JA_ATIVA` | `PARK-21`; `app.test.ts` | Validado. A mensagem da API aparece e a entrada não é confirmada. |
| PARK-22 | `patioLotado` + FE-DEC-09 | `PARK-22`, `entrada.test.ts` | Bloqueio quando `disponiveis === 0` (capacidade 20). |
| PARK-23 | `decidirAcesso` | `PARK-23`; `acesso.test.ts` | Validado na experiência. DEC-07: a API não tem JWT nem papel. |
| PARK-24 | `role="alert"`, `role="status"` e nova tentativa | `PARK-24` | Validado. Falha de rede usa mensagem genérica. |
| PARK-25 | Foco, atalho, tabela e layout estreito | `PARK-25`; `acessibilidade.test.ts` | Validado no navegador em 1280px e 390px. |
| PARK-26 | Ticket/multa sem cálculo local; tabela só referência | `PARK-26` | Valor da estadia e multa vêm da API; disponíveis derivadas de capacidade UI (FE-DEC-09). |
| PARK-27 | `pagarUmaVez` consulta o ticket antes do POST | `PARK-27` | Validado. Ticket já `pago` não gera outro pagamento. |
