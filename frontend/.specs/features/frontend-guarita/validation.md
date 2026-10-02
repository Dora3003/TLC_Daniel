# Frontend Guarita — Validation

## Validation

**Result:** FAIL

Verificação independente contra `spec.md`, executada em 02/10/2026 ao fim do Execute.
Autor ≠ verificador: a cobertura foi re-derivada do zero com regra de evidência-ou-zero, sem
herdar o modelo mental de quem escreveu as telas.

Testes: 98 passando (`npm test` em `frontend/`). Build: `npm run build` limpo.
Sensor de discriminação: 11 mutantes injetados, **9 mortos, 2 sobreviveram**.

O veredicto é FAIL por causa dos dois mutantes sobreviventes e de uma imprecisão de spec em
PARK-16/PARK-26. Nenhum deles é bug de produção observável hoje — são lacunas de verificação, que é
exatamente o que o Verifier existe para encontrar. As cinco linhas `Implementing` em
`spec.md` refletem este relatório.

---

## Correção de contrato verificada

Até `7f6f607` esta feature chamava `GET /api/planos`, `GET /api/planos/:id` e `GET /api/ocupacao` —
três rotas que não existem no backend. Confirmado contra a API em produção: `GET /api/planos` e
`GET /api/ocupacao` devolvem `405 METODO_NAO_PERMITIDO`, enquanto `GET /api/health` e
`GET /api/ativos` devolvem `200`.

O commit `7f6f607` eliminou as três chamadas fantasma. Hoje o frontend chama apenas
`/api/tickets/:token`, `/api/tickets/:token/pagamentos`, `/api/tickets/:token/multas`,
`/api/entrada`, `/api/saida`, `/api/ativos` e `/api/historico/:placa` — todas existentes.
Verificado por inspeção exaustiva das chamadas em `frontend/src`.

A substituição, porém, trocou endpoint inexistente por dado local, o que gerou a dívida cobrada
abaixo. O problema mudou de lugar; não desapareceu.

---

## Per-AC evidence

