# Initial AgentCore Spike — Historical Archive

These are the **original notes** from the former `docs/PRODUCT-VISION.md`, preserved for provenance. CLI commands, SDK assumptions, illustrative scores and policy examples below are **not verified current instructions or real assessment findings**. See [Product Vision](../PRODUCT-VISION.md) and [Reference Architecture](../REFERENCE-ARCHITECTURE.md) for maintained guidance.

~~~text
A scorecard here is the structured result of an attack simulation — a way to answer “how well did our security controls perform?” rather than just “did we find a vulnerability?”

For example, suppose Attack Yourself attempts to use a compromised Lambda role to access sensitive S3 data:

Dimension	Result	Score
Attack execution	Credential abuse succeeded	0/10
Prevention	IAM allowed unintended S3 access	2/10
Detection	GuardDuty detected behaviour	9/10
Alerting	SIEM alerted in 37 sec	9/10
Containment	Nothing automatically revoked access	1/10
Evidence	Full CloudTrail trail available	10/10
Recovery	Test resources cleaned successfully	10/10

Then perhaps:

Scenario score: 58/100 — Attack succeeded, detected quickly, but wasn’t contained.

The particularly useful part is that you can aggregate these across attack scenarios:

Attack Yourself — Account Security Scorecard
Identity compromise             72/100
Privilege escalation            91/100
S3 data exfiltration            58/100
Public API credential abuse     84/100
Cross-account lateral movement  96/100
Overall resilience              80/100

But I wouldn’t make the overall 80/100 the main product — security scores can become bullshit surprisingly quickly.

The valuable information is the control-level breakdown and evidence:

Can attacker do it?
        ↓
Was it prevented?
        ↓
If not, was it detected?
        ↓
Was someone alerted?
        ↓
Was it contained?
        ↓
Was evidence preserved?
        ↓
Did recovery work?

That makes the scorecard effectively a continuous purple-team report.

And over time it gets much more interesting:

                       Aug   Sep   Oct
Prevent                68%   74%   81% ↑
Detect                  91%   94%   94% →
Mean detection time     83s   46s   31s ↓
Contain                 42%   61%   76% ↑
Critical attack paths     4     2     1 ↓

So in Attack Yourself, I’d probably define the scorecard as:

A measurable assessment of how the AWS environment prevented, detected, contained and recovered from each attempted attack, backed by actual execution evidence.

That last bit — actual execution evidence — is what separates this from another compliance dashboard full of reassuring green ticks.


For a new build today, I’d scaffold this with Amazon Bedrock AgentCore rather than Bedrock Agents Classic. AWS now labels the older Bedrock Agents service “Classic” and says it’s no longer open to new customers; AgentCore is the current path for new agent systems. 

For Attack Yourself v0.1, I’d keep the first version extremely small:

Prompt / objective
       ↓
Adversary Agent
       ↓
AgentCore Gateway
       ↓
Policy Engine
       ↓
One controlled Lambda tool
       ↓
Target AWS resources
       ↓
CloudTrail / GuardDuty evidence

The scaffolding would look like this.

1. Create the AgentCore project. Since you’re already primarily Node/TypeScript, I’d use TypeScript + Strands + Bedrock. AWS currently documents TypeScript AgentCore projects with Strands and recommends Node 22+ for that flow. 

npm install -g @aws/agentcore
agentcore create \
  --project-name AttackYourself \
  --no-agent
cd AttackYourself
agentcore add agent \
  --name AdversaryAgent \
  --type create \
  --build CodeZip \
  --language TypeScript \
  --framework Strands \
  --model-provider Bedrock \
  --memory none

That gives you roughly:

AttackYourself/
├── agentcore/
│   ├── agentcore.json
│   └── cdk/
│
└── app/
    └── AdversaryAgent/
        ├── main.ts
        ├── package.json
        └── ...

AgentCore generates the runtime configuration and CDK infrastructure for you rather than you manually assembling the hosting stack. 

2. Give the agent a very boring initial mission. At first, don’t let it attack anything. Just prove that the reasoning loop works.

Conceptually:

const agent = new Agent({
  model: "...bedrock model...",
  systemPrompt: `
    You are the Attack Yourself adversary agent.
    Your job is to evaluate AWS security controls
    using only explicitly available tools.
    Never assume permissions you do not have.
    Never attempt actions outside the provided tools.
  `
});

The important architecture is:

LLM
 │
 ▼
Agent loop
 │
 ├── reason
 ├── select tool
 ├── inspect result
 ├── adapt
 └── produce assessment

At this stage, the model doesn’t need AWS credentials capable of doing security testing.

3. Run it locally before deploying anything.

agentcore dev

AWS’s CLI creates the local environment, runs the agent with hot reload and exposes the Agent Inspector so you can interact with it and inspect traces. 

So you could initially ask:

I want to determine whether a compromised Lambda
could access sensitive S3 objects.
Develop an attack hypothesis.

And it should give you reasoning/planning — but have no ability to execute yet.

4. Deploy the empty-shell agent.

agentcore deploy --dry-run
agentcore deploy
agentcore status

Then:

agentcore invoke \
  --prompt "Develop an attack hypothesis for excessive IAM permissions."

