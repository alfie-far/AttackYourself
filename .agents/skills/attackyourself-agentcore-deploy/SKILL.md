---
name: attackyourself-agentcore-deploy
description: Safely validate, deploy and smoke-test the AttackYourself Bedrock AgentCore project from GitHub Codespaces in the explicitly authorised personal AWS account. Use for deployment readiness, AWS login/profile verification, CDK/AgentCore previews, deployments, runtime invocations and post-deployment troubleshooting.
---

# AttackYourself AgentCore deployment and verification

Use this skill only for `alfie-far/AttackYourself`. It governs deployment **by the Codespaces operator's assistant**, not tool execution by the deployed adversary agent. Read repository `AGENTS.md`, `AttackYourself/AGENTS.md` and this skill before operating. Repository guardrails supersede this workflow.

## Operating contract

- **No access tokens are needed in chat.** The human authenticates with `aws login` or `aws sso login` inside Codespaces. Use the resulting AWS CLI profile/session. Never solicit, display, persist in Git, or echo access keys, session tokens or SSO device codes into the conversation.
- Default deployment target currently configured in `AttackYourself/agentcore/aws-targets.json`: **account `610034861450` in `ap-southeast-2`**. This is *repository configuration, not proof of who is logged in*. Always read the configuration afresh.
- Run the script at `scripts/preflight.sh` (relative to this skill) before **every** deployment. It verifies actual STS caller account, configured target and embedded Lambda target ARN accounts/regions. **Do not bypass a mismatch.** Ask the user to update and approve target/ARN changes separately.
- Running tests, local builds, config validation, status and previews requires no deployment permission. **Before `agentcore deploy` or any other AWS-modifying step, present the account, region, target, current Git SHA, change summary, preview/diff and expected effects to the user and get explicit approval for that deployment.** Permission to read this skill is not permission to deploy.
- Do not run `agentcore remove`, `cdk destroy`, broad IAM grants, unreviewed infrastructure changes, `--yes`/`-y` deployment bypasses, or adversarial active probes. Stop on any resource replacement/deletion/security-boundary change shown by the diff and seek a separate explicit decision.
- **Do not create Git commits** without the current-message standalone `COMMIT: <scope>` directive required by root `AGENTS.md`; deployment approval does not grant commit approval.
- Never claim that a static simulation fixture is observed AWS state. The semantic World engine and Lambda descriptor demos are **offline**, not part of the deployed agent entrypoint.

## 1 — Locate project and inspect changes

Run from the repository root (find `AttackYourself/agentcore/agentcore.json`):

```bash
git status --short
git rev-parse HEAD
node --version
npm --version
aws --version
agentcore --version
```

Inspect `AttackYourself/agentcore/agentcore.json`, `AttackYourself/agentcore/aws-targets.json`, and the changed files. Require Node 22; check the version shown by `agentcore --version` and supported flags with `agentcore <command> --help` because AgentCore CLI commands evolve. Do not discard or auto-commit the operator's unrelated changes.

## 2 — Authenticate interactively in Codespaces

The operator logs in via the supported mechanism for their AWS account; **never handle the token manually**. If using IAM Identity Center, they can use a browser-independent device code flow from Codespaces:

```bash
# Once per profile, if necessary:
aws configure sso --use-device-code
# For subsequent sessions (replace the profile name):
aws sso login --profile <PROFILE> --use-device-code
export AWS_PROFILE=<PROFILE>
```

If using newer AWS console-credential login rather than Identity Center, the operator may instead run `aws login --profile <PROFILE>` after configuring that AWS CLI profile. Do not assume these login mechanisms are interchangeable. For an already active session, just use it. Do not include device codes, browser callback URLs, bearer tokens or secret material in reports.

Verify `aws sts get-caller-identity` and the effective region. If both `AWS_PROFILE` and credential environment variables are set, warn about precedence and trust the actual STS result, not the profile name. **Never change AWS target account automatically** to match the active credentials.

