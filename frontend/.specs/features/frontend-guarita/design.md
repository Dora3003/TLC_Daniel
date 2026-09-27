# Design — Plataforma de Estacionamento

## 1. Arquitetura funcional

A solução terá áreas separadas por papel, protegidas pela autorização existente:

```text
Cliente
  Planos -> Revisão -> Pagamento -> Comprovante
                         |
                         -> Cobrança adicional (quando API indicar excedente)

Atendente
  Dashboard de vagas -> Registrar veículo -> Veículos alocados
```

A separação evita que uma tela do cliente exponha dados operacionais e que o atendente possa operar pagamentos de terceiros sem requisito explícito.

## 2. Módulos conceituais

| Módulo | Responsabilidade | Não faz |
|---|---|---|
| Catálogo de planos | Carrega e exibe planos ativos | calcula preço ou validade |
| Revisão | Mostra dados atuais antes de pagar | confirma pagamento localmente |
| Pagamento | Inicia tentativa e acompanha status | processa dinheiro/gera QR inventado |
| Cobrança adicional | Exibe e quita excedente retornado | calcula excedente ou multa |
| Dashboard operacional | Mostra ocupação oficial | estima vagas por lista local |
| Entrada de veículo | Envia placa e dados exigidos | aprova entrada se API recusar |
| Veículos alocados | Lista alocações ativas | substitui backoffice/histórico completo |

## 3. Fluxos

### 3.1 Cliente: contratação

```text
Planos carregados da API
  -> selecionar plano disponível
  -> informar/confirmar placa (se o contrato exigir)
  -> revisão com dados atuais
  -> criar tentativa com chave de idempotência
  -> checkout/QR Code ou confirmação
  -> consultar status
  -> comprovante apenas em status confirmado
```

Antes de iniciar o pagamento, revalidar plano, preço e disponibilidade no backend. Se algum dado mudar, atualizar a revisão e exigir nova confirmação.

### 3.2 Cliente: excedente

```text
Minhas contratações
  -> API informa cobrança adicional pendente?
       não: não mostrar ação
       sim: mostrar tempo excedido, valor e regra
              -> iniciar pagamento
              -> consultar status
              -> comprovante quando quitado
```

A multa é uma **cobrança adicional** no vocabulário técnico. A interface pode usar “multa por excedente” se esse for o termo validado pelo negócio.

### 3.3 Atendente: operação

```text
Dashboard da unidade autorizada
  -> carregar ocupadas, disponíveis e capacidade
  -> se disponíveis > 0, habilitar cadastro
       -> enviar placa
       -> API cria alocação
       -> atualizar indicadores e lista
  -> se disponíveis = 0, bloquear cadastro e explicar lotação
```

Uma resposta de conflito (placa com alocação ativa) deve manter o formulário e informar o motivo sem expor detalhes técnicos.

## 4. Modelo de estado

Estado local da página é suficiente para seleção e formulário. Dados persistentes vêm da API/cache existente.

```text
clientJourney: selectedPlan, selectedVehicle, paymentAttemptId
attendantView: unitScope, vehicleForm
serverData: plans, contracts, surcharge, occupancy, allocations
```

Não centralizar toda a aplicação em um novo store. Usar o padrão de cache/invalidação já existente. Após criação de alocação, invalidar/refazer consulta de ocupação e de alocações.

## 5. Integrações e estados

### Pagamento

Estados canônicos conceituais: `PENDING`, `PAID/CONFIRMED`, `FAILED`, `EXPIRED`, `CANCELLED`. Mapear apenas os valores reais definidos pela API.

- `PENDING`: impedir nova tentativa com o mesmo contexto; permitir consulta de status.
- `PAID/CONFIRMED`: liberar comprovante.
- `FAILED/EXPIRED`: preservar seleção e permitir nova tentativa conforme regra da API.
- desconhecido: apresentar “em análise” e não afirmar que está pago.

### Ocupação

A UI deve apresentar `occupied`, `available`, `capacity` e `updatedAt` quando fornecidos. A consistência vem da API; uma lista carregada localmente não deve ser usada para deduzir vagas.

## 6. Rotas conceituais

Seguir os nomes e padrão reais do projeto. Possível mapeamento:

```text
/estacionamento/planos
/estacionamento/revisao
/estacionamento/pagamento/:attemptId
/estacionamento/contratacoes
/estacionamento/contratacoes/:id
/atendimento/estacionamento
```

Cada rota operacional deve ter guarda de papel. O backend deve repetir essa validação.

## 7. Tratamento de falhas

| Caso | Comportamento |
|---|---|
| Falha ao carregar planos | feedback não técnico + tentar novamente |
| Plano indisponível | voltar à lista e solicitar nova escolha |
| Valor/regra alterados | exibir dados atuais + nova confirmação |
| Tentativa pendente após reload | consultar status antes de novo pagamento |
| Pagamento recusado/expirado | preservar contexto + nova tentativa |
| Sem vaga | bloquear cadastro + informar lotação |
| Placa duplicada | informar alocação existente sem expor dados de terceiros |
| Falha ao carregar lista | manter página acessível + retry |

## 8. Observabilidade e proteção

Registrar erros técnicos no mecanismo existente com IDs correlacionáveis, sem QR Code, código de pagamento ou dados pessoais em logs de interface. As mutações de pagamento e alocação devem suportar idempotência no contrato; se ainda não suportarem, isso é bloqueio técnico.

## 9. Decisões técnicas em aberto

| ID | Decisão | Bloqueia |
|---|---|---|
| TD-01 | Contratos reais de catálogo, contratação e checkout | cliente |
| TD-02 | Política de idempotência de pagamento | cliente |
| TD-03 | Modelo e gatilho de cobrança de excedente | multa |
| TD-04 | Unidade associada ao atendente | dashboard |
| TD-05 | Registro de saída e atualização de vagas | operação |
| TD-06 | Atualização de ocupação (manual/polling/tempo real) | experiência operacional |

## 10. Validação de design

- Todos os valores de negócio vêm da API.
- Cada papel só acessa sua área.
- Pagamento e cadastro de veículo são idempotentes ou bloqueados por uma dependência explícita.
- Estados de erro, vazio, carregamento e submissão estão previstos.
- A interface é navegável por teclado e responsiva.
