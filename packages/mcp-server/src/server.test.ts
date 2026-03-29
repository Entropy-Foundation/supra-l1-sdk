import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupraMcpServer, McpTool, McpResource } from './server';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => {
  return {
    Server: vi.fn().mockImplementation(function () {
      return {
        setRequestHandler: vi.fn(),
        connect: vi.fn(),
      };
    }),
  };
});

describe('SupraMcpServer', () => {
  let supraMcpServer: SupraMcpServer;
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    supraMcpServer = new SupraMcpServer();
    mockServer = (Server as any).mock.results[0].value;
  });

  it('should initialize with a name and version', () => {
    expect(Server).toHaveBeenCalledWith(
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
  });

  it('should register handlers on initialization', () => {
    expect(mockServer.setRequestHandler).toHaveBeenCalledWith(ListToolsRequestSchema, expect.any(Function));
    expect(mockServer.setRequestHandler).toHaveBeenCalledWith(CallToolRequestSchema, expect.any(Function));
    expect(mockServer.setRequestHandler).toHaveBeenCalledWith(ListResourcesRequestSchema, expect.any(Function));
    expect(mockServer.setRequestHandler).toHaveBeenCalledWith(ReadResourceRequestSchema, expect.any(Function));
  });

  it('should register a tool', async () => {
    const mockTool: McpTool = {
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: { type: 'object', properties: {} },
      handler: vi.fn().mockResolvedValue({ success: true }),
    };

    supraMcpServer.registerTool(mockTool);

    // Get the ListTools handler
    const listToolsHandler = mockServer.setRequestHandler.mock.calls.find(
      (call: any) => call[0] === ListToolsRequestSchema
    )[1];

    const toolsResult = await listToolsHandler();
    expect(toolsResult.tools).toContainEqual({
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: { type: 'object', properties: {} },
    });
  });

  it('should call a registered tool', async () => {
    const mockTool: McpTool = {
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: { type: 'object', properties: {} },
      handler: vi.fn().mockResolvedValue({ result: 'ok' }),
    };

    supraMcpServer.registerTool(mockTool);

    // Get the CallTool handler
    const callToolHandler = mockServer.setRequestHandler.mock.calls.find(
      (call: any) => call[0] === CallToolRequestSchema
    )[1];

    const result = await callToolHandler({
      params: {
        name: 'test-tool',
        arguments: { arg1: 'val1' },
      },
    });

    expect(mockTool.handler).toHaveBeenCalledWith({ arg1: 'val1' });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ result: 'ok' }, null, 2),
        },
      ],
    });
  });

  it('should handle tool errors', async () => {
    const mockTool: McpTool = {
      name: 'error-tool',
      description: 'An error tool',
      inputSchema: { type: 'object', properties: {} },
      handler: vi.fn().mockRejectedValue(new Error('Tool failed')),
    };

    supraMcpServer.registerTool(mockTool);

    const callToolHandler = mockServer.setRequestHandler.mock.calls.find(
      (call: any) => call[0] === CallToolRequestSchema
    )[1];

    const result = await callToolHandler({
      params: {
        name: 'error-tool',
        arguments: {},
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error: Tool failed',
        },
      ],
      isError: true,
    });
  });

  it('should register a resource', async () => {
    const mockResource: McpResource = {
      uri: 'supra://test/resource',
      name: 'Test Resource',
      mimeType: 'application/json',
      read: vi.fn().mockResolvedValue('resource content'),
    };

    supraMcpServer.registerResource(mockResource);

    const listResourcesHandler = mockServer.setRequestHandler.mock.calls.find(
      (call: any) => call[0] === ListResourcesRequestSchema
    )[1];

    const resourcesResult = await listResourcesHandler();
    expect(resourcesResult.resources).toContainEqual({
      uri: 'supra://test/resource',
      name: 'Test Resource',
      mimeType: 'application/json',
    });
  });

  it('should read a registered resource', async () => {
    const mockResource: McpResource = {
      uri: 'supra://account/{address}/info',
      name: 'Account Info',
      mimeType: 'application/json',
      read: vi.fn().mockResolvedValue('account data'),
    };

    supraMcpServer.registerResource(mockResource);

    const readResourceHandler = mockServer.setRequestHandler.mock.calls.find(
      (call: any) => call[0] === ReadResourceRequestSchema
    )[1];

    const result = await readResourceHandler({
      params: {
        uri: 'supra://account/0x123/info',
      },
    });

    expect(mockResource.read).toHaveBeenCalledWith('supra://account/0x123/info');
    expect(result).toEqual({
      contents: [
        {
          uri: 'supra://account/0x123/info',
          mimeType: 'application/json',
          text: 'account data',
        },
      ],
    });
  });

  it('should throw error for unknown tool', async () => {
    const callToolHandler = mockServer.setRequestHandler.mock.calls.find(
      (call: any) => call[0] === CallToolRequestSchema
    )[1];

    await expect(callToolHandler({
      params: {
        name: 'unknown-tool',
      },
    })).rejects.toThrow('Tool not found: unknown-tool');
  });

  it('should throw error for unknown resource', async () => {
    const readResourceHandler = mockServer.setRequestHandler.mock.calls.find(
      (call: any) => call[0] === ReadResourceRequestSchema
    )[1];

    await expect(readResourceHandler({
      params: {
        uri: 'supra://unknown/resource',
      },
    })).rejects.toThrow('Resource not found: supra://unknown/resource');
  });

  it('should connect to transport', async () => {
    const mockTransport = {};
    await supraMcpServer.connect(mockTransport);
    expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
  });
});
