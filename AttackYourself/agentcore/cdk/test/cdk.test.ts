import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AgentCoreStack } from '../lib/cdk-stack';
import { handler } from '../lambda/describe-simulation-environment';

function createStack(): AgentCoreStack {
  const app = new cdk.App();
  return new AgentCoreStack(app, 'TestStack', {
    spec: {
      name: 'testproject',
      version: 1,
      managedBy: 'CDK' as const,
      runtimes: [],
      memories: [],
      credentials: [],
      evaluators: [],
      onlineEvalConfigs: [],
      configBundles: [],
      policyEngines: [],
      payments: [],
      agentCoreGateways: [],
      mcpRuntimeTools: [],
      unassignedTargets: [],
      datasets: [],
      knowledgeBases: [],
    },
  });
}

test('AgentCoreStack synthesizes the standalone simulation environment Lambda', () => {
  const stack = createStack();
  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::Lambda::Function', 1);
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs22.x',
    Handler: 'index.handler',
    MemorySize: 128,
    Timeout: 10,
  });
  template.hasOutput('StackNameOutput', {
    Description: 'Name of the CloudFormation Stack',
  });
  template.hasOutput('SimulationEnvironmentLambdaArn', {
    Description: 'ARN of the standalone simulation environment Lambda.',
  });
});

test('simulation environment handler returns the static JSON description', async () => {
  await expect(handler({})).resolves.toEqual({
    accountAlias: 'attack-yourself-lab',
    region: 'ap-southeast-2',
    resources: [
      {
        type: 'lambda',
        name: 'demo-app',
        purpose: 'simulated workload',
      },
      {
        type: 's3',
        name: 'attack-yourself-sensitive-data',
        classification: 'simulated-sensitive',
      },
    ],
    securityControls: ['CloudTrail', 'GuardDuty'],
  });
});
