# Enterprise Code AI Tooling MCP Server

An MCP (Model Context Protocol) server that provides tools for enterprise-scale code search and retrieval across indexed repositories and documentation. This server enables AI agents to efficiently search, fetch, and bundle code context for development tasks.

## Features

- **Search**: Natural language queries across all indexed repos and docs
- **Fetch**: Retrieve actual content from search results
- **Bundle**: Assemble curated context packs from multiple sources
- **Explain**: Understand search reasoning and applied filters
- **Health**: Operational status for fallback decisions

All tools currently return stubbed responses for development and testing.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/paytonrog/enterprise-code-ai-tooling.git
   cd enterprise-code-ai-tooling
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
       "enterprise-code-ai-tooling": {
         "command": "node",
         "args": ["/path/to/enterprise-code-ai-tooling/build/index.js"]
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

**Returns**: Array of ranked results with:
- `id`: Unique identifier
- `title/path`: Human-readable title or path
- `source_type`: Type of source (e.g., "repo", "doc")
- `score`: Relevance score (0-1)
- `short_preview`: Brief content preview
- `pointer`: Stable pointer for fetching content

### mcp.fetch
**Purpose**: Fetch the actual content for a specific match/pointer returned by search.

**Inputs**:
- `pointer` (string, required): Stable pointer from search result
- `range` (string, optional): Range specification
- `max_chars` (number, optional): Maximum characters
- `max_tokens` (number, optional): Maximum tokens

**Returns**:
- `content`: The actual content
- `provenance`: Source information including repo, version/SHA, path, and line offsets

### mcp.bundle
**Purpose**: Assemble a curated "context pack" from multiple pointers with deduplication and size limits.

**Inputs**:
- `pointers` (array of strings, required): List of pointers
- `formatting` (string, required): Formatting preference
- `size_budget` (number, required): Size/token budget

**Returns**: A bundled payload (content or bundle pointer) ready for model context.

### mcp.explain
**Purpose**: Provide reasoning for returned results, including searched sources and applied filters.

**Inputs**: None required

**Returns**:
- `reasoning`: Concise explanation of results
- `applied_scope`: Scope and filters applied
- `index_freshness`: Index version/timestamp

### mcp.health
**Purpose**: Operational status for determining fallback behavior.

**Inputs**: None required

**Returns**:
- `reachable`: Server connectivity status
- `index_ready`: Index availability
- `embedding_model`: Model version
- `last_indexed`: Last indexing timestamp
- `degradations`: List of any major issues

## Development

- Source code: `src/index.ts`
- Build output: `build/index.js`
- All tools are currently stubbed with static responses

## License

[Add license information here]
