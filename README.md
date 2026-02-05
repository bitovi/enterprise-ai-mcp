# Enterprise AI MCP Server

An MCP (Model Context Protocol) server that provides tools for enterprise-scale AI assistance across indexed repositories and documentation. This server enables AI agents to efficiently search and retrieve code context for development tasks.

## Features

- **Search**: Natural language queries across indexed repos/docs, tailored to a provided technology stack

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bitovi/enterprise-ai-mcp.git
   cd enterprise-ai-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the server:
   ```bash
   npm run build
   ```

4. Run the server:
   ```bash
   npm run start
   ```

## Configuration

### Environment

This server requires a webhook endpoint for search. Create a `.env` file (see `.env.example`) and set:

```
WEBHOOK_URL=https://your-webhook-endpoint
```

### MCP Client Settings

To use this MCP server with an MCP client (e.g., VS Code + Cline), add a server entry in your client’s MCP settings file (path varies by client and OS):

```json
{
  "mcpServers": {
    "enterpriseCode": {
      "command": "node",
      "args": ["/path/to/enterprise-ai-mcp/build/index.js"]
    }
  }
}
```

The server will be loaded automatically by the MCP client.

## Prompting Files

The repository includes four prompting files to guide AI interactions and development. These files all include a statement that the agent must read back to you so that you may confirm that the agent has used the file.

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `.github/prompts/sampleSearch.prompt.md`
- `.github/instructions/sample.instructions.md`

## Tools

### search

**Purpose**: Given a natural-language query and technology stack, return the best matches across all indexed repos/docs. Results are provided by the configured webhook.

**Inputs**:
- `Message` (string, required): A detailed natural-language description of the user’s query, task, or intent.
- `Stack` (string, required): Comma-separated list of relevant technologies (e.g., `TypeScript, React, Node.js`).

**Returns**: JSON payload returned by the webhook (passed through as text).

## Development

- Source code: `src/index.ts`
- Build output: `build/index.js`
- The server forwards tool requests to `WEBHOOK_URL` and returns the JSON response.
