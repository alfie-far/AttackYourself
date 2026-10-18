import { McpClient } from '@strands-agents/sdk';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const GATEWAY_URL_ENV = 'AGENTCORE_GATEWAY_ATTACKGATEWAY_URL';

export function getStreamableHttpMcpClient(): McpClient {
  const configuredUrl = process.env[GATEWAY_URL_ENV];

  if (!configuredUrl) {
    throw new Error(`${GATEWAY_URL_ENV} is not set.`);
  }

  const gatewayUrl = new URL(configuredUrl);

  if (
    gatewayUrl.protocol !== 'https:' ||
    gatewayUrl.search ||
    gatewayUrl.hash
  ) {
    throw new Error(`${GATEWAY_URL_ENV} must be a valid HTTPS Gateway URL.`);
  }

  // AgentCore may provide either the Gateway root or the complete /mcp endpoint.
  if (gatewayUrl.pathname === '/' || gatewayUrl.pathname === '') {
    gatewayUrl.pathname = '/mcp';
  } else if (gatewayUrl.pathname.replace(/\/$/, '') !== '/mcp') {
    throw new Error(
      `${GATEWAY_URL_ENV} must point to the Gateway root or /mcp endpoint.`
    );
  }

  const transport = new StreamableHTTPClientTransport(gatewayUrl);

  return new McpClient({ transport });
}