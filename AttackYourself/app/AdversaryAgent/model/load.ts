import { BedrockModel } from '@strands-agents/sdk/models/bedrock';

export function loadModel(): BedrockModel {
  return new BedrockModel({
    modelId: 'global.anthropic.claude-sonnet-4-6',
    region: 'ap-southeast-2',
    requestTimeout: 600_000,
  });
}