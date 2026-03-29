import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publishPackageTool } from './package';
import { SupraClient, SupraAccount } from "@supra-l1/sdk";

vi.mock("@supra-l1/sdk", () => {
  return {
    SupraClient: {
      init: vi.fn().mockResolvedValue({
        publishPackage: vi.fn().mockResolvedValue({ hash: '0xhash' }),
      }),
    },
    SupraAccount: vi.fn().mockImplementation(function() { return {}; }),
    HexString: vi.fn().mockImplementation(function(val) { return { toString: () => val }; }),
  };
});

describe('publishPackageTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct tool definition', () => {
    expect(publishPackageTool.name).toBe('publish_package');
    expect(publishPackageTool.description).toBe('Publish a package or module on the Supra network');
    expect(publishPackageTool.inputSchema).toBeDefined();
  });

  it('should call publishPackage with correct arguments', async () => {
    const args = {
      senderPrivateKey: '0x123',
      packageMetadata: '0xabcd',
      modulesCode: ['0xbeef', '0xcafe'],
      rpcUrl: 'https://rpc-testnet.supra.com/',
    };

    const result = await publishPackageTool.handler(args);

    expect(SupraClient.init).toHaveBeenCalledWith('https://rpc-testnet.supra.com/');
    expect(SupraAccount).toHaveBeenCalled();
    
    const mockClient = await SupraClient.init('https://rpc-testnet.supra.com/');
    expect(mockClient.publishPackage).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Uint8Array),
      expect.arrayContaining([expect.any(Uint8Array), expect.any(Uint8Array)]),
      expect.objectContaining({
        enableTransactionWaitAndSimulationArgs: {
          enableWaitForTransaction: true,
          enableTransactionSimulation: true,
        },
      })
    );
    expect(result).toEqual({ hash: '0xhash' });
  });
});
