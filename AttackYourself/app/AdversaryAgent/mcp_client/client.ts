import { McpClient } from '@strands-agents/sdk';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const GATEWAY_URL_ENV = 'AGENTCORE_GATEWAY_ATTACKGATEWAY_URL';

export function getStreamableHttpMcpClient(): McpClient {
  const gatewayBaseUrl = process.env[GATEWAY_URL_ENV];
  if (!gatewayBaseUrl) {
    throw new Error(`${GATEWAY_URL_ENV} is not set.`);
  }

  const baseUrl = new URL(gatewayBaseUrl);
  if (baseUrl.protocol !== 'https:' || baseUrl.pathname !== '/' || baseUrl.search || baseUrl.hash) {
    throw new Error(`${GATEWAY_URL_ENV} must be an HTTPS Gateway base URL.`);
  }

  baseUrl.pathname = '/mcp';

  const transport = new StreamableHTTPClientTransport(baseUrl);
  return new McpClient({ transport });
}
