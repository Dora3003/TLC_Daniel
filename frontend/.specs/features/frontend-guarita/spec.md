# Spec — Plataforma de Estacionamento

## 1. Visão do produto

A plataforma AutoPark possui duas jornadas autenticadas e independentes, no visual rosa e creme descrito na seção 8:

- **Cliente:** entra com o token do ticket, consulta a **tabela de valores informativa** (tarifa AD-004), paga a estadia e, quando houver multa pendente no ticket, paga a cobrança adicional.
- **Atendente:** entra com e-mail e senha, vê vagas ocupadas e disponíveis, **cadastra entrada ou registra saída por token**, e consulta veículos alocados (com busca local) na mesma tela.

A interface não calcula valores, disponibilidade, vencimentos ou multas. A API é a fonte de verdade para essas informações.

## 2. Objetivos

1. Permitir que o cliente consulte a tarifa (**R$ 5,00/h, mínimo 1 hora**) e pague a **estadia do ticket** (não há contratação de plano mensal/diária na API).
2. Exibir ao cliente valores oficiais do ticket antes do pagamento; a tabela por hora é referência visual alinhada à AD-004.
3. Permitir pagamento de uma cobrança adicional quando houver tempo excedente.
4. Permitir que o atendente acompanhe vagas ocupadas/disponíveis, cadastre um veículo e consulte veículos alocados.
5. Evitar duplicidade em registro de veículo e criação de pagamentos.

## 3. Fora de escopo

- Controle físico de cancela, leitura automática de placa ou hardware.
- Criação administrativa de planos, preços, capacidade ou regras de multa.
- Cálculo de tarifa, tempo excedente ou multa no frontend.
- Estorno, cancelamento, renovação automática de plano mensal e conciliação financeira.
- Reserva de vaga específica.

## 4. Premissas e decisões

| ID | Decisão | Status |
|---|---|---|
| DEC-01 | Placa vem do ticket; cliente não cadastra veículo. | Fechada |
| DEC-02 | Pagamento simulado (AD-009); QR/código só se o backend devolver. | Fechada |
| DEC-03 | Tarifa por hora (AD-004); sem planos contratáveis na API. Tabela informativa no front (FE-DEC-08). | Fechada |
| DEC-04 | Multa após janela de saída (`POST /api/saida`). | Fechada |
| DEC-05 | Diária/mensal fora do MVP da API. | N/A |
| DEC-06 | Saída via `POST /api/saida`; painel atendente inclui aba de saída assistida (FE-DEC-12). | Fechada |
| DEC-07 | Sem JWT no backend; separação cliente/atendente na experiência. | Fechada |
| FE-DEC-09 | Capacidade do pátio = 20 no painel até a API informar lotação. | Ativa |
| FE-DEC-11 | Identificador na lista = token de 7 caracteres. | Ativa |

Detalhes e rastreio: `tasks.md` (registro 2026-10-02).

## 5. Requisitos funcionais

### Cliente — planos e pagamento

- **PARK-01** — O sistema deve apresentar a tabela de valores (períodos por hora com preço de referência AD-004) e o valor atual da estadia do ticket.
- **PARK-02** — Cada plano deve exibir nome, duração/regra de validade, preço em BRL e condições fornecidas pela API.
- **PARK-03** — O cliente deve conseguir selecionar um único plano disponível e avançar para a revisão.
- **PARK-04** — A revisão deve apresentar placa (quando aplicável), plano, preço, validade e regras antes de iniciar o pagamento.
- **PARK-05** — Ao confirmar, o sistema deve criar uma tentativa de pagamento uma única vez e indicar processamento até receber o resultado.
- **PARK-06** — Quando a API confirmar o pagamento, o sistema deve exibir comprovante com identificador, plano, status e período de validade.
- **PARK-07** — Se o pagamento falhar, expirar ou for recusado, o sistema deve preservar a seleção e disponibilizar nova tentativa sem confirmar a contratação.
- **PARK-08** — Enquanto uma tentativa estiver em processamento, o sistema deve bloquear nova submissão da mesma tentativa.
- **PARK-09** — Caso o pagamento exija QR Code/código Pix, a tela deve exibir exclusivamente os dados retornados pelo provedor/API e permitir copiá-los.
- **PARK-10** — O cliente deve conseguir consultar suas contratações e respectivos status posteriormente.

### Cliente — excedente e multa

- **PARK-11** — Quando a API indicar excedente para uma permanência, o sistema deve exibir o tempo excedido, valor da cobrança e regra aplicável retornados pelo backend.
- **PARK-12** — O cliente deve conseguir iniciar e concluir o pagamento da cobrança adicional por excedente.
- **PARK-13** — O sistema não deve considerar a cobrança adicional quitada até receber confirmação da API.
- **PARK-14** — Após pagamento confirmado, o comprovante da cobrança adicional deve identificar a permanência/veículo, valor, status e identificador retornado.
- **PARK-15** — Se não houver excedente, a ação de pagar multa não deve ser apresentada.

### Atendente — operação de vagas e veículos

