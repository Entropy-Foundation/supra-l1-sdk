import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  const serverPath = path.resolve(__dirname, "../dist/index.js");
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("Connected to MCP server");

  const tools = await client.request(
    { method: "tools/list" },
    ListToolsRequestSchema
  );
  console.log("Tools:", JSON.stringify(tools, null, 2));

  await transport.close();
}

test().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
