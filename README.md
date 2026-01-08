# Enterprise AI MCP Server

An MCP (Model Context Protocol) server that provides tools for enterprise-scale AI assistance across indexed repositories and documentation. This server enables AI agents to efficiently search and retrieve code context for development tasks.

## Features

- **Search**: Natural language queries across all indexed repos and docs, filtered by target coding language

All tools currently return stubbed responses for development and testing.

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

## Configuration

To use this MCP server with an MCP client (e.g., VSCode with Cline extension):

1. Ensure you have the MCP settings file at `~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` (or equivalent for your client).

2. Add the server configuration:
   ```json
   {
     "mcpServers": {
       "enterprise-ai-mcp": {
         "command": "node",
         "args": ["/path/to/enterprise-ai-mcp/build/index.js"]
       }
     }
   }
   ```

3. The server will be automatically loaded by the MCP client.

## Tools

### mcp.search
**Purpose**: Given a natural-language query or pasted text, return the best matches across all indexed repos/docs.

**Inputs**:
- `query` (string, required): Natural-language query or text to search
- `language` (string, required): Target coding language for the search

**Returns**: Array of ranked results with:
- `id`: Unique identifier
- `title/path`: Human-readable title or path
- `source_type`: Type of source (e.g., "repo", "doc")
- `score`: Relevance score (0-1)
- `content`: Brief content preview

## Development

- Source code: `src/index.ts`
- Build output: `build/index.js`
- Tools are currently stubbed with static responses

## License

[Add license information here]
