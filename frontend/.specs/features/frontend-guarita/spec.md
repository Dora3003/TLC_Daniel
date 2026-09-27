# Spec — Plataforma de Estacionamento

## 1. Visão do produto

A plataforma AutoPark possui duas jornadas autenticadas e independentes:

- **Cliente:** consulta planos, escolhe um período de permanência, realiza o pagamento e consulta seu comprovante; se ultrapassar o limite contratado, consulta e paga a cobrança adicional.
- **Atendente:** acompanha a ocupação do estacionamento, registra a entrada de veículos e consulta os veículos atualmente alocados.

A interface não calcula valores, disponibilidade, vencimentos ou multas. A API é a fonte de verdade para essas informações.

## 2. Objetivos

1. Permitir que o cliente escolha e pague um plano de estacionamento: **1 hora, 5 horas, diária ou mensal**.
2. Exibir ao cliente apenas valores e regras retornados pelo backend antes da confirmação do pagamento.
3. Permitir pagamento de uma cobrança adicional quando houver tempo excedente.
4. Permitir que o atendente acompanhe vagas ocupadas/disponíveis, cadastre um veículo e consulte veículos alocados.
5. Evitar duplicidade em registro de veículo e criação de pagamentos.

## 3. Fora de escopo

- Controle físico de cancela, leitura automática de placa ou hardware.
- Criação administrativa de planos, preços, capacidade ou regras de multa.
- Cálculo de tarifa, tempo excedente ou multa no frontend.
- Estorno, cancelamento, renovação automática de plano mensal e conciliação financeira.
- Reserva de vaga específica.

## 4. Premissas e decisões pendentes

| ID | Decisão pendente | Impacto |
|---|---|---|
| DEC-01 | O cliente informa placa antes, durante ou depois de selecionar o plano? | vínculo plano–veículo |
| DEC-02 | Quais meios/provedor de pagamento serão usados? | checkout e QR Code |
| DEC-03 | Qual é a regra de início e término para 1h, 5h, diária e mensal? | validade e excedente |
| DEC-04 | Como o backend identifica uma permanência excedida? | criação da cobrança adicional |
| DEC-05 | A diária tem duração fixa ou encerra em horário definido? | copy e prazo |
| DEC-06 | O atendente pode registrar saída ou só entrada? | escopo operacional |
| DEC-07 | Quais papéis podem acessar o painel do atendente? | autorização |

Os valores exibidos no protótipo (por exemplo, R$ 20,00) são apenas referência visual até confirmação da API.

## 5. Requisitos funcionais

### Cliente — planos e pagamento

- **PARK-01** — O sistema deve apresentar os planos ativos retornados pela API: 1h, 5h, diária e mensal, quando disponíveis.
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

- **PARK-16** — Usuários com perfil de atendente devem visualizar a quantidade de vagas ocupadas, disponíveis e a capacidade total retornadas pela API.
- **PARK-17** — O painel do atendente deve atualizar os indicadores a partir da fonte oficial; a estratégia de atualização (manual, polling ou tempo real) deve ser definida em DEC-06/contrato técnico.
- **PARK-18** — O atendente deve poder cadastrar a entrada de um veículo informando placa válida e os dados obrigatórios definidos pela API.
- **PARK-19** — Após registrar a entrada, o sistema deve apresentar confirmação com placa, identificador da alocação e data/hora retornados pela API.
- **PARK-20** — O painel deve listar veículos atualmente alocados com identificador, placa e data/hora de alocação.
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
