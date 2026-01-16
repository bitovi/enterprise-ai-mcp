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
          description: 'Searches across indexed enterprise repositories and documentation using a natural language query and specified technology stack. Returns the most relevant code examples, files, and documentation to assist with development tasks and problem-solving.',
          inputSchema: {
            type: 'object',
            properties: {
                  Message: {
                    type: 'string',
                    description: 'A detailed natural language description of the user\'s query, task, or intent. This should include specific goals, context, code-related actions, or problems to solve, helping the search find the most relevant matches across indexed repositories and documentation.',
                  },
              Stack: {
                type: 'string',
                description: 'A comma-separated list of all technologies, programming languages, frameworks, libraries, databases, and tools currently used in the project or repository. Examples: \'TypeScript, React, Node.js, Express, PostgreSQL\' or \'Python, Django, Flask, MongoDB\'. This ensures search results are tailored to the relevant tech stack.',
              },
            },
            required: ['Message', 'Stack'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'search':
          if (!request.params.arguments || typeof request.params.arguments.Message !== 'string' || typeof request.params.arguments.Stack !== 'string') {
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
                Message: request.params.arguments.Message,
                Stack: request.params.arguments.Stack,
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
            if (error instanceof McpError) {
              throw error;
            }
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
