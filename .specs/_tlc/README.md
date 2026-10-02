# Validadores TLC Spec-Driven

Cópia local dos scripts determinísticos da skill
[`tlc-spec-driven`](https://github.com/tech-leads-club/agent-skills/tree/main/packages/skills-catalog/skills/(development)/tlc-spec-driven)
(v3.3.0, CC-BY-4.0, Felipe Rodrigues). Versionados no repositório para que os gates sejam
reproduzíveis em qualquer máquina (AD-017).

A ideia do TLC é que os gates estruturais sejam cobrados por código, não por memória do agente.
Exit code diferente de zero significa parar e corrigir.

## Como rodar

Os scripts leem `.specs/` relativo a `--root`. Como o projeto tem specs por domínio (AD-007), o
`--root` muda conforme a feature:

```bash
# Gate de spec — seções obrigatórias, ACs em EARS, premissas resolvidas, IDs bem formados
python3 .specs/_tlc/validate_spec.py backend-api         --root backend
python3 .specs/_tlc/validate_spec.py persistencia-dados  --root backend
python3 .specs/_tlc/validate_spec.py frontend-guarita    --root frontend

# Gate de tasks — granularidade, paridade diagrama/dependências, Tests + Gate por tarefa
python3 .specs/_tlc/validate_tasks.py backend-api        --root backend
python3 .specs/_tlc/validate_tasks.py frontend-guarita   --root frontend

# Gate de conclusão — exige validation.md com veredicto PASS e evidência file:line
python3 .specs/_tlc/validate_state.py backend-api        --root backend
python3 .specs/_tlc/validate_state.py frontend-guarita   --root frontend

# Gate de commit — Conventional Commits
python3 .specs/_tlc/check_commit.py --message "feat(api): expose guard endpoints"

# Camada de lições (gera .specs/LESSONS.md; não editar o .md à mão)
python3 .specs/_tlc/lessons.py --root . status
```

Opcionalmente, `check_commit.py` vira guarda de git, sem depender de nenhum agente:

```bash
ln -s ../../.specs/_tlc/check_commit.py .git/hooks/commit-msg && chmod +x .specs/_tlc/check_commit.py
```

## Estado atual

`validate_state.py frontend-guarita --root frontend` **reprova de propósito**: o veredicto em
`frontend/.specs/features/frontend-guarita/validation.md` é FAIL, com duas lacunas de verificação
ranqueadas (G1 e G2). A feature só volta a PASS quando elas forem fechadas. Ver `.specs/STATE.md`.
