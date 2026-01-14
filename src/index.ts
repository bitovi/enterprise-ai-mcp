#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

class EnterpriseCodeServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'enterpriseCode',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search',
          description: 'Given a natural-language request, return the best matches across all indexed repos/docs.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Give the user\'s request in its entirety.',
              },
              language: {
                type: 'string',
                description: 'Target coding language for the search.',
              },
            },
            required: ['query', 'language'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'search':
          if (!request.params.arguments || typeof request.params.arguments.query !== 'string' || typeof request.params.arguments.language !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'Invalid search arguments');
          }
          const webhookUrl = process.env.WEBHOOK_URL;
          if (!webhookUrl) {
            throw new McpError(ErrorCode.InternalError, 'WEBHOOK_URL not configured');
          }
          try {
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: request.params.arguments.query,
                language: request.params.arguments.language,
              }),
            });
            if (!response.ok) {
              throw new McpError(ErrorCode.InternalError, `Webhook request failed with status ${response.status}`);
            }
            const data = await response.json();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(data, null, 2),
                },
              ],
            };
          } catch (error) {
            console.error('Webhook error:', error);
            throw new McpError(ErrorCode.InternalError, 'Failed to fetch from webhook');
          }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('enterpriseCode MCP server running on stdio');
  }
}

const server = new EnterpriseCodeServer();
server.run().catch(console.error);
