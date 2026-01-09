#!/usr/bin/env node
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
        name: 'enterprise-code-ai-tooling',
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
          description: 'Given a natural-language query or pasted text, return the best matches across all indexed repos/docs.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Natural-language query or text to search',
              },
              language: {
                type: 'string',
                description: 'Target coding language for the search',
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
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify([
                  {
                    id: '1',
                    title: 'Sample Result 1',
                    source_type: 'repo',
                    content: 'This is the first result.'
                  },
                  {
                    id: '2',
                    title: 'Sample Result 2',
                    source_type: 'doc',
                    content: 'This is the second result.'
                  },
                ], null, 2),
              },
            ],
          };



        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Enterprise Code AI Tooling MCP server running on stdio');
  }
}

const server = new EnterpriseCodeServer();
server.run().catch(console.error);