## 3 — Preflight gate

From repository root:

```bash
bash .agents/skills/attackyourself-agentcore-deploy/scripts/preflight.sh default
```

If it fails, **stop**; do not deploy. Default target is `default`; for another explicit target pass its name and use the same name in later commands. Confirm the configured Gateway `SimulationEnvironment` Lambda ARN actually exists in the selected account before first deployment or after changing target configuration; the ARN is an external reference, not portable automatically across accounts.

## 4 — Deterministic validation (no cloud writes)

```bash
(cd AttackYourself/app/AdversaryAgent && npm ci && npm run build && npm run test:world && npm run demo:world && npm run demo:lambda-world)
(cd AttackYourself/agentcore/cdk && npm ci && npm test -- --runInBand && npm run build)
(cd AttackYourself && agentcore validate)
```

Fail closed on a failed build/test/validate. Do not claim a demo is a live AgentCore assessment. Record check outcomes. Do not install dependencies at repo root (no root package manifest).

## 5 — Preview and deployment approval gate

Run from `AttackYourself/` after successful preflight, with the *same active AWS identity*:

```bash
agentcore deploy --target default --dry-run
agentcore deploy --target default --diff
```

If the installed CLI lacks these flags, inspect its help and follow `references/verification.md` for a read-only CDK diff alternative. Review changes, stack replacements/deletions, region, IAM scope, runtime configuration, public exposure, gateway target wiring and possible charges. **Stop and ask for explicit user approval to deploy** after displaying the reviewed result; do not silently move ahead.

After explicit approval in the current session, immediately re-run `preflight.sh` to catch token/account changes, then run the interactive deployment:

```bash
cd AttackYourself
agentcore deploy --target default
```

Use interactive confirmation; never add `-y` automatically. If the user approved a different target, substitute it consistently. If deployment prompts for a changed account or materially different resource actions, stop and ask again.

## 6 — Read-only post-deployment checks

```bash
cd AttackYourself
agentcore status --target default --json
agentcore invoke --runtime AdversaryAgent --target default 'What can you do?'
agentcore invoke --runtime AdversaryAgent --target default 'Using only your available tools, describe the simulation environment and tell me which claims are fixture data rather than live AWS observations.'
agentcore logs --runtime AdversaryAgent --since 30m --level error
agentcore traces list --runtime AdversaryAgent --limit 10
```

Confirm: runtime ready; invocation returned a useful answer; agent/tool path exercised (verify logs/traces where available); any tool result is explicitly identified as **static simulated data**; no unexpected errors. Be cautious that a successful text response alone does not prove a Gateway tool was called. The fixture currently mentions simulated Lambda `demo-app`, simulated S3 `attack-yourself-sensitive-data` and control names CloudTrail/GuardDuty; these are not evidence of actual deployed protections. Do **not** run an active AWS attack to test it.

If the installed CLI uses different invocation/trace arguments, use its `--help` instead of guessing. For optional local runtime testing, prefer `agentcore dev` in one terminal and use the installed version's documented local invocation syntax in another; the current README's `agentcore invoke --dev` may differ by CLI version.

## 7 — Report and stop

Use the checklist and report template in `references/verification.md`. Report actual results with PASS/FAIL/SKIPPED; identify target account/region/profile name (no secrets), SHA, CLI version, deployed runtime, preview summary, tool invocation evidence, costs/changes and unresolved issues. Report any tests skipped or not executed. Do **not** claim success based on `agentcore deploy` exit code alone.

### Failure strategy

On wrong identity, mismatch, missing CLI, invalid config, failing tests, unclear diff or unsafe changes: **stop without deploying**, explain why, and propose the smallest safe repair. On failed deployment, capture status/logs and suggest a reviewed recovery/rollback; do not initiate destructive rollback automatically. See `references/verification.md` for detailed troubleshooting and evidence expectations.
