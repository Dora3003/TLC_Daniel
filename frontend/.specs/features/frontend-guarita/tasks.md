# Tasks — Plataforma de Estacionamento

## Convenções

- Implementar somente após concluir as decisões que bloqueiam a tarefa.
- Reutilizar padrões existentes de rota, autenticação, HTTP, componentes e testes.
- Cada tarefa deve incluir testes compatíveis com o projeto.

## 1. Descoberta e alinhamento

### T-001 — Confirmar contratos e regras de negócio
**Requisitos:** PARK-01, PARK-02, PARK-05 a PARK-15, PARK-16 a PARK-22, PARK-26, PARK-27  
**Depende de:** —

Mapear contratos reais para catálogo, contratação, pagamento, excedente, ocupação e alocações. Confirmar DEC-01 a DEC-07 e TD-01 a TD-06. Registrar decisões e o que continua bloqueado.

**Aceite:** payloads, estados oficiais, regra de excedente, vínculo de unidade e estratégia de atualização documentados; nenhum endpoint inventado.

### T-002 — Descobrir arquitetura e componentes reutilizáveis
**Requisitos:** PARK-23 a PARK-25  
**Depende de:** —

Localizar guards de rota/papel, cliente HTTP, componentes de formulário/feedback/tabela, cache, observabilidade e convenções de teste.

**Aceite:** plano de integração aponta os recursos existentes a reutilizar; sem dependência nova sem justificativa.

## 2. Base e autorização

### T-003 — Criar rotas e guardas por papel
**Requisitos:** PARK-23  
**Depende de:** T-001, T-002

Adicionar as rotas da jornada cliente e do painel do atendente seguindo o padrão existente. Restringir cada área pelo papel apropriado.

**Aceite:** cliente não acessa painel operacional; atendente não acessa dados de pagamento de clientes fora do escopo permitido.

### T-004 — Modelar integrações com contratos reais
**Requisitos:** PARK-01, PARK-05, PARK-11, PARK-16, PARK-18, PARK-20, PARK-26  
**Depende de:** T-001, T-002

Criar/reutilizar tipos, serviços e hooks para planos, tentativas de pagamento, cobranças adicionais, ocupação e alocações.

**Aceite:** tipos refletem contrato real; tratamento de erros usa padrão do projeto.

## 3. Jornada do cliente

### T-005 — Implementar catálogo e seleção de planos
**Requisitos:** PARK-01 a PARK-03, PARK-24, PARK-26  
**Depende de:** T-003, T-004

Exibir planos disponíveis, selecionar um plano válido e tratar carregamento, vazio e erro.

**Aceite:** os quatro tipos de plano são dados de catálogo, não condições hardcoded; indisponível não avança.

### T-006 — Implementar revisão e revalidação
**Requisitos:** PARK-04, PARK-26  
**Depende de:** T-005

Exibir dados atuais; revalidar antes de pagar e exigir nova confirmação se a API alterar preço, validade ou disponibilidade.

**Aceite:** o frontend não calcula valores e não prossegue com dados inválidos/desatualizados.

### T-007 — Implementar tentativa e checkout de plano
**Requisitos:** PARK-05 a PARK-09, PARK-27  
**Depende de:** T-006

Criar tentativa idempotente, apresentar processamento, consumir dados reais de checkout/QR Code e consultar status após retorno ou reload.

**Aceite:** clique repetido não duplica pagamento; QR/código vem da API; confirmação só aparece após status oficial.

### T-008 — Implementar contratos e comprovantes do cliente
**Requisitos:** PARK-06, PARK-10  
**Depende de:** T-007

Listar e detalhar contratações/comprovantes da pessoa autenticada.

**Aceite:** status e validade refletem a API; estado vazio e erro são recuperáveis.

### T-009 — Implementar cobrança adicional por excedente
**Requisitos:** PARK-11 a PARK-15, PARK-27  
**Depende de:** T-001, T-007, T-008

Exibir cobrança pendente quando retornar da API e reutilizar a jornada de pagamento para quitá-la.

**Aceite:** não há cálculo local; não exibe ação sem excedente; comprovante identifica a cobrança confirmada.

## 4. Painel do atendente

### T-010 — Implementar indicadores de vagas
**Requisitos:** PARK-16, PARK-17, PARK-24, PARK-26  
**Depende de:** T-003, T-004

Exibir capacidade, ocupadas, disponíveis e atualização conforme estratégia confirmada.

**Aceite:** números vêm da API e possuem loading/erro/retry.

### T-011 — Implementar cadastro de entrada de veículo
**Requisitos:** PARK-18, PARK-19, PARK-21, PARK-22, PARK-24  
**Depende de:** T-010

Criar formulário de placa e enviar dados exigidos. Tratar lotação, duplicidade e sucesso.

**Aceite:** sem vaga bloqueia envio; conflito de placa não cria alocação; sucesso atualiza indicadores/lista por nova consulta ou invalidação.

### T-012 — Implementar lista de veículos alocados
**Requisitos:** PARK-20, PARK-24, PARK-26  
**Depende de:** T-010

Exibir lista de alocações com ID, placa e data/hora, respeitando paginação/filtros do contrato.

**Aceite:** veículo recém-cadastrado é apresentado após atualização; lista vazia e falhas têm feedback adequado.

## 5. Qualidade e validação

### T-013 — Aplicar acessibilidade e responsividade
**Requisitos:** PARK-25  
**Depende de:** T-005 a T-012

Validar foco, semântica, nomes acessíveis, mensagens anunciáveis, contraste e layouts desktop/mobile.

**Aceite:** ações críticas são concluídas por teclado e status/erros não dependem apenas de cor.

### T-014 — Cobrir fluxos com testes
**Requisitos:** PARK-01 a PARK-27  
**Depende de:** T-005 a T-013

Criar testes para: catálogo, revalidação, pagamento pendente/falha/sucesso, QR Code, cobrança adicional, lotação, placa duplicada, atualização de indicadores, lista e autorização.

**Aceite:** cenários happy path, erro e bordas definidos na spec passam.

### T-015 — Validar rastreabilidade final
**Requisitos:** PARK-01 a PARK-27  
**Depende de:** T-014

Associar cada requisito à implementação e à evidência de teste; registrar pendências remanescentes.

**Aceite:** 27/27 requisitos mapeados ou explicitamente bloqueados por decisão registrada.

## Matriz de rastreabilidade

| Requisitos | Tarefas |
|---|---|
| PARK-01 a PARK-04 | T-004 a T-006, T-014 |
| PARK-05 a PARK-10 | T-004, T-007, T-008, T-014 |
| PARK-11 a PARK-15 | T-001, T-009, T-014 |
| PARK-16 a PARK-17 | T-004, T-010, T-014 |
| PARK-18 a PARK-22 | T-004, T-011, T-012, T-014 |
| PARK-23 | T-002, T-003, T-014 |
| PARK-24 a PARK-25 | T-005 a T-013, T-014 |
| PARK-26 a PARK-27 | T-004 a T-010, T-014 |
