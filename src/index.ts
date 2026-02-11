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
import { Client } from '@temporalio/client';
import { createTemporalClient, executeSearchWorkflow, TemporalConfig } from './temporal/client.js';

// Backend handles the implementation of the MCP-exposed functions.
interface Backend {
  search(message: string, stack: string): Promise<any>;
};

// Options for the server.
interface EnterpriseCodeServerOptions {
  backend: Backend;
}

// Server that hosts the MCP and routes to the backend.
class EnterpriseCodeServer {
  private server: Server;
  private backend: Backend;

  constructor(options: EnterpriseCodeServerOptions) {
    this.backend = options.backend;
    
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
                    description: 'A detailed natural language description of specifically the user\'s query, task, or intent - what they would like to implement. This should include specific goals, context, code-related actions, or problems to solve, helping the search find the most relevant matches across indexed repositories and documentation.',
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
          
          try {
            const data = await this.backend.search(
              request.params.arguments.Message,
              request.params.arguments.Stack
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(data, null, 2),
                },
              ],
            };
          } catch (error) {
            console.error('Search error:', error);
            if (error instanceof McpError) {
              throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to execute search: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  async run() {
    // Initialize Temporal client if in temporal mode
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`enterpriseCode MCP server running on stdio`);
  }
}

interface TemporalBackendOptions {
  config: TemporalConfig;
}

// Backend that uses Temporal workflows.
class TemporalBackend implements Backend {
  private temporalClient: Client;
  private taskQueue: string;

  private constructor(client: Client, taskQueue: string) {
    this.temporalClient = client;
    this.taskQueue = taskQueue;
  }

  static async create(options: TemporalBackendOptions): Promise<TemporalBackend> {
    const client = await createTemporalClient(options.config);
    return new TemporalBackend(client, options.config.taskQueue);
  }

  async search(message: string, stack: string): Promise<any> {
    return await executeSearchWorkflow(this.taskQueue, this.temporalClient, {
      Message: message,
      Stack: stack,
    });
  }
}

// Backend that uses webhook calls.
class WebhookBackend implements Backend {
  async search(message: string, stack: string): Promise<any> {
    const webhookUrl = process.env.WEBHOOK_URL;
    
    if (!webhookUrl) {
      throw new McpError(ErrorCode.InternalError, 'WEBHOOK_URL not configured');
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Message: message,
        Stack: stack,
      }),
    });
    
    if (!response.ok) {
      throw new McpError(ErrorCode.InternalError, `Webhook request failed with status ${response.status}`);
    }
    
    return await response.json();
  }
}

/**
 * Reads Temporal configuration from environment variables
 */
export function getTemporalConfig(): TemporalConfig {
  const config: TemporalConfig = {
    cloudApiKey: process.env.TEMPORAL_CLOUD_API_KEY, // optional
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'enterprise-code-search',
    workflowType: 'searchWorkflow',
  };

  // Add TLS config if paths are provided
  if (process.env.TEMPORAL_TLS_CERT_PATH || process.env.TEMPORAL_TLS_KEY_PATH) {
    config.tls = {
      certPath: process.env.TEMPORAL_TLS_CERT_PATH,
      keyPath: process.env.TEMPORAL_TLS_KEY_PATH,
      caCertPath: process.env.TEMPORAL_TLS_CA_CERT_PATH,
    };
  }

  return config;
}

const options: EnterpriseCodeServerOptions = {
  backend: await (async () => {
    switch (process.env.IMPLEMENTATION_MODE) {
      case "temporal":
        return await TemporalBackend.create({
          config: getTemporalConfig()
        });
      case "webhook":
        return new WebhookBackend();
      default:
        throw new Error("Unknown IMPLEMENTATION_MODE, must be 'webhook' or 'temporal'");
      }
    })()
};

const server = new EnterpriseCodeServer(options);
server.run().catch(console.error);
