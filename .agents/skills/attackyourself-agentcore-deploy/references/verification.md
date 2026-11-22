# Verification, troubleshooting and completion report

This file is loaded when the deployment skill requires more detail. The repository files are authoritative over this reference; do not treat platform options as fixed across CLI versions.

## Project-specific boundaries

- Project: `AttackYourself/` (not repository root).
- Runtime: `AdversaryAgent`, Node.js 22, CodeZip, HTTP, `app/AdversaryAgent/main.js` entrypoint configured from project JSON.
- Gateway: `AttackGateway`, with the `SimulationEnvironment` Lambda tool, `describe_simulation_environment`; gateway `authorizerType` is currently `NONE`. Do not treat that as adequate for adding attack or write-capable tools.
- Source fixture: `AttackYourself/agentcore/cdk/lambda/describe-simulation-environment.ts`. Currently static, not live AWS discovery.
- `agentcore/agentcore.json` is declarative source of truth; the generated `agentcore/cdk` code should not be casually edited. Change names carefully: renaming resources may cause replacement.
- Target list: `AttackYourself/agentcore/aws-targets.json`. The CLI/CDK project generates a stack per target (typically `AgentCore-AttackYourself-default`). A Gateway target's `lambdaArn` is a concrete resource reference; changing account alone does not retarget the ARN.
- Semantic World tests: `npm run test:world`; examples `npm run demo:world` and `npm run demo:lambda-world` — not deployed Runtime capabilities unless deliberately connected.

## Read-only checks and evidence

1. **Git checkout:** record SHA, current branch, dirty state, changed filenames. Do not deploy an unreviewed dirty checkout.
2. **Tool versions:** `node --version`, `aws --version`, `agentcore --version`; inspect `agentcore deploy --help` for actual flags.
3. **AWS identity:** `aws sts get-caller-identity --query '{Account:Account,Arn:Arn}' --output json`. Report ARN only if appropriate; never report tokens.
4. **Target:** preflight script verifies account, region and embedded Lambda ARN account/region against STS. A mismatch blocks all deployment actions.
5. **Build:** `npm ci`, `npm run build`, world tests and demos; CDK `npm test -- --runInBand` and build. Treat each as a separate result.
6. **Preview:** `agentcore deploy --target default --dry-run` and `agentcore deploy --target default --diff` if supported; `cd AttackYourself/agentcore/cdk && npx cdk diff` as an alternative after environment/target review. CDK diff may use AWS reads and can require permissions; it does not itself deploy.
7. **Deployment:** execute only with explicit per-run approval; preserve CLI output and CloudFormation status. Avoid logging raw configuration/secrets.
8. **After deployment:** `agentcore status --target default --json`, deployed invocation, error logs and traces. Verify whether `describe_simulation_environment` was actually used. Require explicit observed evidence for each claim.

## Smoke-test acceptance

- `agentcore status` reports `AdversaryAgent` deployed and ready for the expected target.
- Invoking `What can you do?` completes without an error, returning an agent response.
- A second test uses permitted tools and describes the **static** simulation environment, ideally citing `describe_simulation_environment` in available trace/log records.
- The response must not claim that CloudTrail or GuardDuty are actually enabled on live AWS because their names appear in the fixture.
- Error logs show no new invocation/deployment errors attributable to the run. If observability is missing, mark **inconclusive** rather than silently passing.
- Offline World demo is separately reported; it does not validate cloud configuration or runtime integration.

## Troubleshooting decision tree

- **`aws sts get-caller-identity` fails:** operator re-authenticates (SSO device flow or `aws login` as configured). Never request tokens in chat.
- **Unexpected AWS account or region:** stop; verify profile, ambient credential environment and `aws-targets.json`. Do not work around the mismatch by changing expected IDs or switching roles without review.
- **Gateway Lambda ARN cross-account/region:** stop; the checked-in ARN is pinned. Confirm authorised target and design the migration/re-wiring explicitly, then revalidate/diff.
- **`agentcore validate` fails:** inspect `agentcore.json` and `.llm-context` types. Do not modify generated CDK as a workaround.
- **TypeScript build or test fails:** preserve errors; distinguish runtime app code failures from isolated World experiment failures. Fix or ask for direction before deploy.
- **CLI `--dry-run`, `--diff`, `--dev` differs:** check `agentcore deploy --help`, `agentcore invoke --help`, `agentcore dev --help`; do not assume flags from a different CLI major version. For a preview consider CDK diff after verifying stack and account.
- **CloudFormation fails:** collect stack events and CLI output as appropriate with least-privilege read access; do not retry blindly or run `cdk destroy`.
- **Runtime ready but smoke prompt fails:** inspect latest logs/traces and model permissions. Check Gateway URL injected into the runtime and gateway target wiring. Confirm smoke requests use the right target.
- **Auth failures:** authentication to AWS CLI is separate from Runtime IAM and MCP Gateway authorization. Do not make the Gateway public or relax IAM as a shortcut.
- **No trace or unclear tool invocation:** mark Gateway-path check inconclusive and collect alternate logs. An LLM description of the fixture does not prove the tool was called.

## Operator report template

```text
AttackYourself AgentCore deployment report
Date/time (UTC):
Git SHA / branch / worktree clean?:
AWS CLI profile (name only):
STS account / principal ARN (sanitised):
Region and selected target:
AgentCore CLI version:
Configured Runtime / Gateway:
Preflight: PASS | FAIL
App npm ci/build: PASS | FAIL | SKIPPED
Semantic World tests/demos: PASS | FAIL | SKIPPED
CDK tests/build: PASS | FAIL | SKIPPED
AgentCore config validation: PASS | FAIL | SKIPPED
Preview/diff summary (creates/updates/deletes/replacements/IAM):
Explicit operator deployment approval obtained?: YES | NO
Deployment: PASS | FAIL | NOT ATTEMPTED
Deployed runtime status:
Basic invoke: PASS | FAIL | SKIPPED
Simulation MCP tool invoke evidence: PASS | FAIL | INCONCLUSIVE | SKIPPED
Error logs and trace checks:
Cost / security / rollback considerations:
Unresolved issues / follow-up:
```

### Reference material

- Repository guides: `AGENTS.md`, `AttackYourself/AGENTS.md`, `AttackYourself/agentcore/cdk/README.md`, `README.MD`.
- AgentCore CLI commands: https://github.com/aws/agentcore-cli/blob/main/docs/commands.md
- AWS CLI Identity Center: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html
- AWS CLI sign-in: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html
