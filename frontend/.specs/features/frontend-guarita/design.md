# Design — Plataforma de Estacionamento

## 1. Arquitetura funcional

A solução tem duas cascas visuais, separadas por papel. Cor, faixa, cartão e abas estão na seção 11.

```text
Cliente (coluna estreita)
  /  Login por token
  /cliente/planos       Tabela de valores
  /cliente/pagamento    Pagamento
                          -> Gerar QR Code
                          -> Gerar QR Code Multa (somente se a API indicar)

Atendente (painel largo)
  /atendimento          Login por e-mail e senha, se não houver sessão
  /atendimento          Olá + Sair
                          Vagas | Cadastrar Veículo
                          Veículos Alocados
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

Rotas reais da interface:

```text
/                      login do cliente (token do ticket)
/cliente/planos        tabela de valores
/cliente/revisao       revisão, dentro da mesma coluna, sem aba própria
/cliente/pagamento     pagamento da estadia e, se houver, da multa
/atendimento           login do atendente ou painel único
```

`/cliente/comprovante`, `/cliente/contratacoes` e `/cliente/multa` continuam acessíveis pela jornada, mas não ganham item na navegação. A navegação visível do cliente tem só **Tabela de valores** e **Pagamento**.

Cada área exige a sessão correspondente. Cliente com token não abre `/atendimento`. Atendente autenticado não abre o pagamento de um ticket. A API não tem papéis; a separação é da experiência.

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
- A cor e a estrutura seguem a seção 11, e não o tema roxo do scaffold Vite.

## 11. Cor e estrutura visual

Tema claro. Não aplicar `prefers-color-scheme: dark` nem a paleta roxa do template.

| Token CSS | Valor | Onde |
|---|---|---|
| `--rosa` | `#f25497` | Faixa, botão, título do cartão, número da vaga, cabeçalho da tabela |
| `--rosa-claro` | `#fde7f1` | Fundo do cartão |
| `--creme` | `#fff6e4` | `body` e área da página |
| `--text-h` | `#3b2432` | Saudação e títulos |
| `--text` | `#5c4552` | Texto e dicas |

A faixa (`.barra`) ocupa a largura, com “AutoPark” em branco. O cartão (`.cartao`) tem fundo `--rosa-claro`, borda `#f7c3da` e raio de 16px. A marca circular fica no topo do cartão de login e do cartão do cliente. Botão principal: fundo `--rosa`, texto branco, raio de 8px. **Sair** é texto rosa, sem fundo.

Cliente: miolo centralizado, largura máxima de 24rem. Abas em pílula; a aba atual fica rosa com texto branco, a outra fica branca com texto rosa. Linha de plano: pílula branca, texto rosa, nome e validade à esquerda, preço à direita.

Atendente: miolo até 1120px. No painel, a grade é `Vagas` e `Cadastrar Veículo` lado a lado; abaixo de 40rem, uma coluna. Os números de ocupadas e disponíveis são grandes e rosa. A tabela de alocados tem cabeçalho rosa com texto branco e linhas alternadas `#ffffff` e `#fff0f6`. As colunas visíveis são ID, Placa e Data de Alocação.
