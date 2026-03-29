import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource,
} from "@modelcontextprotocol/sdk/types.js";

export interface McpTool extends Tool {
  handler: (args: any) => Promise<any>;
}

export interface McpResource extends Resource {
  read: (uri: string) => Promise<string>;
}

export class SupraMcpServer {
  private server: Server;
  private tools: Map<string, McpTool> = new Map();
  private resources: Map<string, McpResource> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: "supra-l1-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()).map(({ handler, ...tool }) => tool),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.tools.get(request.params.name);
      if (!tool) {
        throw new Error(`Tool not found: ${request.params.name}`);
      }

      try {
        const result = await tool.handler(request.params.arguments);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: Array.from(this.resources.values()).map(({ read, ...resource }) => resource),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      
      let resource: McpResource | undefined;
      for (const r of this.resources.values()) {
        // Convert URI template to regex
        // e.g., supra://account/{address}/info -> ^supra:\/\/account\/([^/]+)\/info$
        const regexStr = "^" + r.uri.replace(/\{[^}]+\}/g, "([^/]+)").replace(/\//g, "\\/") + "$";
        const regex = new RegExp(regexStr);
        if (regex.test(uri)) {
          resource = r;
          break;
        }
      }

      if (!resource) {
        throw new Error(`Resource not found: ${uri}`);
      }

      try {
        const content = await resource.read(uri);
        return {
          contents: [
            {
              uri,
              mimeType: resource.mimeType,
              text: content,
            },
          ],
        };
      } catch (error: any) {
        throw new Error(`Error reading resource ${uri}: ${error.message}`);
      }
    });
  }

  public registerTool(tool: McpTool) {
    this.tools.set(tool.name, tool);
  }

  public registerResource(resource: McpResource) {
    this.resources.set(resource.uri, resource);
  }

  public async connect(transport: any) {
    await this.server.connect(transport);
  }
}
