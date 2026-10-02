# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Quando a descoberta registrar que um endpoint nao existe, tratar como bloqueio de tarefa: nao marcar tarefa concluida contra rota que a fase anterior declarou inexistente.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `frontend/src/api` · harmful: 0
- features: frontend-guarita
- evidence: tasks.md T-001 vs T-005 (frontend/src/api)
- last seen: 2026-10-02T11:59:42Z

### L-002 - Cobrir cada caminho de negacao de autorizacao separadamente: sessao e token na URL sao ramos independentes e testar o primeiro nao protege o segundo.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `frontend/src/auth` · harmful: 0
- features: frontend-guarita
- evidence: src/auth/acesso.ts:70 (frontend/src/auth)
- last seen: 2026-10-02T11:59:42Z

### L-003 - Nunca afirmar acessibilidade com regex sobre o codigo-fonte: o literal sobrevive a remocao do comportamento; extraia a decisao para funcao pura ou use runner de DOM.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `frontend/src` · harmful: 0
- features: frontend-guarita
- evidence: src/rotas/navegacao.tsx:42 (frontend/src)
- last seen: 2026-10-02T11:59:42Z

### L-004 - Nao inventar campo em fixture: se o nome do teste diz que o dado vem da API, o payload do fixture precisa existir no contrato real.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `frontend/src/atendimento` · harmful: 0
- features: frontend-guarita
- evidence: src/atendimento/vagas.test.ts:6 (frontend/src/atendimento)
- last seen: 2026-10-02T11:59:42Z

### L-005 - Rodar o Verifier como passo de fechamento do Execute, nao no fim do projeto: sem validation.md a feature nao tem veredicto e o gate de conclusao reprova.
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `.specs` · harmful: 0
- features: frontend-guarita
- evidence: validate_state.py frontend-guarita (.specs)
- last seen: 2026-10-02T11:59:42Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
