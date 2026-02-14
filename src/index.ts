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
import { OpenAIEmbeddings } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant';
import { QdrantClient } from '@qdrant/js-client-rest';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';

class EnterpriseCodeServer {
  private webhookUrl: string | undefined;

  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL;
  }

  private getServer() {
    const server = new McpServer(
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

    this.setupToolHandlers(server);
    return server;
  }

  private setupToolHandlers(server: McpServer) {
    server.registerTool("search", {
      description: 'Searches across indexed enterprise repositories and documentation using a natural language query and specified technology stack. Returns the most relevant code examples, files, and documentation to assist with development tasks and problem-solving.',
      inputSchema: z.object({
        Message: z.string().describe('A detailed natural language description of specifically the user\'s query, task, or intent - what they would like to implement. This should include specific goals, context, code-related actions, or problems to solve, helping the search find the most relevant matches across indexed repositories and documentation.'),
        Stack: z.string().describe('A comma-separated list of all technologies, programming languages, frameworks, libraries, databases, and tools currently used in the project or repository. Examples: \'TypeScript, React, Node.js, Express, PostgreSQL\' or \'Python, Django, Flask, MongoDB\'. This ensures search results are tailored to the relevant tech stack.'),
      }).required(),
    }, async({Message, Stack}: {Message: string, Stack: string}) => {
      if (typeof Message !== 'string' || typeof Stack !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'Invalid search arguments');
      }
      const webhookUrl = this.webhookUrl;
      if (!webhookUrl) {
        throw new McpError(ErrorCode.InternalError, 'WEBHOOK_URL not configured');
      }
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Message,
            Stack,
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
    });
    //     {
    //       name: 'fetch_file_from_git',
    //       description: 'Fetches raw file contents from a GitHub repository for the provided organization, repository, and file path.',
    //       inputSchema: {
    //         type: 'object',
    //         properties: {
    //           org: {
    //             type: 'string',
    //             description: 'GitHub organization name.',
    //           },
    //           repository: {
    //             type: 'string',
    //             description: 'GitHub repository name.',
    //           },
    //           filePath: {
    //             type: 'string',
    //             description: 'Path to the file within the repository.',
    //           },
    //         },
    //         required: ['org', 'repository', 'filePath'],
    //       },
    //     },
    //     {
    //       name: 'search_code_embeddings',
    //       description: 'Searches the Qdrant code embeddings collection for semantically similar code snippets.',
    //       inputSchema: {
    //         type: 'object',
    //         properties: {
    //           org: {
    //             type: 'string',
    //             description: 'GitHub organization name to filter results.',
    //           },
    //           keywords: {
    //             type: 'string',
    //             description: 'Search query or keywords to find relevant code embeddings.',
    //           },
    //         },
    //         required: ['org', 'keywords'],
    //       },
    //     },
    //   ],
    // }));

    // this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
    //   switch (request.params.name) {
    //     case 'search':
            //done...
    //     case 'fetch_file_from_git': {
    //       const { org, repository, filePath } = request.params.arguments ?? {};
    //       if (typeof org !== 'string' || typeof repository !== 'string' || typeof filePath !== 'string') {
    //         throw new McpError(ErrorCode.InvalidParams, 'Invalid fetch_file_from_git arguments');
    //       }
    //       const githubToken = process.env.GITHUB_TOKEN;
    //       if (!githubToken) {
    //         throw new McpError(ErrorCode.InternalError, 'GITHUB_TOKEN not configured');
    //       }
    //       const encodedPath = filePath
    //         .split('/')
    //         .map((segment) => encodeURIComponent(segment))
    //         .join('/');
    //       const url = `https://api.github.com/repos/${org}/${repository}/contents/${encodedPath}`;
    //       try {
    //         const response = await fetch(url, {
    //           method: 'GET',
    //           headers: {
    //             Authorization: `Bearer ${githubToken}`,
    //             Accept: 'application/vnd.github+json',
    //             'X-GitHub-Api-Version': '2022-11-28',
    //           },
    //         });
    //         if (!response.ok) {
    //           throw new McpError(ErrorCode.InternalError, `GitHub request failed with status ${response.status}`);
    //         }
    //         const data = await response.json();
    //         if (!data || data.type !== 'file' || typeof data.content !== 'string') {
    //           throw new McpError(ErrorCode.InternalError, 'GitHub API did not return file content');
    //         }
    //         const decodedContent = Buffer.from(data.content, data.encoding ?? 'base64').toString('utf8');
    //         return {
    //           content: [
    //             {
    //               type: 'text',
    //               text: decodedContent,
    //             },
    //           ],
    //         };
    //       } catch (error) {
    //         console.error('GitHub fetch error:', error);
    //         if (error instanceof McpError) {
    //           throw error;
    //         }
    //         throw new McpError(ErrorCode.InternalError, 'Failed to fetch file from GitHub');
    //       }
    //     }

    //     case 'search_code_embeddings': {
    //       const { org, keywords } = request.params.arguments ?? {};
    //       if (typeof org !== 'string' || typeof keywords !== 'string') {
    //         throw new McpError(ErrorCode.InvalidParams, 'Invalid search_code_embeddings arguments');
    //       }
    //       const qdrantHost = process.env.QDRANT_HOST;
    //       const qdrantPort = process.env.QDRANT_PORT;
    //       const openAiApiKey = process.env.OPENAI_API_KEY;
    //       const collectionName = process.env.QDRANT_COLLECTION ?? 'github_code_vectorization';

    //       if (!qdrantHost || !qdrantPort) {
    //         throw new McpError(ErrorCode.InternalError, 'QDRANT_HOST and QDRANT_PORT must be configured');
    //       }
    //       if (!openAiApiKey) {
    //         throw new McpError(ErrorCode.InternalError, 'OPENAI_API_KEY not configured');
    //       }

    //       const qdrantUrl = qdrantHost.startsWith('http')
    //         ? qdrantHost
    //         : `http://${qdrantHost}:${qdrantPort}`;

    //       try {
    //         const client = new QdrantClient({ url: qdrantUrl });
    //         const embeddings = new OpenAIEmbeddings({ apiKey: openAiApiKey });
    //         const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    //           client,
    //           collectionName,
    //           contentPayloadKey: 'document',
    //           metadataPayloadKey: 'metadata',
    //         });
    //         const filter = {
    //           must: [
    //             {
    //               key: 'metadata.organization',
    //               match: { value: org },
    //             },
    //           ],
    //         };
    //         const results = await vectorStore.similaritySearch(keywords, 5, filter);
    //         const formattedResults = results.map((result) => ({
    //           pageContent: result.pageContent,
    //           metadata: result.metadata,
    //         }));
    //         return {
    //           content: [
    //             {
    //               type: 'text',
    //               text: JSON.stringify(formattedResults, null, 2),
    //             },
    //           ],
    //         };
    //       } catch (error) {
    //         console.error('Qdrant search error:', error);
    //         if (error instanceof McpError) {
    //           throw error;
    //         }
    //         throw new McpError(ErrorCode.InternalError, 'Failed to search code embeddings');
    //       }
    //     }

    //     default:
    //       throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    //   }
    // });
  }

  async run() {
    const transport_mode = process.env.TRANSPORT || 'stdio';
    
    if (transport_mode === 'stdio') {
      const server = this.getServer();
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error('enterpriseCode MCP server running on stdio');
    } else if (transport_mode === 'http') {
      const port = parseInt(process.env.HTTP_TRANSPORT_PORT || '3101', 10);

      const app = createMcpExpressApp();
      app.post('/mcp', async (req: Request, res: Response) => {
        try {
          const transport: StreamableHTTPServerTransport  = new StreamableHTTPServerTransport ({
            sessionIdGenerator: undefined
          });
          const server = this.getServer();
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
          
          res.on('close', () => {
            console.log('Request closed');
            transport.close();
            server.close();
          });
        } catch (error) {
          console.error('Error handling MCP request:', error);
          if (!res.headersSent) {
            res.status(500).json({
              jsonrpc: '2.0',
              error: {
                code: -32_603,
                message: 'Internal server error'
              },
              id: null
            });
          }
        }
      });

      app.get('/mcp', async (req: Request, res: Response) => {
        console.log('Received GET MCP request');
        res.writeHead(405).end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32_000,
              message: 'Method not allowed.'
            },
            id: null
          })
        );
      });

      app.delete('/mcp', async (req: Request, res: Response) => {
        console.log('Received DELETE MCP request');
        res.writeHead(405).end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32_000,
                message: 'Method not allowed.'
            },
            id: null
          })
        );
      });

      app.listen(port, error => {
        if (error) {
          console.error('Failed to start HTTP server:', error);
          // eslint-disable-next-line unicorn/no-process-exit
          process.exit(1);
        } else {
          console.error(`enterpriseCode MCP server running on http://localhost:${port}/mcp`);
        }
      });
      
    } else {
      throw new Error(`Unknown transport mode: ${transport_mode}. Use 'stdio' or 'http'`);
    }

    // Handle server shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0);
    });
  }
}

const server = new EnterpriseCodeServer();
server.run().catch(console.error);
