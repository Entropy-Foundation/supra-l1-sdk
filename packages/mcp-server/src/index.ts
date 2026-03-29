import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SupraMcpServer } from "./server.js";
import { tools } from "./tools/index.js";
import { resources } from "./resources/index.js";

async function main() {
  const server = new SupraMcpServer();
  
  // Register tools
  for (const tool of tools) {
    server.registerTool(tool);
  }

  // Register resources
  for (const resource of resources) {
    server.registerResource(resource);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Supra L1 MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