- **PARK-16** — O atendente deve visualizar vagas ocupadas (contagem oficial do pátio), disponíveis e capacidade total (ocupadas oficiais; capacidade/disponíveis conforme FE-DEC-09 até contrato de lotação).
- **PARK-17** — O painel do atendente deve atualizar os indicadores a partir da fonte oficial; a estratégia de atualização (manual, polling ou tempo real) deve ser definida em DEC-06/contrato técnico.
- **PARK-18** — O atendente deve poder cadastrar a entrada de um veículo informando placa válida e os dados obrigatórios definidos pela API.
- **PARK-19** — Após registrar a entrada, o sistema deve apresentar confirmação com placa, identificador da alocação e data/hora retornados pela API.
- **PARK-20** — O painel deve listar veículos alocados com identificador (token), placa, motorista e data/hora; permitir busca local por nome, token ou placa.
- **PARK-21** — O sistema deve impedir registro duplicado de placa já alocada e apresentar uma mensagem compreensível quando a API recusar a operação.
- **PARK-22** — Se não houver vagas disponíveis, o cadastro de entrada deve ficar indisponível e informar o motivo.

### Qualidade, segurança e recuperação

- **PARK-23** — Fluxos protegidos devem exigir autenticação e autorização compatível com o papel cliente ou atendente.
- **PARK-24** — Estados de carregamento, vazio e erro devem ter mensagens não técnicas e ação de recuperação quando aplicável.
- **PARK-25** — Controles críticos devem ter navegação por teclado, nome acessível e mensagens de erro/status perceptíveis sem depender apenas de cor.
- **PARK-26** — Preço, validade, disponibilidade, ocupação, excedente e status devem sempre refletir a API; dados locais não são fonte oficial.
- **PARK-27** — Após recarregar a página durante um pagamento pendente, o sistema deve consultar o status da tentativa existente antes de permitir um novo pagamento.

## 6. Critérios de aceite por jornada

### Cliente

1. Seleciona um plano ativo, revisa os dados e recebe um meio de pagamento ou confirmação real retornada pela API.
2. Em pagamento confirmado, vê comprovante; em falha, consegue tentar novamente sem duplicidade.
3. Quando houver excedente, vê a cobrança retornada pela API e só a considera quitada após confirmação.

### Atendente

1. Visualiza ocupação e disponibilidade oficiais.
2. Registra um veículo válido quando existe vaga.
3. Vê na lista o veículo recém-alocado com ID, placa e data/hora.
4. Não consegue registrar placa já alocada nem nova entrada quando não há vagas.

## 7. Rastreabilidade inicial

| Grupo | Requisitos |
|---|---|
| Cliente: plano e pagamento | PARK-01 a PARK-10 |
| Cliente: excedente | PARK-11 a PARK-15 |
| Atendente | PARK-16 a PARK-22 |
| Qualidade e continuidade | PARK-23 a PARK-27 |

## 8. Aparência e estrutura

O protótipo define a cor e a organização das telas. Preços, placas, nomes de exemplo e QR Codes desenhados nele não são dados: esses valores continuam vindo da API.

Tema claro, sem modo escuro. Página creme, faixa superior rosa com a marca **AutoPark** em branco, cartões rosa-claro com cantos arredondados e botões rosa com texto branco.

| Token | Uso |
|---|---|
| `#f25497` | Faixa, botão principal, títulos do cartão e números de vagas |
| `#fde7f1` | Fundo do cartão |
| `#fff6e4` | Fundo da página |
| `#3b2432` | Texto de título |
| `#5c4552` | Texto corrente |
| `#ffffff` | Linha de plano, campo e linha par da tabela |

### Cliente

Coluna estreita, no máximo cerca de 24rem, centralizada.

1. **`/` — Login.** Cartão com a marca circular, título AutoPark, texto “Acesse sua conta”, campo **Token**, botão **Entrar** e a dica “Use o token enviado para acessar o painel.” O token tem 7 letras ou números. Um link discreto leva ao acesso do atendente.
2. **`/cliente/planos` — Tabela de valores.** Abas **Tabela de valores** e **Pagamento**. Cartão com marca, subtítulo, regra “R$ 5,00 por hora. Mínimo de 1 hora.”, bloco **Sua estadia** (placa, tempo, valor, status do ticket) e linhas de referência 1h–5h.
3. **`/cliente/pagamento` — Pagamento.** As mesmas abas e o mesmo cabeçalho do cartão. Campo **Token** somente leitura, botão **Gerar QR Code** e a orientação de uso do token. QR e **Copiar código** aparecem só quando a API devolve esses dados. **Gerar QR Code Multa** aparece só quando a API indica cobrança adicional.

A revisão do plano, quando existir, permanece dentro dessa coluna, sem uma terceira aba.

### Atendente

Conteúdo mais largo, até cerca de 1120px.

1. **`/atendimento` sem sessão — Login.** O mesmo cartão rosa, com **E-mail**, **Senha** e **Entrar**.
2. **`/atendimento` com sessão — Painel.** Faixa AutoPark, saudação e **Sair**. Grade: **Vagas** | cartão **Operação** com abas **Cadastrar Veículo** e **Saída de Veículo**. Abaixo, **Veículos Alocados** com campo de busca e colunas Identificador (token), Placa, Motorista, Data.

Em tela estreita, os dois cartões do painel ficam um abaixo do outro.
