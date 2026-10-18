import { McpClient } from '@strands-agents/sdk';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const GATEWAY_MCP_URL_ENV = 'ATTACK_GATEWAY_MCP_URL';

export function getStreamableHttpMcpClient(): McpClient {
  const endpoint = process.env[GATEWAY_MCP_URL_ENV];
  if (!endpoint) {
    throw new Error(
      `${GATEWAY_MCP_URL_ENV} must be set to the AttackGateway MCP endpoint.`
    );
  }

  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.pathname !== '/mcp') {
    throw new Error(
      `${GATEWAY_MCP_URL_ENV} must be an HTTPS URL ending in /mcp.`
    );
  }

  const transport = new StreamableHTTPClientTransport(url);
  return new McpClient({ transport });
}