| Req | Spec outcome | Evidence |
| --- | ------------ | -------- |
| PARK-01 | Tabela de referência derivada de AD-004 | `src/planos/tabela-valores.test.ts:6` tarifa de R$ 5,00/h |
| PARK-02 | Nome, validade, preço e regras sem recalcular | `src/qualidade/requisitos.test.ts:59` |
| PARK-03 | Só avança com plano disponível | `src/qualidade/requisitos.test.ts:53` `podeAvancar` |
| PARK-04 | Revisão antes do pagamento | `src/qualidade/requisitos.test.ts:59` `decidirRevisao` |
| PARK-05 | Confirma só com status `pago` | `src/qualidade/requisitos.test.ts:65` recusa status em análise |
| PARK-06 | Comprovante com identificador e validade oficiais | `src/qualidade/requisitos.test.ts:96` |
| PARK-07 | Falha não confirma a contratação | `src/qualidade/requisitos.test.ts:103` |
| PARK-08 | Segunda submissão bloqueada | `src/qualidade/requisitos.test.ts:116` `reservarEnvio` |
| PARK-09 | Fora de escopo (AD-009) — sem QR de cobrança na API | `src/qualidade/requisitos.test.ts:124` cobre apenas a ausência |
| PARK-10 | Lista vazia sem pagamento confirmado | `src/qualidade/requisitos.test.ts:129` |
| PARK-11 | Multa só com status e valor oficiais | `src/qualidade/requisitos.test.ts:133` |
| PARK-12 | `POST .../multas` uma única vez | `src/qualidade/requisitos.test.ts:140` |
| PARK-13 | Só quita com status `pago` | `src/qualidade/requisitos.test.ts:140`; mutante `pagamentoConfirmado -> true` morto |
| PARK-14 | Comprovante identifica placa, valor e status | `src/qualidade/requisitos.test.ts:171` |
| PARK-15 | Ação oculta sem `multa_pendente` | `src/qualidade/requisitos.test.ts:133` |
| PARK-16 | Ocupação oficial da API | **Parcial** — `src/api/atendente.ts:26` deriva `ocupadas` de `/api/ativos` (oficial), mas `src/api/atendente.ts:29` injeta `CAPACIDADE_PATIO` local |
| PARK-17 | Atualização por ação explícita | `src/qualidade/requisitos.test.ts:188` consulta seguinte substitui indicadores |
| PARK-18 | Entrada apenas em `/api/entrada` | `src/api/integracao.test.ts:143` |
| PARK-19 | Confirmação com `id`, placa e data da resposta | `src/atendimento/entrada.test.ts:13`; mutante `confirmacaoDaEntrada -> null` morto |
| PARK-20 | Lista com token, placa e data; aceita vazio | `src/qualidade/requisitos.test.ts:210`, `src/api/integracao.test.ts:180` |
| PARK-21 | `409 PLACA_JA_ATIVA` preserva mensagem e não confirma | `src/qualidade/requisitos.test.ts:220` |
| PARK-22 | Bloqueia cadastro com zero vagas | **Parcial** — `src/atendimento/entrada.test.ts:6` prova a regra, mas o zero vem de `calcularDisponiveis`, não da API |
| PARK-23 | Cliente e atendente separados | **Parcial** — `src/auth/acesso.test.ts:18` cobre o caminho de sessão; o caminho de token na URL não tem teste (mutante sobreviveu) |
| PARK-24 | Mensagem recuperável sem detalhe técnico | `src/qualidade/requisitos.test.ts:245`, `src/api/integracao.test.ts:121` |
| PARK-25 | `aria-current`, `role="alert"`, foco | **Parcial** — `src/atendimento/acessibilidade.test.ts` inspeciona texto do fonte, não comportamento (mutante sobreviveu) |
| PARK-26 | API como fonte de verdade | **Parcial** — valor, status e janela respeitam a API; preço de referência e capacidade são locais |
| PARK-27 | Relê o ticket antes de novo pagamento | `src/qualidade/requisitos.test.ts:255` |
| PARK-28 | Saída em `/api/saida` com bloqueios | `src/api/integracao.test.ts:195`, `src/atendimento/saida.test.ts:6`, `src/api/integracao.test.ts:96` preserva `valorMulta` do 409 |
| PARK-29 | Histórico pela placa informada | `src/api/integracao.test.ts:188` |

---

## Sensor

Mutantes injetados numa cópia isolada em `/tmp` (nunca `git stash`); árvore real conferida
inalterada depois, 98 testes passando no baseline.

| Mutante | Arquivo | Resultado |
| ------- | ------- | --------- |
| Tarifa de 1h: `5` → `7` | `src/planos/tabela-valores.ts` | morto |
| `CAPACIDADE_PATIO`: `20` → `999` | `src/atendimento/capacidade.ts` | morto |
| `calcularDisponiveis` → `0` | `src/atendimento/capacidade.ts` | morto |
| `patioLotado` → sempre `false` | `src/atendimento/entrada.ts` | morto |
| `pagamentoConfirmado` → sempre `true` | `src/planos/pagamento.ts` | morto |
| `confirmacaoDaEntrada` → sempre `null` | `src/atendimento/entrada.ts` | morto |
| `qrEhImagem` → sempre `true` | `src/planos/pagamento.ts` | morto |
| Atendente ganha acesso ao pagamento do cliente | `src/auth/acesso.ts` | morto |
| Token inválido passa a ser aceito | `src/auth/acesso.ts` | morto |
| **Cliente com token na URL ganha o painel operacional** | `src/auth/acesso.ts:70` | **SOBREVIVEU** |
| **`aria-current` nunca marca a página atual** | `src/rotas/navegacao.tsx:42` | **SOBREVIVEU** |

---

## Ranked gaps

