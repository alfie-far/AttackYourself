# Repository guidance

The product goal and longer-term architecture are in
[`docs/PRODUCT-VISION.md`](./docs/PRODUCT-VISION.md). The development lifecycle
principles are in [`docs/SDLC.md`](./docs/SDLC.md). Treat these as intent and
direction; do not describe planned components as implemented. The repository
status and useful commands are summarized in [`README.MD`](./README.MD).

For work under [`AttackYourself/`](./AttackYourself/), also follow its
[`AGENTS.md`](./AttackYourself/AGENTS.md), which contains detailed AgentCore
configuration and infrastructure guidance.

## Architecture and safety

- Keep the model's role separate from the execution boundary: the model may
  propose actions, but only explicitly exposed, narrowly scoped tools may act.
- Do not add generic shell, AWS CLI, or unrestricted AWS SDK access as an
  attack capability. Prefer purpose-built tools with validated inputs and
  least-privilege identities.
- Do not deploy, modify AWS resources, or run adversarial security actions
  against live targets without explicit user authorization and a clearly
  scoped target. Prefer isolated, tagged simulation resources.
- Treat policy enforcement, authorization, validation, and deployment gates
  as deterministic controls. Model output is not authorization.
- Keep assessment claims tied to execution results and preserved evidence;
  distinguish observed behavior from hypotheses and avoid unsupported
  aggregate scores.
- Never add credentials or other secrets to tracked files. Use the existing
  ignored local environment files where needed.

## Development and verification

- The repository has no root package manifest. Work from the relevant package
  directory; do not install dependencies at the repository root.
- For agent changes, run `npm ci` and `npm run build` from
  `AttackYourself/app/AdversaryAgent/`.
- For CDK changes, run `npm ci`, `npm test`, and `npm run build` from
  `AttackYourself/agentcore/cdk/`.
- For AgentCore JSON changes, read the matching definitions under
  `AttackYourself/agentcore/.llm-context/` and run `agentcore validate` from
  `AttackYourself/`.
- Prefer small, reviewable changes. Update relevant docs and tests alongside
  behavior changes; deterministic checks are authoritative for correctness
  and policy.

## Commit workflow

- Do not create commits unless the user's current message contains an explicit
  standalone directive in this form: `COMMIT: <scope>`. Mentioning commits,
  discussing this policy, or quoting the directive is not authorization.
- The scope identifies exactly which completed work to commit (for example,
  `COMMIT: the documentation changes from this task`). If the scope is
  ambiguous, ask before committing.
- Before committing, inspect the full worktree and index, review the exact
  diff, and run the relevant checks. Commit only changes within the stated
  scope that belong to the current task.
- Never use `git add -A` or include unrelated, pre-existing, or unrequested
  changes. If unrelated or pre-existing changes are staged, do not commit;
  ask the user to resolve the index first.
- Use one focused [Conventional Commit](https://www.conventionalcommits.org/)
  subject in `type(scope): imperative summary` form, such as
  `docs(agent): document commit workflow`. Do not amend commits unless
  explicitly requested.
- Include the repository's required co-author trailer in commit messages.
