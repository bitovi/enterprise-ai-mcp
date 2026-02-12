import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["build/index.js"],
  cwd: process.cwd(),
  env: {
    ...process.env,
  },
});

const client = new Client(
  { name: "mcp-test-client", version: "1.0.0" },
  { capabilities: {} }
);

await client.connect(transport);

const fetchResult = await client.callTool({
  name: "fetch_file_from_git",
  arguments: {
    org: "bitovi",
    repository: "enterprise-ai-mcp",
    filePath: "README.md",
  },
});

console.log("fetch_file_from_git result:");
console.log(fetchResult.content?.[0]?.text?.slice(0, 500));

const searchResult = await client.callTool({
  name: "search_code_embeddings",
  arguments: {
    org: "bitovi",
    keywords: "authentication middleware",
  },
});

console.log("search_code_embeddings result:");
console.log(searchResult.content?.[0]?.text);

await client.close();
