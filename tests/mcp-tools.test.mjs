import 'dotenv/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { jest } from '@jest/globals';

const withQdrantEnv = {
  ...process.env,
  QDRANT_HOST: process.env.QDRANT_HOST ?? 'localhost',
  QDRANT_PORT: process.env.QDRANT_PORT ?? '6333',
};

async function createClient() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['build/index.js'],
    cwd: process.cwd(),
    env: withQdrantEnv,
  });

  const client = new Client(
    { name: 'mcp-jest-test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  return client;
}

describe('enterprise-ai-mcp tools', () => {
  jest.setTimeout(120000);

  test('fetch_file_from_git returns README content', async () => {
    const client = await createClient();
    try {
      const result = await client.callTool({
        name: 'fetch_file_from_git',
        arguments: {
          org: 'bitovi',
          repository: 'enterprise-ai-mcp',
          filePath: 'README.md',
        },
      });

      const text = result?.content?.[0]?.text ?? '';
      expect(text).toContain('Enterprise AI MCP Server');
    } finally {
      await client.close();
    }
  });

  test('search_code_embeddings returns array-like JSON payload', async () => {
    const client = await createClient();
    try {
      const result = await client.callTool({
        name: 'search_code_embeddings',
        arguments: {
          org: 'bitovi-training',
          keywords: 'auth middleware role based access',
        },
      });

      const text = result?.content?.[0]?.text ?? '[]';
      const parsed = JSON.parse(text);
      expect(Array.isArray(parsed)).toBe(true);
    } finally {
      await client.close();
    }
  });
});