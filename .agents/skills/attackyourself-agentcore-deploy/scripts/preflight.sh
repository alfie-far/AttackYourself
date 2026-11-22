#!/usr/bin/env bash
# Read-only identity/target gate. No AWS resource mutations. No credential printing.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${SKILL_DIR}/../../.." && pwd)"
TARGET="${1:-default}"

fail() { printf 'PRE-FLIGHT FAILED: %s\n' "$*" >&2; exit 1; }
for command in node aws; do
  command -v "$command" >/dev/null 2>&1 || fail "Missing $command"
done
[[ -f "${REPO_ROOT}/AttackYourself/agentcore/agentcore.json" ]] || fail "Expected repository root not found: ${REPO_ROOT}"
[[ -f "${REPO_ROOT}/AttackYourself/agentcore/aws-targets.json" ]] || fail 'Missing target config'

node_version="$(node -p 'process.versions.node.split(".")[0]')" || fail 'Could not read Node version'
[[ "$node_version" =~ ^[0-9]+$ ]] || fail 'Could not parse Node major version'
(( node_version >= 22 )) || fail "Node 22+ required; detected $(node --version)"

# Capture errors and ensure exit status is checked; do not use process substitution here.
config="$(node - "$REPO_ROOT" "$TARGET" <<'NODE'
const fs=require('node:fs'),path=require('node:path');
const root=process.argv[2],targetName=process.argv[3];
const base=path.join(root,'AttackYourself','agentcore');
const targets=JSON.parse(fs.readFileSync(path.join(base,'aws-targets.json'),'utf8'));
const spec=JSON.parse(fs.readFileSync(path.join(base,'agentcore.json'),'utf8'));
if (!Array.isArray(targets) || !targets.length) throw new Error('No deployment targets found');
const matches=targets.filter(x=>x.name===targetName);
if (matches.length!==1) throw new Error(`Expected exactly one target named ${targetName}`);
const t=matches[0];
if (!/^\d{12}$/.test(t.account) || !/^[a-z]{2}-[a-z0-9-]+-\d$/.test(t.region)) throw new Error('Invalid target account/region');
if (!Array.isArray(spec.runtimes) || !spec.runtimes.some(x=>x.name==='AdversaryAgent')) throw new Error('AdversaryAgent runtime missing');
const targetArns=(spec.agentCoreGateways||[]).flatMap(g=>g.targets||[]).map(x=>x.lambdaFunctionArn?.lambdaArn).filter(Boolean);
for (const arn of targetArns) {
  const m=arn.match(/^arn:[^:]+:lambda:([^:]+):(\d{12}):function:.+$/);
  if (!m) throw new Error(`Malformed Lambda ARN in Gateway target`);
  if (m[1]!==t.region || m[2]!==t.account) throw new Error(`Gateway Lambda target ARN account/region does not match ${targetName}; do not deploy`);
}
if (!/^[A-Za-z0-9_-]+$/.test(targetName)) throw new Error('Invalid target name');
console.log(`${t.account} ${t.region}`);
NODE
)" || fail 'Invalid or cross-account/region AgentCore configuration'
read -r expected_account expected_region <<< "$config"

[[ -z "${AWS_REGION:-}" || "${AWS_REGION}" == "$expected_region" ]] || fail "AWS_REGION differs from configured target region ${expected_region}"
[[ -z "${AWS_DEFAULT_REGION:-}" || "${AWS_DEFAULT_REGION}" == "$expected_region" ]] || fail "AWS_DEFAULT_REGION differs from configured target region ${expected_region}"

if [[ -n "${AWS_PROFILE:-}" && -n "${AWS_ACCESS_KEY_ID:-}" ]]; then
  printf 'WARNING: Both AWS_PROFILE and AWS_ACCESS_KEY_ID are set; credentials may come from the environment. Checking actual STS identity.\n' >&2
fi

# AWS CLI prints no session keys for STS get-caller-identity. Do not use --debug.
sts="$(aws sts get-caller-identity --region "$expected_region" --output json)" || fail 'AWS credentials unavailable/expired or STS failed. Ask operator to log in in Codespaces.'
actual_account="$(printf '%s' "$sts" | node -e '
  let data=""; process.stdin.on("data",x=>data+=x); process.stdin.on("end",()=>{
  const j=JSON.parse(data); if(!/^\d{12}$/.test(j.Account))process.exit(2); console.log(j.Account);
  });
')" || fail 'Cannot read STS caller identity'
[[ "$actual_account" == "$expected_account" ]] || fail "Authenticated AWS account ${actual_account} does NOT equal configured target account ${expected_account}"

printf 'PRE-FLIGHT PASSED\n'
printf '  Target: %s\n' "$TARGET"
printf '  Account: %s (verified via STS)\n' "$actual_account"
printf '  Region: %s\n' "$expected_region"
printf '  Profile: %s\n' "${AWS_PROFILE:-<ambient-credentials>}"
printf '  Node: %s\n' "$(node --version)"
printf '  WARNING: Gateway auth configuration must be reviewed before adding write-capable tools.\n'
