# Gestão do Grupo por Demandas

> **Consolidado em 02/10/2026** a partir da autoria dos commits do repositório. Cada linha
> corresponde a um ou mais commits verificáveis, com data e autor conferidos em `git log`, e a
> coluna *Demanda realizada* descreve o que o commit efetivamente alterou.
>
> *Carga de trabalho* e *Complexidade* seguem os critérios declarados abaixo e devem ser revisadas
> pelos integrantes: volume de código é um proxy de esforço, não uma medida dele.

## Critérios aplicados

**Carga de trabalho** (volume e extensão da tarefa):

- **Baixa** — alteração pontual, até cerca de 100 linhas ou poucos arquivos.
- **Média** — entre cerca de 100 e 600 linhas, ou tarefa com múltiplas etapas e revisão.
- **Alta** — acima de cerca de 600 linhas, ou integração de várias partes do sistema.

**Complexidade** (natureza da decisão exigida):

- **Baixa** — procedimento conhecido, repetitivo ou diretamente orientado.
- **Média** — exige análise, adaptação de código existente ou decisão metodológica.
- **Alta** — exige pesquisa, solução de problema novo ou decisão técnica relevante.

As duas colunas são independentes: remover o diretório `__MACOSX` mexeu em 580 arquivos (carga
alta) mas era uma exclusão mecânica (complexidade baixa). Estender o schema com o token do ticket
mexeu em 48 linhas (carga baixa) mas definiu a máquina de estados do pagamento (complexidade
média).

## Integrantes

| Nome | Identidade nos commits | Frente principal |
| ---- | ---------------------- | ---------------- |
| Isadora Jardim | `Isadora Jardim`, `Dora3003` | Repositório e estrutura inicial |
| João Camargo | `devcamargo01` | Persistência de dados |
| Gustavo Galdino | `Gustavo Galdino` | Backend API e aderência ao TLC |
| Gustavo De Longhi | `Gustavo De Longhi`, `ghuspace` | Infraestrutura e deploy |
| Heloísa Machado | `heloisa-machado` | Frontend das duas jornadas |

## Registro de demandas

