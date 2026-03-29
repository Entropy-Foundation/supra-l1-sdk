import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountInfoResource, accountResourcesResource } from './account';
import { SupraClient, HexString } from "@supra-l1/sdk";

vi.mock("@supra-l1/sdk", () => {
  return {
    SupraClient: {
      init: vi.fn().mockResolvedValue({
        getAccountInfo: vi.fn().mockResolvedValue({ sequence_number: '1' }),
        getAccountResources: vi.fn().mockResolvedValue([{ type: '0x1::coin::CoinStore' }]),
      }),
    },
    SupraAccount: vi.fn().mockImplementation(function() { return {}; }),
    HexString: vi.fn().mockImplementation(function(val) { return { toString: () => val }; }),
  };
});

describe('account resources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('accountInfoResource', () => {
    it('should have correct resource definition', () => {
      expect(accountInfoResource.uri).toBe('supra://account/{address}/info');
    });

    it('should read account info', async () => {
      const uri = 'supra://account/0x123/info';
      const result = await accountInfoResource.read(uri);

      expect(SupraClient.init).toHaveBeenCalled();
      expect(HexString).toHaveBeenCalledWith('0x123');
      const mockClient = await SupraClient.init('https://rpc-testnet.supra.com/');
      expect(mockClient.getAccountInfo).toHaveBeenCalled();
      expect(JSON.parse(result)).toEqual({ sequence_number: '1' });
    });

    it('should throw error for invalid URI', async () => {
      const uri = 'supra://account/invalid/info';
      await expect(accountInfoResource.read(uri)).rejects.toThrow('Invalid account info URI');
    });
  });

  describe('accountResourcesResource', () => {
    it('should have correct resource definition', () => {
      expect(accountResourcesResource.uri).toBe('supra://account/{address}/resources');
    });

    it('should read account resources', async () => {
      const uri = 'supra://account/0x123/resources';
      const result = await accountResourcesResource.read(uri);

      expect(SupraClient.init).toHaveBeenCalled();
      expect(HexString).toHaveBeenCalledWith('0x123');
      const mockClient = await SupraClient.init('https://rpc-testnet.supra.com/');
      expect(mockClient.getAccountResources).toHaveBeenCalled();
      expect(JSON.parse(result)).toEqual([{ type: '0x1::coin::CoinStore' }]);
    });

    it('should throw error for invalid URI', async () => {
      const uri = 'supra://account/invalid/resources';
      await expect(accountResourcesResource.read(uri)).rejects.toThrow('Invalid account resources URI');
    });
  });
});