### G1 — PARK-23: o caminho de token na URL não é verificado (alta)

`decidirAcesso` tem dois caminhos independentes para negar a área do atendente a um cliente: o de
sessão (`src/auth/acesso.ts:77`) e o de token vindo na URL (`src/auth/acesso.ts:70`). Apenas o
primeiro tem teste — `src/auth/acesso.test.ts:18` chama
`decidirAcesso('/atendimento', '', cliente)`. Trocar a negação da linha 70 por um `permitir` mantém
os 98 testes verdes.

Consequência: um link `/atendimento?token=U3T98LX` é uma fronteira de autorização sem rede de
proteção. O código hoje está correto; o teste que impede a regressão não existe.

**Correção**: adicionar `decidirAcesso('/atendimento', '?token=U3T98LX', null)` esperando
`permitido: false` e `motivo: 'cliente_sem_acesso_operacional'`.

### G2 — PARK-25: acessibilidade testada por inspeção de texto (alta)

`src/atendimento/acessibilidade.test.ts` lê arquivos `.tsx` com `readFileSync` e faz regex em cima
do código-fonte (doze ocorrências). Isso prova que a string existe, não que o comportamento
acontece. Trocar `aria-current={atual ? 'page' : undefined}` por `aria-current={undefined}` em
`src/rotas/navegacao.tsx:42` mantém o literal `aria-current` no arquivo, então o regex continua
passando e os 98 testes seguem verdes — embora nenhum item de navegação seja mais anunciado como
página atual.

Este é o caso mais claro de teste que espelha a implementação em vez de afirmar o resultado da
spec, o que o contrato de execução do TLC proíbe explicitamente.

**Correção**: ou introduzir um runner de DOM e asseverar o atributo renderizado, ou extrair a
decisão para uma função pura (`ehPaginaAtual(href, pathname)`) e testá-la por comportamento.

### G3 — PARK-16 e PARK-26: o teste afirma um contrato que não existe (média)

`src/atendimento/vagas.test.ts:6` chama-se "deve exibir ocupadas, capacidade e disponíveis **como a
API enviou**" e alimenta `indicadoresOficiais({ ocupadas: 2, capacidade: 10, disponiveis: 3 })`.
A API nunca envia `capacidade` nem `disponiveis`. No caminho real, `src/api/atendente.ts:29` injeta
`CAPACIDADE_PATIO = 20` e `calcularDisponiveis(ocupadas)` antes de a função ser chamada.

O teste passa porque a função é um repasse puro; o fixture inventa o contrato. É uma imprecisão de
spec, não um bug: a spec reescrita agora declara a constante local como AD-015 e PARK-16 como
`Implementing`.

**Correção**: renomear o teste para refletir que o dado é local e cobrir `obterOcupacao` provando
que `ocupadas` vem do tamanho de `/api/ativos` enquanto `capacidade` é configuração.

### G4 — PARK-01 e PARK-26: tabela de valores local (média)

`src/planos/tabela-valores.ts` deriva 5/10/15/20/25 de AD-004 no cliente. É honesto quanto à
origem e está comentado, mas contradiz PARK-26 na letra. Registrado como AD-014 e marcado
`Implementing`. Sai da dívida quando o backend expuser a tarifa.

### G5 — PARK-09 permanece fora de escopo (baixa)

Não existe QR nem código de cobrança no contrato (AD-009). O teste em
`src/qualidade/requisitos.test.ts:124` cobre apenas o comportamento na ausência desses dados. Fica
`Pending` em `spec.md`, por decisão, não por esquecimento.

---

## Diff range

Feature entregue entre `112f1be` (27/09/2026) e `7f6f607` (02/10/2026) em `main`.

## Fix → re-verify

Ciclo de correção limitado a 3 iterações antes de escalar, conforme o TLC. G1 e G2 são as únicas
que bloqueiam um veredicto PASS; G3 a G5 são dívida declarada e rastreada em `spec.md`.