| Data | Integrante | Demanda realizada | Carga de trabalho | Complexidade | Status |
| ---- | ---------- | ----------------- | ----------------- | ------------ | ------ |
| 31/08 | Isadora Jardim | Criar o repositório e o commit inicial | Baixa | Baixa | Concluída |
| 11/09 | João Camargo | Modelar o schema PostgreSQL, a camada de repositório e a estrutura de specs TLC por domínio (25 arquivos, 2.232 linhas) | Alta | Alta | Concluída |
| 11/09 | Isadora Jardim | Publicar a estrutura inicial do projeto no repositório (581 arquivos, incluindo o resíduo `__MACOSX` do zip) | Alta | Baixa | Concluída |
| 24/09 | Gustavo Galdino | Especificar a feature `backend-api` no formato TLC: 29 requisitos em EARS, premissas resolvidas, rastreabilidade e matriz de tarefas | Média | Alta | Concluída |
| 24/09 | Gustavo Galdino | Estender o schema com o token do ticket e os estados `pago` e `multa_pendente` | Baixa | Média | Concluída |
| 24/09 | Gustavo Galdino | Implementar a API Express completa — domínio, repositório, serviço e rotas — com 30 testes (17 arquivos, 2.557 linhas) | Alta | Alta | Concluída |
| 25/09 | Gustavo Galdino | Documentar os endpoints em OpenAPI com Swagger UI e criar o build de container do backend | Média | Média | Concluída |
| 25/09 | Gustavo De Longhi | Remover o diretório residual `__MACOSX` do repositório (580 arquivos) | Alta | Baixa | Concluída |
| 27/09 | Heloísa Machado | Fazer o setup do frontend e a descoberta de contrato da API (T-001 e T-002), registrando que catálogo de planos, checkout e lotação não existem no backend | Alta | Alta | Concluída |
| 01/10 | Heloísa Machado | Atualizar `spec.md`, `design.md` e `tasks.md` da feature `frontend-guarita` | Média | Média | Concluída |
| 01/10 | Heloísa Machado | Criar o build Docker e a configuração nginx do frontend | Baixa | Baixa | Concluída |
| 01/10 | Heloísa Machado | Implementar o cliente HTTP com tradução do corpo de erro padrão e os tipos do contrato | Média | Média | Concluída |
| 01/10 | Heloísa Machado | Implementar normalização de token, sessão e autorização por área | Média | Alta | Concluída |
| 01/10 | Heloísa Machado | Implementar as telas do atendente: cadastro de entrada, indicadores de vagas e lista de alocações | Média | Média | Concluída |
| 01/10 | Heloísa Machado | Implementar o fluxo de pagamento da estadia e da multa do cliente (15 arquivos, 1.079 linhas) | Alta | Alta | Concluída |
| 01/10 | Heloísa Machado | Conectar rotas, páginas e configuração do app nas duas jornadas | Alta | Média | Concluída |
| 01/10 | Heloísa Machado | Escrever a suíte de rastreabilidade com um caso nomeado por requisito PARK-xx | Média | Média | Concluída |
| 01/10 | Gustavo De Longhi | Configurar o deploy no Render, migrar o banco para Aiven PostgreSQL e ajustar o SSL da conexão (seis commits de correção sucessiva) | Alta | Alta | Concluída |
| 01/10 | Heloísa Machado | Corrigir a URL do backend usada pelo frontend em produção | Baixa | Baixa | Concluída |
| 02/10 | Heloísa Machado | Corrigir o desvio de contrato: remover as chamadas a `/api/planos` e `/api/ocupacao`, substituir por tabela de valores local e contagem de `/api/ativos`, e adicionar o fluxo de saída pela catraca (26 arquivos) | Alta | Alta | Concluída |
| 02/10 | Gustavo Galdino | Auditar a aderência ao TLC: executar os validadores oficiais da skill, as duas suítes de teste e um sensor de discriminação com 11 mutantes injetados | Alta | Alta | Concluída |
| 02/10 | Gustavo Galdino | Versionar os validadores da skill em `.specs/_tlc/` e remover a linha do `.gitignore` que os excluía | Baixa | Média | Concluída |
| 02/10 | Gustavo Galdino | Reescrever `spec.md` e `tasks.md` do frontend no formato TLC até zerar os dois gates estruturais | Alta | Alta | Concluída |
| 02/10 | Gustavo Galdino | Registrar a verificação independente em `validation.md`: veredicto FAIL, evidência `file:line` por requisito e cinco lacunas ranqueadas | Média | Alta | Concluída |
| 02/10 | Gustavo Galdino | Destilar as cinco lições em `LESSONS.md` e reconciliar o `STATE.md` com o estado real do git | Média | Média | Concluída |
| — | Heloísa Machado | Fechar a lacuna G1: teste de negação de acesso para `/atendimento?token=` em `src/auth/acesso.test.ts` | Baixa | Média | A fazer |
| — | a definir | Fechar a lacuna G2: verificar `aria-current` por comportamento, extraindo `ehPaginaAtual` como função pura ou adotando runner de DOM | Média | Alta | A fazer |
| — | João Camargo | Escrever o `validation.md` da feature `persistencia-dados`, que segue sem veredicto desde 11/09 | Média | Média | A fazer |
| — | a definir | Preparar o material da apresentação a partir da auditoria de aderência ao TLC | Alta | Média | Em andamento |

## Distribuição do trabalho

| Integrante | Demandas concluídas | Frente |
| ---------- | ------------------- | ------ |
| Heloísa Machado | 11 | Frontend completo, descoberta de contrato e correção do desvio |
| Gustavo Galdino | 8 | Backend API, especificação TLC e auditoria de aderência |
| Gustavo De Longhi | 2 | Deploy, banco hospedado e limpeza de resíduo |
| Isadora Jardim | 2 | Repositório e estrutura inicial |
| João Camargo | 1 | Persistência, schema e estrutura de specs |

Observação honesta para a análise crítica: a distribuição é desigual e concentrada em dois
integrantes, e 18 dos 31 commits caem em 01/10. Isso é visível no histórico e é melhor explicado
pelo grupo do que descoberto pelo avaliador.
