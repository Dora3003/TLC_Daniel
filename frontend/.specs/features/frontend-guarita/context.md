# Context — Plataforma de Estacionamento

## 1. Propósito

Este documento orienta a implementação de `spec.md`. As decisões de solução ficam em `design.md`; a sequência executável fica em `tasks.md`.

A referência visual fornecida apresenta dois produtos:

- Aplicação **cliente**: seleção de período, pagamento via QR Code/código e pagamento de multa.
- Painel **atendente**: login, indicadores de vagas, cadastro de veículo e lista de veículos alocados.

O protótipo é referência visual, não contrato de negócio. Preços, exemplos de placas, nomes e QR Codes nele exibidos não devem ser reaproveitados como dados reais.

## 2. Perfis e limite de acesso

| Perfil | Pode acessar |
|---|---|
| Cliente | planos, revisão, pagamento, comprovantes, contratos e cobrança adicional própria |
| Atendente | ocupação, cadastro de entrada e lista de veículos alocados na unidade autorizada |

Autenticação e autorização devem reutilizar os mecanismos do projeto. Nunca criar um login paralelo só porque o protótipo contém um campo de token.

## 3. Fonte de verdade

| Dado | Fonte oficial |
|---|---|
| Planos, preços, validade e disponibilidade | API de catálogo/estacionamento |
| Meio de pagamento, QR Code e status | API de pagamento/checkout |
| Excedente e valor da cobrança adicional | backend de estacionamento/faturamento |
| Ocupação e veículos alocados | API operacional |
| Sessão e papéis | autenticação/autorização existente |

O frontend pode reter seleção e identificador de tentativa temporariamente, mas não pode calcular tarifa/multa, inferir pagamento ou decidir disponibilidade.

## 4. Descoberta obrigatória no projeto

Antes de codificar, localizar e reutilizar:

- rotas e proteção por papel;
- autenticação e obtenção do usuário atual;
- cliente HTTP, tratamento global de erros e observabilidade;
- componentes de formulário, tabela, card, modal, loading, feedback e cópia;
- padrão de estado, cache e invalidação;
- framework, mocks e convenções de teste;
- contratos/DTOs existentes para veículo, alocação, pagamento e ocupação.

Não criar endpoints, campos de payload, regras comerciais ou uma nova biblioteca de estado sem necessidade comprovada.

## 5. Contratos mínimos a confirmar

### Catálogo e contratação

- plano: `id`, nome, tipo, preço, moeda, validade/duração, disponibilidade e regras;
- contratação: identificador, plano, veículo quando aplicável, status, início e término;
- pagamento: ID de tentativa, status, QR Code ou código copiável quando aplicável;
- cobrança adicional: ID, motivo, duração excedida, valor, status e instrução de pagamento.

### Operação do atendente

- ocupação: capacidade total, ocupadas, disponíveis e instante de atualização;
- entrada/alocação: ID, placa, unidade, data/hora, status;
- lista paginada/filtrável de alocações ativas, conforme contrato.

Os nomes acima são conceituais. Usar apenas os nomes reais do contrato.

## 6. Regras de implementação

- Não hardcodar preços, QR Codes, códigos Pix, vagas, placas, multas ou horários.
- Não expor payload, stack trace, IDs sensíveis ou mensagens HTTP ao usuário.
- Desabilitar ações em submissão, mas usar idempotência da API quando disponível.
- Em retorno ambíguo ou recarregamento, consultar a tentativa existente; nunca criar novo pagamento automaticamente.
- Validar dados de formulário no cliente apenas para experiência; o backend continua responsável pela validação final.
- Formatar placa e moeda conforme padrão do projeto, sem alterar o valor enviado ao backend sem contrato.

## 7. Estados esperados

Cada tela deve prever: `loading`, `empty`, `error`, `ready` e `submitting` quando houver mutação.

Exemplos:

- Catálogo vazio: “Não há planos disponíveis no momento.”
- Ocupação indisponível: “Não foi possível atualizar as vagas. Tente novamente.”
- Lotação: “Não há vagas disponíveis para registrar uma nova entrada.”
- Placa duplicada: “Este veículo já possui uma alocação ativa.”
- Pagamento pendente: “Aguardando confirmação do pagamento.”

## 8. Segurança e acessibilidade

- Aplicar autorização no cliente somente como experiência; a API deve impor a permissão.
- Não armazenar QR Codes/códigos de pagamento além do necessário para a jornada.
- Usar componentes semânticos, foco visível e mensagens anunciáveis.
- Não usar somente cor para status de pagamento, lotação ou erro.

## 9. Conflitos a resolver antes de implementar

1. O “token” do protótipo é login, identificador de ticket ou código de pagamento?
2. A placa é obrigatória para contratar um plano e pagar excedente?
3. Há uma ou várias unidades? Como o atendente é associado a uma unidade?
4. Como a saída do veículo é registrada e quando o excedente é calculado?
5. Pagamento por QR Code é Pix, outro método ou apenas representação visual?
6. Atualização de vagas será manual, polling ou tempo real?

Enquanto uma decisão bloquear uma integração, registrar a pendência no `tasks.md` em vez de assumir comportamento.
