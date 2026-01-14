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
  private readonly sampleSearchResults = [
    [
      {
        document: {
          pageContent: "## Examples\n\n### Example 1: Public and Protected Endpoints\n\n```go\nfunc main() {\n    // Public endpoint - no authentication\n    http.HandleFunc(\"/api/public\", publicHandler)\n    \n    // Protected endpoint - requires valid token\n    http.HandleFunc(\"/api/profile\", authmiddleware.AuthMiddleware(profileHandler))\n    \n    // Admin only endpoint\n    http.HandleFunc(\"/api/admin/users\", authmiddleware.RequireRoles(\"admin\")(adminHandler))\n    \n    http.ListenAndServe(\":8080\", nil)\n}\n```\n\n### Example 2: Role-Based Order Management\n\n```go\n// Any authenticated user can list orders\nhttp.HandleFunc(\"/api/orders\", authmiddleware.AuthMiddleware(listOrdersHandler))\n\n// Support staff or admins can cancel orders\nhttp.HandleFunc(\"/api/orders/cancel\", authmiddleware.RequireRoles(\"support\", \"admin\")(cancelOrderHandler))\n\n// Only admins can issue refunds\nhttp.HandleFunc(\"/api/orders/refund\", authmiddleware.RequireRoles(\"admin\")(refundOrderHandler))\n```",
          metadata: {
            source: "blob",
            blobType: "text/plain",
            loc: {
              lines: {
                to: 188,
                from: 159
              }
            },
            metadata: {
              repo_name: "auth-middleware-go",
              file_name: "README.md",
              last_commit_timestamp: "2016-12-15T21:57:32Z",
              organization: "bitovi-corp",
              file_size: 254,
              file_path: "README.md",
              last_commit: "27cc3fadc5cf30e40c08cc35c9c17a3aef04135f",
              file_type: "file"
            }
          }
        },
        score: 0.976123,
        explanation: "Section from the README providing examples of using the auth middleware in Go applications.",
        feedback: ""
      }
    ],
    [
      {
        document: {
          pageContent: "// AuthMiddleware validates Bearer JWT tokens\nfunc AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {\n\treturn func(w http.ResponseWriter, r *http.Request) {\n\t\t// Get Authorization header\n\t\tauthHeader := r.Header.Get(\"Authorization\")\n\t\t\n\t\tif authHeader == \"\" {\n\t\t\twriteUnauthorizedError(w, \"MISSING_TOKEN\", \"Authorization header is required\")\n\t\t\treturn\n\t\t}\n\n\t\t// Check if it's a Bearer token\n\t\tparts := strings.Split(authHeader, \" \")\n\t\tif len(parts) != 2 || parts[0] != \"Bearer\" {\n\t\t\twriteUnauthorizedError(w, \"INVALID_TOKEN_FORMAT\", \"Authorization header must be in format: Bearer {token}\")\n\t\t\treturn\n\t\t}\n\n\t\ttoken := parts[1]\n\t\tif token == \"\" {\n\t\t\twriteUnauthorizedError(w, \"EMPTY_TOKEN\", \"Token cannot be empty\")\n\t\t\treturn\n\t\t}\n\n\t\t// Simple token validation (in production, validate JWT signature and claims)\n\t\t// For this example, we'll accept any non-empty token that looks like a JWT\n\t\tif !isValidToken(token) {\n\t\t\twriteUnauthorizedError(w, \"INVALID_TOKEN\", \"Invalid or expired token\")\n\t\t\treturn\n\t\t}\n\n\t\t// Parse JWT claims\n\t\tclaims, err := parseJWTClaims(token)\n\t\tif err != nil {\n\t\t\twriteUnauthorizedError(w, \"INVALID_TOKEN\", \"Unable to parse token claims\")\n\t\t\treturn\n\t\t}\n\n\t\t// Store claims in request context\n\t\tctx := context.WithValue(r.Context(), userClaimsKey, claims)\n\t\tr = r.WithContext(ctx)\n\n\t\t// Token is valid, proceed to next handler\n\t\tnext(w, r)\n\t}\n}",
          metadata: {
            source: "blob",
            blobType: "text/plain",
            loc: {
              lines: {
                to: 74,
                from: 29
              }
            },
            metadata: {
              repo_name: "auth-middleware-go",
              file_name: "auth.go",
              last_commit_timestamp: "2016-12-15T21:57:32Z",
              organization: "bitovi-corp",
              file_size: 1003,
              file_path: "middleware/auth.go",
              last_commit: "27cc3fadc5cf30e40c08cc35c9c17a3aef04135f",
              file_type: "file"
            }
          }
        },
        score: 0.850463,
        explanation: "Section from the auth.go file providing the implementation of the AuthMiddleware function.",
        feedback: ""
      }
    ]
  ];

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
                text: JSON.stringify(this.sampleSearchResults, null, 2),
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
