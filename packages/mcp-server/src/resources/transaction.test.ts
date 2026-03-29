import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionInsightsResource } from './transaction';
import { SupraClient } from "@supra-l1/sdk";

vi.mock("@supra-l1/sdk", () => {
  return {
    SupraClient: {
      init: vi.fn().mockResolvedValue({
        getTransactionDetail: vi.fn().mockResolvedValue({ sender: '0x123' }),
        getTransactionInsights: vi.fn().mockReturnValue({ tx_type: 'UserTransaction' }),
      }),
    },
    SupraAccount: vi.fn().mockImplementation(function() { return {}; }),
    HexString: vi.fn().mockImplementation(function(val) { return { toString: () => val }; }),
  };
});

describe('transaction resources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('transactionInsightsResource', () => {
    it('should have correct resource definition', () => {
      expect(transactionInsightsResource.uri).toBe('supra://transaction/{hash}/insights');
    });

    it('should read transaction insights', async () => {
      const uri = 'supra://transaction/0x123/insights';
      const result = await transactionInsightsResource.read(uri);

      expect(SupraClient.init).toHaveBeenCalled();
      const mockClient = await SupraClient.init('https://rpc-testnet.supra.com/');
      expect(mockClient.getTransactionInsights).toHaveBeenCalledWith('0x123', expect.any(Object));
      expect(JSON.parse(result)).toEqual({ tx_type: 'UserTransaction' });
    });

    it('should throw error for invalid URI', async () => {
      const uri = 'supra://transaction/invalid/insights';
      await expect(transactionInsightsResource.read(uri)).rejects.toThrow('Invalid transaction insights URI');
    });
  });
});
