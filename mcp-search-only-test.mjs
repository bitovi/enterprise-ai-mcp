import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["build/index.js"],
  cwd: process.cwd(),
  env: { ...process.env },
});

const client = new Client(
  { name: "mcp-search-test-client", version: "1.0.0" },
  { capabilities: {} }
);

await client.connect(transport);

try {
  const searchResult = await client.callTool({
    name: "search_code_embeddings",
    arguments: {
      org: "bitovi-training",
      keywords: "auth middleware role based access",
    },
  });
  console.log("search_code_embeddings result:");
  console.log(searchResult.content?.[0]?.text);
} finally {
  await client.close();
}
