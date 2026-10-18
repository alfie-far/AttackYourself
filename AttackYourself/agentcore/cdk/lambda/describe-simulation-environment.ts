export interface SimulationEnvironment {
  accountAlias: string;
  region: string;
  resources: (
    { type: 'lambda'; name: string; purpose: string } | { type: 's3'; name: string; classification: string }
  )[];
  securityControls: string[];
}

export async function handler(_event: unknown): Promise<SimulationEnvironment> {
  return {
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
  };
}
