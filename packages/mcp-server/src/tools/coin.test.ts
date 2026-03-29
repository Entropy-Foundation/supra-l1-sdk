import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferCoinTool, getBalanceTool } from './coin';
import { SupraClient, SupraAccount, HexString } from "@supra-l1/sdk";

vi.mock("@supra-l1/sdk", () => {
  return {
    SupraClient: {
      init: vi.fn().mockResolvedValue({
        transferCoin: vi.fn().mockResolvedValue({ hash: '0xhash' }),
        getAccountCoinBalance: vi.fn().mockResolvedValue(5000000000n),
      }),
    },
    SupraAccount: vi.fn().mockImplementation(function() { return {}; }),
    HexString: vi.fn().mockImplementation(function(val) { return { toString: () => val }; }),
  };
});

describe('transferCoinTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct tool definition', () => {
    expect(transferCoinTool.name).toBe('transfer_coin');
    expect(transferCoinTool.description).toBe('Transfer coins from one account to another');
    expect(transferCoinTool.inputSchema).toBeDefined();
  });

  it('should call transferCoin with correct arguments', async () => {
    const args = {
      senderPrivateKey: '0x123',
      receiverAddress: '0x456',
      amount: '1000',
      coinType: '0x1::supra_coin::SupraCoin',
      rpcUrl: 'https://rpc-testnet.supra.com/',
    };

    const result = await transferCoinTool.handler(args);

    expect(SupraClient.init).toHaveBeenCalledWith('https://rpc-testnet.supra.com/');
    expect(SupraAccount).toHaveBeenCalled();
    expect(HexString).toHaveBeenCalledWith('0x456');
    
    const mockClient = await SupraClient.init('https://rpc-testnet.supra.com/');
    expect(mockClient.transferCoin).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      1000n,
      '0x1::supra_coin::SupraCoin',
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

describe('getBalanceTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct tool definition', () => {
    expect(getBalanceTool.name).toBe('get_balance');
    expect(getBalanceTool.description).toBe('Get the balance of a Supra account for a specific coin type');
    expect(getBalanceTool.inputSchema).toBeDefined();
  });

  it('should call getAccountCoinBalance with correct arguments', async () => {
    const args = {
      address: '0x456',
      coinType: '0x1::supra_coin::SupraCoin',
      rpcUrl: 'https://rpc-testnet.supra.com/',
    };

    const result = await getBalanceTool.handler(args);

    expect(SupraClient.init).toHaveBeenCalledWith('https://rpc-testnet.supra.com/');
    expect(HexString).toHaveBeenCalledWith('0x456');
    
    const mockClient = await SupraClient.init('https://rpc-testnet.supra.com/');
    expect(mockClient.getAccountCoinBalance).toHaveBeenCalledWith(
      expect.any(Object),
      '0x1::supra_coin::SupraCoin'
    );
    expect(result).toEqual({
      address: '0x456',
      coinType: '0x1::supra_coin::SupraCoin',
      balance: '5000000000',
    });
  });

  it('should use default values if not provided', async () => {
    const args = {
      address: '0x456',
    };

    await getBalanceTool.handler(args);

    expect(SupraClient.init).toHaveBeenCalledWith('https://rpc-testnet.supra.com/');
    const mockClient = await SupraClient.init('https://rpc-testnet.supra.com/');
    expect(mockClient.getAccountCoinBalance).toHaveBeenCalledWith(
      expect.any(Object),
      '0x1::supra_coin::SupraCoin'
    );
  });
});