AgentCore packages the application, provisions the runtime through CDK, configures the Runtime endpoint and CloudWatch logging/observability, and lets you invoke it through the CLI or SDK. 

At this point you have:

┌───────────────────────┐
│ AgentCore Runtime     │
│                       │
│ AdversaryAgent        │
│       │               │
│       ▼               │
│ Bedrock model         │
└───────────────────────┘

That’s your first milestone.

5. Now create exactly one attack tool. This is where I’d deliberately resist giving the agent generic AWS SDK access.

For example:

test_s3_access

Input:

{
  "roleArn": "...",
  "bucketArn": "...",
  "objectPrefix": "simulation/"
}

Output:

{
  "assumeRoleSucceeded": true,
  "listBucketSucceeded": true,
  "getObjectSucceeded": false,
  "cloudTrailEventIds": []
}

Implement that tool as a Lambda.

Crucially:

BAD
Agent
 ↓
AWS SDK
 ↓
sts:*
iam:*
s3:*
lambda:*
...

versus:

GOOD
Agent
 ↓
test_s3_access()
 ↓
purpose-built Lambda
 ↓
very restricted IAM role
 ↓
simulation resources only

This is the beginning of your bounded attack surface.

6. Put AgentCore Gateway in front of the tool.

First define the tool schema, perhaps:

[
  {
    "name": "test_s3_access",
    "description": "Test whether an authorised simulated role can access a tagged S3 target.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "roleArn": {
          "type": "string"
        },
        "bucketArn": {
          "type": "string"
        }
      },
      "required": [
        "roleArn",
        "bucketArn"
      ]
    }
  }
]

Then:

agentcore add gateway \
  --name AttackGateway \
  --authorizer-type AWS_IAM \
  --runtimes AdversaryAgent

And expose your Lambda:

agentcore add gateway-target \
  --name S3AttackSimulator \
  --type lambda-function-arn \
  --lambda-arn <ATTACK_SIMULATION_LAMBDA_ARN> \
  --tool-schema-file tools.json \
  --gateway AttackGateway

AWS Gateway converts Lambda targets, OpenAPI endpoints, API Gateway services and MCP servers into tools an agent can invoke. 

Now your architecture becomes:

                Bedrock model
                     │
                     ▼
              Adversary Agent
                     │
               MCP tool call
                     │
                     ▼
            AgentCore Gateway
                     │
                     ▼
             test_s3_access
                     │
                     ▼
                   Lambda
                     │
                     ▼
                 AWS APIs

This boundary is important.

The agent reasons.

The tool acts.

7. Add the Policy Engine before adding more powerful tools.

agentcore add policy-engine \
  --name AttackPolicy

I’d initially attach it in:

LOG_ONLY

rather than enforcement mode.

AWS’s Policy Engine evaluates tool calls at the Gateway and uses Cedar policies; it can operate in LOG_ONLY or ENFORCE. AWS actually recommends starting with LOG_ONLY while you’re establishing policies. 

Eventually you’d encode rules resembling:

permit test_s3_access
WHEN
target.account == simulationAccount
AND
target.resourceTag["AttackYourself"] == "true"
AND
requestedAction == "read"

And:

forbid
iam:DeleteRole
organizations:*
kms:ScheduleKeyDeletion
cloudtrail:StopLogging

Even if the LLM says:

Excellent! Next I’ll disable CloudTrail.

the execution layer responds:

DENIED

That’s exactly what you want.

8. Only then start building the attack library. Your first handful of tools could eventually become:

discover_simulation_resources()
test_role_assumption()
test_s3_access()
test_secret_access()
simulate_api_credential_abuse()

Notice something important: those aren’t named:

execute_shell()
run_aws_cli()
execute_python()

That’s deliberate.

You’re making the tool vocabulary itself a security boundary.

That maps directly onto the principle we’ve talked about before: you can’t necessarily constrain everything an agent thinks about, but you can constrain the space in which its decisions become real actions. SDLC with AI.txt

So after only a fairly small amount of scaffolding, you’d have:

                    ATTACK YOURSELF v0.1
                  ┌─────────────────┐
                  │ Bedrock Model   │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Adversary Agent │
                  │ AgentCore       │
                  │ Runtime         │
                  └────────┬────────┘
                           │
                      tool intent
                           │
                           ▼
                ┌────────────────────┐
                │ AgentCore Gateway  │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Policy Engine      │
                │ Cedar              │
                └─────────┬──────────┘
                          │ permitted
                          ▼
                 ┌──────────────────┐
                 │ Attack Tools     │
                 │ Lambda           │
                 └────────┬─────────┘
                          │
                   constrained IAM
                          │
                          ▼
                 ┌──────────────────┐
                 │ AWS Test Target  │
                 └────────┬─────────┘
                          │
                          ▼
          CloudTrail / GuardDuty / Security Hub

And that is already an agentic BAS prototype.

The bit I’d build first is almost comically small: one agent + test_s3_access + one deliberately vulnerable S3 scenario. Once that closed loop works — hypothesise → call tool → observe AWS → evaluate result — adding another twenty attack scenarios becomes an extension problem rather than an architectural one. 

What I particularly like here is that AgentCore Gateway + Policy Engine solves a piece of the architecture we otherwise would have had to build ourselves. That’s probably the part of AWS Bedrock worth exploring first for this idea.
~~~
