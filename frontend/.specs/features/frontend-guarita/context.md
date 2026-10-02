# Context — Plataforma de Estacionamento

## 1. Propósito

Este documento orienta a implementação de `spec.md`. As decisões de solução ficam em `design.md`; a sequência executável fica em `tasks.md`.

A referência visual é o contrato de cor e de estrutura. Os dois produtos são:

- Aplicação **cliente**: login por token, aba Tabela de valores e aba Pagamento, no cartão rosa estreito.
- Painel **atendente**: login por e-mail e senha, e em seguida uma única tela com vagas, cadastro e lista.

Preços, placas, nomes e QR Codes desenhados no protótipo não são dados. A estrutura da tela e a paleta da seção 11 de `design.md` devem ser seguidas.

## 2. Perfis e limite de acesso

| Perfil | Pode acessar |
|---|---|
| Cliente | login em `/` com o token do ticket; tabela de valores, revisão, pagamento e cobrança adicional do próprio ticket |
| Atendente | login em `/atendimento` com e-mail e senha; ocupação, cadastro de entrada e lista de veículos alocados |

O campo Token do protótipo é a entrada do cliente: o mesmo token de 7 caracteres do ticket, enviado como `/?token=`. Não criar outro identificador. O e-mail e a senha existem só na casca do atendente, porque a API não tem usuário nem JWT.

## 3. Fonte de verdade

| Dado | Fonte oficial |
|---|---|
| Valor da estadia, status e multa do ticket | `GET /api/tickets/:token`, pagamentos/multas |
| Tabela de valores (referência por hora) | Catálogo local AD-004 (`tabela-valores.ts`), não `/api/planos` |
| Meio de pagamento, QR Code e status | API de pagamento/checkout |
| Excedente e valor da cobrança adicional | backend de estacionamento/faturamento |
| Ocupadas no pátio | `GET /api/ativos` (contagem) |
| Capacidade/disponíveis (painel) | `CAPACIDADE_PATIO` no front até contrato de lotação |
| Veículos alocados | `GET /api/ativos`; identificador na UI = `token` |
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

- Não hardcodar QR Codes, códigos Pix, placas ou multas. A tarifa por hora na tabela informativa segue AD-004; capacidade do pátio é parâmetro documentado (FE-DEC-09).
- Montar as telas na paleta e na estrutura da seção 11 de `design.md`: faixa rosa, fundo creme, cartão rosa-claro, sem o tema roxo ou escuro do scaffold.
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

Os itens 1 e 5 estão decididos pela estrutura visual. Os demais continuam pendentes até o contrato da API.

1. O token do protótipo é o identificador do ticket e também a credencial da área do cliente. O código copiável do pagamento só aparece se a API o devolver.
2. A placa é obrigatória para contratar um plano e pagar excedente?
3. Há uma ou várias unidades? Como o atendente é associado a uma unidade?
4. Como a saída do veículo é registrada e quando o excedente é calculado?
5. A tela de pagamento tem o botão “Gerar QR Code”, mas a imagem e o código só são renderizados com o que a API devolver. Não desenhar um Pix local.
6. Atualização de vagas será manual, polling ou tempo real?

Enquanto uma decisão bloquear uma integração, registrar a pendência no `tasks.md` em vez de assumir comportamento.
